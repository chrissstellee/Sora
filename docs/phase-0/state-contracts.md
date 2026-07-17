# Phase 0 state contracts

The backend package owns the shared TypeScript contracts for asset lifecycle and issuance. The source files and their tests are authoritative:

- `packages/backend/src/domain/asset-lifecycle.ts`
- `packages/backend/src/domain/asset-lifecycle.test.ts`
- `packages/backend/src/domain/issuance.ts`
- `packages/backend/src/domain/issuance.test.ts`

The contracts are exported as `@repo/backend/domain/asset-lifecycle` and `@repo/backend/domain/issuance`. They define domain behavior but are not yet connected to durable Convex issuance storage. Convex currently contains only the starter task schema and task functions.

## Asset lifecycle

`AssetLifecycleState` has seven values. A transition not shown below throws an `Invalid asset lifecycle transition` error. Same-state transitions are invalid, and `archived` is terminal.

| From       | Allowed next state           |
| ---------- | ---------------------------- |
| `draft`    | `review`, `archived`         |
| `review`   | `draft`, `ready`, `archived` |
| `ready`    | `issuing`, `archived`        |
| `issuing`  | `active`, `failed`           |
| `active`   | `archived`                   |
| `failed`   | `issuing`                    |
| `archived` | None                         |

The test suite exercises every permitted edge, rejects a duplicate transition for every state, and rejects representative invalid and terminal-state transitions.

## Issuance status

`IssuanceStatus` has five values:

| Status      | Meaning in the contract                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| `pending`   | The logical request has been claimed and its transaction identity is recorded before submission.                      |
| `submitted` | The submit adapter returned a transaction identity.                                                                   |
| `confirmed` | Reconciliation established confirmation. This state is terminal.                                                      |
| `failed`    | Submission failed definitively, or reconciliation established failure. Recovery to `pending` requires reconciliation. |
| `ambiguous` | Submission may have reached the network, so a retry is prohibited until reconciliation.                               |

### Allowed issuance transitions

| From        | Allowed next state                 | Additional rule                                                   |
| ----------- | ---------------------------------- | ----------------------------------------------------------------- |
| `pending`   | `submitted`, `failed`              | Normal submission path                                            |
| `submitted` | `confirmed`, `failed`, `ambiguous` | `ambiguous` represents an uncertain result, not a generic failure |
| `ambiguous` | `confirmed`, `failed`              | Reconciliation evidence is required                               |
| `failed`    | `pending`                          | Reconciliation evidence is required before retry eligibility      |
| `confirmed` | None                               | Terminal                                                          |

Duplicate and unlisted transitions throw. `ambiguous -> confirmed`, `ambiguous -> failed`, and `failed -> pending` cannot be invoked through `transitionIssuance` without the reconciled flag.

## Issuance record identity

Each `IssuanceRecord` contains:

- a record `id`;
- a stable `logicalKey` used as the idempotency key;
- the current `status`;
- an optional precomputed `TransactionIdentity`;
- append-only `reconciliationEvidence` entries;
- `createdAt` and `updatedAt` timestamps.

`TransactionIdentity` records the transaction hash, source account, source sequence, operation purpose, submission identity, submission time, and optional Horizon result and ledger.

## Atomic claim before submission

`requestIssuance` follows this order:

1. `submitAdapter.prepare(logicalKey)` computes the transaction identity.
2. `repository.claim(logicalKey, create)` atomically establishes uniqueness and persists a `pending` record containing that identity.
3. Only the caller that receives `claimed: true` invokes `submitAdapter.submit(record)`.
4. A duplicate caller receives the existing record and does not submit again.
5. A successful submit stores `submitted`; a definite error stores `failed`; `UncertainSubmissionError` stores `ambiguous`.

The repository interface therefore requires an atomic claim keyed by `logicalKey`. The current tests use an in-memory repository to prove concurrent duplicate requests call `submit` once. A durable implementation must preserve the same atomic behavior.

The identity is present in the claimed record before network submission. This closes the crash window in which a transaction could be accepted by the network before its hash and sequence are recoverable by the application.

## Reconcile before retry

`reconcileIssuance` accepts only `pending`, `ambiguous`, or `failed` records with a precomputed transaction identity. It appends `ReconciliationEvidence` before changing status.

Conclusive evidence must include both methods:

- `transaction-hash`: whether Horizon found the precomputed hash;
- `account-sequence`: whether the transaction's source sequence was consumed.

An `unresolved` outcome is saved without changing the status. A `safe-to-retry` outcome is accepted only when Horizon reports the hash as not found and the observed source sequence is lower than the transaction sequence. Only then can a reconciled `failed` record return to `pending`. The test suite rejects incomplete safe-to-retry evidence and proves that an ambiguous submission is not blindly resubmitted.

The live spike uses the same safety principle in a smaller server-only flow: after an uncertain submit it looks up the precomputed hash, then loads the source account sequence if the hash lookup fails, emits sanitized evidence, and does not retry.

## Scope boundary

These types enable later issuance integration; they do not implement custody, durable issuance persistence, background reconciliation, SEP-10, or product-facing issuance. Those additions must preserve the transition and idempotency invariants or supersede them through a reviewed ADR.
