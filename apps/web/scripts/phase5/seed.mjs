import { readPhase5Environment } from "./env.mjs";

const { baseURL, orgA, orgB } = readPhase5Environment();

// Reuse the deterministic Phase 2 asset/event corpus under Phase 5 credentials.
// The backend half of `pnpm phase5:seed` then publishes a private, non-formal
// 5,000-row ownership performance fixture for PHASE5_PERF_ASSET_ID.
process.env.PHASE2_BASE_URL = baseURL;
process.env.PHASE2_ORG_A_SESSION_COOKIE = orgA;
process.env.PHASE2_ORG_B_SESSION_COOKIE = orgB;
process.env.PHASE2_SEED_CONCURRENCY = process.env.PHASE5_SEED_CONCURRENCY ?? "4";

await import("../phase2/seed.mjs");
