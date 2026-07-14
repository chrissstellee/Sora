# Sora Convex backend

This directory contains Sora's Organization-scoped authentication, Asset Record, Activity Event, and retained task functions.

## Authorization rule

Public functions intended for Next.js validate `CONVEX_SERVER_BOUNDARY_KEY`. Private data functions then call `enforceAuth` with the SHA-256 session-token hash. That helper returns the trusted user, wallet, and Organization context and rejects expired, revoked, deleted, disabled, or inconsistent identity state. Never authorize from caller-supplied Organization, user, or wallet identifiers.

New tenant-owned indexes must begin with `organizationId`. Foreign and nonexistent record identifiers must produce the same non-disclosing result.

## Asset operations

- `assets.create`: canonical validation, per-Organization registration uniqueness, idempotent request UUIDs, and atomic `asset.created` events.
- `assets.get`: Organization-scoped detail lookup.
- `assets.update`: Draft-only optimistic concurrency, normalized no-op handling, and atomic allowlisted `asset.updated` events.
- `assets.list`: stable cursor list and indexed name/registration prefix search.
- `assets.workspaceSummary`: lifecycle counts and recent assets derived from persisted records.
- `activity.list`: Organization- or asset-scoped recent activity.

The shared business schema is `packages/backend/src/domain/asset-record.ts`. Convex validators validate transport shape; they do not replace the domain contract.

## Verify

From the repository root:

```powershell
pnpm.cmd --filter @repo/backend typecheck
pnpm.cmd --filter @repo/backend test
pnpm.cmd verify
```

See [ADR 0004](../../../docs/adr/0004-authenticated-next-convex-boundary.md), the [Asset Workspace contract](../../../docs/phase-2/asset-workspace-contract.md), and the [evidence matrix](../../../docs/phase-2/evidence-matrix.md).
