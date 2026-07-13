# Sora

Sora is a pnpm/Turborepo workspace with a Next.js 16 web application and a Convex backend package. Phase 0 establishes typed Stellar Testnet configuration, executable state contracts, deterministic verification, and an isolated server-side issuance proof.

> [!WARNING]
> This repository is Testnet-only. It does not provide Mainnet issuance, production custody, live SEP-10 authentication, or an integrated product issuance flow. Never add a Stellar secret seed to browser code, an environment file committed to Git, Convex data, logs, or evidence.

## Prerequisites

- Node.js 22 (`.nvmrc` pins the major version; `package.json` requires `>=22 <23`)
- pnpm 10.25.0 (`packageManager` pins the exact version)

With Corepack:

```bash
corepack enable
corepack prepare pnpm@10.25.0 --activate
pnpm install --frozen-lockfile
```

## Configure the web application

The root `.env.example` contains public, non-secret Testnet metadata. Copy it to the Next.js application before running or building locally:

```powershell
Copy-Item .env.example apps/web/.env.local
```

On macOS or Linux:

```bash
cp .env.example apps/web/.env.local
```

The accepted values are deliberately exact:

- Network passphrase: `Test SDF Network ; September 2015`
- Horizon: `https://horizon-testnet.stellar.org`
- Explorer: `https://stellar.expert/explorer/testnet`
- UI label: `Stellar Testnet`

Missing, malformed, or mixed-network values fail validation. The browser receives only this public network metadata and the public Convex URL. Account material and signing do not cross the backend boundary.

## Development

```bash
# Run all persistent development tasks
pnpm dev

# Run only the web application on port 3000
pnpm --filter web dev

# Run the Convex development process separately when backend data is needed
pnpm --filter @repo/backend dev
```

The current Convex schema is still the starter task schema. The Phase 0 issuance contract is exported from `@repo/backend`, tested in isolation, and is not yet wired to durable Convex issuance storage.

## Verification commands

All commands below run from the repository root. The check variants do not rewrite source files.

| Command             | Purpose                                                                               |
| ------------------- | ------------------------------------------------------------------------------------- |
| `pnpm typecheck`    | Generate Next route types and type-check workspace packages                           |
| `pnpm lint`         | Run Oxlint across the workspace                                                       |
| `pnpm format:check` | Check formatting without changing files                                               |
| `pnpm test`         | Run Vitest in the backend and web workspaces                                          |
| `pnpm build`        | Produce the Next.js production build                                                  |
| `pnpm scan:secrets` | Scan tracked, unignored, and selected generated files without printing matched values |
| `pnpm verify`       | Run all checks above in the listed order                                              |

The verified Phase 0 baseline is 52 backend tests plus 2 web tests, zero-warning lint, a production route inventory with neither `/template` nor `/api-keys`, and a secret scan covering at least 383 files.

## Live Testnet spike

The live issuance proof is a manual, network-dependent backend command:

```bash
pnpm --filter @repo/backend spike:testnet
```

It creates new in-memory issuer and distributor keypairs, funds their public accounts through Friendbot, submits a Trustline and payment through Horizon, verifies the resulting balance, and overwrites the sanitized evidence receipt. Friendbot and Horizon are intentionally excluded from required CI.

Read [the spike runbook](docs/phase-0/testnet-spike.md) before running it. The checked-in evidence is at [docs/phase-0/evidence/testnet-issuance.json](docs/phase-0/evidence/testnet-issuance.json).

## Phase 0 documentation

- [State contracts](docs/phase-0/state-contracts.md)
- [Testnet spike runbook and evidence](docs/phase-0/testnet-spike.md)
- [Acceptance criteria and verification proof](docs/phase-0/verification.md)
- [ADR 0001: SEP-10, Next.js, and Convex boundary](docs/adr/0001-sep-10-next-convex-boundary.md)
- [ADR 0002: Testnet demo account policy](docs/adr/0002-testnet-demo-account-policy.md)
- [ADR 0003: Issuance idempotency and reconciliation](docs/adr/0003-issuance-idempotency-reconciliation.md)

Implementation and tests are authoritative for runtime behavior. The ADRs record why the boundaries exist; these guides explain how to work within them.
