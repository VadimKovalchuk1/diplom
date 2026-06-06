# FNP Distributed Notarial Blockchain Platform

Enterprise demonstration platform for the dissertation topic: **“Application of blockchain technologies to improve organizational efficiency using the Federal Notarial Chamber of the Russian Federation as an example.”**

The system models interregional notarial document workflow using an Ethereum-compatible permissioned blockchain, encrypted off-chain storage, RBAC, immutable audit trails and zero-knowledge verification.

## Architecture overview

```text
apps/
  backend/      NestJS REST API, JWT auth, RBAC, audit, IPFS, blockchain and ZK integrations
  frontend/     Next.js + Tailwind UI for notaries, auditors, admins and public verifiers
  blockchain/   Hardhat Solidity contracts and tests
  zk/           Circom circuit and proof helper module
contracts/      Contract mirror for dissertation review convenience
docker/         Container build definitions
docs/           UML/BPMN/deployment/sequence diagrams
```

### Core design decisions

- **On-chain minimization:** contracts store only hashes, commitments, CIDs, timestamps and status fields.
- **Off-chain confidentiality:** original documents are encrypted before IPFS persistence.
- **Permissioned governance:** `NotaryAccessControl` maps Federal and regional chamber roles to contract-level permissions.
- **Immutable auditability:** API audit entries are complemented by blockchain events and append-only `AuditContract` records.
- **ZK privacy:** the ZK module demonstrates ownership/existence proofs without revealing the document content.

## Components

| Component | Technology | Responsibility |
| --- | --- | --- |
| Permissioned blockchain | Private Ethereum / Besu-compatible RPC | Consensus and immutable transaction history |
| Smart contracts | Solidity + OpenZeppelin + Hardhat | Document registry, RBAC, audit, proof verification |
| Backend API | NestJS + TypeScript | Auth, documents, regional routing, audit, ZK, IPFS |
| Frontend | Next.js + Tailwind | Enterprise UI and public verification pages |
| Storage | IPFS + encrypted payloads | Off-chain document persistence |
| Database | PostgreSQL | Operational read models and workflow state |

## Quick start

```bash
npm install
npm run build --workspaces --if-present
docker compose up --build
```

### Local contract workflow

```bash
npm install --workspace @fnp/blockchain
npm run test --workspace @fnp/blockchain
npm run deploy:local --workspace @fnp/blockchain
```

### Backend workflow

```bash
npm install --workspace @fnp/backend
npm run start:dev --workspace @fnp/backend
```

Important environment variables:

```env
PORT=3001
JWT_SECRET=change-me
RPC_URL=http://localhost:8545
DOCUMENT_REGISTRY_ADDRESS=0x...
DATABASE_URL=postgresql://fnp:fnp_password@localhost:5432/fnp_notary
IPFS_API_URL=http://localhost:5001
FRONTEND_ORIGIN=http://localhost:3000
```

### Frontend workflow

```bash
npm install --workspace @fnp/frontend
npm run dev --workspace @fnp/frontend
```

Open http://localhost:3000.

## REST API summary

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/v1/auth/nonce` | Create wallet-login nonce |
| `POST` | `/api/v1/auth/login` | Verify wallet signature and return JWT |
| `POST` | `/api/v1/documents` | Encrypt, store and prepare a document registration |
| `POST` | `/api/v1/documents/verify` | Verify document hash against blockchain |
| `GET` | `/api/v1/audit` | Return audit entries for privileged roles |
| `POST` | `/api/v1/regional-requests` | Create interregional workflow request |
| `POST` | `/api/v1/zk/proof` | Generate demo proof payload |
| `POST` | `/api/v1/zk/verify` | Verify proof public signals |

## Smart contracts

- `NotaryAccessControl.sol` — enterprise RBAC roles for FNP hierarchy.
- `DocumentRegistry.sol` — document hash registration, verification, metadata update and revoke operations.
- `AuditContract.sol` — append-only audit log and events.
- `ZKVerifier.sol` — verifier facade for SnarkJS-generated verifier integration.

Security mechanisms include OpenZeppelin RBAC, `Pausable`, `ReentrancyGuard`, wallet signatures, nonces, hash commitments and minimal on-chain disclosure.

## Testing

```bash
npm run test --workspace @fnp/blockchain
npm run test --workspace @fnp/backend
npm run test --workspace @fnp/zk
npm run typecheck --workspaces --if-present
```

## Diagrams

- [Architecture](docs/architecture.md)
- [Подробное объяснение кода для защиты](docs/code-walkthrough.md)
- [Component diagram](docs/diagrams/component.md)
- [Код структурной диаграммы PlantUML](docs/diagrams/system-structure.puml)
- [Код структурной диаграммы Mermaid](docs/diagrams/system-structure.mmd)
- [Инструкция по генерации диаграмм](docs/diagrams/README.md)
- [Sequence diagrams](docs/diagrams/sequences.md)
- [Deployment diagram](docs/diagrams/deployment.md)
- [BPMN process](docs/diagrams/bpmn.md)

## Development roadmap

1. Complete scaffold and dissertation-grade architecture description.
2. Add Prisma schema/migrations and persistent read models.
3. Replace in-memory IPFS demo store with `ipfs-http-client` adapter.
4. Generate production Groth16 Solidity verifier with SnarkJS.
5. Configure Besu QBFT/IBFT network with chamber validator nodes.
6. Add end-to-end tests, gas reports, load tests and threat model.
