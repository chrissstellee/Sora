# Phase 2 verification runbook

## Local deterministic gate

Use Node.js 22 and pnpm 10.25.0 from the repository root:

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd verify
```

`pnpm verify` runs type checking, lint, format checking, Vitest, the bounded-query guard, the production mock-import guard, the production build, and the secret scan. The 2026-07-14 working-tree run passed with 78 backend tests, 17 web tests, and 492 files scanned for secrets.

The static guards can also run independently:

```powershell
pnpm.cmd check:phase2-bounds
pnpm.cmd check:phase2-mocks
```

The bounded-query guard rejects broad `collect()` reads in the Asset Workspace query paths and requires native opaque pagination for asset lists, aggregate-backed lifecycle counts, and bounded Activity reads. Local tests additionally cover deterministic create/update rollback faults, two-Organization count/recency/activity isolation, cursor failure mapping, equal-timestamp ordering, and idempotent multi-page aggregate backfill.

## Authenticated preview gate

Run this only against a disposable preview serving a production Next.js build and a disposable Convex deployment. It persists a large fixture.

Required process environment:

- `PHASE2_BASE_URL`: preview origin.
- `PHASE2_ORG_A_SESSION_COOKIE`: raw `sora_session` value for Organization A.
- `PHASE2_ORG_B_SESSION_COOKIE`: raw `sora_session` value for Organization B.
- `PHASE2_SEED_CONCURRENCY`: optional integer 1–100; default 20.

Never place cookie values in a command line, checked-in file, screenshot, log, or evidence artifact. Set them in the private execution environment. The harness reads them without printing them.

The backend backfill step also requires `CONVEX_URL` and `CONVEX_SERVER_BOUNDARY_KEY` in `packages/backend/.env.local`. It pages through existing Asset Records in batches of 50 and idempotently builds the Organization/lifecycle aggregate used by dashboard counts. Run it against the same disposable Convex deployment as the preview. New asset mutations maintain the aggregate transactionally with the Asset Record and Activity Event.

Install Chromium once, then execute the complete gate:

```powershell
pnpm.cmd phase2:browser:install
pnpm.cmd verify:phase2
```

`verify:phase2` first runs the deterministic gate, then the aggregate backfill, fixture seed, performance checks, and authenticated Playwright flow. The scripts under `apps/web/scripts/phase2/` seed exactly 5,000 assets and 25,000 asset events per Organization. Search runs 20 warmups and 100 measured requests and requires p95 at or below 500 ms. Dashboard runs 10 warmups and 50 measured navigations until workspace content is usable and requires p95 at or below 2 seconds. Playwright covers the authenticated create/reload/list/search/detail/edit/reload/dashboard path, stale-conflict recovery, and Organization A/B nondisclosure.

Missing URL, cookies, fixture, browser, or valid sessions must be reported as `NOT EXECUTED`, never passed or skipped silently. Preserve the sanitized terminal output as the performance/E2E evidence artifact and record its environment and preview revision.

## Live Phase 0 regression

The live Testnet spike remains separate from deterministic verification:

```powershell
pnpm.cmd --filter @repo/backend spike:testnet
```

The command uses disposable Testnet accounts and overwrites `docs/phase-0/evidence/testnet-issuance.json` with a sanitized receipt. Review the diff and confirm it contains no secret material before retaining it as release evidence. The regression was rerun successfully on 2026-07-14.

## Current result

The local deterministic gate and live Phase 0 Testnet regression passed on 2026-07-14. Chromium is installed. The authenticated preview gate was **not executed** because `PHASE2_BASE_URL` and both Organization session cookies were unavailable. Therefore the preview performance budgets and full authenticated browser workflow remain open release gates; they must not be reported as passed until sanitized preview evidence is captured.
