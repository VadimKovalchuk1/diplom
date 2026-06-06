// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ReentrancyGuard защищает функции записи от повторного входа.
import {ReentrancyGuard} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
// Pausable нужен для аварийной остановки аудита при инциденте.
import {Pausable} from '@openzeppelin/contracts/utils/Pausable.sol';
import {NotaryAccessControl} from './NotaryAccessControl.sol';

/// @title AuditContract
/// @notice Append-only журнал критичных действий нотариального документооборота.
/// @dev Контракт не предоставляет функцию удаления записей: это принцип immutable audit.
///      Храним не полный текст действия, а compact metadataHash, чтобы не раскрывать
///      персональные данные и не тратить лишний gas.
contract AuditContract is ReentrancyGuard, Pausable {
    bytes32 public constant AUDITOR = keccak256('AUDITOR');
    bytes32 public constant NOTARY = keccak256('NOTARY');
    bytes32 public constant SUPER_ADMIN = keccak256('SUPER_ADMIN');

    /// @notice Одна запись аудита.
    /// @param actionType Тип действия, например DOCUMENT_REGISTER.
    /// @param entityId Идентификатор сущности: documentId, requestId и т.п.
    /// @param actor Адрес, который инициировал действие.
    /// @param timestamp Время блока, когда действие зафиксировано.
    /// @param metadataHash Хэш подробностей действия, которые хранятся off-chain.
    struct AuditLog {
        bytes32 actionType;
        bytes32 entityId;
        address actor;
        uint64 timestamp;
        bytes32 metadataHash;
    }

    // Ссылка на RBAC-контракт: AuditContract делегирует проверку ролей туда.
    NotaryAccessControl public immutable access;

    // Массив всех записей. Индекс массива является logId.
    AuditLog[] private logs;

    // Индекс для быстрого поиска всех логов по конкретной сущности.
    mapping(bytes32 => uint256[]) private entityLogIndexes;

    // Отдельный whitelist нужен, чтобы другие контракты системы, например DocumentRegistry,
    // могли писать аудит от имени бизнес-операции.
    mapping(address => bool) public authorizedWriters;

    event AuditWriterUpdated(address indexed writer, bool allowed);
    event ActionLogged(uint256 indexed logId, bytes32 indexed actionType, bytes32 indexed entityId, address actor, bytes32 metadataHash);

    /// @dev Писать аудит могут: явно разрешённые контракты, аудиторы, нотариусы и super-admin.
    modifier onlyAuditWriter() {
        require(authorizedWriters[msg.sender] || access.hasRole(AUDITOR, msg.sender) || access.hasRole(NOTARY, msg.sender) || access.hasRole(SUPER_ADMIN, msg.sender), 'AUDIT_FORBIDDEN');
        _;
    }

    constructor(NotaryAccessControl accessControl) { access = accessControl; }

    /// @notice Разрешает системному контракту писать audit events.
    /// @dev Например, после deployment мы добавляем DocumentRegistry как authorized writer.
    function setAuthorizedWriter(address writer, bool allowed) external {
        require(access.hasRole(SUPER_ADMIN, msg.sender), 'WRITER_ADMIN_FORBIDDEN');
        authorizedWriters[writer] = allowed;
        emit AuditWriterUpdated(writer, allowed);
    }

    /// @notice Добавляет неизменяемую запись аудита.
    /// @dev metadataHash связывает on-chain запись с подробным off-chain JSON audit record.
    function logAction(bytes32 actionType, bytes32 entityId, bytes32 metadataHash) external nonReentrant whenNotPaused onlyAuditWriter returns (uint256) {
        logs.push(AuditLog({actionType: actionType, entityId: entityId, actor: msg.sender, timestamp: uint64(block.timestamp), metadataHash: metadataHash}));
        uint256 logId = logs.length - 1;
        entityLogIndexes[entityId].push(logId);
        emit ActionLogged(logId, actionType, entityId, msg.sender, metadataHash);
        return logId;
    }

    /// @notice Получить одну запись по её порядковому номеру.
    function getAuditLog(uint256 logId) external view returns (AuditLog memory) { return logs[logId]; }

    /// @notice Получить список logId, связанных с конкретным документом/запросом.
    function getAuditLogs(bytes32 entityId) external view returns (uint256[] memory) { return entityLogIndexes[entityId]; }

    /// @notice Общее число audit records — удобно для мониторинга и индексатора.
    function totalLogs() external view returns (uint256) { return logs.length; }

    function pause() external { require(access.hasRole(SUPER_ADMIN, msg.sender), 'PAUSE_FORBIDDEN'); _pause(); }
    function unpause() external { require(access.hasRole(SUPER_ADMIN, msg.sender), 'UNPAUSE_FORBIDDEN'); _unpause(); }
}
