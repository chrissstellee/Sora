<div align="center">
  <img src="apps/web/public/sora-logo.png" alt="Sora logo" width="96" />

# Sora

**Stellar-native infrastructure for creating, issuing, and tracking tokenized real-world assets.**

[Repository](https://github.com/Carts1024/Sora) | [Testnet Proof](docs/phase-0/evidence/testnet-issuance.json) | [Project Documentation](docs/prds/prd-sora-2026-07-13/project-description.md)

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)
![React](https://img.shields.io/badge/React-19-149eca?style=flat-square)
![Convex](https://img.shields.io/badge/Convex-Backend-f3b01c?style=flat-square)
![Stellar](https://img.shields.io/badge/Stellar-Classic_Assets-7d00ff?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square)
![Network](https://img.shields.io/badge/Network-Testnet-3ecf8e?style=flat-square)

</div>

## 🧩 Problem

Organizations exploring real-world asset (RWA) tokenization must often assemble several specialized systems before they can validate an idea. They need wallet authentication, tenant isolation, asset and document storage, Stellar account management, Trustlines, transaction submission, failure recovery, ledger confirmation, and ownership views.

This creates several barriers:

- Blockchain infrastructure requires knowledge that many product and asset-operations teams do not have in-house.
- Fragmented tools make asset preparation, issuance, and verification slow and difficult to audit.
- Unsafe transaction retries can create duplicate value movement when a network result is uncertain.
- Private organization records can leak if tenant identity is trusted from browser input.
- Product interfaces can overstate legal ownership, compliance, or production readiness when they only display token and account data.

Sora is built for organizations and developers who want to test a complete, verifiable RWA tokenization workflow without building the Stellar integration from scratch.

## 🌟 Vision

Sora aims to make tokenized-asset infrastructure easier to adopt while keeping blockchain results independently verifiable. The long-term vision is a platform where:

- Organizations can move from an approved asset record to an issued Stellar asset through one guided workflow.
- Operators can verify every successful blockchain action through public ledger evidence.
- Current token holdings remain visible without being misrepresented as legal title.
- Safe reconciliation and idempotent processing protect issuance across retries, restarts, and uncertain submissions.
- Developers can eventually integrate the same infrastructure through scoped APIs and signed webhooks.

## 🎯 Purpose

Sora demonstrates how Stellar can support the lifecycle of a tokenized real-world asset, from off-chain preparation to Testnet issuance and ownership tracking. The project combines:

- SEP-10 wallet authentication and organization-scoped sessions.
- Convex persistence for asset records, documents, lifecycle state, issuance, ownership snapshots, activity, and demo evidence.
- Classic Stellar Asset issuance through separate issuer and distributor accounts.
- Horizon reconciliation and Stellar Expert proof links.
- A Next.js enterprise dashboard for asset operations.

Sora does not claim that a token proves legal title. It is not a marketplace, custodian, compliance engine, transfer agent, or Mainnet issuance platform.

## 👥 Target Users

- **Fintech companies** evaluating Stellar-based tokenized-asset products.
- **Real estate developers** exploring digital representations of property-related assets.
- **Asset management firms** testing auditable issuance and ownership workflows.
- **Financial institutions** prototyping RWA infrastructure on Stellar Testnet.
- **Enterprise product and asset-operations teams** that need a guided tokenization workflow.
- **Developers** building applications that may later consume Sora through APIs and webhooks.

## ✨ Features

- **Stellar wallet authentication**: Connect Freighter through Stellar Wallets Kit, sign a SEP-10 challenge, and establish a server-verified application session.
- **Organization isolation**: Derive organization scope from the authenticated session instead of trusting client-supplied tenant identifiers.
- **Asset workspace**: Create, edit, search, filter, and inspect durable RWA records containing valuation, jurisdiction, legal-owner, and contact metadata.
- **Supporting documents**: Upload, retrieve, replace, and delete approved evidence files before review, with server-side ownership and file validation.
- **Guarded asset lifecycle**: Move records through Draft, Review, Ready, Issuing, Active, Failed, or Archived states using validated transitions.
- **Immutable review basis**: Bind asset data, proposed token settings, and document versions before approval and issuance.
- **Tokenization queue**: Surface organization-owned Ready assets that are eligible for issuance.
- **Classic Stellar Asset issuance**: Configure an asset code and exact supply, establish the distributor Trustline, and issue supply from a separate issuer account on Stellar Testnet.
- **Safe transaction processing**: Persist transaction identity before submission, prevent duplicate issuance, reconcile uncertain outcomes, and retry only when ledger evidence proves it safe.
- **Ledger proof**: Retain transaction hash, ledger sequence, timestamp, network, source account, issuer, distributor, asset identity, and amount.
- **Ownership registry**: Publish current non-zero Classic account Trustline balances and percentages only after observed supply matches confirmed issuance.
- **Activity history**: Record authentication, asset changes, document actions, reviews, issuance, recovery, and ownership publication without exposing secrets.
- **Validated explorer links**: Link transactions, accounts, ledgers, and assets only to approved Stellar Expert Testnet URLs.
- **Formal demo tooling**: Prepare isolated demo runs, perform preflight checks, exercise one controlled recovery path, measure deployed behavior, and produce sanitized evidence manifests.

Developer API keys, versioned public APIs, signed webhooks, and delivery retries remain planned stretch scope. They are not part of the current accepted demo release.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript 5.9, App Router, Framer Motion.
- **UI**: Tailwind CSS 4, shared `@repo/ui` package, Base UI, Radix UI, lucide-react, Recharts.
- **Backend**: Convex 1.31, typed functions, file storage, indexed organization data, orchestration workers.
- **Blockchain**: Stellar Testnet, Classic Stellar Assets, Trustlines, Horizon, Stellar Expert.
- **Wallet and auth**: Stellar Wallets Kit 2.5, Freighter, SEP-10.
- **Stellar integration**: `@stellar/stellar-sdk` 16 with server-owned transaction construction, signing, submission, and reconciliation.
- **Testing**: Vitest, `convex-test`, Playwright, axe-core.
- **Monorepo tooling**: pnpm 10.25, Turborepo 2.8, Oxlint, Oxfmt, Husky.

Sora uses Classic Stellar Assets for its MVP. It does not require or deploy a custom Soroban smart contract.

## 🚀 How to Run Locally

Prerequisites:

- Node.js `>=22 <23`
- pnpm `10.25.0`
- Convex account and development project
- Freighter wallet configured for Stellar Testnet when testing wallet authentication

Enable the pinned package manager and install dependencies:

```bash
corepack enable
corepack prepare pnpm@10.25.0 --activate
pnpm install --frozen-lockfile
```

Create the web environment file.

On Windows PowerShell:

```powershell
Copy-Item .env.example apps/web/.env.local
```

On macOS or Linux:

```bash
cp .env.example apps/web/.env.local
```

The public Testnet values are intentionally fixed:

```dotenv
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_STELLAR_EXPLORER_URL=https://stellar.expert/explorer/testnet
NEXT_PUBLIC_STELLAR_UI_LABEL=Stellar Testnet
```

Also configure:

- `NEXT_PUBLIC_CONVEX_URL` with the URL for your Convex deployment.
- `CONVEX_SERVER_BOUNDARY_KEY` with the same high-entropy secret in the private Next.js and Convex environments. Never give this value a `NEXT_PUBLIC_` prefix.
- `SORA_SIGNING_SEED` only when a stable SEP-10 server signer is required. Local development otherwise creates an ephemeral signer for the running process.

Run the full monorepo development workflow:

```bash
pnpm dev
```

Or run the backend and frontend separately:

```bash
pnpm --filter @repo/backend dev
```

```bash
pnpm --filter web dev
```

The web application runs on [http://localhost:3000](http://localhost:3000).

## ✅ Verification

Run these commands from the repository root. Check variants do not rewrite source files.

| Command                       | Purpose                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`              | Generate Next.js route types and type-check workspace packages.                                                     |
| `pnpm lint`                   | Run Oxlint across the workspace.                                                                                    |
| `pnpm format:check`           | Check formatting without changing files.                                                                            |
| `pnpm test`                   | Run backend and web Vitest suites.                                                                                  |
| `pnpm build`                  | Produce the Next.js production build.                                                                               |
| `pnpm scan:secrets`           | Scan tracked, unignored, and selected generated files without printing matched values.                              |
| `pnpm check:phase5-safety`    | Reject production mocks, browser signing or Horizon access, Friendbot, fault controls, and arbitrary explorer URLs. |
| `pnpm check:phase5-manifests` | Require five sanitized live manifests at one revision, including one controlled recovery run.                       |
| `pnpm verify`                 | Run deterministic checks, build, safety guards, and secret scanning.                                                |
| `pnpm verify:phase5`          | Add deployed seed, performance, three-engine Playwright, and live-manifest gates.                                   |

Local checks prove implementation behavior; they do not by themselves grant release acceptance. See the [Phase 5 evidence matrix](docs/phase-5/evidence-matrix.md) for passed and outstanding evidence.

## 🌐 Deployment

### Testnet

- **Network**: Stellar Testnet
- **Asset model**: Classic Stellar Assets; no custom Soroban contract
- **Horizon**: `https://horizon-testnet.stellar.org`
- **Explorer**: `https://stellar.expert/explorer/testnet`
- **Live issuance evidence**: [`docs/phase-0/evidence/testnet-issuance.json`](docs/phase-0/evidence/testnet-issuance.json)

The checked-in spike evidence records a successful Trustline transaction and issuance payment using ephemeral Testnet accounts whose secret seeds were never persisted.

| Proof                 | Stellar Expert                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Issuer account        | [View account](https://stellar.expert/explorer/testnet/account/GAREWXUB357PIQPHXRLEIJT6IAANOMYYOKWPWADZV2NQW6FECM67YRUR)        |
| Distributor account   | [View account](https://stellar.expert/explorer/testnet/account/GC5BKH57PGTK5ADTGPN5GNILM44QG45EEXWNGHFN3W5IQLTPCD2RSKXZ)        |
| Trustline transaction | [View transaction](https://stellar.expert/explorer/testnet/tx/4d159dfe826410651cc549d608e0ce4e04307eb25f4dcef6d7d3153a32374fd4) |
| Issuance payment      | [View transaction](https://stellar.expert/explorer/testnet/tx/f02ffd6ba2bf8381e2899a75e5df59023d20bc7490bba018fe50a7d2aa1879bb) |

Run a new isolated Testnet spike:

```bash
pnpm --filter @repo/backend spike:testnet
```

The command uses Friendbot and the public Testnet network. Read the [Testnet spike runbook](docs/phase-0/testnet-spike.md) first.

### Mainnet

Mainnet deployment, production custody, KYC/AML, legal verification, securities compliance, and production-grade public APIs are outside the current MVP. Sora must not be presented as Mainnet-ready.

## 🧪 Formal Demo Operations

Phase 5 operator commands require a dedicated `demo-testnet` deployment, private operator configuration, pre-provisioned Testnet accounts, and the prerequisites in the [operator runbook](docs/phase-5/operator-runbook.md).

| Command                                                                          | Purpose                                                                        |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `pnpm phase5:prepare -- --request-id <uuid> --browser-target chromium-freighter` | Create one sequential formal run and deterministic unique asset code.          |
| `pnpm phase5:preflight -- --run-id <run-id>`                                     | Record sanitized network, account, lock, signer, Horizon, and explorer checks. |
| `pnpm phase5:fault:arm -- --run-id <run-id>`                                     | Arm the one-shot Testnet ambiguity fault for the required recovery run.        |
| `pnpm phase5:reset -- --run-id <run-id>`                                         | Mark a blocked run failed without deleting ledger or application evidence.     |
| `pnpm phase5:evidence -- --run-id <run-id>`                                      | Recheck the live run and exclusively create its sanitized manifest.            |
| `pnpm phase5:seed`                                                               | Seed the non-production performance corpus.                                    |
| `pnpm phase5:perf`                                                               | Measure deployed ownership and three-browser response times.                   |
| `pnpm phase5:e2e`                                                                | Run authenticated ownership, activity, isolation, and accessibility tests.     |

`phase5:reset` is private and non-destructive. It preserves confirmed issuance, transactions, activity, ownership evidence, and Stellar history.

## 🎥 Demo and Documentation

- **Source Repository**: [github.com/Carts1024/Sora](https://github.com/Carts1024/Sora)
- **Project Description**: [Product overview and boundaries](docs/prds/prd-sora-2026-07-13/project-description.md)
- **Functional Specification**: [Sora MVP specification](docs/sora-spec.md)
- **Testnet Proof**: [Sanitized issuance receipt](docs/phase-0/evidence/testnet-issuance.json)
- **Release Evidence**: [Phase 5 evidence matrix](docs/phase-5/evidence-matrix.md)
- **Operator Guide**: [Formal Testnet demo runbook](docs/phase-5/operator-runbook.md)
- **Architecture Decisions**: [`docs/adr`](docs/adr)

A public live-app, demo-video, and pitch-deck URL are not configured in this repository.

## 👩‍💻 Team

| Name                     | Role               | GitHub                                             |
| ------------------------ | ------------------ | -------------------------------------------------- |
| Sherwin Limosnero        | Business Developer | [@owenlim225](https://github.com/owenlim225)       |
| Bette Anjanelle Cabarles | Frontend Developer | [@anjobette](https://github.com/anjobette)         |
| Christelle Anne Dacapias | UI/UX Designer & Backend Developer | [@chrissstellee](https://github.com/chrissstellee) |

## 🔒 Security and Release Status

> [!WARNING]
> Sora is Testnet-only and does not provide Mainnet issuance or production custody. Phase 5 is implemented locally but is not release-accepted: deployed-browser checks, real Freighter verification, accessibility review, preview performance, controlled recovery, prerequisite evidence, and five formal Testnet run manifests remain open.

Never place a Stellar secret seed, raw session value, boundary or operator key, signed XDR, or transaction envelope in browser code, a committed environment file, Convex data, logs, or evidence.

## 📜 License

The `@repo/backend` package metadata declares the MIT license. This repository does not currently include a root `LICENSE` file; add one before treating the whole repository as licensed for redistribution.
