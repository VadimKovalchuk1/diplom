# Подробное объяснение кода для защиты проекта

Этот документ написан как «шпаргалка для защиты»: он объясняет не только что делает код, но и зачем это нужно в архитектуре распределённого нотариального документооборота.

## 1. Главная идея проекта

Система разделяет данные на две категории:

1. **Конфиденциальный документ** — хранится off-chain, то есть вне blockchain. Перед сохранением он шифруется.
2. **Доказательства существования и неизменности** — hash документа, hash metadata, timestamp, статус и события аудита хранятся on-chain.

Такой подход нужен, потому что blockchain хорошо подходит для неизменяемых доказательств, но плохо подходит для хранения больших и персональных файлов.

## 2. Smart contracts

### `NotaryAccessControl.sol`

Этот контракт отвечает за роли. Роли соответствуют организационной структуре ФНП:

- `SUPER_ADMIN` — верхний администратор;
- `FEDERAL_CHAMBER_ADMIN` — федеральная палата;
- `REGIONAL_CHAMBER_ADMIN` — региональная палата;
- `NOTARY` — нотариус;
- `AUDITOR` — аудитор;
- `VERIFIER` — проверяющий.

Ключевая идея: backend может ошибиться или быть скомпрометирован, но smart contract всё равно проверит роль wallet-адреса перед критичной операцией.

### `DocumentRegistry.sol`

Это основной контракт реестра документов. Он хранит:

- `documentHash` — криптографический отпечаток документа;
- `metadataHash` — отпечаток служебной информации;
- `cid` — ссылка на зашифрованный файл в IPFS;
- `notary` — адрес нотариуса;
- timestamps;
- статус `Active` или `Revoked`.

Важные защиты:

- `onlyNotary` запрещает регистрацию не-нотариусам;
- `nonces` защищают подписи от повторного использования;
- `address(this)` и `block.chainid` внутри подписи не дают перенести подпись на другой контракт или сеть;
- `ReentrancyGuard` защищает от повторного входа;
- `Pausable` позволяет остановить систему при инциденте.

### `AuditContract.sol`

Контракт аудита является append-only журналом. Записи не удаляются. Это важно для юридически значимой истории действий.

Чтобы не раскрывать персональные данные, в audit log пишется `metadataHash`, а подробный JSON может храниться в PostgreSQL/IPFS.

### `ZKVerifier.sol`

Это фасад для проверки zero-knowledge proof. Сейчас он демонстрационный, но интерфейс совпадает с тем, как обычно вызывается Groth16 verifier: `a`, `b`, `c`, `publicSignals`.

Для production защиты нужно сгенерировать настоящий verifier через SnarkJS и заменить внутреннюю функцию проверки.

## 3. Backend NestJS

Backend разделён на модули. Это важно для enterprise-архитектуры: каждый модуль отвечает за одну область.

### `AuthModule`

Вход работает через wallet signature:

1. Backend выдаёт nonce.
2. Пользователь подписывает nonce кошельком.
3. Backend восстанавливает адрес из подписи.
4. Если адрес совпадает, backend выдаёт JWT.

Преимущество: private key никогда не покидает кошелёк пользователя.

### `DocumentsModule`

Отвечает за регистрацию и проверку документов:

1. Принимает файл в base64.
2. Считает `documentHash`.
3. Считает `metadataHash`.
4. Шифрует документ через `IpfsService`.
5. Получает CID.
6. Готовит запись для blockchain-транзакции.

### `IpfsModule`

Шифрует документ до IPFS через AES-256-GCM. Это критично, потому что IPFS является content-addressed storage и не должен получать открытый нотариальный документ.

### `BlockchainModule`

Изолирует работу с Ethereum RPC. Остальной backend не должен знать детали ABI и ethers.js.

### `AuditModule`

Пишет API audit logs. В production эти записи должны сохраняться в PostgreSQL и сопоставляться с blockchain events.

### `RegionalModule`

Моделирует межрегиональный документооборот: документ может быть направлен из одной палаты в другую, а статус показывает обработку.

### `ZkModule`

Демонстрирует API для генерации и проверки proof. В production proof лучше генерировать на клиенте или в доверенном защищённом сервисе, чтобы secret не передавался backend'у.

## 4. Frontend Next.js

Frontend содержит страницы, которые нужны для демонстрации комиссии:

- Login — вход;
- Dashboard — показатели системы;
- Register document — регистрация документа;
- Verify document — публичная проверка;
- Audit logs — журнал действий;
- Regional requests — межрегиональные запросы;
- Admin panel — роли и пользователи;
- ZK verification — демонстрация zero-knowledge проверки.

Компонент `Shell` делает единый enterprise layout: боковое меню и рабочая область.

## 5. ZK circuit

Circuit `document_ownership.circom` доказывает знание двух приватных значений:

- `documentHash`;
- `ownerSecret`.

Проверяющий видит только `expectedCommitment`. Если proof валиден, значит prover действительно знает секретные входы, но сами входы не раскрываются.

## 6. Docker Compose

Compose поднимает инфраструктуру:

- PostgreSQL — операционная база данных;
- IPFS — off-chain storage;
- Ethereum dev node — локальная blockchain-сеть;
- backend;
- frontend.

Для production можно заменить dev geth на Hyperledger Besu QBFT/IBFT network.

## 7. Что честно сказать на защите

Этот репозиторий — dissertation-grade прототип. Он показывает архитектуру и ключевые security patterns. Для промышленного запуска нужно:

1. заменить in-memory stores на PostgreSQL repositories;
2. подключить реальный IPFS adapter;
3. сгенерировать настоящий Groth16 Solidity verifier;
4. настроить Besu permissioned consensus;
5. провести security audit smart contracts;
6. добавить e2e/load/gas тестирование.
