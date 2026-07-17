# Phase 2 evidence matrix

Date: 2026-07-15

Code revision: uncommitted working tree based on `4b8a4b4cf5378a23529e94f6dcca14c1283e9a08`; no final implementation commit SHA exists yet.

Local environment: Windows/PowerShell, Node.js 22 workspace, pnpm 10.25.0, Vitest with `convex-test`, Next.js production build, and installed Chromium. Local result on 2026-07-15: typecheck, lint, formatting, 97 backend tests, 24 web tests, bounded-query guards, mock guards, production build, and secret scan passed. The earlier live Phase 0 Testnet regression receipt remains at `docs/phase-0/evidence/testnet-issuance.json`. Preview environment: not supplied. Authenticated fixture/performance/Playwright result: **Not Executed** because `PHASE2_BASE_URL` and both Organization session cookies were unavailable.

Status meanings: **Pass** is backed by the listed evidence; **Fail** means an executed criterion did not meet its acceptance condition; **Not Executed** means a required environment-dependent acceptance result was not run. A criterion with both deterministic and environment-dependent requirements remains **Not Executed** until the complete criterion is exercised.

| Acceptance ID | Implementation anchor                                                | Evidence                                                            | Status / result |
| ------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------- |
| P2-AC1.1      | ADR 0004; `enforceBoundary`; protected layout                        | `assets.test.ts`; build                                             | Pass            |
| P2-AC1.2      | `helpers.enforceAuth`; `server-session.getServerSession`             | revoked/deleted/disabled/inconsistent cases in `assets.test.ts`     | Pass            |
| P2-AC1.3      | `domain/asset-record.ts`; `api-errors.ts`                            | `asset-record.test.ts`; typecheck                                   | Pass            |
| P2-AC1.4      | `assets.create/update/list/workspaceSummary`; `activity.list`        | `assets.test.ts`; Asset Workspace contract                          | Pass            |
| P2-AC1.5      | Organization-first indexes in `convex/schema.ts`                     | schema-aware `assets.test.ts`; mock guard                           | Pass            |
| P2-AC1.6      | `scripts/phase2`; root `verify:phase2`; locked owners in sprint plan | harness README                                                      | Not Executed    |
| P2-AC2.1      | `schema.assets`; `assets.create`                                     | create/replay test                                                  | Pass            |
| P2-AC2.2      | shared `assetRecordSchema` imported by form and mutation             | domain boundary tests; direct mutation rejection                    | Pass            |
| P2-AC2.3      | `AssetForm`; `CreateAssetPage`                                       | build; static mock guard                                            | Pass            |
| P2-AC2.4      | `assets.create` + `enforceAuth`                                      | missing boundary/session and isolation tests                        | Pass            |
| P2-AC2.5      | `assets.create`; `activityMetadata`; `phase2Faults.createThenFail`   | create event and injected rollback assertions in `assets.test.ts`   | Pass            |
| P2-AC2.6      | request fingerprint and registration index                           | idempotency/conflict/uniqueness test                                | Pass            |
| P2-AC2.7      | `assets.list`; `AssetsPage`; `useAssets`                             | pagination/isolation tests; build                                   | Not Executed    |
| P2-AC2.8      | `AssetForm`; `RequestState`; create/list views                       | web tests and build                                                 | Not Executed    |
| P2-AC2.9      | `phase2Faults.createThenFail`; transactional aggregate/event writes  | injected create rollback test in `assets.test.ts`                   | Pass            |
| P2-AC3.1      | `assets.get`; `AssetDetailsPage`                                     | isolation/update test; mock guard                                   | Pass            |
| P2-AC3.2      | `findAsset`; `ASSET_NOT_FOUND` mapping                               | foreign/nonexistent tests                                           | Pass            |
| P2-AC3.3      | `assetUpdateSchema`; `EditAssetPage`; Draft guard                    | update tests; typecheck                                             | Pass            |
| P2-AC3.4      | `assets.update`; allowlisted changed fields                          | material update/event assertions                                    | Pass            |
| P2-AC3.5      | canonical equality branch in `assets.update`                         | no-op test                                                          | Pass            |
| P2-AC3.6      | expected-version check; conflict-review UI                           | stale test; `workspace-api.test.ts`                                 | Not Executed    |
| P2-AC3.7      | `workspace-api`; no-store fetch hooks                                | build and mock guard                                                | Not Executed    |
| P2-AC3.8      | `phase2Faults.updateThenFail`; transactional asset/event writes      | injected update rollback test in `assets.test.ts`                   | Pass            |
| P2-AC4.1      | indexed name/registration search in `assets.list`                    | search/isolation test                                               | Pass            |
| P2-AC4.2      | server normalization and empty-query list mode                       | search and pagination tests                                         | Pass            |
| P2-AC4.3      | dedupe map, limit 50, normalized-name ordering                       | dedupe/order test                                                   | Pass            |
| P2-AC4.4      | `AssetsToolbar`; `useAssets`; request states                         | build                                                               | Not Executed    |
| P2-AC4.5      | Organization-first search indexes                                    | two-Organization collision test                                     | Pass            |
| P2-AC4.6      | `performance.mjs` search sampler                                     | 5,000/25,000 per-org preview run                                    | Not Executed    |
| P2-AC5.1      | workspace/activity API routes; `enforceAuth`                         | isolation tests; build                                              | Pass            |
| P2-AC5.2      | `assets.workspaceSummary`; lifecycle constants                       | count/Archived test                                                 | Pass            |
| P2-AC5.3      | `assetLifecycleCounts` aggregate component; idempotent backfill      | lifecycle/Organization count and multi-page backfill tests          | Pass            |
| P2-AC5.4      | `by_organizationId_updatedAt`; native opaque cursor pagination       | non-overlap, invalid-cursor envelope, and equal-time ordering tests | Pass            |
| P2-AC5.5      | activity timestamp/event ID indexes; bounded `activity.list`         | limit-before-return and equal-time ordering tests                   | Pass            |
| P2-AC5.6      | create/update transactions; dashboard refetch                        | tests and implementation                                            | Not Executed    |
| P2-AC5.7      | Organization-scoped assets, counts, recency, and activity queries    | two-Organization edit/count/recency/activity isolation matrix       | Pass            |
| P2-AC5.8      | dashboard request states; performance harness                        | production build                                                    | Not Executed    |
| P2-AC6.1      | persisted workspace hooks and API routes                             | `check-phase2-mocks.mjs`                                            | Pass            |
| P2-AC6.2      | deleted known runtime mock modules                                   | static guard                                                        | Pass            |
| P2-AC6.3      | detail Phase 3 preparation and working create path                   | static guard; build                                                 | Pass            |
| P2-AC6.4      | shared canonical record types and lifecycle                          | typecheck; mock guard                                               | Pass            |
| P2-AC6.5      | request/form/not-found/conflict views                                | web tests and build                                                 | Not Executed    |
| P2-AC6.6      | no-store request hooks and server refetch                            | `workspace-api.test.ts`; code inspection                            | Pass            |
| P2-AC7.1      | `e2e/phase2-workspace.spec.ts`                                       | authenticated Playwright flow                                       | Not Executed    |
| P2-AC7.2      | Convex two-org fixtures; Playwright org contexts                     | local asset/count/recency/activity isolation matrix                 | Not Executed    |
| P2-AC7.3      | domain schema, create/update conflict guards                         | domain, Convex, web tests                                           | Pass            |
| P2-AC7.4      | Convex transactional mutations; internal deterministic fault hooks   | create/update asset, aggregate, and event rollback assertions       | Pass            |
| P2-AC7.5      | `scripts/check-phase2-mocks.mjs`                                     | `pnpm check:phase2-mocks`                                           | Pass            |
| P2-AC7.6      | seed and performance scripts                                         | required preview benchmark                                          | Not Executed    |
| P2-AC7.7      | root verification pipeline                                           | `pnpm verify`; retained Phase 0 Testnet receipt                     | Pass            |
| P2-AC7.8      | this matrix and verification runbook                                 | local command record                                                | Not Executed    |

## Release conclusion

The implementation, local deterministic gate, transaction fault-injection tests, and retained live Phase 0 Testnet regression evidence are green. Phase 2 is not complete because the authenticated preview, two-Organization Playwright, performance, and browser-dependent rows are **Not Executed**. Supply the private preview URL and two Organization session cookies, run `pnpm verify:phase2` against the specified disposable authenticated preview, attach sanitized performance and Playwright output, resolve the remaining rows, and replace the working-tree identifier with the final commit SHA before phase-gate sign-off.
