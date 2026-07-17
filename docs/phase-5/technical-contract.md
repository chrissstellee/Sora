# Phase 5 technical contract

Status: Implemented locally; live release gate not executed

Revision under review: current `HEAD` (`6e84a05580d8d261ded8f3e5795bb462a5d797da`) plus the dirty Phase 5 implementation working tree. This is not a release commit identifier.

## Purpose and authority

Phase 5 turns a confirmed Stellar Testnet issuance into an Organization-scoped, independently inspectable account-balance proof. It also introduces a canonical Activity registry and a private formal-demo run authority.

The browser is never authoritative for Organization, network, issuer, supply, snapshot identity, demo-run identity, or fault activation. Browser requests pass through authenticated Next.js routes. Convex derives the Organization and actor from the verified session, or, for operator commands, validates both the server boundary and the private Phase 5 operator key.

“Ownership” in this phase means current Classic Stellar account trustline balances for one exact Testnet `(asset code, issuer account)` identity. It does not establish legal, beneficial, institutional, retail, or contractual ownership.

The supported denominator includes non-zero Classic account trustline balances returned by the complete Horizon account collection. It excludes issuer pseudo-balances, liquidity-pool reserves, claimable balances, liabilities, and Soroban-held balances.

## Ownership snapshot contract

### Exact amounts and shares

- Amounts are canonical non-negative strings with at most seven input decimal places and exactly seven output decimal places.
- Internal arithmetic uses signed 64-bit integer stroops (`10^-7` units), not JavaScript `Number`.
- A holder share is `balance / confirmed supply * 100`, rendered to four decimal places with integer round-half-up behavior.
- Zero balances are validated but excluded from the published holder corpus.
- The canonical content hash is SHA-256 over strictly account-sorted lines in the form `account|canonical-balance\n`.

### Horizon collection boundary

The server queries `https://horizon-testnet.stellar.org/accounts` with the exact asset identity, ascending order, and a page size of 200. It accepts only reconstructed next-page URLs with the same origin, `/accounts` path, exact asset, ascending order, page limit, and a non-empty cursor.

The collector fails closed on malformed identities, balances, ledgers, response shapes, ordering, pagination, rate limits, non-success responses, or guardrail overflow. Current guardrails are 50 pages, 10,000 non-zero holders, and a 15-second timeout per Horizon request. A duplicate or descending account also fails the attempt.

### Publication invariant

An attempt progresses through `Queued`, `Staging`, then `Complete` or `Failed`. Holder rows are staged under an attempt identifier and are not reachable through the public ownership query until publication.

Publication is one Convex mutation that verifies:

1. The asset has one Organization-scoped confirmed Testnet issuance.
2. The caller holds the current asset-scoped fencing token and unexpired lease.
3. Page count, holder count, observed units, first ledger, and last ledger match the staged attempt.
4. The staged corpus contains no more than 10,000 rows and its recomputed content hash matches.
5. Observed account supply equals the confirmed issuance supply exactly.

Only then does the mutation create an immutable snapshot and replace the issuance's `currentOwnershipSnapshotId`. Failed, incomplete, mismatched, or stale-worker attempts cannot change that pointer. A successful publication emits one `ownership.proof_published` Activity event.

The snapshot contains:

- `snapshotId`, `attemptId`, Organization, asset, and issuance identities
- fixed `Testnet` network, asset code, and issuer account
- canonical confirmed and observed supply
- holder count and SHA-256 holder-corpus hash
- optional first and last observed ledger
- synchronization time
- optional formal `runId` and pin marker

### Concurrency, freshness, and retention

- One Organization-and-asset lease provides single-flight synchronization. Lease duration is 60 seconds; every staged page renews it.
- A takeover increments the fencing token. The former worker cannot stage or publish after takeover.
- Issuance confirmation enqueues a deterministic refresh. The UI may request `visible-stale`, `focus-stale`, or `manual` refresh.
- Data is fresh for at most 60 seconds. Manual refresh is throttled server-side for 15 seconds.
- A refresh request is deduplicated by request ID and against already queued or staging work.
- A failed refresh retains the last complete snapshot. With no prior complete snapshot the state is unavailable, never a fabricated zero-holder result.
- Current and pinned snapshots are never pruned. Other history retains at most the current plus nine prior snapshots and is eligible after 30 days. Abandoned queued, staging, and failed attempts are eligible after 24 hours.

The read model exposes `unavailable`, `refreshing`, `fresh`, `stale`, or `failed`. When a snapshot exists, rows remain visible during stale, refreshing, or failed states.

### Authenticated HTTP surface

`GET /api/assets/{assetId}/ownership`

| Input     | Contract                                               |
| --------- | ------------------------------------------------------ |
| `assetId` | UUID path parameter                                    |
| `limit`   | Optional integer from 1 through 100; default 25        |
| `cursor`  | Optional opaque snapshot-bound cursor                  |
| `q`       | Optional normalized `G...` exact/prefix account search |

The response contains the confirmed asset identity, optional current snapshot, synchronization state, and a holder page. A cursor is bound to the snapshot ID; it cannot be replayed against a different snapshot. Foreign and nonexistent assets share the not-found behavior.

`POST /api/assets/{assetId}/ownership/refresh`

```json
{
  "reason": "manual",
  "requestId": "00000000-0000-4000-8000-000000000000"
}
```

The accepted reasons are `manual`, `visible-stale`, and `focus-stale`. Results are `accepted`, `deduplicated`, or `throttled`; an accepted request returns HTTP 202.

## Explorer-link contract

`stellarExpertUrl` constructs links from typed public identifiers; it does not accept stored or provider-supplied URLs.

| Resource    | Identifier rule                                    | Path                                      |
| ----------- | -------------------------------------------------- | ----------------------------------------- |
| Account     | Valid Ed25519 public key                           | `/explorer/testnet/account/{account}`     |
| Transaction | 64 hexadecimal characters, normalized lowercase    | `/explorer/testnet/tx/{hash}`             |
| Ledger      | Positive safe integer                              | `/explorer/testnet/ledger/{sequence}`     |
| Asset       | 1–12 uppercase alphanumeric code plus valid issuer | `/explorer/testnet/asset/{code}-{issuer}` |

The final URL must use HTTPS, origin `https://stellar.expert`, a Testnet path, and no user info, query, or fragment. Invalid identifiers return no link. UI links open a new tab with `noopener noreferrer`; an explorer outage does not invalidate Sora's retained last-good proof.

## Activity registry

Activity events are Organization-scoped, newest-first queryable, optionally filtered by asset and formal `runId`, and limited to 100 per page. Every canonical write validates actor semantics, subject, outcome, correlation ID, optional run ID, and an event-specific metadata allowlist. Metadata is JSON, limited to 4,000 characters, and rejects secret-, session-, credential-, token-, XDR-, raw-response-, exception-, and stack-shaped keys.

Canonical event types are:

- Authentication: `auth.wallet_login`, `auth.wallet_onboarded`
- Asset: `asset.created`, `asset.updated`, `asset.token_proposal_updated`, `asset.review_submitted`, `asset.review_returned`, `asset.review_approved`, `asset.archived`
- Document: `document.uploaded`, `document.replaced`, `document.deleted`
- Issuance: `issuance.requested`, `issuance.preflight_failed`, `issuance.submitted`, `issuance.resumed`, `issuance.reconciling`, `issuance.trustline_confirmed`, `issuance.confirmed`, `issuance.failed`
- Ownership: `ownership.proof_published`
- Demo: `demo.run_prepared`, `demo.preflight_completed`, `demo.fault_armed`, `demo.fault_consumed`, `demo.run_completed`

Legacy wallet, approval, and pre-Phase-5 event names are normalized on read where a durable mapping exists. Unknown history is not invented.

## Formal demo authority

Formal demo commands require `CONVEX_URL`, `CONVEX_SERVER_BOUNDARY_KEY`, and `PHASE5_OPERATOR_KEY`. The Convex environment must identify the exact Testnet network, Horizon, explorer, `demo-testnet` deployment tier, demo Organization, approved issuer/distributor public keys, and authorized operator user. Fault activation additionally requires `PHASE5_FAULTS_ENABLED=true`.

`phase5:prepare` creates one sequential run namespace. A request ID makes prepare idempotent. It refuses a second `Prepared` or `Active` run. The run receives a UUID and a deterministic 12-character asset-code candidate `S5` plus ten uppercase hexadecimal characters; collisions are retried with a bounded nonce.

There is intentionally no destructive ledger reset. The private `phase5:reset` command may mark the named `Prepared` or `Active` run as `Failed` only when it has no `Pending` or `Submitted` issuance. It records outcome `Fail`, completion time, duration, and `operator-reset`; clears only an `Armed` controlled fault; emits a failed `demo.run_completed` event; and preserves prior runs, assets, issuances, transaction attempts, reconciliation evidence, Activity, ownership snapshots, and Stellar history. The next prepare call creates a new namespace and unique asset identity.

Preflight records sanitized checks using only `Pass`, `Fail`, and `Not Executed`. All checks must pass before the run becomes `Active`. The current implementation checks:

- exact Testnet environment and unique run/asset identity
- Convex worker action health
- a fresh session in the configured demo Organization
- the enabled authorized operator user's wallet matches `PHASE5_FREIGHTER_PUBLIC_KEY`
- no active source-account or ownership lease
- no pending/submitted issuance
- custody signer-to-public-key match
- on-chain signer state and numeric source sequences
- both demo accounts have at least 2 XLM
- Horizon ledger freshness within five minutes of the operator clock
- StellarExpert Testnet availability

The one supported fault boundary is `after-submit-before-result-persist`. It is Testnet-only, operator-authorized, run/Organization-allowlisted, durable, and consumed at most once. Recovery continues through the Phase 4 persisted transaction identity and reconciliation path; it must not begin a new logical issuance.

`phase5:evidence` closes a run only if the run is active and under ten minutes, every preflight check passed, exactly one run asset is Active, exactly one issuance has one confirmed payment hash and ledger, the ownership snapshot is pinned to the same run with equal supplies, required Activity events exist, and any consumed fault has reconciliation evidence. It also reopens the payment proof from Horizon. Only after these checks pass does it write a new manifest using exclusive file creation.

## Performance and browser contract

The non-production performance fixture reuses the deterministic Phase 2 corpus of 5,000 assets and 25,000 Activity events, then publishes 5,000 synthetic ownership holders for a confirmed non-formal asset.

The Phase 5 performance command requires a deployed authenticated environment, exact `PHASE5_REVISION`, and named `PHASE5_SEED_ID`. It measures 30 ownership API samples plus 30 rendered asset and 30 rendered ownership exact/prefix/no-result searches per Chromium, Firefox, and WebKit. Rendered asset timing includes its 250 ms debounce; each rendered search replaces an obsolete request before measuring the latest result. It also records 50 dashboard navigations per engine, including 10 isolated cold contexts. The 500 ms search and 2,000 ms dashboard p95 gates retain raw samples, p95s, cache classification, preview origin, browser versions, revision, seed, selected asset, and per-engine Playwright traces under `test-results/phase5`.

The Playwright matrix covers Chromium, Firefox, and WebKit non-extension flows and runs `@axe-core/playwright` WCAG-tagged serious/critical scans across ownership happy, stale, unavailable, zero, mismatch, refreshing, permission, rate-limit, recoverable failure, proof-unavailable, Activity no-result, and Activity failure/retry states. The real SEP-10/Freighter claim is limited to Chromium and requires a separate manual judging-environment record. Manual NVDA/Chrome evidence remains separate.

## Known acceptance gaps

Passing unit tests do not close the following Phase 5 acceptance criteria:

- P5-AC5.8 has deterministic domain and integration coverage for every preflight dependency outcome, including insufficient funding and Horizon/explorer failure behavior; the deployed preflight receipt remains environment-dependent evidence.

This gap appears as `Fail` in the evidence matrix. Preview performance, three-engine accessibility, wallet, and live evidence remain `Not Executed`; implementation alone cannot convert them to `Pass`.

## Verification anchors

- Ownership domain and Horizon collection: `packages/backend/src/domain/ownership.ts`, `packages/backend/src/stellar/ownership.ts`
- Atomic publication and retention: `packages/backend/convex/ownership.ts`, `packages/backend/convex/ownershipWorker.ts`
- Explorer validation: `packages/backend/src/stellar/explorer.ts`
- Activity registry and writer: `packages/backend/src/domain/activity.ts`, `packages/backend/convex/activityWriter.ts`
- Demo authority and evidence: `packages/backend/src/domain/demo.ts`, `packages/backend/convex/demo.ts`, `packages/backend/convex/demoWorker.ts`
- Operator CLI: `packages/backend/src/scripts/phase5.ts`
- Browser/performance harness: `apps/web/e2e/phase5-proof.spec.ts`, `apps/web/scripts/phase5`
- Static safety and live-manifest gates: `scripts/check-phase5-safety.mjs`, `scripts/verify-phase5-manifests.mjs`
- Architecture rationale: [ADR 0005](../adr/0005-fenced-ownership-publication-and-demo-run-authority.md)
