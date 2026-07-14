# Phase 2 verification runbook

## Local deterministic gate

Use Node.js 22 and pnpm 10.25.0 from the repository root:

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd verify
```

`pnpm verify` runs type checking, lint, format checking, Vitest, the production mock-import guard, the production build, and the secret scan. The 2026-07-14 working-tree run passed with 72 backend tests and 15 web tests.

The static guard can also run independently:

```powershell
pnpm.cmd check:phase2-mocks
```

## Authenticated preview gate

Run this only against a disposable preview serving a production Next.js build and a disposable Convex deployment. It persists a large fixture.

Required process environment:

- `PHASE2_BASE_URL`: preview origin.
- `PHASE2_ORG_A_SESSION_COOKIE`: raw `sora_session` value for Organization A.
- `PHASE2_ORG_B_SESSION_COOKIE`: raw `sora_session` value for Organization B.
- `PHASE2_SEED_CONCURRENCY`: optional integer 1–100; default 20.

Never place cookie values in a command line, checked-in file, screenshot, log, or evidence artifact. Set them in the private execution environment. The harness reads them without printing them.

Install Chromium once, then execute the complete gate:

```powershell
pnpm.cmd phase2:browser:install
pnpm.cmd verify:phase2
```

The scripts under `apps/web/scripts/phase2/` seed exactly 5,000 assets and 25,000 asset events per Organization. Search runs 20 warmups and 100 measured requests and requires p95 at or below 500 ms. Dashboard runs 10 warmups and 50 measured navigations until workspace content is usable and requires p95 at or below 2 seconds. Playwright covers the authenticated create/reload/list/search/detail/edit/reload/dashboard path, stale-conflict recovery, and Organization A/B nondisclosure.

Missing URL, cookies, fixture, browser, or valid sessions must be reported as `NOT EXECUTED`, never passed or skipped silently. Preserve the sanitized terminal output as the performance/E2E evidence artifact and record its environment and preview revision.

## Current result

The local deterministic gate passed on 2026-07-14. The authenticated preview gate was **not executed** because `PHASE2_BASE_URL`, both Organization session cookies, and Chromium were unavailable. The live Phase 0 Testnet regression was also not rerun. Therefore the performance budgets, full browser workflow, deployed-like transaction behavior, and live Testnet regression remain open release gates.
