# Phase 2 evidence matrix

Date: 2026-07-14

Code revision: working tree based on `6855ed9dcb1ebd8d8c4702d99c7c3a273aaaf5dd`; implementation is not committed, so no final commit SHA exists.

Local environment: Windows/PowerShell, Node.js 22 workspace, pnpm 10.25.0, Vitest with `convex-test`, Next.js production build. Local result: typecheck, lint, formatting, 72 backend tests, 15 web tests, mock guard, production build, and secret scan passed. Preview environment: not supplied. Fixture/performance/Playwright result: **NOT EXECUTED**.

Status meanings: **Pass** is backed by the listed local evidence; **Partial** means implementation exists but a required scenario or artifact remains; **Not executed** means the acceptance result requires the unavailable authenticated preview.

| Acceptance ID | Implementation anchor                                                | Evidence                                                        | Status / result                                               |
| ------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| P2-AC1.1      | ADR 0004; `enforceBoundary`; protected layout                        | `assets.test.ts`; build                                         | Pass                                                          |
| P2-AC1.2      | `helpers.enforceAuth`; `server-session.getServerSession`             | revoked/deleted/disabled/inconsistent cases in `assets.test.ts` | Pass                                                          |
| P2-AC1.3      | `domain/asset-record.ts`; `api-errors.ts`                            | `asset-record.test.ts`; typecheck                               | Pass                                                          |
| P2-AC1.4      | `assets.create/update/list/workspaceSummary`; `activity.list`        | `assets.test.ts`; Asset Workspace contract                      | Pass                                                          |
| P2-AC1.5      | Organization-first indexes in `convex/schema.ts`                     | schema-aware `assets.test.ts`; mock guard                       | Pass                                                          |
| P2-AC1.6      | `scripts/phase2`; root `verify:phase2`; locked owners in sprint plan | harness README                                                  | Pass for definition; execution pending                        |
| P2-AC2.1      | `schema.assets`; `assets.create`                                     | create/replay test                                              | Pass                                                          |
| P2-AC2.2      | shared `assetRecordSchema` imported by form and mutation             | domain boundary tests; direct mutation rejection                | Pass                                                          |
| P2-AC2.3      | `AssetForm`; `CreateAssetPage`                                       | build; static mock guard                                        | Pass                                                          |
| P2-AC2.4      | `assets.create` + `enforceAuth`                                      | missing boundary/session and isolation tests                    | Pass                                                          |
| P2-AC2.5      | `assets.create`; `activityMetadata`                                  | create event assertions in `assets.test.ts`                     | Pass locally; no deployed fault injection                     |
| P2-AC2.6      | request fingerprint and registration index                           | idempotency/conflict/uniqueness test                            | Pass                                                          |
| P2-AC2.7      | `assets.list`; `AssetsPage`; `useAssets`                             | pagination/isolation tests; build                               | Pass locally; browser reload not executed                     |
| P2-AC2.8      | `AssetForm`; `RequestState`; create/list views                       | web tests and build                                             | Partial; complete browser-state assertions not executed       |
| P2-AC2.9      | `assets.test.ts` create suite                                        | Vitest                                                          | Partial; explicit injected event-insert rollback case absent  |
| P2-AC3.1      | `assets.get`; `AssetDetailsPage`                                     | isolation/update test; mock guard                               | Pass                                                          |
| P2-AC3.2      | `findAsset`; `ASSET_NOT_FOUND` mapping                               | foreign/nonexistent tests                                       | Pass                                                          |
| P2-AC3.3      | `assetUpdateSchema`; `EditAssetPage`; Draft guard                    | update tests; typecheck                                         | Pass                                                          |
| P2-AC3.4      | `assets.update`; allowlisted changed fields                          | material update/event assertions                                | Pass                                                          |
| P2-AC3.5      | canonical equality branch in `assets.update`                         | no-op test                                                      | Pass                                                          |
| P2-AC3.6      | expected-version check; conflict-review UI                           | stale test; `workspace-api.test.ts`                             | Pass locally; browser recovery not executed                   |
| P2-AC3.7      | `workspace-api`; no-store fetch hooks                                | build and mock guard                                            | Partial; reload workflow not executed                         |
| P2-AC3.8      | get/update tests in `assets.test.ts`                                 | Vitest                                                          | Partial; explicit event-failure injection absent              |
| P2-AC4.1      | indexed name/registration search in `assets.list`                    | search/isolation test                                           | Pass                                                          |
| P2-AC4.2      | server normalization and empty-query list mode                       | search and pagination tests                                     | Pass                                                          |
| P2-AC4.3      | dedupe map, limit 50, normalized-name ordering                       | dedupe/order test                                               | Pass                                                          |
| P2-AC4.4      | `AssetsToolbar`; `useAssets`; request states                         | build                                                           | Partial; keyboard/browser assertions not executed             |
| P2-AC4.5      | Organization-first search indexes                                    | two-Organization collision test                                 | Pass                                                          |
| P2-AC4.6      | `performance.mjs` search sampler                                     | 5,000/25,000 per-org preview run                                | Not executed                                                  |
| P2-AC5.1      | workspace/activity API routes; `enforceAuth`                         | isolation tests; build                                          | Pass                                                          |
| P2-AC5.2      | `assets.workspaceSummary`; lifecycle constants                       | count/Archived test                                             | Pass                                                          |
| P2-AC5.3      | indexed counts read from assets                                      | code inspection; count test                                     | Pass                                                          |
| P2-AC5.4      | `by_organizationId_updatedAt`; stable asset ID                       | pagination/summary test                                         | Pass                                                          |
| P2-AC5.5      | activity timestamp/event ID indexes; `activity.list`                 | mutation event assertions; build                                | Pass locally                                                  |
| P2-AC5.6      | create/update transactions; dashboard refetch                        | tests and implementation                                        | Partial; browser agreement flow not executed                  |
| P2-AC5.7      | Organization-scoped assets/activity queries                          | two-Organization tests                                          | Pass locally                                                  |
| P2-AC5.8      | dashboard request states; performance harness                        | production build                                                | Partial; p95 navigation gate not executed                     |
| P2-AC6.1      | persisted workspace hooks and API routes                             | `check-phase2-mocks.mjs`                                        | Pass                                                          |
| P2-AC6.2      | deleted known runtime mock modules                                   | static guard                                                    | Pass                                                          |
| P2-AC6.3      | detail Phase 3 unavailable notice; working create path               | static guard; build                                             | Pass for active routes                                        |
| P2-AC6.4      | shared canonical record types and lifecycle                          | typecheck; mock guard                                           | Pass                                                          |
| P2-AC6.5      | request/form/not-found/conflict views                                | web tests and build                                             | Partial; full keyboard/state browser matrix not executed      |
| P2-AC6.6      | no-store request hooks and server refetch                            | `workspace-api.test.ts`; code inspection                        | Pass                                                          |
| P2-AC7.1      | `e2e/phase2-workspace.spec.ts`                                       | authenticated Playwright flow                                   | Not executed                                                  |
| P2-AC7.2      | Convex two-org fixtures; Playwright org contexts                     | local isolation tests                                           | Partial; full browser matrix not executed                     |
| P2-AC7.3      | domain schema, create/update conflict guards                         | domain, Convex, web tests                                       | Pass for local covered boundaries                             |
| P2-AC7.4      | Convex transactional mutations                                       | event/count/no-op/stale assertions                              | Partial; explicit fault-injection artifact absent             |
| P2-AC7.5      | `scripts/check-phase2-mocks.mjs`                                     | `pnpm check:phase2-mocks`                                       | Pass                                                          |
| P2-AC7.6      | seed and performance scripts                                         | required preview benchmark                                      | Not executed                                                  |
| P2-AC7.7      | root verification pipeline                                           | `pnpm verify`; Phase 0 Testnet spike                            | Partial; local gate passed, live Testnet regression not rerun |
| P2-AC7.8      | this matrix and verification runbook                                 | local command record                                            | Partial; preview/E2E/performance artifacts pending            |

## Release conclusion

The implementation and local deterministic gates are green. The sprint is not complete because P2-AC4.6, P2-AC7.1, and P2-AC7.6 are not executed, and several browser/fault-injection evidence rows remain partial. Run `pnpm verify:phase2` in the specified disposable authenticated preview, rerun the Phase 0 Testnet spike, attach sanitized output, resolve partial rows, then replace the working-tree identifier with the final commit SHA before phase-gate sign-off.
