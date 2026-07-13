# ADR 0003: Issuance idempotency and reconciliation

Status: Accepted for Phase 0

## Decision

Each issuance uses a stable `logicalKey`. The submit adapter precomputes transaction identity before submission, including hash, submission identity, source account and sequence, purpose, and time. The repository atomically claims the logical key and persists the `pending` record with that identity before the claim winner submits. Duplicate callers receive the existing record and do not submit again.

An uncertain submission becomes `ambiguous` and is not blindly retried. Conclusive reconciliation requires both transaction-hash and account-sequence evidence. Retry is safe only when Horizon does not find the hash and the observed source sequence is lower than the transaction sequence.

## Alternatives

- Submit before persisting identity. Rejected because a crash could leave an accepted transaction without recoverable identity.
- Retry every timeout. Rejected because the first submission may have succeeded.
- Use hash-only or sequence-only reconciliation. Rejected because neither proves the outcome alone.
- Rely on the ledger to deduplicate a business request. Rejected because Stellar does not know Sora's logical issuance key.

## Consequences

- The durable repository must provide an atomic claim keyed by `logicalKey`.
- Concurrent callers may prepare identity, but only one may submit; tests prove one submission.
- Ambiguous records can remain unresolved until reconciliation supplies adequate evidence.
- The current in-memory test repository proves the contract; durable Convex issuance persistence is future work.

## Reconsideration trigger

Reconsider when durable Convex issuance storage, fee-bump transactions, multi-operation envelopes, external signing, batching, or custody-provider submission IDs change identity or sequence ownership. Any replacement must still prevent duplicate value movement across retries, crashes, and concurrency.
