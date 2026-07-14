# Phase 2 preview verification

Run this harness only against a disposable, production-built preview. It creates persistent fixture records through the public HTTP API.

Required environment variables:

- `PHASE2_BASE_URL`: preview origin, such as `https://preview.example.test`.
- `PHASE2_ORG_A_SESSION_COOKIE` and `PHASE2_ORG_B_SESSION_COOKIE`: raw values of authenticated `sora_session` cookies for two different Organizations. Do not include `sora_session=` or a semicolon.
- `PHASE2_SEED_CONCURRENCY`: optional seed concurrency from 1 to 100; defaults to 20.

Install Chromium once with `pnpm phase2:browser:install`, then run `pnpm verify:phase2`. The gate runs the standard verification suite, seeds exactly 5,000 assets with 25,000 asset events per Organization, executes the authenticated browser workflow, and checks search and dashboard p95 thresholds. Missing inputs, invalid sessions, an unseeded fixture, or a missing browser are reported as `NOT EXECUTED`; they are never recorded as passing evidence.

Session cookies are read only from the process environment and are never printed.
