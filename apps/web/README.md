# Sora web application

The Next.js 16 application owns the browser-facing authentication and Asset Workspace boundary. It verifies SEP-10 responses, manages opaque `HttpOnly` session cookies, resolves the session before protected layouts render, and calls Convex with a server-only boundary credential plus the session-token hash.

## Run locally

From the repository root, copy `.env.example` to `apps/web/.env.local`, set the private values described in `apps/web/.env.example`, and run:

```powershell
pnpm.cmd --filter web dev
```

The application runs on `http://localhost:3000`. Run Convex separately with `pnpm.cmd --filter @repo/backend dev` when persistence is required.

## Asset Workspace

Production asset, dashboard, search, and activity screens use the authenticated routes under `app/api/assets`, `app/api/workspace`, and `app/api/activity`. Browser clients use `features/assets/lib/workspace-api.ts` with `cache: "no-store"`; canonical validation comes from `@repo/backend/domain/asset-record`.

Phase 2 preview verification is intentionally environment-driven:

```powershell
pnpm.cmd phase2:browser:install
pnpm.cmd verify:phase2
```

This requires a disposable production preview and two private Organization session cookies. Read [the Phase 2 runbook](../../docs/phase-2/verification-runbook.md) before running it.

## References

- [Authenticated boundary ADR](../../docs/adr/0004-authenticated-next-convex-boundary.md)
- [Asset Workspace contract](../../docs/phase-2/asset-workspace-contract.md)
- [Phase 2 evidence matrix](../../docs/phase-2/evidence-matrix.md)
