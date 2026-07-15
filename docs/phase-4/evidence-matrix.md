# Phase 4 evidence matrix

Date: 2026-07-15

Code revision: uncommitted working tree based on `4b8a4b4cf5378a23529e94f6dcca14c1283e9a08`.

Environment: Windows/PowerShell, Node.js 22 workspace, pnpm 10.25.0, Convex test runtime, Stellar SDK 16.0.1, Next.js production build. Verification timestamp: `2026-07-15T04:52:58Z`.

Status values in this matrix are restricted to `Pass`, `Fail`, and `Not Executed`.

| Acceptance area                                                                                                                                                   | Evidence                                                                                        | Status       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------ |
| Signed Phase 3 exit gate                                                                                                                                          | `docs/phase-3/evidence-matrix.md` contains open prerequisite/browser rows                       | Not Executed |
| Testnet-only public contract; request accepts only `expectedAssetVersion`                                                                                         | `app/api/assets/[assetId]/issuance/route.ts`; strict Zod body                                   | Pass         |
| Canonical amount boundaries and immutable approved snapshot                                                                                                       | `tokenization.test.ts`; `issuances.test.ts`                                                     | Pass         |
| Atomic duplicate claim and stable replay before stale-version rejection                                                                                           | `issuances.request`; `issuances.test.ts`                                                        | Pass         |
| Global `(Testnet, code, issuer)` managed identity reservation                                                                                                     | `managedAssetIdentities`; `issuances.test.ts`                                                   | Pass         |
| Seeds read only inside the Node worker and validated against configured public keys                                                                               | `convex/issuanceWorker.ts`; browser safety and secret scans                                     | Pass         |
| Dedicated accounts are funded and signer/account preflight passes on Testnet                                                                                      | Public keys and seeds were not configured                                                       | Not Executed |
| Exact changeTrust/payment construction, Testnet passphrase, five-minute bounds, and precomputed hash                                                              | `stellar/transactions.ts`; `transactions.test.ts`                                               | Pass         |
| Identity-before-submit, global source lock, lease fencing, and pre-submit stale-fence rejection                                                                   | `prepareAttempt`; `authorizeSubmission`; `issuances.test.ts`                                    | Pass         |
| Trustline gating and atomic payment proof, `Confirmed`, `Active`, and one confirmation event                                                                      | `confirmTrustline`; `confirmPayment`; `issuances.test.ts`                                       | Pass         |
| Hash-first reconciliation, expected sequence checks, identical resubmission, expiry predicate, and `NeedsReview` decision                                         | `domain/issuance.ts`; `issuance.test.ts`; `issuanceWorker.ts`                                   | Pass         |
| Durable retry schedule of 15, 30, 60, 120, then 300 seconds                                                                                                       | `scheduleRetry`; `retryDelaySeconds`; `issuance.test.ts`                                        | Pass         |
| Every submission crash window, response loss, ledger-before-database confirmation, replacement, external sequence consumption, and Horizon outage fault injection | The complete fault-injection matrix was not executed                                            | Not Executed |
| Persisted Ready/issuance UX, immutable configuration, safe Resume, proofs, focus, and live announcements                                                          | `tokenization-queue`; production build; browser safety guard                                    | Pass         |
| Refresh-at-every-state, session expiry, long reconciliation, Needs review, and non-color-only browser matrix                                                      | Authenticated preview sessions were not supplied                                                | Not Executed |
| Client/API/data/event/log/artifact scan for custody and signed-envelope material                                                                                  | `check-phase4-safety`; `scan:secrets` over 515 files                                            | Pass         |
| Live Testnet Trustline, payment, exact delivered balance, hashes, operations, restart recovery, duplicate replay, Activity history, and Active transition         | Dedicated funded Testnet pair was not configured                                                | Not Executed |
| Root deterministic verification                                                                                                                                   | `pnpm verify`: 97 backend tests, 24 web tests, build, guards, formatting, lint, and secret scan | Pass         |

## Gate conclusion

The deterministic issuance implementation is locally green, but Phase 4 is not complete or operational. The Phase 3 prerequisite, full crash/browser matrices, and required live Testnet gate are `Not Executed`.

The root README, superseding ADR, shipped engine guide, and operations runbook are intentionally deferred. Publishing them as operational documentation before the funded-pair and restart-recovery evidence would describe planned behavior as shipped behavior.
