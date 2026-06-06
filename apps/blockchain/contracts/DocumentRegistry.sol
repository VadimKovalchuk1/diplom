// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import {Pausable} from '@openzeppelin/contracts/utils/Pausable.sol';
import {ECDSA} from '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import {MessageHashUtils} from '@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol';
import {NotaryAccessControl} from './NotaryAccessControl.sol';
import {AuditContract} from './AuditContract.sol';

/// @title DocumentRegistry
/// @notice Главный реестр нотариальных документов.
/// @dev Важный архитектурный принцип: документ НЕ кладётся в blockchain. В blockchain
///      сохраняются только hash документа, hash metadata и CID зашифрованного файла в IPFS.
///      Это снижает стоимость хранения, сохраняет конфиденциальность и позволяет доказать
///      неизменность документа: если файл поменять, его hash уже не совпадёт с on-chain hash.
contract DocumentRegistry is ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Роли должны совпадать с NotaryAccessControl. Контракт проверяет их через access.hasRole.
    bytes32 public constant NOTARY = keccak256('NOTARY');
    bytes32 public constant AUDITOR = keccak256('AUDITOR');
    bytes32 public constant SUPER_ADMIN = keccak256('SUPER_ADMIN');

    // Типы audit events. Они нужны, чтобы аудит был машинно-читаемым.
    bytes32 public constant ACTION_REGISTER = keccak256('DOCUMENT_REGISTER');
    bytes32 public constant ACTION_REVOKE = keccak256('DOCUMENT_REVOKE');
    bytes32 public constant ACTION_METADATA = keccak256('DOCUMENT_METADATA_UPDATE');

    /// @notice Жизненный цикл документа в реестре.
    enum DocumentStatus { Unknown, Active, Revoked }

    /// @notice On-chain карточка документа.
    /// @param documentHash Hash исходного документа или его canonical representation.
    /// @param metadataHash Hash JSON metadata: название, тип, регион, служебные признаки.
    /// @param cid IPFS CID зашифрованного off-chain payload.
    /// @param notary Wallet нотариуса, зарегистрировавшего документ.
    /// @param registeredAt Timestamp блока регистрации.
    /// @param updatedAt Timestamp последнего изменения metadata/status.
    /// @param status Текущий статус: Active или Revoked.
    struct DocumentRecord {
        bytes32 documentHash;
        bytes32 metadataHash;
        string cid;
        address notary;
        uint64 registeredAt;
        uint64 updatedAt;
        DocumentStatus status;
    }

    // Immutable значит адрес RBAC/audit контрактов нельзя подменить после deployment.
    NotaryAccessControl public immutable access;
    AuditContract public immutable audit;

    // documentId => DocumentRecord. documentId — технический идентификатор записи.
    mapping(bytes32 => DocumentRecord) private documents;

    // Nonce на каждого нотариуса защищает wallet-подпись от replay attack.
    // Если злоумышленник повторно отправит старую подпись, nonce уже изменится.
    mapping(address => uint256) public nonces;

    event DocumentRegistered(bytes32 indexed documentId, bytes32 indexed documentHash, address indexed notary, string cid);
    event DocumentRevoked(bytes32 indexed documentId, address indexed actor, bytes32 reasonHash);
    event MetadataUpdated(bytes32 indexed documentId, bytes32 metadataHash, string cid);

    /// @dev Модификатор допускает только адреса с ролью NOTARY.
    modifier onlyNotary() {
        require(access.hasRole(NOTARY, msg.sender), 'NOTARY_ONLY');
        _;
    }

    /// @dev Привилегированный доступ нужен для просмотра полной карточки и revoke.
    modifier onlyPrivileged() {
        require(access.hasRole(NOTARY, msg.sender) || access.hasRole(AUDITOR, msg.sender) || access.hasRole(SUPER_ADMIN, msg.sender), 'ACCESS_DENIED');
        _;
    }

    constructor(NotaryAccessControl accessControl, AuditContract auditContract) {
        access = accessControl;
        audit = auditContract;
    }

    /// @notice Регистрирует документ в blockchain.
    /// @param documentHash Hash документа. Если документ изменится хотя бы на 1 байт, hash изменится.
    /// @param metadataHash Hash metadata. Сама metadata может храниться в БД/IPFS.
    /// @param cid CID зашифрованного документа в IPFS.
    /// @param walletSignature Подпись нотариуса, подтверждающая его волю зарегистрировать документ.
    /// @return documentId Идентификатор записи в реестре.
    function registerDocument(
        bytes32 documentHash,
        bytes32 metadataHash,
        string calldata cid,
        bytes calldata walletSignature
    ) external nonReentrant whenNotPaused onlyNotary returns (bytes32 documentId) {
        require(documentHash != bytes32(0), 'EMPTY_HASH');

        // Подписываем не только hash, но и address(this), chainid, nonce, metadataHash и CID.
        // Так подпись нельзя перенести на другой контракт, другую сеть или другой документ.
        bytes32 digest = keccak256(abi.encodePacked(address(this), block.chainid, msg.sender, nonces[msg.sender], documentHash, metadataHash, cid)).toEthSignedMessageHash();
        require(digest.recover(walletSignature) == msg.sender, 'INVALID_SIGNATURE');
        nonces[msg.sender]++;

        // documentId включает timestamp, поэтому две регистрации одного hash разными транзакциями
        // будут иметь разные записи. Это удобно для истории нотариальных действий.
        documentId = keccak256(abi.encodePacked(documentHash, msg.sender, block.timestamp));
        require(documents[documentId].status == DocumentStatus.Unknown, 'DOCUMENT_EXISTS');

        documents[documentId] = DocumentRecord({
            documentHash: documentHash,
            metadataHash: metadataHash,
            cid: cid,
            notary: msg.sender,
            registeredAt: uint64(block.timestamp),
            updatedAt: uint64(block.timestamp),
            status: DocumentStatus.Active
        });

        // Аудит пишется сразу при регистрации, чтобы невозможно было иметь документ без следа аудита.
        audit.logAction(ACTION_REGISTER, documentId, metadataHash);
        emit DocumentRegistered(documentId, documentHash, msg.sender, cid);
    }

    /// @notice Публичная проверка подлинности: совпадает ли переданный hash с on-chain записью.
    /// @dev Содержимое документа не раскрывается: проверяющий передаёт только hash.
    function verifyDocument(bytes32 documentId, bytes32 documentHash) external view returns (bool valid, DocumentRecord memory record) {
        record = documents[documentId];
        valid = record.status == DocumentStatus.Active && record.documentHash == documentHash;
    }

    /// @notice Получить полную карточку документа.
    /// @dev Доступ ограничен, потому что CID/metadata могут считаться служебной информацией.
    function getDocument(bytes32 documentId) external view onlyPrivileged returns (DocumentRecord memory) {
        return documents[documentId];
    }

    /// @notice Отзывает документ, не удаляя историческую запись.
    /// @dev Это важно юридически: запись остаётся, но статус показывает, что документ неактуален.
    function revokeDocument(bytes32 documentId, bytes32 reasonHash) external nonReentrant whenNotPaused onlyPrivileged {
        DocumentRecord storage record = documents[documentId];
        require(record.status == DocumentStatus.Active, 'NOT_ACTIVE');
        require(record.notary == msg.sender || access.hasRole(SUPER_ADMIN, msg.sender), 'REVOKE_FORBIDDEN');

        record.status = DocumentStatus.Revoked;
        record.updatedAt = uint64(block.timestamp);

        audit.logAction(ACTION_REVOKE, documentId, reasonHash);
        emit DocumentRevoked(documentId, msg.sender, reasonHash);
    }

    /// @notice Обновляет metadataHash и CID, например при добавлении служебной информации.
    /// @dev Обновлять может только нотариус, который создал запись.
    function updateMetadata(bytes32 documentId, bytes32 metadataHash, string calldata cid) external nonReentrant whenNotPaused onlyNotary {
        DocumentRecord storage record = documents[documentId];
        require(record.status == DocumentStatus.Active, 'NOT_ACTIVE');
        require(record.notary == msg.sender, 'UPDATE_FORBIDDEN');

        record.metadataHash = metadataHash;
        record.cid = cid;
        record.updatedAt = uint64(block.timestamp);

        audit.logAction(ACTION_METADATA, documentId, metadataHash);
        emit MetadataUpdated(documentId, metadataHash, cid);
    }

    function pause() external { require(access.hasRole(SUPER_ADMIN, msg.sender), 'PAUSE_FORBIDDEN'); _pause(); }
    function unpause() external { require(access.hasRole(SUPER_ADMIN, msg.sender), 'UNPAUSE_FORBIDDEN'); _unpause(); }
}
