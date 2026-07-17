import { performance } from "node:perf_hooks";

import { chromium } from "@playwright/test";

import {
  apiRequest,
  assertMinimumFixtureSize,
  percentile,
  playwrightCookie,
  readPhase2Environment,
} from "./env.mjs";

const SEARCH_WARMUPS = 20;
const SEARCH_SAMPLES = 100;
const DASHBOARD_WARMUPS = 10;
const DASHBOARD_SAMPLES = 50;
const SEARCH_P95_LIMIT_MS = 500;
const DASHBOARD_P95_LIMIT_MS = 2_000;
const DASHBOARD_WARMUP_READY_TIMEOUT_MS = 120_000;
const DASHBOARD_SAMPLE_READY_TIMEOUT_MS = 30_000;
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
  await assertBrowserAuthenticated(context, baseURL);
  const page = await context.newPage();
  for (let index = 0; index < DASHBOARD_WARMUPS + DASHBOARD_SAMPLES; index += 1) {
    const started = performance.now();
    const response = await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
    if (!response?.ok()) {
      throw new Error(
        `Dashboard navigation failed during ${sampleLabel(index)} (HTTP ${response?.status() ?? "unknown"})`,
      );
    }
    await waitForDashboardReady(
      page,
      index < DASHBOARD_WARMUPS
        ? DASHBOARD_WARMUP_READY_TIMEOUT_MS
        : DASHBOARD_SAMPLE_READY_TIMEOUT_MS,
      index,
    );
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
  assertMinimumFixtureSize(summary.counts?.total, 5_000, "NOT EXECUTED: Phase 2 fixture");
}

async function assertBrowserAuthenticated(context, url) {
  const response = await context.request.get(new URL("/api/auth/me", url).href);
  const body = await response.json().catch(() => ({}));
  if (!response.ok() || !body.authenticated) {
    throw new Error(
      `NOT EXECUTED: Chromium could not authenticate the Organization A session (HTTP ${response.status()})`,
    );
  }
}

async function waitForDashboardReady(page, timeout, index) {
  const heading = page.getByRole("heading", { name: "Workspace dashboard" });
  const lifecycle = page.getByLabel("Lifecycle summary");
  const error = page.getByRole("alert").filter({ hasText: "Workspace data is unavailable" });
  const outcome = await Promise.race([
    lifecycle.waitFor({ timeout }).then(() => "ready"),
    error.waitFor({ timeout }).then(() => "error"),
    page.waitForURL((url) => url.pathname.startsWith("/login"), { timeout }).then(() => "login"),
  ]).catch(() => "timeout");

  if (outcome === "ready") {
    await heading.waitFor({ timeout: DASHBOARD_SAMPLE_READY_TIMEOUT_MS });
    return;
  }
  if (outcome === "login") {
    throw new Error(`Dashboard redirected to login during ${sampleLabel(index)}`);
  }
  if (outcome === "error") {
    throw new Error(`Dashboard rendered its safe error state during ${sampleLabel(index)}`);
  }
  throw new Error(
    `Dashboard did not become ready during ${sampleLabel(index)} within ${timeout} ms (URL ${page.url()})`,
  );
}

function sampleLabel(index) {
  return index < DASHBOARD_WARMUPS
    ? `warmup ${index + 1}/${DASHBOARD_WARMUPS}`
    : `sample ${index - DASHBOARD_WARMUPS + 1}/${DASHBOARD_SAMPLES}`;
}
