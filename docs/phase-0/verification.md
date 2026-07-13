# Phase 0 verification

This document maps sprint acceptance criteria P0-01 through P0-08 to the implementation and passing proof. Runtime source and tests remain authoritative if this summary drifts.

## Verified baseline

| Item            | Passing proof                                                                    |
| --------------- | -------------------------------------------------------------------------------- |
| Toolchain       | Node.js 22 and pnpm 10.25.0, pinned by `.nvmrc`, `package.json`, and CI          |
| Full local gate | `pnpm verify` passed                                                             |
| Type checking   | Workspace `typecheck` tasks passed                                               |
| Lint            | Oxlint passed with zero warnings                                                 |
| Format          | `oxfmt --check .` passed                                                         |
| Tests           | 52 backend tests and 2 web tests passed; 54 total                                |
| Build           | Next.js 16 production build passed                                               |
| Route safety    | Build inventory contains neither `/template` nor `/api-keys`                     |
| Secret scan     | Passed over at least 383 files; matched values are never printed                 |
| Live proof      | Trustline ledger `3586695`; payment ledger `3586696`; balance `25`; limit `1000` |

The public application routes in the verified build are `/`, `/login`, `/register`, `/activity-log`, `/assets`, `/assets/[id]`, `/assets/create`, `/dashboard`, `/documents`, `/ownership-registry`, `/settings`, and `/tokenization-queue`.

## P0-01: Typed Testnet configuration

| Acceptance criterion                                        | Proof                                                                                                                                                                                                                                  | Result |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| P0-AC1.1: One typed Testnet configuration                   | `packages/backend/src/stellar/config.ts` defines the exact passphrase, Horizon URL, explorer URL, UI label, and the literal `network: "testnet"`; the web imports that contract.                                                       | Pass   |
| P0-AC1.2: Browser receives only non-secret network metadata | `toPublicStellarConfig` returns only network, passphrase, Horizon, explorer, and label. `config.test.ts` asserts the key set and absence of Friendbot configuration. Signing and generated keypairs remain in the backend-local spike. | Pass   |
| P0-AC1.3: Safe environment example                          | `.env.example` contains only the public Convex URL and canonical public Testnet metadata. The secret scan passes.                                                                                                                      | Pass   |
| P0-AC1.4: Invalid or missing configuration fails clearly    | `apps/web/core/config/env.ts` validates required environment values; `parseTestnetConfig` rejects missing, malformed, noncanonical, and mixed-Mainnet values. Backend configuration tests cover each case.                             | Pass   |

## P0-02: Unsafe surface cleanup

| Acceptance criterion                                             | Proof                                                                                                                                                                                                                                          | Result |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| P0-AC2.1: Visible identity is consistently Testnet               | The web reads `publicStellarConfig.uiLabel`; the web safety test renders `Stellar Testnet` and `Demo Data`. Mock network content was normalized to Testnet.                                                                                    | Pass   |
| P0-AC2.2: Dead routes and misleading capability are inaccessible | `/template` and `/api-keys` page files are removed; API-key generation UI and hook are removed; navigation excludes both routes. The web safety test checks file absence and links, and the production build inventory contains neither route. | Pass   |
| P0-AC2.3: No client route handles account seeds                  | Route inventory contains no issuance or key-generation route. Stellar keypair creation and signing exist only in `packages/backend/src/stellar/spike.ts`. The repository scan finds no persisted seed.                                         | Pass   |
| P0-AC2.4: Source and built-client secret scans pass              | `scripts/scan-secrets.mjs` scans tracked/unignored files and selected generated roots, including `apps/web/.next/static`, while excluding dependency and cache directories. The verified run passed over at least 383 files.                   | Pass   |

## P0-03: Local quality gates and smoke tests

| Acceptance criterion                                 | Proof                                                                                                                                                                                                        | Result |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| P0-AC3.1: Non-mutating commands pass                 | Root scripts expose `typecheck`, `lint`, `format:check`, `test`, `build`, `scan:secrets`, and aggregate `verify`. `pnpm verify` passed.                                                                      | Pass   |
| P0-AC3.2: Frontend and backend smoke coverage exists | Vitest runs 2 web safety tests and 52 backend tests across configuration, lifecycle, issuance, transaction building, and redaction.                                                                          | Pass   |
| P0-AC3.3: Workspace boundaries remain intact         | The existing `apps/web`, `packages/ui`, `packages/typescript-config`, and `packages/backend` workspace structure remains in pnpm/Turborepo. Shared contracts are exported from the existing backend package. | Pass   |

## P0-04: Asset lifecycle contract

| Acceptance criterion                                   | Proof                                                                                                                                                                  | Result |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| P0-AC4.1: States and allowed transitions are typed     | `packages/backend/src/domain/asset-lifecycle.ts` exports all seven states, the transition type, the allowed-transition predicate, and the guarded transition function. | Pass   |
| P0-AC4.2: Permitted and invalid transitions are tested | `asset-lifecycle.test.ts` exercises every allowed edge, duplicate transitions for every state, and representative invalid and archived-terminal edges.                 | Pass   |

## P0-05: Issuance and idempotency contract

| Acceptance criterion                                       | Proof                                                                                                                                                                                                                                                                   | Result |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| P0-AC5.1: Required issuance states exist                   | `packages/backend/src/domain/issuance.ts` exports `pending`, `submitted`, `confirmed`, `failed`, and `ambiguous`.                                                                                                                                                       | Pass   |
| P0-AC5.2: Ambiguous is explicit                            | The transition map permits `submitted -> ambiguous` and only reconciled `ambiguous -> confirmed/failed`; the tests reject an unreconciled ambiguous transition.                                                                                                         | Pass   |
| P0-AC5.3: Stable key and transaction identity are recorded | `IssuanceRecord.logicalKey` is the idempotency key. `TransactionIdentity` includes hash, submission identity, source account and sequence, purpose, and submission time. `requestIssuance` prepares the identity and includes it in the atomic claim before submission. | Pass   |
| P0-AC5.4: Horizon evidence precedes retry                  | `reconcileIssuance` requires a transaction identity and validates both transaction-hash and account-sequence methods for conclusive outcomes.                                                                                                                           | Pass   |
| P0-AC5.5: Blind retry remains prohibited                   | An uncertain submit becomes `ambiguous`; duplicate calls return that record without another submit. Only a reconciled `safe-to-retry` result with a missing hash and unconsumed sequence can enable recovery.                                                           | Pass   |
| P0-AC5.6: Duplicate and ambiguous cases are tested         | Concurrent duplicate logical keys call `submit` once. Timeout-after-submit remains ambiguous and does not resubmit. Confirmation and crash-window reconciliation tests use recorded identity and evidence.                                                              | Pass   |

## P0-06: Server-side Testnet spike

| Acceptance criterion                                     | Proof                                                                                                                                                                                                                         | Result |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| P0-AC6.1: Isolated funded accounts in the backend        | `packages/backend/src/stellar/spike.ts` creates fresh issuer/distributor keypairs and funds them with Friendbot. The Stellar SDK is local to `@repo/backend`; no generalized Stellar package was added.                       | Pass   |
| P0-AC6.2: Trustline and payment confirmed                | The preserved receipt records successful Trustline ledger `3586695` and payment ledger `3586696`.                                                                                                                             | Pass   |
| P0-AC6.3: Identifiers and links are captured             | `docs/phase-0/evidence/testnet-issuance.json` contains the asset code, public account IDs, transaction and precomputed hashes, ledgers, selected sanitized Horizon results, and Testnet explorer links.                       | Pass   |
| P0-AC6.4: Pre/post state is captured                     | The receipt records starting sequences, absence of the Trustline before execution, successful operations, post-operation Trustline existence, limit `1000.0000000`, balance `25.0000000`, and last-modified ledger `3586696`. | Pass   |
| P0-AC6.5: Seeds stay server-side and errors are redacted | Keypairs are local variables and only public keys enter evidence. `redaction.ts` sanitizes evidence and errors; redaction tests and the repository scan pass. No seeds are persisted or logged.                               | Pass   |

## P0-07: Architecture decisions

| Acceptance criterion                            | Proof                                                                                                                                                           | Result |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| P0-AC7.1: Three required decisions are recorded | ADR 0001 fixes the SEP-10/Next.js/Convex boundary; ADR 0002 fixes the ephemeral Testnet account policy; ADR 0003 fixes issuance idempotency and reconciliation. | Pass   |
| P0-AC7.2: Required ADR sections exist           | Each ADR contains Decision, Alternatives, Consequences, and Reconsideration trigger sections.                                                                   | Pass   |

## P0-08: Fresh checkout and deterministic CI

| Acceptance criterion                          | Proof                                                                                                                                                                                                                            | Result |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| P0-AC8.1: Fresh-checkout commands pass        | With Node 22 and pnpm 10.25.0, `pnpm install --frozen-lockfile` followed by the documented `pnpm verify` gate passed. The gate includes typecheck, zero-warning lint, format check, 54 tests, build, and secret scan.            | Pass   |
| P0-AC8.2: CI is deterministic and secret-free | `.github/workflows/ci.yml` pins Node 22 and pnpm 10.25.0, supplies only public Testnet metadata, installs with the frozen lockfile, and runs `pnpm verify`. It has no seed, funded-account, Friendbot, or live transaction step. | Pass   |
| P0-AC8.3: Live verification remains separate  | `spike:testnet` is an explicit backend package command and is not called by `pnpm verify` or the CI workflow. The checked-in receipt supplies the live proof.                                                                    | Pass   |

## Reproduce deterministic verification

```bash
corepack enable
corepack prepare pnpm@10.25.0 --activate
pnpm install --frozen-lockfile
pnpm verify
```

For a local build, first copy `.env.example` to `apps/web/.env.local`. CI injects the same public values directly. Do not add secret or funded-account variables to either path.

The manual live command is documented separately in [testnet-spike.md](testnet-spike.md) and is not part of this deterministic transcript.
