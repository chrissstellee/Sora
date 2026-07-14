import { performance } from "node:perf_hooks";

import { chromium } from "@playwright/test";

import { apiRequest, percentile, playwrightCookie, readPhase2Environment } from "./env.mjs";

const SEARCH_WARMUPS = 20;
const SEARCH_SAMPLES = 100;
const DASHBOARD_WARMUPS = 10;
const DASHBOARD_SAMPLES = 50;
const SEARCH_P95_LIMIT_MS = 500;
const DASHBOARD_P95_LIMIT_MS = 2_000;
const { baseURL, orgA } = readPhase2Environment({ requireBothOrganizations: false });

await assertFixture(baseURL, orgA);
const searchPreflight = await apiRequest(
  baseURL,
  orgA,
  "/api/assets?q=Phase%202%20A%20Asset%2001&limit=50",
);
if (!(await searchPreflight.json()).items?.length) {
  throw new Error("NOT EXECUTED: the seeded search fixture could not be found");
}
const searchSamples = [];
for (let index = 0; index < SEARCH_WARMUPS + SEARCH_SAMPLES; index += 1) {
  const started = performance.now();
  const response = await apiRequest(
    baseURL,
    orgA,
    "/api/assets?q=Phase%202%20A%20Asset%2001&limit=50",
  );
  await response.arrayBuffer();
  if (index >= SEARCH_WARMUPS) searchSamples.push(performance.now() - started);
}

let browser;
const dashboardSamples = [];
try {
  browser = await chromium.launch();
} catch (error) {
  throw new Error(
    `NOT EXECUTED: dashboard measurements require an installed Chromium browser (${error.message})`,
  );
}
try {
  const context = await browser.newContext();
  await context.addCookies([playwrightCookie(baseURL, orgA)]);
  const page = await context.newPage();
  for (let index = 0; index < DASHBOARD_WARMUPS + DASHBOARD_SAMPLES; index += 1) {
    const started = performance.now();
    await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Workspace dashboard" }).waitFor();
    await page.getByLabel("Lifecycle summary").waitFor();
    if (index >= DASHBOARD_WARMUPS) dashboardSamples.push(performance.now() - started);
  }
} finally {
  await browser.close();
}

const searchP95 = percentile(searchSamples, 95);
const dashboardP95 = percentile(dashboardSamples, 95);
console.log(
  `Search p95: ${searchP95.toFixed(1)} ms (${SEARCH_SAMPLES} samples after ${SEARCH_WARMUPS} warmups)`,
);
console.log(
  `Dashboard p95: ${dashboardP95.toFixed(1)} ms (${DASHBOARD_SAMPLES} samples after ${DASHBOARD_WARMUPS} warmups)`,
);
if (searchP95 > SEARCH_P95_LIMIT_MS || dashboardP95 > DASHBOARD_P95_LIMIT_MS) {
  throw new Error(
    `Phase 2 performance threshold failed (search <= ${SEARCH_P95_LIMIT_MS} ms; dashboard <= ${DASHBOARD_P95_LIMIT_MS} ms)`,
  );
}

async function assertFixture(url, cookie) {
  const response = await apiRequest(url, cookie, "/api/workspace/summary");
  const summary = await response.json();
  if (summary.counts?.total !== 5_000) {
    throw new Error(
      `NOT EXECUTED: expected exactly 5,000 seeded assets; found ${summary.counts?.total ?? "unknown"}`,
    );
  }
}
