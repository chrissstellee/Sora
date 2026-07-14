# Phase 1 integrity-gate evidence matrix

This matrix records the Phase 1 properties rechecked as the Phase 2 security gate. It is intentionally narrower than a retroactive certification of every `P1-AC`.

| Property                                         | Implementation symbol                                 | Test or command                                     | Result on 2026-07-14                              |
| ------------------------------------------------ | ----------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| Server-only Convex caller boundary               | `enforceBoundary`; `getConvexBoundaryKey`             | `assets.test.ts` direct-call case; `pnpm typecheck` | Pass                                              |
| Session expiry and revocation                    | `enforceAuth`; `revokeSession`                        | `auth-isolation.test.ts`; `assets.test.ts`          | Pass                                              |
| Deleted/disabled/inconsistent identity rejection | `enforceAuth`                                         | `assets.test.ts` identity-state case                | Pass                                              |
| Protected server render                          | `AppLayout`; `getServerSession`                       | `middleware.test.ts`; production build              | Pass; middleware is not treated as the authority  |
| Organization-scoped retained tasks               | `tasks.getByCompleted`; `by_organizationId_completed` | `auth-isolation.test.ts`                            | Pass                                              |
| Atomic auth/onboarding event writes              | `completeAuthentication`; `onboard`                   | Convex mutation semantics and local tests           | Implemented; no deployed fault-injection artifact |
| Secret and raw-token boundary                    | `hashToken`; `.env.example` server-only naming        | `pnpm scan:secrets`                                 | Pass for scanned working tree                     |
| Complete original Phase 1 browser/threat matrix  | Phase 1 sprint plan P1-09                             | Authenticated preview/browser run                   | Not executed in this evidence run                 |

Working-tree base SHA: `6855ed9dcb1ebd8d8c4702d99c7c3a273aaaf5dd`. Integrity-gate changes are not committed, so no final implementation SHA exists yet.
