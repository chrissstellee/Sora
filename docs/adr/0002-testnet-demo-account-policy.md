# ADR 0002: Testnet demo account policy

Status: Accepted for Phase 0

## Decision

Each live spike generates fresh issuer and distributor keypairs in backend process memory and funds their public accounts through Friendbot. Demo accounts are not reused. Seeds are not accepted as input, persisted, committed, or logged.

Evidence may retain public account IDs, transaction hashes, ledgers, sanitized Horizon results, explorer links, and pre/post state. Friendbot and Horizon execution is manual and excluded from required CI.

## Alternatives

- Commit a funded Testnet seed. Rejected because it establishes an unsafe custody precedent.
- Reuse a shared seed from local environment variables. Rejected because reuse adds distribution, rotation, and logging risks.
- Generate accounts in browser code. Rejected because it violates the server-only boundary.
- Use mocks only. Rejected because mocks cannot prove Horizon acceptance or ledger state.

## Consequences

- Every live run depends on Testnet and Friendbot availability and produces new public identifiers.
- Running the spike overwrites the sanitized evidence receipt.
- CI remains deterministic and needs no seeds, funded accounts, Friendbot, or Horizon submission.

## Reconsideration trigger

Reconsider if rate limits, staged demonstrations, or long-running reconciliation require persistent Testnet accounts. A replacement must use approved secret storage, access control, rotation, disposal, and redacted logging; browser storage and committed seeds remain prohibited.
