# Phase 2 Asset Workspace contract

Status: Implemented in the working tree; authenticated preview evidence pending

## Trust and ownership

All browser operations use Next.js API routes. Next.js derives the SHA-256 session-token hash from the `HttpOnly` cookie and creates the correlation ID. Convex validates the server boundary key, resolves the actor and Organization with `enforceAuth`, and scopes every asset/event query by that Organization. Mutation inputs do not accept Organization, actor, lifecycle, timestamps, destination version, or correlation ID from the browser.

See [ADR 0004](../adr/0004-authenticated-next-convex-boundary.md) for the complete trust decision.

## Canonical record

`packages/backend/src/domain/asset-record.ts` is the shared Zod business contract used by the web form and Convex mutations.

| Field                | Rule                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `name`               | Required, NFKC/whitespace normalized, 3–120 characters                                              |
| `category`           | `Real Estate`, `Aviation`, `Energy`, or `Maritime`                                                  |
| `description`        | Required, 20–4,000 characters                                                                       |
| `estimatedValue`     | Decimal string, 1–18 integer digits, canonicalized to two fractional digits, minimum `0.01`         |
| `currency`           | `USD`, `EUR`, `GBP`, or `SGD`                                                                       |
| `countryCode`        | ISO-3166 alpha-2, uppercased                                                                        |
| `legalOwner`         | Required, 2–200 characters                                                                          |
| `registrationNumber` | Required, 3–64 characters; stored display value is uppercased; match key removes spaces and hyphens |
| `ownershipType`      | `Individual`, `Company`, `Trust`, or `Government`                                                   |
| `contactEmail`       | Required email, at most 254 characters, lowercased                                                  |
| `address`            | Optional, at most 500 characters                                                                    |
| `contactPhone`       | Optional, at most 32 characters and limited to phone punctuation/digits                             |
| `internalNotes`      | Optional, at most 2,000 characters                                                                  |

Server-owned fields are UUID `assetId`, `organizationId`, `createdBy`, normalized search keys, `lifecycle`, `createdAt`, `updatedAt`, `version`, and `createRequestId`. Creation always sets lifecycle `Draft`. The persisted lifecycle vocabulary is `Draft`, `Review`, `Ready`, `Issuing`, `Active`, `Failed`, and `Archived`; Phase 2 exposes no transition control and only Draft records are editable.

## Persistence and indexes

The `assets` table uses Organization-first indexes for asset ID, create request ID, normalized registration, normalized name plus asset ID, lifecycle, and update time plus asset ID. `activityEvents` uses Organization/timestamp/event ID and Organization/asset/timestamp/event ID indexes. Retained task status queries use `organizationId` before `completed`.

Registration uniqueness is per Organization. Identical normalized values in different Organizations are valid.

## Mutation semantics

Create requires a client UUID retained across retries. Identical canonical input with the same request ID returns the original asset with `replayed: true`; different input returns `CREATE_REQUEST_CONFLICT`. A normalized registration collision returns `REGISTRATION_NUMBER_CONFLICT`.

Update requires `expectedVersion`. A material update increments the version, changes `updatedAt`, and emits one `asset.updated` event. A canonical no-op returns `outcome: "unchanged"` without changing the record or emitting an event. A stale version returns `ASSET_VERSION_CONFLICT`; a non-Draft record returns `ASSET_NOT_EDITABLE`. Foreign and nonexistent IDs both return `ASSET_NOT_FOUND`.

```mermaid
sequenceDiagram
    participant N as Next.js API
    participant M as Convex mutation
    participant A as Asset table
    participant E as Activity table
    N->>M: canonical input + expectedVersion + session hash + correlation ID
    M->>M: enforce boundary/session; normalize; compare version
    alt canonical no-op
        M-->>N: unchanged asset; no event
    else stale or invalid
        M-->>N: conflict/error; transaction writes nothing
    else material change
        M->>A: patch version and updatedAt
        M->>E: insert allowlisted changed-field event at same timestamp
        M-->>N: updated asset
    end
```

Create and its `asset.created` event, and material update and its `asset.updated` event, execute within one Convex mutation transaction. Event metadata is generated by internal allowlisted helpers, contains only create status or changed field names, and is bounded to 2 KB.

## Read semantics

- Default list order: `updatedAt DESC`, then `assetId ASC`; cursor-paginated, default 25 and maximum 100.
- Search: server-normalized case-insensitive name prefix plus registration exact/prefix, deduplicated, at most 50, ordered by normalized name then `assetId`. Empty input restores the default list.
- Dashboard: indexed counts for every lifecycle and total including Archived; recent assets follow the default stable order.
- Activity: Organization- or asset-scoped, ordered by timestamp with stable event ID tie-breaking.

## HTTP surface

| Method and path                   | Success shape                               |
| --------------------------------- | ------------------------------------------- | -------------- |
| `POST /api/assets`                | `{ asset, replayed }`                       |
| `GET /api/assets?cursor&limit&q`  | `{ items, nextCursor, mode }`               |
| `GET /api/assets/[assetId]`       | `{ asset }`                                 |
| `PATCH /api/assets/[assetId]`     | `{ asset, outcome: "updated"                | "unchanged" }` |
| `GET /api/workspace/summary`      | lifecycle counts and recent assets          |
| `GET /api/activity?assetId&limit` | recent Organization- or asset-scoped events |

Errors use `{ error: { code, message, correlationId, fieldErrors? } }` with HTTP 401, 404, 409, 422, or 503 according to `apps/web/core/lib/api-errors.ts`.

## Web source of truth

`workspace-api.ts` performs authenticated `no-store` requests. `useRequest` and `useAssets` provide cancellation and explicit retry behavior. Create redirects only after confirmed persistence. Edit preserves the submitted draft on conflict, loads the latest record, lists changed fields, and requires explicit review before retry. Asset list/detail/search/statistics, dashboard counts/recent records, and activity use persisted APIs. Phase 3 document and tokenization actions are removed from the working path or displayed as unavailable.
