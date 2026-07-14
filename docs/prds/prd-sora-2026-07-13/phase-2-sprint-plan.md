---
title: Phase 2 Sprint Plan — Persisted Asset Workspace
status: implementation-complete-external-evidence-pending
capacity_validation: required
created: 2026-07-14
source_prd: prd.md
source_phase: mvp-phases.md
---

# Phase 2 Sprint Plan — Persisted Asset Workspace

**Status: Implementation complete; authenticated preview E2E and performance evidence pending**

## Sprint goal

Enable an authenticated Organization member to create, reload, find, inspect, and safely edit durable Asset Records, with Organization-isolated search, dashboard counts, recent assets, and Activity Events all driven by the same persisted source of truth.

## Outcome hypothesis

If Sora derives Organization scope only from the verified Phase 1 session, validates one canonical Asset Record model at both client and server boundaries, and replaces each affected mock path with Organization-scoped persistence, then the asset workspace will remain correct across reloads and sessions without leaking, losing, or silently overwriting tenant data.

## Resolved product and architecture decisions

- Phase 1 remains the only authority for Organization, user, and session identity. Phase 2 reuses those records and does not create parallel identity tables or mappings.
- Every private operation derives `organizationId` and actor identity from the authenticated server context. Client-supplied tenant or actor identifiers are never authorization evidence.
- The required Asset Record fields are name, category, description, estimated value, currency, country, legal owner, registration number, ownership type, and contact email.
- Address, contact phone, and internal notes are optional.
- The complete persisted lifecycle enum is `Draft`, `Review`, `Ready`, `Issuing`, `Active`, `Failed`, and `Archived`. Phase 2 creation always produces `Draft`; Phase 2 exposes no lifecycle-transition control. Guarded transitions remain Phase 3 scope.
- One shared business schema owns trimming, normalization, field constraints, lifecycle values, and error codes. The UI uses it for immediate feedback and the server executes it again before every write. Framework transport validators may repeat shape checks but not redefine business rules.
- Estimated value is stored in a precision-safe canonical representation with an ISO currency code; UI-only display units such as “millions” are not persisted as domain values.
- Registration number is normalized for matching and is unique within an Organization. Create also carries a client-generated request identifier so a retry after an uncertain response returns the original result rather than creating a duplicate.
- Basic search is Organization-scoped, case-insensitive prefix matching on name and exact or prefix matching on normalized registration number. Fuzzy, substring, ranked, and cross-Organization search are out of scope.
- Dashboard counts include total assets and all seven lifecycle statuses. Total includes Archived; Archived also has its own count.
- Recent assets order by server-owned `updatedAt` descending with stable record ID as the tie-breaker.
- Create and material update write immutable `asset.created` and `asset.updated` Activity Events in the same datastore mutation as the Asset Record. A failed or no-op mutation writes no success event.
- Activity Events contain Organization, actor or system identity, event type, server timestamp, Asset Record subject, outcome, correlation ID, and bounded safe metadata. Secrets, unrestricted snapshots, and document contents are excluded.
- Conflict handling is explicit optimistic concurrency. Edit submits an expected record version; a stale edit is rejected without overwriting newer data and the UI offers reload and retry. Silent last-write-wins is not accepted.
- A foreign Asset Record ID and a nonexistent ID produce the same non-disclosing public result. Missing or invalid authentication remains an authorization error.
- Mock removal means no affected production execution path imports or reads mock asset, dashboard, search, or activity data. Isolated test, Storybook, and development fixtures may remain.

## Repository baseline and blockers

- `packages/backend/convex/helpers.ts` already exposes session-derived user and Organization context through `enforceAuth`; Phase 2 must verify and reuse that boundary.
- `packages/backend/convex/tasks.ts` provides a reusable Organization-scoped CRUD pattern, but its status index demonstrates a pattern Phase 2 must avoid: tenant scope belongs in the index, not in a global query followed by a filter.
- `packages/backend/convex/schema.ts` contains Organization, user, session, Activity Event, and starter task records, but no Asset Record table. Activity Events lack an Asset Record subject reference and a recent-event index.
- `packages/backend/convex/auth.ts#logActivity` accepts caller-supplied Organization and user IDs without `enforceAuth`. Asset event writes must not use that public trust pattern.
- The create form currently disagrees with the PRD: description is optional in the UI but required by FR-6; address and phone are required in the UI but optional in FR-6; an extra Organization name is required; and no shared server schema exists.
- Asset list, detail, search, dashboard, and asset activity surfaces are mock-backed. Create only shows a toast and redirects; Edit is inert.
- The create flow contains seeded document data even though document persistence is Phase 3.
- Existing isolation tests cover auth and starter tasks, not Asset Record list, detail, edit, search, aggregates, or Activity Events.
- ADR 0001 remains accepted only for Phase 0 and explicitly requires replacement when authenticated durable product storage begins. Phase 1 was expected to replace it; if no replacement exists at sprint start, P2-01 is blocking.

## Planning assumptions

- Sprint duration, team capacity, and owners are unknown; no calendar commitment is implied.
- Relative sizes are S, M, and L. Capacity must be validated before commitment.
- The Phase 1 exit gate has passed, including secure session restoration, centralized server authorization, protected routes, logout/revocation, and cross-Organization isolation.
- The replacement authentication/data-boundary ADR exists or is completed in P2-01 before durable Asset Record work begins.
- Search and dashboard performance fixtures use an agreed demo-load record count fixed during P2-01; a p95 claim without a named dataset and harness is not accepted.
- Each story ships as a vertical slice: schema/indexes, server authorization, UI wiring, explicit states, and automated acceptance coverage travel together.
- If all stories do not fit one delivery sprint, preserve the dependency order and split execution across multiple sprints. P2-01 through P2-03 form a demonstrable persisted CRUD increment but do not satisfy the Phase 2 exit gate by themselves.

## Scope

**In scope:** Phase 1 identity reuse; Asset Record persistence; canonical shared validation; Draft create; Organization-scoped list and detail; conflict-safe edit; server timestamps and versioning; basic Organization-scoped search; persisted lifecycle counts; recent assets; immutable create/update Activity Events; persisted recent Activity Events; affected-screen loading, empty, success, validation, failure, not-found, conflict, and retry UX; removal of affected production mock paths; performance checks; adversarial tenant-isolation tests; Phase 2 evidence matrix.

**Out of scope:** Asset deletion; document upload or seeded document behavior; lifecycle transition controls; Review/Ready workflow; Tokenization Queue behavior; issuance or blockchain synchronization; advanced filters, sorting, fuzzy search, full-text relevance, and global search; bulk import/export/edit; real-time collaboration; offline mode; advanced RBAC; compliance-grade audit history; event buses, CQRS, or generic repository abstractions; unrelated dashboard analytics; repository-wide deletion of test fixtures.

## Ordered stories

| ID    | Story / outcome                                                                                     | Size | Dependency   | PRD references                                           |
| ----- | --------------------------------------------------------------------------------------------------- | ---: | ------------ | -------------------------------------------------------- |
| P2-01 | Verify the Phase 1 authorization boundary and close the Phase 2 data contract                       |    S | Phase 1 exit | FR-5–8, FR-24, FR-25, FR-27; NFR-1, NFR-10–12, NFR-14–18 |
| P2-02 | Create and list Organization-scoped Draft Asset Records with canonical validation and create events |    L | P2-01        | FR-6–8, FR-24, FR-27; NFR-1, NFR-10, NFR-14–18           |
| P2-03 | Open and conflict-safely edit persisted Asset Records with update events                            |    L | P2-02        | FR-6–8, FR-24, FR-27; NFR-1, NFR-10, NFR-14–18           |
| P2-04 | Search persisted Asset Records inside the authenticated Organization                                |    M | P2-02        | FR-8, FR-27; NFR-1, NFR-12, NFR-15, NFR-18               |
| P2-05 | Drive dashboard lifecycle counts, recent assets, and recent Activity Events from persistence        |    M | P2-02–03     | FR-24, FR-25, FR-27; NFR-1, NFR-11, NFR-14–18            |
| P2-06 | Remove affected production mocks and complete truthful workspace state handling                     |    M | P2-02–05     | FR-7, FR-8, FR-25, FR-27; NFR-10, NFR-17, NFR-18         |
| P2-07 | Prove the Phase 2 isolation, durability, correctness, and performance exit gate                     |    M | P2-02–06     | FR-6–8, FR-24, FR-25, FR-27; NFR-1, NFR-10–12, NFR-14–18 |

## Sprint acceptance criteria

The `P2-AC` identifiers below are sprint acceptance IDs, not PRD functional requirement IDs.

### P2-01 — Authorization and data-contract preflight

1. **P2-AC1.1:** An accepted ADR defines the implemented Browser → Next.js session-cookie → Convex authorization and data boundary, including how direct browser-to-Convex calls cannot bypass Organization scoping. If ADR 0001 is still the active record, its required replacement blocks P2-02.
2. **P2-AC1.2:** The Phase 1 session path is verified to return trusted `userId` and `organizationId`, reject missing, expired, revoked, deleted, or inconsistent identity state, and expose a single helper used by every Phase 2 server entry point.
3. **P2-AC1.3:** The canonical Asset Record contract fixes the required and optional fields, precision-safe value representation, supported currency/country formats, maximum lengths, normalization rules, lifecycle enum, server-owned timestamps, record version, and stable error codes.
4. **P2-AC1.4:** The contract fixes registration-number uniqueness per Organization, create idempotency-key behavior, no-op update behavior, conflict behavior, search semantics, dashboard status inclusion, recent ordering, and safe Activity Event metadata.
5. **P2-AC1.5:** The schema/query design includes Organization-first indexes for normalized registration number, updated time, lifecycle status, and supported search. No Phase 2 query begins globally and relies on client filtering for tenant safety.
6. **P2-AC1.6:** The agreed demo-load fixture size, dashboard/search performance harness, and accountable owners are recorded before commitment.

### P2-02 — Persisted Draft create and list

1. **P2-AC2.1:** The datastore defines an Asset Record with required `organizationId`, PRD fields, normalized search fields, `Draft` status, server-owned `createdAt` and `updatedAt`, version, and create request identifier, plus the required Organization-first indexes.
2. **P2-AC2.2:** One shared business schema is imported by the create form and the server mutation; direct mutation calls that bypass client validation are rejected by the same domain rules.
3. **P2-AC2.3:** The existing form is reconciled to FR-6: description is required; address and contact phone are optional; the duplicate Organization-name field is removed unless it maps to a separately approved domain field; seeded documents are removed from the Phase 2 flow.
4. **P2-AC2.4:** An authenticated create derives Organization and actor from the verified session, persists one `Draft` record, and never accepts a client Organization or actor ID as authority.
5. **P2-AC2.5:** Asset creation and exactly one immutable `asset.created` event commit in the same server mutation using one timestamp and correlation ID. If either insert fails, neither result persists.
6. **P2-AC2.6:** Reusing a completed create request identifier in the same Organization returns the original logical result; normalized registration-number collisions return a stable validation conflict rather than a duplicate record.
7. **P2-AC2.7:** The list reads persisted records only for the authenticated Organization and presents name, category, value/currency, lifecycle state, and last update. Refresh and a new valid session show the created record.
8. **P2-AC2.8:** Create and list expose loading, empty, submitting, validation-error, recoverable server/network error, retry, and success states with user-safe messages stating whether data was saved.
9. **P2-AC2.9:** Automated tests prove unauthenticated denial, direct-call validation, idempotent retry, registration collision handling, create-event atomicity, and Organization A/B list isolation.

### P2-03 — Detail and conflict-safe edit

1. **P2-AC3.1:** Opening a persisted list item loads its complete Asset Record through a server-authorized, Organization-scoped detail query; the detail route no longer reads `MOCK_ASSETS`.
2. **P2-AC3.2:** A missing ID and a known foreign-Organization ID produce the same public unavailable/not-found behavior and reveal no record fields or existence signal.
3. **P2-AC3.3:** Edit uses the same canonical input model as create, preserves immutable fields, and sends the current expected version. Phase 2 exposes editing for reachable Draft records but no lifecycle-transition control.
4. **P2-AC3.4:** A material successful edit increments version, updates `updatedAt`, and writes exactly one immutable `asset.updated` event atomically using the same server timestamp. The event may list changed field names but stores no unrestricted before/after snapshot.
5. **P2-AC3.5:** A no-op edit returns success without changing version or `updatedAt` and without creating an update event.
6. **P2-AC3.6:** A stale expected version fails without overwriting the newer record or writing an event; the UI states that the asset changed and offers reload and safe retry.
7. **P2-AC3.7:** Refreshing detail and list after an edit shows the same latest persisted values and timestamp without a local duplicate source of truth.
8. **P2-AC3.8:** Automated tests cover missing/foreign IDs, direct unauthorized update, invalid server input, atomic event failure, no-op behavior, and concurrent stale edits.

### P2-04 — Organization-scoped basic search

1. **P2-AC4.1:** Search trims and normalizes input server-side, scopes by the authenticated Organization before matching, and never loads all assets for client-side filtering.
2. **P2-AC4.2:** Name search is case-insensitive prefix matching. Registration-number search supports case-insensitive exact and prefix matching. Empty input restores the default Organization list.
3. **P2-AC4.3:** Search results are limited or paginated and deduplicated when name and registration paths match the same record; stable ordering is documented and tested.
4. **P2-AC4.4:** Loading, no-result, error, retry, and cleared-search states are distinct and keyboard operable.
5. **P2-AC4.5:** Organization A cannot retrieve or infer Organization B records even when both contain the same normalized name or registration prefix.
6. **P2-AC4.6:** Search meets NFR-12 at p95 ≤500 ms against the agreed demo-load fixture, with the harness and result captured in the evidence matrix.

### P2-05 — Persisted dashboard and recent activity

1. **P2-AC5.1:** Dashboard data is fetched through authenticated Organization-scoped server queries and contains no caller-controlled tenant filter.
2. **P2-AC5.2:** Dashboard shows total assets plus counts for `Draft`, `Review`, `Ready`, `Issuing`, `Active`, `Failed`, and `Archived`; total includes Archived and counts agree with seeded datastore records.
3. **P2-AC5.3:** Counts are derived from Asset Records for Phase 2 and are not maintained as mutable counter records or another source of truth. An optimization threshold may be documented without adding premature counters.
4. **P2-AC5.4:** Recent assets use persisted `updatedAt DESC` ordering with stable ID tie-breaking and an explicit result limit.
5. **P2-AC5.5:** Recent Activity Events read persisted `asset.created` and `asset.updated` records ordered by server timestamp with a deterministic tie-breaker and remain visible after reload.
6. **P2-AC5.6:** Creating an asset increments total and Draft counts and updates recent assets/activity; editing updates recency and activity without changing counts.
7. **P2-AC5.7:** Organization B assets and events do not affect Organization A counts, recency, timing, or empty states.
8. **P2-AC5.8:** Dashboard loading, empty, partial/recoverable failure, retry, and success states are explicit and usable, and usable content meets NFR-11 at p95 ≤2 seconds under the agreed demo load.

### P2-06 — Mock removal and truthful workspace states

1. **P2-AC6.1:** Asset create, list, detail, edit, search, asset statistics, dashboard counts, recent assets, and recent Activity Events have no production import or runtime path to mock data.
2. **P2-AC6.2:** Dead runtime mock modules for affected screens are deleted; retained fixtures are isolated to tests, Storybook, or clearly labeled development-only tooling.
3. **P2-AC6.3:** Fake seeded documents and Phase 3-only document interactions are removed or visibly disabled outside the Phase 2 working path.
4. **P2-AC6.4:** Existing display models are replaced or adapted to the canonical domain model; UI-only `Tokenized` and blockchain status labels cannot overwrite or masquerade as persisted lifecycle truth.
5. **P2-AC6.5:** Every affected route handles loading, empty, success, validation error, not found, conflict, network/server failure, and safe retry as applicable, with visible focus and non-color-only status cues.
6. **P2-AC6.6:** Query invalidation or reactive updates keep create, list, detail, dashboard, and activity views consistent without maintaining a second mutable client cache as product truth.

### P2-07 — Exit-gate evidence and regression proof

1. **P2-AC7.1:** One automated or scripted flow passes: authenticate → create → reload → list → search → open detail → edit → reload → dashboard, with persisted values, counts, recency, and events agreeing at each step.
2. **P2-AC7.2:** A reusable two-Organization matrix covers list, detail, edit, search, status counts, recent assets, and Activity Events, including guessed foreign IDs and colliding search values.
3. **P2-AC7.3:** Client and direct server tests reject missing required fields, invalid formats/bounds, unsafe normalization, invalid lifecycle values, duplicate registration numbers, duplicate create requests, and stale versions.
4. **P2-AC7.4:** Atomicity tests prove failed creates/updates leave neither a misleading Asset Record result nor a success Activity Event, and successful material mutations produce exactly one matching event.
5. **P2-AC7.5:** Static import checks or equivalent automated assertions prove affected production modules cannot import runtime asset/dashboard/activity mocks.
6. **P2-AC7.6:** The dashboard and search performance budgets pass against the named demo-load fixture and deployed-like configuration; results are attached to the Phase 2 evidence matrix.
7. **P2-AC7.7:** `pnpm verify` passes with no regression to Phase 0 Testnet safety or Phase 1 authentication/session isolation.
8. **P2-AC7.8:** The Phase 2 evidence matrix maps every phase exit condition and referenced NFR to an automated test, CI result, or captured verification artifact.

## Execution order and capacity cut

Critical path: **P2-01 → P2-02 → P2-03 → P2-05 → P2-06 → P2-07**.

P2-04 may begin after P2-02 and run alongside P2-03. P2-05 count and recent-asset work may begin after P2-02, but recent update behavior and Activity Event acceptance wait for P2-03. Mock removal and negative tests occur within each story; P2-06 and P2-07 audit completeness rather than deferring cleanup and testing to the end.

P2-01 through P2-03 are the first demonstrable vertical increment. They are a valid capacity cut only if work must span multiple delivery sprints; they are not a completed Phase 2 because search, persisted dashboard truth, full mock removal, performance evidence, and the phase isolation matrix remain mandatory.

No security, tenant-isolation, server-validation, durability, or mock-truth criterion is de-scopable. Cosmetic polish outside FR-27 and NFR-17 may move after the Phase 2 gate.

## Phase exit gate / epic definition of done

Phase 2 exits only with:

- An accepted current ADR and verified Phase 1 session-derived Organization authorization boundary.
- An authenticated user creating, listing, opening, editing, and reloading a durable Asset Record.
- One canonical model enforcing the PRD field rules on both client and server.
- Create always producing Draft and no Phase 2 UI advancing lifecycle state.
- Conflict-safe edits rejecting stale versions without data loss.
- Persisted Organization-scoped basic search returning correct name and registration-number results within the performance budget.
- Dashboard lifecycle counts, recent assets, and recent Activity Events coming from persisted Organization data within the performance budget.
- Exactly one immutable Activity Event accompanying each successful material create/update, with failed and no-op writes producing no misleading event.
- Automated Organization-isolation coverage for every Asset Record operation, search path, aggregate, and Activity Event query.
- No mock data driving affected production screens.
- Loading, empty, success, validation, not-found, conflict, failure, and safe retry states implemented where applicable.
- A complete evidence matrix and passing `pnpm verify`.

## Demo checkpoint

1. Authenticate as Organization A and show an empty persisted asset workspace.
2. Create a Draft Asset Record using all required fields and show it in the list.
3. Reload the browser and open the same persisted detail record.
4. Edit it, reload again, and show the updated value, version, timestamp, and Activity Event.
5. Search by name prefix and registration-number prefix and show the correct Organization A result.
6. Return to the dashboard and show real total/Draft counts, recent assets, and recent activity.
7. Authenticate as Organization B with similarly named data and prove direct-ID, search, count, recency, and activity isolation.
8. Demonstrate a stale-edit conflict and the safe reload/retry path.
9. Run the Phase 2 evidence matrix with affected runtime mocks disabled.

## Risks and mitigations

- **Phase 1 is treated as complete without a current trust-boundary ADR:** block P2-02 until P2-01 verifies the implemented cookie, session, Convex, and direct-client boundary.
- **Client identifiers bypass tenancy:** derive Organization and actor only from the verified server session; test every operation with known foreign IDs and indistinguishable not-found results.
- **The current form silently becomes the domain contract:** reconcile it explicitly to FR-6 and place business rules in one shared schema executed server-side.
- **Precision is lost through UI display units:** persist a canonical precision-safe amount and ISO currency, then format only at the view boundary.
- **Create retry produces duplicates:** combine Organization-scoped normalized registration uniqueness with a request identifier and concurrency tests.
- **Concurrent edits overwrite newer data:** require expected version and return a recoverable conflict without patching or emitting an event.
- **Activity logging remains a caller-trusted public mutation:** write subject-scoped events inside authorized Asset Record mutations and expose only Organization-scoped readers.
- **Dashboard counters become a second source of truth:** derive Phase 2 counts from indexed Organization records; optimize only after measured thresholds justify it.
- **Search scopes globally before filtering:** use Organization-first exact/search indexes and assert cross-tenant collisions.
- **Mock adapters survive behind hooks:** remove mock imports per slice and add a final production-import assertion.
- **Documents leak into Phase 2 through the existing create flow:** remove seeded document data and leave document persistence and lifecycle eligibility to Phase 3.
- **Performance claims lack a repeatable load model:** name the fixture volume and harness during P2-01 and store p95 evidence.

## Open ownership decisions

Before commitment, assign accountable owners for the replacement/current ADR approval, canonical Asset Record contract, Convex schema and indexes, shared validation module, create/list UI, detail/edit conflict UX, search implementation and performance harness, dashboard/activity migration, two-Organization fixtures, mock-import audit, and final phase-gate sign-off.
