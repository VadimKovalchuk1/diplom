// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// OpenZeppelin AccessControl — проверенная библиотека для ролевой модели в Solidity.
// Она хранит роли как bytes32 и предоставляет grant/revoke/hasRole.
import {AccessControl} from '@openzeppelin/contracts/access/AccessControl.sol';
// Pausable позволяет администратору временно остановить критичные операции,
// если найден инцидент безопасности или требуется регламентное обслуживание.
import {Pausable} from '@openzeppelin/contracts/utils/Pausable.sol';

/// @title NotaryAccessControl
/// @notice Центральный on-chain справочник участников permissioned-сети ФНП.
/// @dev В реальной production-сети этот контракт разворачивается первым, потому что
///      остальные контракты спрашивают у него: «имеет ли адрес нужную роль?». Здесь
///      не хранятся персональные данные документа, только адреса кошельков, роли и
///      минимальная служебная metadata URI участника.
contract NotaryAccessControl is AccessControl, Pausable {
    // Роли кодируются через keccak256, чтобы роль была компактным bytes32-идентификатором.
    // Это стандартный подход OpenZeppelin: строка удобна человеку, bytes32 удобен EVM.
    bytes32 public constant SUPER_ADMIN = keccak256('SUPER_ADMIN');
    bytes32 public constant FEDERAL_CHAMBER_ADMIN = keccak256('FEDERAL_CHAMBER_ADMIN');
    bytes32 public constant REGIONAL_CHAMBER_ADMIN = keccak256('REGIONAL_CHAMBER_ADMIN');
    bytes32 public constant NOTARY = keccak256('NOTARY');
    bytes32 public constant AUDITOR = keccak256('AUDITOR');
    bytes32 public constant VERIFIER = keccak256('VERIFIER');

    // События попадают в blockchain logs. Их удобно читать backend-индексатором,
    // чтобы строить историю выдачи ролей и подтверждать действия в диссертации.
    event ParticipantRegistered(address indexed account, bytes32 indexed role, string chamberCode, string metadataURI);
    event ParticipantMetadataUpdated(address indexed account, string metadataURI);

    /// @notice Минимальная карточка участника нотариальной сети.
    /// @param chamberCode Код региональной палаты, например «77» для Москвы.
    /// @param metadataURI Ссылка на off-chain metadata: ФИО, сертификаты, должность.
    /// @param active Флаг, что участник зарегистрирован в системе.
    struct Participant {
        string chamberCode;
        string metadataURI;
        bool active;
    }

    // mapping — ассоциативный массив Solidity. По адресу кошелька находим карточку участника.
    mapping(address => Participant) private participants;

    /// @notice Конструктор задаёт первичного администратора всей сети.
    /// @dev Для демонстрации deployer получает несколько ролей, чтобы сразу можно было
    ///      bootstrap-ить систему. В production эти роли можно распределить через multisig.
    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SUPER_ADMIN, admin);
        _grantRole(FEDERAL_CHAMBER_ADMIN, admin);
        _grantRole(REGIONAL_CHAMBER_ADMIN, admin);
        _grantRole(AUDITOR, admin);

        // Иерархия администрирования отражает структуру ФНП:
        // SUPER_ADMIN управляет федеральными администраторами;
        // федеральный администратор управляет региональными и аудиторами;
        // региональный администратор выдаёт роль нотариуса.
        _setRoleAdmin(FEDERAL_CHAMBER_ADMIN, SUPER_ADMIN);
        _setRoleAdmin(REGIONAL_CHAMBER_ADMIN, FEDERAL_CHAMBER_ADMIN);
        _setRoleAdmin(NOTARY, REGIONAL_CHAMBER_ADMIN);
        _setRoleAdmin(AUDITOR, FEDERAL_CHAMBER_ADMIN);
        _setRoleAdmin(VERIFIER, FEDERAL_CHAMBER_ADMIN);
    }

    /// @notice Регистрирует участника и выдаёт ему роль.
    /// @dev onlyRole(getRoleAdmin(role)) означает: выдать роль может только администратор
    ///      именно этой роли. Это защищает от самовольной регистрации нотариусов.
    function registerParticipant(
        address account,
        bytes32 role,
        string calldata chamberCode,
        string calldata metadataURI
    ) external whenNotPaused onlyRole(getRoleAdmin(role)) {
        require(account != address(0), 'ACCOUNT_ZERO');

        _grantRole(role, account);
        participants[account] = Participant({chamberCode: chamberCode, metadataURI: metadataURI, active: true});

        emit ParticipantRegistered(account, role, chamberCode, metadataURI);
    }

    /// @notice Обновляет ссылку на metadata участника.
    /// @dev Metadata вынесена off-chain, потому что персональные данные нельзя публиковать
    ///      в blockchain в открытом виде. On-chain остаётся только ссылка/хэш.
    function updateParticipantMetadata(address account, string calldata metadataURI) external whenNotPaused onlyRole(SUPER_ADMIN) {
        require(participants[account].active, 'PARTICIPANT_NOT_FOUND');
        participants[account].metadataURI = metadataURI;
        emit ParticipantMetadataUpdated(account, metadataURI);
    }

    /// @notice Возвращает карточку участника по wallet-адресу.
    function getParticipant(address account) external view returns (Participant memory) {
        return participants[account];
    }

    /// @notice Аварийная остановка операций, доступна только верхнему администратору.
    function pause() external onlyRole(SUPER_ADMIN) { _pause(); }

    /// @notice Возобновление операций после устранения проблемы.
    function unpause() external onlyRole(SUPER_ADMIN) { _unpause(); }
}
