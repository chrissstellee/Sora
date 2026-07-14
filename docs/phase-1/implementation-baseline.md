# Phase 1 implementation baseline

Date reviewed: 2026-07-14

Baseline commit: `6855ed9dcb1ebd8d8c4702d99c7c3a273aaaf5dd`, with the integrity-gate changes described below present in the current uncommitted working tree.

## Implemented boundary

Phase 1 provides wallet-only SEP-10 challenge and verification routes, first-wallet onboarding, returning-wallet sessions, Organization and user persistence, hashed session storage, logout revocation, and server-side protected-route validation. Phase 2's integrity gate added a server-only Next.js-to-Convex boundary key, consolidated authentication side effects into authorized mutations, rejected revoked and inconsistent identities, and changed retained task indexes to begin with `organizationId`.

The authoritative implementation is:

- `apps/web/app/api/auth/{challenge,verify,onboard,me,logout}/route.ts`
- `apps/web/core/lib/server-session.ts`
- `apps/web/app/(pages)/layout.tsx`
- `packages/backend/convex/{auth,helpers,schema,tasks}.ts`
- `packages/backend/src/stellar/auth.ts`

[ADR 0004](../adr/0004-authenticated-next-convex-boundary.md) records the current decision. [ADR 0001](../adr/0001-sep-10-next-convex-boundary.md) remains an accurate historical Phase 0 record and is not rewritten.

## Current verification record

The local workspace verification completed successfully for type checking, lint, formatting, 71 backend tests, 15 web tests, production build, the Phase 2 mock guard, and the secret scanner. This is evidence for the current working tree, not a retrospective claim that every Phase 1 sprint criterion was captured when Phase 1 shipped.

| Phase 1 area                  | Current implementation evidence                              | Current automated evidence                 | Qualification                                                                                       |
| ----------------------------- | ------------------------------------------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| P1-01 trust contract          | ADR 0004; Wallets Kit dependency in `apps/web/package.json`  | Build and typecheck                        | Package-version/import behavior was not recaptured as a dedicated Phase 1 evidence artifact         |
| P1-02 auth persistence        | `convex/schema.ts`                                           | `auth-isolation.test.ts`, `assets.test.ts` | Schema and isolation are covered; no historical database-inspection artifact exists                 |
| P1-03 wallet-only UX          | Login/register and auth hooks under `apps/web/features/auth` | Web test suite and production build        | No screenshot evidence was captured in this run                                                     |
| P1-04 challenge generation    | challenge route; `stellar/auth.ts`                           | `stellar/auth.test.ts`                     | Live wallet rejection/network UX was not rerun                                                      |
| P1-05 verification            | verify route; `completeAuthentication`                       | Stellar auth and Convex tests              | Parallel verification is transactionally implemented; no deployed concurrency artifact was captured |
| P1-06 onboarding              | onboard route and mutation                                   | Convex regression suite                    | No deployed concurrent-onboarding artifact was captured                                             |
| P1-07 session lifecycle       | `server-session.ts`, logout route, protected layout          | `assets.test.ts`, `middleware.test.ts`     | Browser account/network-change behavior was not rerun                                               |
| P1-08 tenant isolation        | `enforceAuth`; Organization-first indexes                    | `auth-isolation.test.ts`, `assets.test.ts` | Current direct-bypass and two-Organization cases pass locally                                       |
| P1-09 safe activity and gates | authorized auth mutations; scanner                           | `pnpm verify`                              | Phase 1 UI/live Testnet evidence was not recaptured                                                 |

## Evidence limits

This baseline closes the code-level Phase 1 boundary needed by Phase 2. It does not mark the original Phase 1 sprint plan complete, recreate missing screenshots, claim a live wallet run, or substitute current tests for historical CI evidence. The Phase 0 Testnet evidence remains separately documented under `docs/phase-0/`.
