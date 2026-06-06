> Документ создан **отдельно от исходного кода** и предназначен для защиты магистерской диссертации. Он объясняет назначение каждого файла и каждой реализованной функции/метода в проекте простым техническим языком.

## 1. Назначение системы

Проект реализует прототип enterprise-системы распределённого нотариального документооборота для Федеральной нотариальной палаты РФ и региональных нотариальных палат.

Ключевая архитектурная идея:

1. **Документ не хранится в blockchain** — это дорого, небезопасно и не подходит для персональных данных.
2. **Документ шифруется и хранится off-chain** — в демонстрации через IPFS-подобный слой.
3. **В blockchain записываются доказательства** — hash документа, hash metadata, CID, timestamp, статус, события аудита.
4. **Роли проверяются дважды** — на backend через JWT/RBAC и на blockchain через smart contract access control.
5. **Zero-Knowledge модуль** показывает, как подтвердить владение/существование документа без раскрытия содержимого.

## 2. Структура репозитория

| Путь | Назначение |
| --- | --- |
| `apps/backend` | Backend API на NestJS/TypeScript. Отвечает за REST API, auth, documents, audit, IPFS, blockchain и ZK. |
| `apps/frontend` | Frontend web application на Next.js/React/TailwindCSS. Даёт UI для нотариусов, администраторов, аудиторов и проверяющих. |
| `apps/blockchain` | Hardhat-проект со smart contracts, тестами и deploy script. |
| `apps/zk` | Zero-Knowledge circuit и demo prover helpers. |
| `contracts` | Зеркальная копия Solidity contracts для удобства проверки/прикрепления к диссертации. |
| `docker` | Dockerfile для backend и frontend. |
| `docs` | Архитектурные документы, диаграммы и пояснения. |
| `docker-compose.yml` | Локальная инфраструктура: PostgreSQL, IPFS, blockchain node, backend, frontend. |
| `package.json` | Root workspace configuration для monorepo. |
| `tsconfig.base.json` | Общая TypeScript strict-конфигурация. |

---

# 3. Root-level файлы

## 3.1 `.gitignore`

Файл исключает из Git временные и генерируемые артефакты:

- `node_modules` — зависимости npm;
- `dist`, `.next`, `coverage` — результаты сборки/тестов;
- `artifacts`, `cache`, `typechain-types` — Hardhat-generated артефакты;
- `.env`, `.env.local` — секреты и локальные переменные окружения;
- `*.zkey`, `*.wtns`, `*.r1cs`, `*.sym` — ZK build artifacts.

Функций не содержит.

## 3.2 `package.json`

Root package file управляет monorepo.

### Основные поля

| Поле | Значение |
| --- | --- |
| `workspaces` | Подключает `apps/backend`, `apps/frontend`, `apps/blockchain`, `apps/zk` как npm workspaces. |
| `scripts.build` | Запускает build во всех workspaces, где он есть. |
| `scripts.test` | Запускает тесты во всех workspaces, где они есть. |
| `scripts.lint` | Запускает lint во всех workspaces, где он есть. |
| `scripts.typecheck` | Запускает TypeScript-проверку во всех workspaces. |
| `engines.node` | Требует Node.js версии 20+. |

Функций не содержит.

## 3.3 `tsconfig.base.json`

Общая TypeScript-конфигурация.

Ключевые настройки:

- `strict: true` — строгая типизация;
- `target: ES2022` — современный JavaScript runtime;
- `moduleResolution: node` — стандартное разрешение импортов Node.js;
- `noImplicitOverride: true` — защита от неявного переопределения методов;
- `forceConsistentCasingInFileNames: true` — защита от ошибок регистра в путях.

Функций не содержит.

## 3.4 `docker-compose.yml`

Описывает локальную инфраструктуру.

| Сервис | Назначение |
| --- | --- |
| `postgres` | PostgreSQL для operational data/read models. |
| `ipfs` | IPFS/Kubo node для off-chain storage. |
| `blockchain` | Ethereum-compatible dev node через `ethereum/client-go:stable --dev`. |
| `backend` | NestJS API container. |
| `frontend` | Next.js UI container. |

Функций не содержит, но задаёт инфраструктурные зависимости и переменные окружения.

---

# 4. Backend: `apps/backend`

Backend построен на NestJS. Архитектурно NestJS использует:

- **Module** — группирует controller/service/providers;
- **Controller** — принимает HTTP-запросы;
- **Service** — содержит бизнес-логику;
- **Guard** — проверяет доступ;
- **Interceptor** — выполняет сквозную логику, например audit;
- **DTO** — описывает входные данные и валидацию.

## 4.1 `apps/backend/package.json`

Описывает зависимости backend-приложения.

### Scripts

| Script | Назначение |
| --- | --- |
| `start:dev` | Запуск NestJS backend в watch mode. |
| `build` | Сборка backend через Nest CLI. |
| `test` | Запуск Jest tests. |
| `typecheck` | TypeScript-проверка без генерации JS. |
| `lint` | ESLint-проверка `src/**/*.ts`. |
| `prisma:generate` | Генерация Prisma Client. |
| `prisma:migrate` | Запуск Prisma migrations в dev mode. |

Функций не содержит.

## 4.2 `apps/backend/tsconfig.json`

TypeScript-конфигурация backend.

Особенности:

- включает decorators: `emitDecoratorMetadata`, `experimentalDecorators`;
- задаёт `outDir: ./dist`;
- включает `src/**/*.ts` и `test/**/*.ts`.

Функций не содержит.

## 4.3 `apps/backend/nest-cli.json`

Минимальная конфигурация Nest CLI:

- `sourceRoot: src` — исходный код лежит в `src`.

Функций не содержит.

## 4.4 `apps/backend/jest.config.js`

Конфигурация Jest:

- `preset: ts-jest` — тестирование TypeScript;
- `testEnvironment: node` — Node.js среда;
- `roots: ['<rootDir>/test']` — тесты находятся в `test`.

Функций не содержит.

## 4.5 `apps/backend/prisma/schema.prisma`

Prisma schema описывает будущую PostgreSQL-модель.

### Enums

| Enum | Значения | Назначение |
| --- | --- | --- |
| `Role` | `SUPER_ADMIN`, `FEDERAL_CHAMBER_ADMIN`, `REGIONAL_CHAMBER_ADMIN`, `NOTARY`, `AUDITOR`, `VERIFIER` | Роли участников системы. |
| `DocumentStatus` | `PENDING_ON_CHAIN`, `ACTIVE`, `REVOKED` | Состояния документа в operational DB. |

### Models

| Model | Назначение |
| --- | --- |
| `User` | Пользователь/участник: wallet, ФИО, код палаты, роли, active flag. |
| `Document` | Read model документа: documentId, hash, metadataHash, CID, status, txHash, notary relation. |
| `AuditEntry` | API audit entry: actor, action, entity, metadata, createdAt. |
| `RegionalRequest` | Межрегиональный workflow request: documentId, from/to chamber, status. |

Функций не содержит, но является схемой данных.

## 4.6 `apps/backend/src/main.ts`

Точка входа backend-приложения.

### `bootstrap(): Promise<void>`

Назначение:

1. Создаёт NestJS-приложение из `AppModule`.
2. Включает CORS для frontend.
3. Устанавливает глобальный API prefix `/api/v1`.
4. Подключает `ValidationPipe`.
5. Запускает HTTP server на `PORT` или `3001`.

Почему важно:

- CORS нужен для браузерного frontend;
- versioned API упрощает развитие системы;
- `ValidationPipe` защищает API от лишних и некорректных полей.

## 4.7 `apps/backend/src/app.module.ts`

Корневой NestJS module.

### `AppModule`

Назначение:

- подключает все backend-модули;
- регистрирует глобальный rate limit guard;
- регистрирует глобальный audit interceptor.

### Подключённые modules

| Module | Назначение |
| --- | --- |
| `ConfigModule` | Работа с env variables. |
| `ThrottlerModule` | Rate limiting: защита от brute-force/DoS. |
| `AuthModule` | Wallet login и JWT. |
| `UsersModule` | Пользователи и роли. |
| `BlockchainModule` | Ethereum JSON-RPC интеграция. |
| `IpfsModule` | Шифрование и off-chain storage. |
| `AuditModule` | Audit trail. |
| `DocumentsModule` | Документы и verification. |
| `RegionalModule` | Межрегиональные запросы. |
| `ZkModule` | Zero-Knowledge proof API. |

Функций не содержит, но задаёт dependency graph backend.

---

# 5. Backend common layer

## 5.1 `apps/backend/src/common/roles.ts`

### `Role` enum

Перечисление ролей backend-приложения.

| Роль | Смысл |
| --- | --- |
| `SUPER_ADMIN` | Полный системный администратор. |
| `FEDERAL_CHAMBER_ADMIN` | Федеральная палата. |
| `REGIONAL_CHAMBER_ADMIN` | Администратор региональной палаты. |
| `NOTARY` | Нотариус, регистрирует документы. |
| `AUDITOR` | Проверяет логи и историю действий. |
| `VERIFIER` | Выполняет verification без доступа к закрытым данным. |

Функций не содержит.

## 5.2 `apps/backend/src/common/decorators/roles.decorator.ts`

### `ROLES_KEY`

Константа metadata key. Используется NestJS Reflector для хранения списка ролей на controller method.

### `Roles(...roles: Role[])`

Функция-декоратор.

Назначение:

- вызывается как `@Roles(Role.NOTARY)`;
- сохраняет список разрешённых ролей в metadata;
- позже `RolesGuard` читает эту metadata и принимает решение о доступе.

## 5.3 `apps/backend/src/common/guards/roles.guard.ts`

### `RolesGuard` class

Guard для role-based access control на уровне REST API.

### `constructor(private readonly reflector: Reflector)`

Внедряет NestJS `Reflector`, который читает metadata декораторов.

### `canActivate(context: ExecutionContext): boolean`

Алгоритм:

1. Получает список ролей из `@Roles(...)`.
2. Если ролей нет — доступ разрешён.
3. Берёт `request.user`, который заполнил JWT strategy.
4. Проверяет, есть ли у пользователя хотя бы одна требуемая роль.

Security-смысл:

- запрещает доступ к endpoint'ам неавторизованным ролям;
- реализует backend RBAC.

## 5.4 `apps/backend/src/common/interceptors/audit.interceptor.ts`

### `AuditInterceptor` class

Interceptor для автоматического audit logging.

### `constructor(private readonly audit: AuditService)`

Внедряет `AuditService`, куда записываются audit entries.

### `intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>`

Алгоритм:

1. Читает HTTP method, URL и user id из request.
2. Запоминает время начала обработки.
3. Передаёт управление controller'у через `next.handle()`.
4. После успешного выполнения пишет audit entry.

Почему это удобно:

- не надо вручную писать audit-код в каждом controller;
- логика аудита централизована.

---

# 6. Backend AuthModule

## 6.1 `apps/backend/src/auth/auth.module.ts`

### `AuthModule`

Модуль аутентификации.

Подключает:

- `PassportModule` — authentication framework;
- `JwtModule` — создание и проверка JWT;
- `AuthController`;
- `AuthService`;
- `JwtStrategy`.

Функций не содержит.

## 6.2 `apps/backend/src/auth/auth.service.ts`

### `AuthenticatedUser` interface

Описывает payload внутри JWT:

| Поле | Значение |
| --- | --- |
| `sub` | Subject/user id, здесь wallet lowercase. |
| `wallet` | Ethereum wallet address. |
| `roles` | Роли пользователя. |
| `chamberCode` | Код региональной палаты. |

### `AuthService` class

Сервис wallet authentication.

### `constructor(private readonly jwt: JwtService)`

Внедряет JWT service для подписи access token.

### `createNonce(wallet: string): string`

Назначение:

- генерирует случайный nonce;
- сохраняет nonce по wallet address;
- возвращает nonce frontend'у.

Зачем нужен nonce:

- пользователь подписывает уникальное сообщение;
- старую подпись нельзя бесконечно переиспользовать;
- это защита от replay в login flow.

### `login(wallet: string, signature: string): Promise<{ accessToken: string }>`

Алгоритм:

1. Находит nonce для wallet.
2. Восстанавливает адрес подписанта через `ethers.verifyMessage`.
3. Сравнивает восстановленный адрес с заявленным wallet.
4. Формирует JWT payload.
5. Возвращает access token.

Ограничение прототипа:

- роль `NOTARY` выдаётся демонстрационно;
- в production роли должны читаться из PostgreSQL и/или smart contract.

## 6.3 `apps/backend/src/auth/auth.controller.ts`

### `NonceDto` class

DTO для запроса nonce.

Поле:

- `wallet` — Ethereum address, проверяется `@IsEthereumAddress()`.

### `LoginDto` class

DTO для login.

Поля:

- `wallet` — Ethereum address;
- `signature` — подпись nonce.

### `AuthController` class

HTTP controller для auth endpoints.

### `constructor(private readonly auth: AuthService)`

Внедряет бизнес-логику auth.

### `nonce(dto: NonceDto): { nonce: string }`

Endpoint: `POST /api/v1/auth/nonce`.

Назначение:

- frontend передаёт wallet;
- backend возвращает nonce для подписи.

### `login(dto: LoginDto): Promise<{ accessToken: string }>`

Endpoint: `POST /api/v1/auth/login`.

Назначение:

- frontend отправляет wallet и signature;
- backend проверяет подпись;
- backend возвращает JWT.

## 6.4 `apps/backend/src/auth/jwt.strategy.ts`

### `JwtStrategy` class

Passport strategy для проверки JWT.

### `constructor()`

Настраивает:

- извлечение токена из `Authorization: Bearer <token>`;
- проверку expiration;
- secret из `JWT_SECRET`.

### `validate(payload: AuthenticatedUser): AuthenticatedUser`

Назначение:

- возвращает payload;
- NestJS кладёт результат в `request.user`;
- дальше guards/controllers используют user roles/wallet.

---

# 7. Backend DocumentsModule

## 7.1 `apps/backend/src/documents/documents.module.ts`

### `DocumentsModule`

Модуль работы с документами.

Подключает:

- `BlockchainModule` — проверка/взаимодействие с blockchain;
- `IpfsModule` — шифрование и off-chain storage;
- `DocumentsController`;
- `DocumentsService`.

Функций не содержит.

## 7.2 `apps/backend/src/documents/dto.ts`

### `RegisterDocumentDto` class

DTO регистрации документа.

| Поле | Назначение |
| --- | --- |
| `fileName` | Имя файла для metadata. |
| `mimeType` | MIME type файла. |
| `base64Content` | Содержимое файла в base64. |
| `regionalChamberCode` | Опциональный код региональной палаты. |

### `VerifyDocumentDto` class

DTO публичной проверки.

| Поле | Назначение |
| --- | --- |
| `documentId` | Идентификатор записи в registry. |
| `sha256` | Hash/checksum документа в SHA-256 формате. |

## 7.3 `apps/backend/src/documents/documents.service.ts`

### `RegisteredDocument` interface

Описывает результат регистрации документа на backend.

Поля:

- `documentId` — идентификатор записи;
- `documentHash` — hash документа;
- `cid` — IPFS CID;
- `status` — `PENDING_ON_CHAIN` или `ACTIVE`;
- `txHash` — optional blockchain transaction hash.

### `DocumentsService` class

Бизнес-логика документа.

### `constructor(private readonly ipfs: IpfsService, private readonly blockchain: BlockchainService)`

Внедряет зависимости:

- `IpfsService` для шифрования/off-chain storage;
- `BlockchainService` для проверки on-chain.

### `register(dto: RegisterDocumentDto, notaryWallet: string): Promise<RegisteredDocument>`

Алгоритм:

1. Декодирует файл из base64 в `Buffer`.
2. Считает `documentHash` через `ethers.keccak256`.
3. Считает `metadataHash` из имени файла, MIME type и регионального кода.
4. Передаёт документ в `IpfsService.addEncrypted`.
5. Получает `cid`.
6. Создаёт demo `documentId`.
7. Сохраняет запись во временную in-memory map.
8. Возвращает prepared record.

Архитектурный смысл:

- backend готовит off-chain часть;
- blockchain-транзакция должна отдельно подписываться wallet'ом.

### `verify(dto: VerifyDocumentDto): Promise<{ valid: boolean; documentHash: string; source: string }>`

Назначение:

- преобразует SHA-256 строку в `0x...` формат;
- вызывает `BlockchainService.verifyDocument`;
- возвращает результат проверки.

### `checksum(buffer: Buffer): string`

Назначение:

- считает SHA-256 checksum буфера;
- полезно для интеграции с внешними системами, где принят SHA-256.

### `list(): RegisteredDocument[]`

Назначение:

- возвращает все demo records из in-memory map.

## 7.4 `apps/backend/src/documents/documents.controller.ts`

### `DocumentsController` class

HTTP API для документов.

### `constructor(private readonly documents: DocumentsService)`

Внедряет service.

### `register(dto: RegisterDocumentDto, req: { user: { wallet: string } }): Promise<RegisteredDocument>`

Endpoint: `POST /api/v1/documents`.

Guards:

- JWT authentication;
- roles guard;
- роль `NOTARY`.

Назначение:

- нотариус отправляет документ;
- backend готовит encrypted off-chain storage и hash.

### `list(): RegisteredDocument[]`

Endpoint: `GET /api/v1/documents`.

Доступ:

- `NOTARY`;
- `AUDITOR`.

Назначение:

- вернуть список demo documents.

### `verify(dto: VerifyDocumentDto): Promise<{ valid: boolean; documentHash: string; source: string }>`

Endpoint: `POST /api/v1/documents/verify`.

Назначение:

- публичная проверка документа;
- JWT не требуется.

---

# 8. Backend IPFS/off-chain storage

## 8.1 `apps/backend/src/ipfs/ipfs.module.ts`

### `IpfsModule`

Модуль off-chain storage.

Экспортирует `IpfsService`, чтобы другие модули могли шифровать и сохранять документы.

Функций не содержит.

## 8.2 `apps/backend/src/ipfs/ipfs.service.ts`

### `IpfsService` class

Сервис шифрования и demo IPFS storage.

### `encrypt(buffer: Buffer, key = randomBytes(32)): { encrypted: Buffer; key: Buffer; iv: Buffer; authTag: Buffer }`

Назначение:

- шифрует документ через AES-256-GCM;
- возвращает ciphertext, key, IV и authTag.

Security-смысл:

- IPFS получает только ciphertext;
- authTag позволяет выявить подмену ciphertext.

### `decrypt(encrypted: Buffer, key: Buffer, iv: Buffer, authTag: Buffer): Buffer`

Назначение:

- расшифровывает ciphertext;
- проверяет authTag;
- возвращает исходный buffer.

### `addEncrypted(buffer: Buffer): Promise<{ cid: string; encrypted: Buffer; encryptionKeyRef: string }>`

Алгоритм:

1. Вызывает `encrypt`.
2. Генерирует demo CID на основе SHA-256 encrypted payload.
3. Сохраняет encrypted payload в in-memory map.
4. Возвращает CID, encrypted bytes и `encryptionKeyRef`.

Ограничение прототипа:

- ключ не должен храниться так в production;
- нужен KMS/HSM или envelope encryption.

---

# 9. Backend BlockchainModule

## 9.1 `apps/backend/src/blockchain/blockchain.module.ts`

### `BlockchainModule`

Модуль blockchain-интеграции.

Экспортирует `BlockchainService`.

Функций не содержит.

## 9.2 `apps/backend/src/blockchain/blockchain.service.ts`

### `BlockchainService` class

Сервис взаимодействия с Ethereum-compatible RPC.

### `provider`

Поле класса, экземпляр `ethers.JsonRpcProvider`.

Использует:

- `RPC_URL` из env;
- fallback `http://localhost:8545`.

### `hashDocument(buffer: Buffer): string`

Назначение:

- считает `keccak256` hash документа;
- возвращает hash в Ethereum-compatible формате `0x...`.

### `getTransaction(txHash: string): Promise<ethers.TransactionResponse | null>`

Назначение:

- получает blockchain transaction по hash;
- используется для истории транзакций и UI.

### `verifyDocument(documentId: string, documentHash: string): Promise<{ valid: boolean; source: 'contract' | 'demo' }>`

Алгоритм:

1. Если `DOCUMENT_REGISTRY_ADDRESS` не задан — возвращает demo result.
2. Создаёт minimal ABI для `verifyDocument`.
3. Создаёт ethers contract instance.
4. Вызывает smart contract.
5. Возвращает `valid` и source.

---

# 10. Backend AuditModule

## 10.1 `apps/backend/src/audit/audit.module.ts`

### `AuditModule`

Модуль аудита API.

Содержит:

- `AuditController`;
- `AuditService`.

Экспортирует `AuditService` для interceptor.

Функций не содержит.

## 10.2 `apps/backend/src/audit/audit.service.ts`

### `AuditEntry` interface

Описывает audit record:

- `id`;
- `actorId`;
- `action`;
- `entityId`;
- `durationMs`;
- `createdAt`.

### `AuditService` class

Сервис audit trail.

### `recordAccess(entry: Omit<AuditEntry, 'id' | 'createdAt'>): void`

Назначение:

- добавляет audit entry;
- генерирует UUID;
- ставит timestamp.

### `list(): AuditEntry[]`

Назначение:

- возвращает audit entries в обратном порядке;
- новые события отображаются первыми.

## 10.3 `apps/backend/src/audit/audit.controller.ts`

### `AuditController` class

HTTP API аудита.

### `constructor(private readonly audit: AuditService)`

Внедряет audit service.

### `list(): AuditEntry[]`

Endpoint: `GET /api/v1/audit`.

Доступ:

- `AUDITOR`;
- `SUPER_ADMIN`;
- `FEDERAL_CHAMBER_ADMIN`.

Назначение:

- получить audit logs.

---

# 11. Backend UsersModule

## 11.1 `apps/backend/src/users/users.module.ts`

### `UsersModule`

Модуль управления пользователями.

Экспортирует `UsersService`.

Функций не содержит.

## 11.2 `apps/backend/src/users/users.service.ts`

### `UserAccount` interface

Описывает пользователя:

- `id`;
- `wallet`;
- `fullName`;
- `chamberCode`;
- `roles`;
- `active`.

### `UsersService` class

Demo user management service.

### `create(input: Omit<UserAccount, 'id' | 'active'>): UserAccount`

Назначение:

- создаёт пользователя;
- генерирует UUID;
- ставит `active: true`;
- сохраняет в in-memory array.

### `revoke(id: string): void`

Назначение:

- ищет пользователя;
- если найден — ставит `active: false`;
- не удаляет запись, чтобы сохранить auditability.

### `list(): UserAccount[]`

Назначение:

- возвращает список пользователей.

## 11.3 `apps/backend/src/users/users.controller.ts`

### `UsersController` class

HTTP API user management.

### `constructor(private readonly users: UsersService)`

Внедряет user service.

### `create(dto: Omit<UserAccount, 'id' | 'active'>): UserAccount`

Endpoint: `POST /api/v1/users`.

Доступ:

- `SUPER_ADMIN`;
- `FEDERAL_CHAMBER_ADMIN`;
- `REGIONAL_CHAMBER_ADMIN`.

### `revoke(id: string): { revoked: boolean }`

Endpoint: `POST /api/v1/users/:id/revoke`.

Доступ:

- `SUPER_ADMIN`;
- `FEDERAL_CHAMBER_ADMIN`.

### `list(): UserAccount[]`

Endpoint: `GET /api/v1/users`.

Доступ:

- `SUPER_ADMIN`;
- `FEDERAL_CHAMBER_ADMIN`;
- `REGIONAL_CHAMBER_ADMIN`.

---

# 12. Backend RegionalModule

## 12.1 `apps/backend/src/regional/regional.module.ts`

### `RegionalModule`

Модуль межрегиональных запросов.

Функций не содержит.

## 12.2 `apps/backend/src/regional/regional.service.ts`

### `RegionalRequest` interface

Описывает межрегиональный запрос:

- `id`;
- `documentId`;
- `fromChamber`;
- `toChamber`;
- `status`;
- `createdAt`.

### `RegionalService` class

Сервис workflow между палатами.

### `create(input: Omit<RegionalRequest, 'id' | 'status' | 'createdAt'>): RegionalRequest`

Назначение:

- создаёт request;
- генерирует UUID;
- ставит статус `CREATED`;
- сохраняет in-memory.

### `list(): RegionalRequest[]`

Назначение:

- возвращает все межрегиональные запросы.

## 12.3 `apps/backend/src/regional/regional.controller.ts`

### `RegionalController` class

HTTP API регионального workflow.

### `constructor(private readonly regional: RegionalService)`

Внедряет service.

### `create(dto: Omit<RegionalRequest, 'id' | 'status' | 'createdAt'>): RegionalRequest`

Endpoint: `POST /api/v1/regional-requests`.

Доступ:

- `NOTARY`;
- `REGIONAL_CHAMBER_ADMIN`.

### `list(): RegionalRequest[]`

Endpoint: `GET /api/v1/regional-requests`.

Доступ:

- `NOTARY`;
- `REGIONAL_CHAMBER_ADMIN`;
- `AUDITOR`.

---

# 13. Backend ZkModule

## 13.1 `apps/backend/src/zk/zk.module.ts`

### `ZkModule`

Модуль Zero-Knowledge API.

Функций не содержит.

## 13.2 `apps/backend/src/zk/zk.service.ts`

### `ZkProofResponse` interface

Описывает demo response:

- `proof.a`;
- `proof.b`;
- `proof.c`;
- `publicSignals`.

### `ZkService` class

Сервис demo proof generation/verification.

### `generateProof(documentHash: string, ownerSecret: string): Promise<ZkProofResponse>`

Назначение:

- создаёт commitment из `documentHash` и `ownerSecret`;
- возвращает proof-like структуру;
- показывает интерфейс будущего SnarkJS workflow.

Ограничение:

- это не настоящая криптографическая генерация proof;
- production должен использовать `snarkjs.groth16.fullProve`.

### `verify(publicSignals: string[]): Promise<{ valid: boolean }>`

Назначение:

- demo-проверка public signals;
- возвращает `valid: true`, если сигналы существуют и непустые.

## 13.3 `apps/backend/src/zk/zk.controller.ts`

### `ProofDto` class

DTO генерации proof:

- `documentHash`;
- `ownerSecret`.

### `VerifyProofDto` class

DTO проверки proof:

- `publicSignals`.

### `ZkController` class

HTTP API для ZK.

### `constructor(private readonly zk: ZkService)`

Внедряет ZK service.

### `generate(dto: ProofDto): Promise<ZkProofResponse>`

Endpoint: `POST /api/v1/zk/proof`.

Назначение:

- создать demo proof response.

### `verify(dto: VerifyProofDto): Promise<{ valid: boolean }>`

Endpoint: `POST /api/v1/zk/verify`.

Назначение:

- проверить public signals.

---

# 14. Backend tests/load

## 14.1 `apps/backend/test/documents.service.spec.ts`

Jest unit test для `DocumentsService`.

### Test case: `creates an encrypted off-chain record`

Проверяет:

1. Создание `DocumentsService` с `IpfsService` и `BlockchainService`.
2. Регистрацию demo PDF.
3. Что возвращённый CID содержит `bafy-demo-`.
4. Что `documentHash` начинается с `0x`.

## 14.2 `apps/backend/test/load/verify.k6.js`

k6 load test для public verify endpoint.

### `options`

Настройки нагрузки:

- `vus: 10` — 10 виртуальных пользователей;
- `duration: '30s'` — тест длится 30 секунд.

### `default function ()`

Алгоритм:

1. Формирует JSON payload с demo `documentId` и `sha256`.
2. Отправляет POST на `/api/v1/documents/verify`.
3. Проверяет, что HTTP status в диапазоне `200..499`.
4. Ждёт 1 секунду.

---

# 15. Blockchain: `apps/blockchain`

## 15.1 `apps/blockchain/package.json`

Hardhat workspace configuration.

### Scripts

| Script | Назначение |
| --- | --- |
| `build` | `hardhat compile`. |
| `test` | `hardhat test`. |
| `deploy:local` | Deploy contracts в localhost network. |
| `typecheck` | TypeScript typecheck. |

### Dependencies

- `@openzeppelin/contracts` — безопасные базовые smart contract библиотеки;
- `ethers` — Ethereum client library;
- `hardhat` — development/test/deploy framework.

Функций не содержит.

## 15.2 `apps/blockchain/hardhat.config.ts`

Hardhat configuration.

Содержит:

- Solidity version `0.8.24`;
- optimizer enabled;
- `viaIR: true`;
- networks `hardhat` и `localhost`;
- paths for sources/tests/cache/artifacts.

Функций не содержит.

## 15.3 `apps/blockchain/tsconfig.json`

TypeScript configuration for Hardhat scripts/tests.

Функций не содержит.

## 15.4 `apps/blockchain/scripts/deploy.ts`

Deployment script.

### `main(): Promise<void>`

Алгоритм:

1. Получает deployer account.
2. Deploy `NotaryAccessControl`.
3. Deploy `AuditContract`.
4. Deploy `DocumentRegistry`.
5. Разрешает registry писать в audit через `setAuthorizedWriter`.
6. Deploy `ZKVerifier`.
7. Печатает адреса контрактов.

### `main().catch(...)`

Обработка ошибок deployment:

- выводит ошибку;
- выставляет `process.exitCode = 1`.

## 15.5 `apps/blockchain/test/document-registry.test.ts`

Hardhat test для регистрации и проверки документа.

### Test suite: `DocumentRegistry`

Группирует тесты registry contract.

### Test case: `registers and verifies a document commitment`

Проверяет:

1. Deploy access/audit/registry contracts.
2. Разрешение registry писать audit.
3. Регистрацию notary participant.
4. Расчёт `documentHash` и `metadataHash`.
5. Формирование digest как в contract.
6. Подписание digest нотариусом.
7. Вызов `registerDocument`.
8. Извлечение `DocumentRegistered` event.
9. Проверку `verifyDocument`.

---

# 16. Smart contracts

> В `apps/blockchain/contracts` лежит основная версия контрактов. В `contracts` лежит зеркальная копия тех же контрактов для удобства проверки. Ниже описываются оба набора как один логический smart-contract слой.

## 16.1 `NotaryAccessControl.sol`

Контракт on-chain RBAC.

### Constants

| Constant | Назначение |
| --- | --- |
| `SUPER_ADMIN` | Верхний администратор сети. |
| `FEDERAL_CHAMBER_ADMIN` | Администратор федеральной палаты. |
| `REGIONAL_CHAMBER_ADMIN` | Администратор региональной палаты. |
| `NOTARY` | Нотариус. |
| `AUDITOR` | Аудитор. |
| `VERIFIER` | Проверяющий. |

### Events

| Event | Назначение |
| --- | --- |
| `ParticipantRegistered` | Фиксирует регистрацию участника и выдачу роли. |
| `ParticipantMetadataUpdated` | Фиксирует обновление metadata участника. |

### Struct `Participant`

Поля:

- `chamberCode` — код палаты;
- `metadataURI` — ссылка на off-chain metadata;
- `active` — активен ли участник.

### `constructor(address admin)`

Назначение:

1. Выдаёт deployer/admin базовые роли.
2. Настраивает иерархию администрирования ролей.

### `registerParticipant(address account, bytes32 role, string calldata chamberCode, string calldata metadataURI)`

Назначение:

- выдаёт роль участнику;
- сохраняет карточку участника;
- генерирует `ParticipantRegistered` event.

Access control:

- вызвать может только admin соответствующей роли.

### `updateParticipantMetadata(address account, string calldata metadataURI)`

Назначение:

- обновить metadata URI участника;
- доступно только `SUPER_ADMIN`.

### `getParticipant(address account): Participant`

Назначение:

- прочитать карточку участника.

### `pause()`

Назначение:

- аварийно остановить операции контракта;
- доступно только `SUPER_ADMIN`.

### `unpause()`

Назначение:

- снять аварийную остановку;
- доступно только `SUPER_ADMIN`.

## 16.2 `AuditContract.sol`

Контракт immutable audit trail.

### Constants

- `AUDITOR`;
- `NOTARY`;
- `SUPER_ADMIN`.

Используются для проверки прав записи/администрирования.

### Struct `AuditLog`

Поля:

- `actionType` — тип действия;
- `entityId` — documentId/requestId;
- `actor` — address инициатора;
- `timestamp` — block timestamp;
- `metadataHash` — hash подробностей.

### Events

| Event | Назначение |
| --- | --- |
| `AuditWriterUpdated` | Изменён список контрактов, которым разрешено писать audit. |
| `ActionLogged` | Создана новая audit-запись. |

### Modifier `onlyAuditWriter()`

Проверяет, что sender имеет право писать audit:

- либо address в `authorizedWriters`;
- либо роль `AUDITOR`;
- либо роль `NOTARY`;
- либо роль `SUPER_ADMIN`.

### `constructor(NotaryAccessControl accessControl)`

Сохраняет ссылку на RBAC contract.

### `setAuthorizedWriter(address writer, bool allowed)`

Назначение:

- разрешить/запретить контракту писать audit;
- используется для `DocumentRegistry`.

### `logAction(bytes32 actionType, bytes32 entityId, bytes32 metadataHash): uint256`

Назначение:

1. Добавляет `AuditLog` в массив.
2. Индексирует log по `entityId`.
3. Генерирует `ActionLogged` event.
4. Возвращает `logId`.

### `getAuditLog(uint256 logId): AuditLog`

Назначение:

- прочитать audit entry по id.

### `getAuditLogs(bytes32 entityId): uint256[]`

Назначение:

- получить все logId, связанные с entity.

### `totalLogs(): uint256`

Назначение:

- вернуть общее число audit entries.

### `pause()` / `unpause()`

Аварийная остановка/возобновление audit contract.

## 16.3 `DocumentRegistry.sol`

Основной контракт реестра документов.

### Constants

| Constant | Назначение |
| --- | --- |
| `NOTARY` | Проверка права регистрации. |
| `AUDITOR` | Проверка доступа к privileged view. |
| `SUPER_ADMIN` | Административный доступ. |
| `ACTION_REGISTER` | Audit action регистрации. |
| `ACTION_REVOKE` | Audit action отзыва. |
| `ACTION_METADATA` | Audit action обновления metadata. |

### Enum `DocumentStatus`

| Status | Смысл |
| --- | --- |
| `Unknown` | Записи нет. |
| `Active` | Документ активен. |
| `Revoked` | Документ отозван. |

### Struct `DocumentRecord`

Поля:

- `documentHash`;
- `metadataHash`;
- `cid`;
- `notary`;
- `registeredAt`;
- `updatedAt`;
- `status`.

### Events

| Event | Назначение |
| --- | --- |
| `DocumentRegistered` | Документ зарегистрирован. |
| `DocumentRevoked` | Документ отозван. |
| `MetadataUpdated` | Metadata/CID обновлены. |

### Modifier `onlyNotary()`

Проверяет роль `NOTARY` через `NotaryAccessControl`.

### Modifier `onlyPrivileged()`

Разрешает доступ ролям:

- `NOTARY`;
- `AUDITOR`;
- `SUPER_ADMIN`.

### `constructor(NotaryAccessControl accessControl, AuditContract auditContract)`

Сохраняет ссылки на RBAC и audit contracts.

### `registerDocument(bytes32 documentHash, bytes32 metadataHash, string calldata cid, bytes calldata walletSignature): bytes32 documentId`

Главная функция регистрации документа.

Алгоритм:

1. Проверяет, что hash не пустой.
2. Собирает signed digest из:
   - address контракта;
   - chain id;
   - sender;
   - nonce;
   - documentHash;
   - metadataHash;
   - CID.
3. Проверяет ECDSA подпись.
4. Увеличивает nonce.
5. Генерирует `documentId`.
6. Сохраняет `DocumentRecord`.
7. Пишет audit action.
8. Генерирует event.

Security-смысл:

- защита от replay;
- защита от переноса подписи между сетями/контрактами;
- on-chain фиксация неизменности.

### `verifyDocument(bytes32 documentId, bytes32 documentHash): (bool valid, DocumentRecord record)`

Назначение:

- проверяет, активен ли документ;
- сравнивает переданный hash с on-chain hash;
- возвращает boolean и карточку.

### `getDocument(bytes32 documentId): DocumentRecord`

Назначение:

- получить полную карточку документа;
- доступно privileged roles.

### `revokeDocument(bytes32 documentId, bytes32 reasonHash)`

Назначение:

- перевести документ в `Revoked`;
- сохранить timestamp;
- записать audit action;
- сгенерировать event.

Access control:

- нотариус-владелец записи или `SUPER_ADMIN`.

### `updateMetadata(bytes32 documentId, bytes32 metadataHash, string calldata cid)`

Назначение:

- обновить metadata hash и CID;
- обновить timestamp;
- записать audit.

Access control:

- только нотариус, создавший запись.

### `pause()` / `unpause()`

Аварийная остановка/возобновление registry.

## 16.4 `ZKVerifier.sol`

Контракт-фасад проверки ZK proof.

### Event `ProofVerified`

Фиксирует:

- public document commitment;
- verifier address;
- результат проверки.

### `verifyProof(uint256[2] calldata a, uint256[2][2] calldata b, uint256[2] calldata c, uint256[2] calldata publicSignals): bool valid`

Назначение:

1. Передать proof parts в internal verifier.
2. Получить boolean result.
3. Записать event.
4. Вернуть результат.

### `_verifyGroth16Proof(...): bool`

Demo internal function.

Назначение:

- проверяет, что proof/public signals не пустые;
- имитирует интерфейс настоящего Groth16 verifier.

Ограничение:

- не является настоящей криптографической проверкой;
- для production нужно заменить SnarkJS-generated verifier'ом.

---

# 17. Frontend: `apps/frontend`

## 17.1 Config files

### `apps/frontend/package.json`

Описывает Next.js workspace.

Scripts:

- `dev` — development server;
- `build` — production build;
- `typecheck` — TypeScript check;
- `lint` — Next lint.

### `apps/frontend/tsconfig.json`

TypeScript config для frontend:

- JSX preserve;
- DOM libs;
- path alias `@/*` → `src/*`.

### `apps/frontend/next.config.js`

Next.js config. Включает `reactStrictMode`.

### `apps/frontend/tailwind.config.ts`

Tailwind config:

- source files `./src/**/*.{ts,tsx}`;
- custom color `federal`.

### `apps/frontend/postcss.config.js`

Подключает TailwindCSS и Autoprefixer.

### `apps/frontend/next-env.d.ts`

Next.js generated type references.

Функций в config-файлах нет.

## 17.2 `apps/frontend/src/app/globals.css`

Глобальные CSS стили:

- Tailwind base/components/utilities;
- body background and text color.

Функций не содержит.

## 17.3 `apps/frontend/src/app/layout.tsx`

### `metadata`

Объект metadata страницы:

- title;
- description.

### `RootLayout({ children }: { children: ReactNode }): JSX.Element`

Назначение:

- корневой layout Next.js App Router;
- задаёт `<html lang="ru">`;
- выводит children внутри body.

## 17.4 `apps/frontend/src/lib/api.ts`

### `apiBase`

Base URL backend API.

Берётся из `NEXT_PUBLIC_API_URL` или fallback `http://localhost:3001/api/v1`.

### `api<T>(path: string, init?: RequestInit): Promise<T>`

Назначение:

1. Выполняет `fetch` к backend API.
2. Автоматически добавляет `Content-Type: application/json`.
3. Если response не ok — выбрасывает error.
4. Возвращает JSON как generic type `T`.

## 17.5 `apps/frontend/src/components/Shell.tsx`

### `items`

Readonly list navigation items:

- Dashboard;
- Registration;
- Verification;
- Audit;
- Regional;
- Admin;
- ZK.

### `Shell({ children }: { children: ReactNode }): JSX.Element`

Назначение:

- общий layout для внутренних страниц;
- рисует sidebar;
- рисует navigation links;
- выводит page content в main area.

## 17.6 `apps/frontend/src/components/StatCard.tsx`

### `StatCard({ label, value, tone }): JSX.Element`

Назначение:

- показывает KPI-карточку;
- `tone` выбирает цветовую схему;
- используется на dashboard.

## 17.7 Frontend pages

### `apps/frontend/src/app/page.tsx`

#### `LoginPage(): JSX.Element`

Стартовая страница входа.

Назначение:

- показывает описание wallet/JWT authentication;
- даёт demo link на dashboard.

### `apps/frontend/src/app/dashboard/page.tsx`

#### `Dashboard(): JSX.Element`

Dashboard page.

Показывает:

- число документов;
- число региональных запросов;
- число ZK проверок;
- краткое описание архитектуры.

### `apps/frontend/src/app/documents/register/page.tsx`

#### `RegisterDocument(): JSX.Element`

Client component для регистрации документа.

Состояние:

- `result` — текст результата demo operation.

Поведение:

1. Пользователь выбирает файл.
2. Вводит региональную палату.
3. Submit показывает сообщение: документ зашифрован, CID создан, transaction ожидает подписи.

### `apps/frontend/src/app/verify/page.tsx`

#### `Verify(): JSX.Element`

Client component публичной проверки.

Состояние:

- `ok` — показывать ли successful result.

Поведение:

- пользователь вводит documentId и SHA-256;
- нажимает «Проверить»;
- UI показывает demo verification result.

### `apps/frontend/src/app/audit/page.tsx`

#### `Audit(): JSX.Element`

Audit page.

Назначение:

- показывает demo audit rows;
- объясняет, что audit складывается из blockchain events и API audit.

### `apps/frontend/src/app/regional/page.tsx`

#### `Regional(): JSX.Element`

Regional workflow page.

Назначение:

- показывает demo requests между регионами;
- демонстрирует статусы `IN_REVIEW`, `APPROVED`.

### `apps/frontend/src/app/admin/page.tsx`

#### `roles`

Array demo roles для отображения.

#### `Admin(): JSX.Element`

Admin page.

Назначение:

- показывает роль model;
- объясняет синхронизацию с smart contract access control.

### `apps/frontend/src/app/zk/page.tsx`

#### `Zk(): JSX.Element`

Client component ZK demo.

Состояние:

- `done` — показывать ли proof result.

Поведение:

- пользователь нажимает «Сгенерировать proof»;
- UI показывает demo `proof verified: true`.

---

# 18. ZK module: `apps/zk`

## 18.1 `apps/zk/package.json`

ZK workspace config.

Scripts:

- `test` — запускает node test;
- `build` — текстовая подсказка по Circom build command;
- `typecheck` — TypeScript check.

Dependencies:

- `circomlib`;
- `snarkjs`.

Функций не содержит.

## 18.2 `apps/zk/tsconfig.json`

TypeScript config для ZK helper code.

Функций не содержит.

## 18.3 `apps/zk/circuits/document_ownership.circom`

Circom circuit для доказательства владения документом.

### `template DocumentOwnership()`

Назначение:

- принимает private inputs `documentHash` и `ownerSecret`;
- принимает public input `expectedCommitment`;
- считает Poseidon hash;
- проверяет, что calculated commitment равен expected commitment.

### `component main { public [expectedCommitment] } = DocumentOwnership();`

Назначение:

- объявляет главный circuit;
- делает `expectedCommitment` публичным сигналом;
- остальные входы остаются приватными.

## 18.4 `apps/zk/src/prover.ts`

### `DemoProof` interface

Описывает demo proof format:

- `proof.pi_a`;
- `proof.pi_b`;
- `proof.pi_c`;
- `publicSignals`.

### `createDemoCommitment(documentHash: string, ownerSecret: string): string`

Назначение:

- считает SHA-256 commitment из `documentHash:ownerSecret`;
- демонстрирует идею связывания документа и секрета.

### `generateDemoProof(documentHash: string, ownerSecret: string): Promise<DemoProof>`

Назначение:

- создаёт commitment;
- возвращает proof-like структуру;
- имитирует форму ответа SnarkJS.

## 18.5 `apps/zk/test/commitment.test.js`

Node.js test.

### Test case: `demo commitment is deterministic`

Проверяет:

- один и тот же input `hash:secret` даёт одинаковый SHA-256 hash;
- это важно для reproducible commitments.

---

# 19. Docker files

## 19.1 `docker/backend.Dockerfile`

Собирает backend container.

Шаги:

1. Использует `node:20-alpine`.
2. Копирует package files.
3. Устанавливает backend workspace dependencies.
4. Копирует весь repo.
5. Выполняет backend build.
6. Запускает backend dev server.

Функций не содержит.

## 19.2 `docker/frontend.Dockerfile`

Собирает frontend container.

Шаги:

1. Использует `node:20-alpine`.
2. Копирует package files.
3. Устанавливает frontend workspace dependencies.
4. Копирует весь repo.
5. Выполняет frontend build.
6. Запускает Next dev server на `0.0.0.0`.

Функций не содержит.

---

# 20. Docs and diagrams

## 20.1 `README.md`

Главная документация проекта.

Содержит:

- overview;
- структуру monorepo;
- design decisions;
- quick start;
- API summary;
- smart contracts summary;
- testing commands;
- ссылки на диаграммы и roadmap.

Функций не содержит.

## 20.2 `docs/architecture.md`

Архитектурное описание:

- компоненты;
- поток регистрации документа;
- roadmap.

Функций не содержит.

## 20.3 `docs/code-walkthrough.md`

Пояснение для защиты:

- главная идея проекта;
- smart contracts;
- backend modules;
- frontend;
- ZK circuit;
- Docker;
- что честно сказать на защите.

Функций не содержит.

## 20.4 `docs/security.md`

Security notes:

- replay protection;
- off-chain confidentiality;
- AES-GCM/KMS;
- JWT security;
- RBAC/Pausable/ReentrancyGuard;
- requirement for real SnarkJS verifier;
- need for Slither/Mythril audit.

Функций не содержит.

## 20.5 `docs/diagrams/*.md`, `.mmd`, `.puml`

Диаграммы:

| Файл | Назначение |
| --- | --- |
| `component.md` | Mermaid component diagram. |
| `sequences.md` | Sequence diagrams for document registration and ZK verification. |
| `deployment.md` | Deployment diagram. |
| `bpmn.md` | BPMN-like business process. |
| `system-structure.mmd` | Mermaid source структурной диаграммы. |
| `system-structure.puml` | PlantUML source структурной диаграммы. |
| `README.md` | Инструкция по генерации диаграмм. |

Функций не содержит.

---

# 21. Как объяснить проект комиссии кратко

Можно использовать такую формулировку:

> Я разработал прототип распределённой нотариальной системы на Ethereum-compatible permissioned blockchain. Документы не раскрываются и не хранятся в блокчейне: они шифруются и сохраняются off-chain, а в blockchain фиксируются только доказательства — hash, CID, metadata commitment, timestamp и audit events. Backend реализует REST API, RBAC, JWT wallet authentication, IPFS integration и ZK API. Smart contracts обеспечивают on-chain контроль ролей, регистрацию документов, аудит и интерфейс проверки zero-knowledge proof. Frontend демонстрирует основные сценарии: регистрацию, проверку, аудит, межрегиональные запросы, администрирование и ZK verification.

## 22. Ограничения текущего прототипа

Важно честно обозначить:

1. In-memory хранилища в backend нужно заменить PostgreSQL repositories.
2. Demo IPFS service нужно заменить реальным `ipfs-http-client` adapter.
3. `ZKVerifier.sol` содержит demo verifier facade; production требует SnarkJS-generated Groth16 verifier.
4. Docker blockchain node сейчас `geth --dev`; enterprise-вариант должен использовать Besu QBFT/IBFT.
5. Нужны дополнительные e2e, gas, security и load tests.
6. Для реального использования с персональными данными нужен полноценный threat model и compliance review.
