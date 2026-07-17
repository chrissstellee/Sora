---
title: Phase 3 Sprint Plan — Documents, Review, and Ready State
status: proposed
capacity_validation: required
created: 2026-07-14
source_prd: prd.md
source_phase: mvp-phases.md
---

# Phase 3 Sprint Plan — Documents, Review, and Ready State

**Status: Proposed — Phase 2 exit evidence and capacity validation required**

## Sprint goal

Turn an Organization-owned Draft Asset Record into a trustworthy, issuance-eligible Ready record by attaching real evidence, reviewing one immutable record basis, enforcing guarded lifecycle transitions, and showing only Ready assets in a real Tokenization Queue.

## Outcome hypothesis

If Sora stores Supporting Documents behind the existing Organization authorization boundary, validates stored bytes rather than browser claims, freezes an explicit review basis, and derives queue eligibility only from guarded lifecycle state, then an authenticated owner can prepare and approve an asset without cross-Organization disclosure, approval drift, or a second queue source of truth.

## Resolved product and architecture decisions

- Phase 2 sign-off is a hard entry gate. Local code completion alone is insufficient; its authenticated preview, browser, performance, and live-regression evidence must pass before Phase 3 implementation begins.
- MVP review is an owner-operated completeness and confirmation gate. One owner user acts as preparer and approver; Phase 3 does not claim independent review, separation of duties, reviewer assignment, or RBAC.
- Phase 3 adds a non-executable Proposed Tokenization Profile containing proposed Stellar asset code, proposed supply, and an internal reference. The configured network is the application-wide Testnet and is displayed, not selected. Phase 4 owns issuer/distributor accounts, Trustline creation, transaction construction, signing, submission, reconciliation, and final issuance validation.
- Supporting Documents are mutable only while the Asset Record is Draft. They are readable but immutable in Review, Ready, and Archived. Review can return to Draft with a required reason. Ready has no correction or reopen path in the MVP; an incorrect Ready record must be archived and restarted through the supported preparation flow.
- The reachable Phase 3 transitions are `Draft → Review`, `Review → Draft`, `Review → Ready`, and `Draft | Review | Ready → Archived`. Archived is terminal. `Ready → Issuing` remains a Phase 4 operation.
- A single shared lifecycle service owns the persisted, UI, and domain transition vocabulary. The existing capitalized record states and lowercase pure helper cannot remain separate sources of transition truth.
- Review submission creates an immutable, bounded manifest containing the asset/version, Proposed Tokenization Profile version, active document/version references, document content hashes, checklist schema version, and a canonical fingerprint. It does not copy document bytes or an unrestricted snapshot of business data.
- Approval references the submitted manifest and records approver and server time. Review and Ready immutability make the approved basis reconstructable without duplicating sensitive records.
- The Phase 3 Tokenization Queue is an authenticated, Organization-scoped read model derived from Ready assets. It has no queue table and no enqueue mutation. Phase 4 will create the durable, unique Issuance Record when processing starts.
- Upload uses authenticated intent, direct Convex storage upload, and authenticated finalization. Finalization rechecks authorization, Draft state, version, count, stored byte size, file signature/type, and intent state before document metadata becomes visible.
- Browser filename, extension, and MIME are hints only. Server inspection must recognize PDF, DOC, DOCX, PNG, and JPEG, enforce 10 MB per file and 10 active files per Asset Record, compute a content hash, and fail closed.
- Retrieval passes through an authenticated application endpoint. Raw storage identifiers and reusable storage URLs are not exposed as product data. Downloads use safe content headers; Office files are not rendered inline in Phase 3.
- Document and lifecycle mutations use expected versions, stable error codes, server correlation IDs, and safe Activity Event metadata. File contents, signed URLs, storage credentials, session material, and unrestricted record snapshots never enter Activity Events.

## Repository baseline and blockers

- Phase 2 implemented the Browser → Next.js API → hashed session/boundary key → Convex `enforceAuth` trust path, Organization-scoped Asset Records, versioned Draft editing, Activity Events, and Organization-first indexes.
- Phase 2 local verification passed, but its evidence matrix still marks authenticated preview E2E, performance, browser-state, fault-injection, and live Testnet regression evidence as partial or not executed. Phase 3 is blocked until those rows pass and the Phase 2 gate is signed off.
- `supportingDocuments`, upload intents, review manifests, review decisions, and document APIs do not exist.
- The document registry and Tokenization Queue are production mock paths. Document upload, preview actions, queue actions, and blockchain configuration controls are inert or mock-backed.
- The existing lifecycle helper is not integrated with persisted Asset Record mutations, uses a different case vocabulary, and does not record review reasons or transition events.
- The current Asset detail surface is a useful base for asset/owner review, but it has no real documents, token proposal, readiness summary, or review actions.
- FR-10's Proposed Tokenization Profile and the Draft-only interpretation of FR-12 are phase-boundary decisions that must be recorded in the PRD decision log before implementation commitment.

## Planning assumptions

- Sprint duration, team capacity, and owners are unknown; no calendar commitment is implied.
- Relative sizes are S, M, and L. Capacity must be validated before commitment.
- Phase 2's accepted authorization boundary, canonical Asset Record, version semantics, Activity Event schema, and Organization-isolation fixtures are reused rather than replaced.
- Every story is a vertical slice: schema and indexes, server authorization, domain rules, API, UI states, safe events, and automated acceptance coverage travel together.
- Direct storage upload avoids application-host request-size and bandwidth limits. A protected server action may inspect stored bytes, but only authenticated internal queries/mutations may link storage to Organization data.
- Content-signature validation reduces accidental and simple spoofing risk; malware scanning, content moderation, OCR, and legal verification are outside MVP scope. Files are evidence supplied by the Organization, not independently verified by Sora.
- If all work does not fit one delivery sprint, execution may span multiple sprints, but the Phase 3 exit gate and dependency order remain intact.

## Scope

**In scope:** authenticated upload intent and finalization; Convex file storage; stored-byte validation; document metadata, list, download, replace, and delete; active/retired document versions; orphan cleanup; Proposed Tokenization Profile; one readiness validator; read-only review surface; immutable review manifest; Draft/Review/Ready/Archived transition controls; mandatory return reason; approval record; document and lifecycle Activity Events; Ready-derived Tokenization Queue; dashboard queue integration; explicit loading, empty, progress, validation, failure, retry, conflict, and destructive-confirmation states; Organization-isolation, concurrency, storage-failure, lifecycle, accessibility, mock-removal, and E2E evidence.

**Out of scope:** independent reviewers, invitations, roles, RBAC, four-eyes approval, comments, notifications, rich document previews, thumbnails, tags, categories, OCR, malware scanning, legal/compliance verification, bulk upload/delete, document sharing links, Ready reopening, unarchive, Mainnet, Issuance Records, issuer/distributor configuration, Trustlines, signing, submission, retry, reconciliation, queue processing controls, and blockchain status simulation.

## Ordered stories

| ID    | Story / outcome                                                                                          | Size | Dependency   | PRD references                                              |
| ----- | -------------------------------------------------------------------------------------------------------- | ---: | ------------ | ----------------------------------------------------------- |
| P3-01 | Close the Phase 2 entry gate and fix the Phase 3 document, review, lifecycle, and error contracts        |    S | Phase 2 exit | FR-9–13, FR-24, FR-27; NFR-1, NFR-6, NFR-10, NFR-14–18      |
| P3-02 | Upload, reload, list, and retrieve authorized Supporting Documents from real storage                     |    L | P3-01        | FR-11, FR-12, FR-24, FR-27; NFR-1, NFR-6, NFR-10, NFR-14–18 |
| P3-03 | Replace and delete Draft documents without losing the last durable version or leaking storage            |    L | P3-02        | FR-11, FR-12, FR-24, FR-27; NFR-1, NFR-6, NFR-10, NFR-14–18 |
| P3-04 | Capture a non-executable token proposal and show one complete readiness/review surface                   |    L | P3-01–03     | FR-9, FR-10, FR-27; NFR-10, NFR-14–18                       |
| P3-05 | Submit Draft for Review and return Review to Draft with a visible reason                                 |    L | P3-04        | FR-9, FR-10, FR-24, FR-27; NFR-10, NFR-14–18                |
| P3-06 | Approve the exact reviewed manifest as Ready exactly once                                                |    M | P3-05        | FR-9, FR-10, FR-13, FR-24, FR-27; NFR-10, NFR-14–18         |
| P3-07 | Replace the mock queue with a Ready-derived view and implement terminal archive behavior                 |    M | P3-06        | FR-9, FR-13, FR-24, FR-27; NFR-1, NFR-10, NFR-14–18         |
| P3-08 | Remove affected mocks and prove the Phase 3 security, durability, lifecycle, and accessibility exit gate |    L | P3-02–07     | FR-9–13, FR-24, FR-27; NFR-1, NFR-6, NFR-10, NFR-14–18      |

## Sprint acceptance criteria

The `P3-AC` identifiers below are sprint acceptance IDs, not PRD functional requirement IDs.

### P3-01 — Entry gate and contract preflight

1. **P3-AC1.1:** Every Phase 2 exit-gate row is Pass against the required authenticated preview, including browser E2E, performance, Organization isolation, and the required live regression; the sign-off revision is recorded before Phase 3 implementation begins.
2. **P3-AC1.2:** One lifecycle module defines the persisted and UI state vocabulary, allowed transitions, terminal behavior, expected-state/version rules, transition error codes, and the Phase 4 boundary. Duplicate and unlisted transitions fail server-side.
3. **P3-AC1.3:** The Supporting Document contract fixes filename normalization, allowed extensions, detected content signatures, maximum stored byte size, maximum active count, content hash algorithm, active/retired version semantics, storage cleanup, and stable error codes.
4. **P3-AC1.4:** The Proposed Tokenization Profile contract fixes proposed Stellar code, precision-safe proposed supply, internal reference, fixed Testnet display, normalization, maximum lengths, completeness rules, versioning, and the explicit non-executable boundary.
5. **P3-AC1.5:** The review contract fixes readiness inputs, manifest canonicalization and fingerprinting, return-reason rules, Ready immutability, archive rules, activity types, and queue ordering/pagination.
6. **P3-AC1.6:** The API design defines intent, finalize, list, retrieve, replace, delete, review-submit, review-return, approve, archive, and Ready-queue operations with nondisclosing 404 behavior and user-safe 401, 409, 413, 415, 422, and 503 mappings as applicable.
7. **P3-AC1.7:** The PRD decision log records the non-executable token proposal, Draft-only document mutation interpretation, Ready immutability, bounded review manifest, direct-storage flow, and derived Ready queue.
8. **P3-AC1.8:** Accountable owners and evidence fixtures are assigned before commitment, including real representative PDF, DOC, DOCX, PNG, JPEG, spoofed, malformed, boundary-size, and cross-Organization samples.

### P3-02 — Authorized upload, reload, list, and retrieval

1. **P3-AC2.1:** The datastore defines Organization-scoped upload intents and Supporting Document metadata with Asset Record reference, storage ID, sanitized original filename, detected media type, byte size, SHA-256 content hash, document/version identifiers, state, actor, server timestamps, and Organization-first indexes.
2. **P3-AC2.2:** An authenticated intent derives Organization and actor from the verified session, verifies the Organization-owned Asset Record is Draft at the expected version, records short expiry and single-use identity, and never accepts caller Organization or actor IDs as authority.
3. **P3-AC2.3:** The browser uploads only to the short-lived URL returned through the authenticated intent flow. An intent cannot authorize a different Organization, asset, user session, storage object, or second finalization.
4. **P3-AC2.4:** Finalization reads the stored object server-side, enforces actual size and recognized signature/type, validates the sanitized filename/extension relationship, computes the content hash, and rechecks intent, ownership, Draft state, expected asset version, and active count.
5. **P3-AC2.5:** Document metadata becomes visible only after storage succeeds and final validation commits. Invalid or stale finalization creates no active metadata, emits no success event, returns whether the file was linked, and deletes or schedules cleanup of the orphaned blob.
6. **P3-AC2.6:** Concurrent finalization when nine active documents exist allows at most one additional active document. The loser receives a recoverable limit/conflict result and its unlinked storage object is cleaned up.
7. **P3-AC2.7:** Upload and exactly one immutable `document.uploaded` Activity Event commit together with safe metadata limited to document ID, filename, detected type, byte size, and version; storage ID, URL, hash, and file content are excluded from the event.
8. **P3-AC2.8:** Asset detail and the Organization document registry list only authorized persisted metadata and survive refresh and a new valid session. A missing or foreign asset/document ID is indistinguishable and discloses no filename, type, size, timing, or storage signal.
9. **P3-AC2.9:** Retrieval reauthorizes the current session and Organization at request time, streams the stored object with safe `Content-Type`, `Content-Disposition`, `X-Content-Type-Options`, and cache policy, and exposes neither a raw storage identifier nor reusable storage URL.
10. **P3-AC2.10:** UI states distinguish empty, requesting intent, uploading progress, validating/finalizing, saved, failed-before-save, failed-after-storage, retryable conflict, and completed retrieval; controls are labeled, keyboard operable, focus-visible, and explain whether metadata was saved.
11. **P3-AC2.11:** Automated tests cover allowed real fixtures, spoofed extension/MIME, malformed bytes, zero-byte input, exactly and over 10 MB, unsupported types, eleven-file attempts, expired/replayed intents, cross-asset storage substitution, abandoned upload cleanup, missing/foreign nondisclosure, and reloadable authorized retrieval.

### P3-03 — Conflict-safe replace and delete

1. **P3-AC3.1:** Replace is available only for an Organization-owned Draft asset and requires expected asset, document, and document-version values. Review, Ready, and Archived attempts fail without changing metadata or storage.
2. **P3-AC3.2:** Replacement uses the same intent, stored-byte validation, size/type, and finalization rules as upload. The existing active document remains readable until the new object is valid and the version swap commits.
3. **P3-AC3.3:** A successful replacement atomically retires the prior metadata version, creates the next active version, preserves bounded audit references, updates the asset version/time as defined by the contract, and emits exactly one safe `document.replaced` event.
4. **P3-AC3.4:** A failed or stale replacement never deletes or hides the current active document. The rejected new object is deleted or scheduled for cleanup and the UI offers a safe retry from current versions.
5. **P3-AC3.5:** Delete requires explicit confirmation and expected versions, retires the active metadata, removes the object through the documented storage-cleanup path, restores count capacity, and emits exactly one safe `document.deleted` event without storing content or URLs.
6. **P3-AC3.6:** Retry of a completed replace/delete request returns the original logical outcome without another version, event, or storage deletion. Concurrent replace/delete/finalize operations produce one deterministic winner and recoverable conflicts.
7. **P3-AC3.7:** The orphan/retired-object sweeper processes only expired unlinked intents and cleanup-pending objects, is idempotent, cannot delete active referenced content, records safe operational evidence, and supports a deterministic test clock.
8. **P3-AC3.8:** Automated tests cover replace/delete authorization, missing/foreign nondisclosure, stale versions, state changes during upload, old-object deletion failure, retry, concurrency, count recovery, event atomicity, and sweeper safety.

### P3-04 — Proposed token profile and review readiness

1. **P3-AC4.1:** A Draft Asset Record can persist one versioned Proposed Tokenization Profile using the shared server/client contract; the profile contains no seed, signer, issuer/distributor secret, transaction, Trustline, submission, or mutable network selector.
2. **P3-AC4.2:** Profile edits are Draft-only, require expected versions, produce a recoverable conflict instead of overwriting newer data, and record one bounded `asset.token_proposal_updated` event for a material change.
3. **P3-AC4.3:** One server-owned readiness evaluator checks the canonical required Asset Record fields, one or more active validated Supporting Documents, complete Proposed Tokenization Profile, supported Testnet context, and absence of blocking state; the UI consumes but cannot override its result.
4. **P3-AC4.4:** The review surface displays basic asset information, ownership information, active document metadata and retrieval actions, Proposed Tokenization Profile, Testnet label, validation checklist, and last-updated/version context from persisted authorized data.
5. **P3-AC4.5:** Every blocker identifies the affected section and safe correction action without exposing internal schema, storage, or foreign-record information. The first invalid control or section is keyboard reachable and visibly focused.
6. **P3-AC4.6:** Review and Ready render the profile and documents read-only. Issuance, configure, sign, retry, and simulated blockchain controls are absent or explicitly unavailable until Phase 4.
7. **P3-AC4.7:** Automated tests exercise each independent readiness blocker, combined blockers, complete readiness, stale profile edits, Organization isolation, accessible summary/error navigation, and absence of Phase 4 execution paths.

### P3-05 — Submit for Review and return to Draft

1. **P3-AC5.1:** Submit for Review derives actor and Organization from the session, requires Draft at the expected asset/profile versions, reruns readiness inside the mutation path, and refuses client-supplied readiness or lifecycle state.
2. **P3-AC5.2:** A successful submission creates one immutable bounded review manifest and fingerprint, changes `Draft → Review`, increments the asset version, sets server review time, and records one `asset.review_submitted` event as one atomic logical result.
3. **P3-AC5.3:** Manifest canonicalization is deterministic and includes exactly the approved contract fields and version/hash references. Identical inputs produce the same fingerprint; ordering, locale, and client serialization cannot change it.
4. **P3-AC5.4:** Once Review begins, asset fields, Proposed Tokenization Profile, and documents are immutable through UI and direct server calls. Retrieval and authorized review remain available.
5. **P3-AC5.5:** Return to Draft requires a nonblank, normalized, bounded reason and the expected Review version. It changes `Review → Draft`, restores editing, records one immutable `asset.review_returned` event with the safe reason, and retains the submitted manifest as historical evidence.
6. **P3-AC5.6:** The visible return reason appears on the Asset Record review/status surface and authorized Activity history after refresh, but cannot contain secrets, markup execution, or unbounded content.
7. **P3-AC5.7:** Repeated or concurrent submit/return calls produce one transition/event per accepted state change. Stale, duplicate, invalid-state, missing-document, or cleanup-pending cases fail without a partial manifest, state change, or success event.
8. **P3-AC5.8:** Automated tests cover every permitted and rejected Phase 3 transition, readiness recheck, fingerprint determinism, immutability, reason validation/sanitization, concurrency, transaction rollback, Organization isolation, and reload behavior.

### P3-06 — Approve the reviewed manifest as Ready

1. **P3-AC6.1:** Approval requires an Organization-owned Asset Record in Review at the expected version and references the current immutable review manifest; the server verifies its asset, profile, and document versions/fingerprint still match.
2. **P3-AC6.2:** A successful approval changes `Review → Ready`, records `readyAt`, creates one immutable approval record referencing the manifest, increments the asset version, and emits one `asset.ready` Activity Event as one atomic logical result.
3. **P3-AC6.3:** Approval records the owner actor and server timestamp without implying independent reviewer identity, legal verification, regulatory approval, or blockchain issuance.
4. **P3-AC6.4:** Double-click, retry, refresh, and concurrent approval produce one Ready transition, one approval record, and one success event. A Ready response may return the existing accepted result but cannot create another logical approval.
5. **P3-AC6.5:** A stale, returned-to-Draft, missing-manifest, fingerprint-mismatch, or foreign approval fails without changing state or creating approval/activity evidence.
6. **P3-AC6.6:** Ready is read-only, clearly labeled issuance-eligible but not issued, and exposes no configure/issue action until the Phase 4 contract exists.
7. **P3-AC6.7:** Automated tests cover accepted approval, every invalid basis, duplicate/concurrent approval, rollback on approval/event failure, Organization isolation, exact manifest reference, reload durability, and non-color-only Ready status.

### P3-07 — Derived Tokenization Queue and archive

1. **P3-AC7.1:** The Tokenization Queue query derives Organization from the authenticated session and reads Asset Records from an Organization-first lifecycle/ready-time index. It accepts no caller tenant and has no enqueue mutation.
2. **P3-AC7.2:** The queue returns only `Ready` records with approval time/fingerprint reference and the minimum asset/proposal fields needed to prepare Phase 4. It is paginated and ordered by `readyAt ASC`, then stable asset ID.
3. **P3-AC7.3:** Draft, Review, Issuing, Active, Failed, and Archived records never appear. A foreign Organization cannot retrieve, count, time, or infer another Organization's Ready assets.
4. **P3-AC7.4:** Successful approval makes the asset appear after the persisted state refresh without a separate queue write. No mock item, fake Issued/Failed item, local status mutation, or client-side eligibility filter drives the queue.
5. **P3-AC7.5:** Archive requires an allowed current state, expected version, explicit bounded reason, and Organization authorization; it changes the asset to terminal Archived and emits one safe `asset.archived` event atomically.
6. **P3-AC7.6:** Archiving a Ready asset removes it from the queue solely through lifecycle query semantics. Duplicate or concurrent archive is idempotent or a safe conflict and cannot leave a ghost queue record because no Phase 3 queue record exists.
7. **P3-AC7.7:** Queue and dashboard queue panel provide loading, empty, failure, retry, pagination, and success states; Phase 4 configure/issue/retry controls and simulated network activity are removed or unavailable.
8. **P3-AC7.8:** Automated tests cover stable ordering/pagination, Ready inclusion, every non-Ready exclusion, immediate approval/archive changes, Organization-isolation collisions, guessed IDs, duplicate transition behavior, archive terminality, activity, and production mock exclusion.

### P3-08 — Exit-gate evidence and regression proof

1. **P3-AC8.1:** One authenticated automated browser flow passes: open Draft → upload allowed evidence → reload/list/retrieve → replace → delete/restore required evidence → complete token proposal → inspect blockers → submit Review → return with reason → fix/resubmit → approve Ready → observe real queue → archive → observe queue removal.
2. **P3-AC8.2:** A reusable two-Organization matrix covers upload intent/finalize, metadata list, retrieval, replace, delete, token proposal, readiness, submit, return, approve, archive, queue, review/approval evidence, and Activity Events, including known foreign IDs and storage-ID substitution.
3. **P3-AC8.3:** Boundary tests cover all allowed and rejected lifecycle edges, duplicate transitions, stale versions, concurrent upload at count limit, state changes during finalization, duplicate approval, and deterministic manifest fingerprints.
4. **P3-AC8.4:** Fault-injection evidence covers storage upload failure, invalid stored bytes, metadata-finalization failure, orphan cleanup, replacement before swap, old-object cleanup failure, event write failure, manifest/approval write failure, and safe user retry without silent success or loss of the last valid document.
5. **P3-AC8.5:** Static production-import checks prove affected document, review, Tokenization Queue, dashboard queue, activity, and Asset detail paths cannot import runtime mocks or expose Phase 4 simulation controls.
6. **P3-AC8.6:** Accessibility evidence covers keyboard upload and management, progress announcements, error focus, destructive confirmation, review checklist, return-reason validation, approval, queue navigation, visible focus, labels, and non-color-only states.
7. **P3-AC8.7:** Secret/privacy scans and event assertions find no session token, boundary key, upload URL, storage credential, raw storage ID, document content, content hash, or unrestricted record snapshot in client logs, server logs, analytics, API errors, or Activity Event metadata.
8. **P3-AC8.8:** `pnpm verify` and the Phase 3 browser/evidence gate pass with no regression to Phase 0 Testnet safety, Phase 1 authentication/isolation, or Phase 2 persistence/search/dashboard behavior.
9. **P3-AC8.9:** A Phase 3 evidence matrix maps every phase exit condition and referenced NFR to an automated test, CI result, code anchor, or captured verification artifact; missing environment evidence is reported as Not Executed, never silently passed.

## Execution order and capacity cut

Critical path: **Phase 2 sign-off → P3-01 → P3-02 → P3-03 → P3-04 → P3-05 → P3-06 → P3-07 → P3-08**.

Execution may span three delivery slices:

1. **Documents:** P3-01 through P3-03 establish secure, reloadable evidence management.
2. **Review and Ready:** P3-04 through P3-06 establish the proposal, immutable review basis, return, and approval.
3. **Queue and proof:** P3-07 through P3-08 replace mocks and close the complete phase gate.

The Proposed Tokenization Profile model and review UI shell may begin after P3-01 while document storage work proceeds. Final readiness integration waits for P3-03. Queue UI adaptation may begin against typed fixtures after P3-01, but it cannot be wired or accepted until P3-06 provides real Ready records.

P3-01 through P3-03 are the first demonstrable vertical increment if work must span multiple sprints. They do not complete Phase 3. No authorization, nondisclosure, stored-byte validation, count/size limit, durable cleanup, lifecycle guard, readiness, immutability, approval integrity, Ready-only queue, activity safety, or automated exit criterion is de-scopable. Rich preview and cosmetic polish beyond FR-27/NFR-17 are the first cuts.

## Phase exit gate / epic definition of done

Phase 3 exits only with:

- A signed-off Phase 2 exit gate and current accepted Organization authorization boundary.
- An authenticated owner uploading an allowed Supporting Document, reloading, listing it, and retrieving the same stored bytes through an authorized path.
- Server enforcement of stored-byte type, 10 MB size, 10 active-file count, Draft state, intent, version, and Organization ownership.
- Foreign and nonexistent assets, documents, manifests, approvals, and queue records producing indistinguishable, nondisclosing results.
- Safe replace/delete behavior that never loses the last valid version on failure and cleans abandoned or unlinked storage.
- A complete, non-executable Proposed Tokenization Profile and one server readiness validator blocking incomplete Review submissions.
- A read-only review surface covering asset, ownership, documents, proposal, and validation basis.
- Guarded and recorded Draft → Review, Review → Draft with visible reason, Review → Ready, and archive transitions, including duplicate/concurrency protection.
- One immutable manifest proving the exact versions approved and one durable approval outcome, with Ready clearly meaning eligible rather than issued.
- A real, Organization-scoped Tokenization Queue derived only from Ready records, with no persisted queue duplicate, production mocks, or Phase 4 simulation controls.
- Safe document/lifecycle Activity Events, complete accessibility states, passing deterministic/browser/fault-injection gates, a complete evidence matrix, and green `pnpm verify`.

## Demo checkpoint

1. Authenticate as Organization A and open a persisted Draft Asset Record.
2. Attempt a spoofed or oversized file and show the safe server rejection.
3. Upload valid evidence, reload, retrieve it, then replace it and show the document Activity Events.
4. Attempt Review with a missing proposal field and show the actionable readiness blocker.
5. Complete the Proposed Tokenization Profile, submit for Review, and show the read-only reviewed basis.
6. Return the record to Draft with a visible reason, correct it, and resubmit.
7. Approve the exact manifest as Ready and show that the record is eligible but not issued.
8. Open the real Tokenization Queue and show the Ready asset with no fake issuance controls.
9. Authenticate as Organization B and prove direct document, review, approval, and queue isolation.
10. Archive the Ready asset and show its immediate removal from the queue and terminal state.

## Risks and mitigations

- **Phase 3 starts on incomplete Phase 2 evidence:** block P3-01 acceptance until authenticated preview, performance, browser, and live-regression rows pass.
- **A direct storage upload bypasses product authorization:** issue short-lived single-use intents only through the authenticated boundary; finalization reauthorizes and links the object only after stored-byte validation.
- **Browser MIME or extension spoofing creates unsafe metadata:** treat browser values as hints; inspect stored signatures and size server-side and fail closed.
- **Storage succeeds but metadata fails:** keep the object invisible, return an honest failed-after-storage state, delete it immediately when possible, and sweep expired unlinked objects idempotently.
- **Concurrent uploads exceed the ten-file limit:** recheck active count transactionally at finalization; exactly one contender may claim the final slot.
- **Replacement destroys the only valid evidence:** validate and store the new object before atomically swapping metadata; retain the old active version until the swap commits.
- **Raw storage URLs bypass current-session authorization:** stream through an authenticated retrieval endpoint and do not persist or expose reusable download URLs.
- **Review approval drifts from displayed data:** make Review read-only and fingerprint bounded asset, proposal, and document version references server-side.
- **Activity history leaks file or storage data:** use allowlisted bounded metadata and automated serialization/secret assertions.
- **A queue table becomes a second lifecycle:** derive the Phase 3 queue from the Organization/lifecycle/ready-time index; create Issuance Records only in Phase 4.
- **Phase 4 scope leaks into review:** store only a proposed code, supply, internal reference, and fixed Testnet context; expose no accounts, Trustline, transaction, signing, submission, retry, or fake chain result.
- **Ready evidence needs correction:** keep Ready immutable for MVP; require archive and restart, document the limitation, and revisit only with an explicit amendment/reapproval workflow.
- **Legacy DOC detection is unreliable:** define accepted signatures and real fixtures during P3-01, fail ambiguous files safely, and give the user a useful conversion/retry message.
- **Mock screens conceal source-of-truth drift:** replace per vertical slice and enforce a final static production-import/control guard.

## Open ownership decisions

Before commitment, assign accountable owners for Phase 2 gate sign-off, document/security contract, stored-byte fixture corpus, Convex storage and cleanup, authenticated API boundary, document UX, Proposed Tokenization Profile, lifecycle service migration, manifest canonicalization, review/return/approval UX, derived queue/dashboard wiring, Activity Event safety, two-Organization and concurrency fixtures, browser/fault-injection/accessibility evidence, mock-removal guard, PRD decision-log update, and final Phase 3 gate sign-off.
