# Sora

Sora is a pnpm/Turborepo workspace with a Next.js 16 web application and a Convex backend. It provides SEP-10 wallet authentication, Organization-isolated sessions, and a persisted Asset Workspace backed by Convex. The original Stellar Testnet issuance proof remains isolated from the product issuance path.

> [!WARNING]
> This repository is Testnet-only. It does not provide Mainnet issuance, production custody, or an integrated product issuance flow. Never add a Stellar secret seed, raw session value, or server boundary key to browser code, a committed environment file, Convex data, logs, or evidence.

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

Copy the public Testnet metadata into the Next.js application before running or building locally:

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

Missing, malformed, or mixed-network values fail validation. Also configure the same high-entropy `CONVEX_SERVER_BOUNDARY_KEY` in the private Next.js and Convex environments. Never give it a `NEXT_PUBLIC_` prefix. The browser receives only public network metadata and the public Convex URL; Next.js hashes the opaque session cookie before calling Convex.

## Development

```bash
# Run all persistent development tasks
pnpm dev

# Run only the web application on port 3000
pnpm --filter web dev

# Run the Convex development process separately when backend data is needed
pnpm --filter @repo/backend dev
```

Convex persists authentication, Organization, Asset Record, Activity Event, and retained Organization-scoped task data. The Phase 0 issuance contract remains exported from `@repo/backend`, tested in isolation, and intentionally is not wired to product issuance storage.

## Verification commands

All commands below run from the repository root. The check variants do not rewrite source files.

| Command              | Purpose                                                                               |
| -------------------- | ------------------------------------------------------------------------------------- |
| `pnpm typecheck`     | Generate Next route types and type-check workspace packages                           |
| `pnpm lint`          | Run Oxlint across the workspace                                                       |
| `pnpm format:check`  | Check formatting without changing files                                               |
| `pnpm test`          | Run Vitest in the backend and web workspaces                                          |
| `pnpm build`         | Produce the Next.js production build                                                  |
| `pnpm scan:secrets`  | Scan tracked, unignored, and selected generated files without printing matched values |
| `pnpm verify`        | Run all checks above plus the Phase 2 production mock-import guard                    |
| `pnpm verify:phase2` | Run local verification, seed the disposable preview, benchmark it, and run Playwright |

The 2026-07-14 Phase 2 working-tree verification passed typecheck, lint, format checking, 72 backend tests, 15 web tests, the production mock guard, production build, and secret scan. Authenticated preview E2E and performance evidence is still pending; see the runbook before interpreting `verify:phase2`.

## Live Testnet spike

The live issuance proof is a manual, network-dependent backend command:

```bash
pnpm --filter @repo/backend spike:testnet
```

It creates new in-memory issuer and distributor keypairs, funds their public accounts through Friendbot, submits a Trustline and payment through Horizon, verifies the resulting balance, and overwrites the sanitized evidence receipt. Friendbot and Horizon are intentionally excluded from required CI.

Read [the spike runbook](docs/phase-0/testnet-spike.md) before running it. The checked-in evidence is at [docs/phase-0/evidence/testnet-issuance.json](docs/phase-0/evidence/testnet-issuance.json).

## Documentation

- [State contracts](docs/phase-0/state-contracts.md)
- [Testnet spike runbook and evidence](docs/phase-0/testnet-spike.md)
- [Acceptance criteria and verification proof](docs/phase-0/verification.md)
- [ADR 0001: SEP-10, Next.js, and Convex boundary](docs/adr/0001-sep-10-next-convex-boundary.md)
- [ADR 0002: Testnet demo account policy](docs/adr/0002-testnet-demo-account-policy.md)
- [ADR 0003: Issuance idempotency and reconciliation](docs/adr/0003-issuance-idempotency-reconciliation.md)
- [ADR 0004: Authenticated Next.js-to-Convex boundary](docs/adr/0004-authenticated-next-convex-boundary.md)
- [Phase 1 implementation baseline](docs/phase-1/implementation-baseline.md)
- [Phase 1 integrity-gate evidence](docs/phase-1/evidence-matrix.md)
- [Phase 2 Asset Workspace contract](docs/phase-2/asset-workspace-contract.md)
- [Phase 2 verification runbook](docs/phase-2/verification-runbook.md)
- [Phase 2 evidence matrix](docs/phase-2/evidence-matrix.md)

Implementation and tests are authoritative for runtime behavior. The ADRs record why the boundaries exist; these guides explain how to work within them.
