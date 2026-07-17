import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

import { chromium, firefox, webkit } from "@playwright/test";

import { apiRequest, playwrightCookie, readPhase5Environment } from "./env.mjs";

const DASHBOARD_SAMPLES = 50;
const DASHBOARD_COLD_SAMPLES = 10;
const OWNERSHIP_SAMPLES = 30;
const DASHBOARD_P95_LIMIT_MS = 2_000;
const OWNERSHIP_P95_LIMIT_MS = 500;
const SEARCH_SAMPLES = 30;
const revision = requiredEnvironment("PHASE5_REVISION", /^[0-9a-f]{40}$/);
const seedId = requiredEnvironment("PHASE5_SEED_ID", /^[A-Za-z0-9._:-]{1,100}$/);
const { baseURL, orgA, assetId } = readPhase5Environment({
  requireAsset: true,
  requireBothOrganizations: false,
});

const firstAccount = await assertOwnershipFixture();
const noResultAccount = `${firstAccount.slice(0, -1)}${firstAccount.endsWith("A") ? "B" : "A"}`;

const ownershipSamples = [];
for (let index = 0; index < OWNERSHIP_SAMPLES; index += 1) {
  const query =
    index % 3 === 0 ? firstAccount : index % 3 === 1 ? firstAccount.slice(0, 12) : noResultAccount;
  const started = performance.now();
  const response = await apiRequest(
    baseURL,
    orgA,
    `/api/assets/${encodeURIComponent(assetId)}/ownership?limit=100&q=${encodeURIComponent(query)}`,
  );
  await response.arrayBuffer();
  ownershipSamples.push(performance.now() - started);
}

await mkdir("test-results/phase5", { recursive: true });
const browserResults = {};
for (const [name, browserType] of Object.entries({ chromium, firefox, webkit })) {
  let browser;
  try {
    browser = await browserType.launch();
  } catch (error) {
    throw new Error(`NOT EXECUTED: ${name} is not installed (${error.message})`);
  }
  try {
    const samples = [];
    const browserVersion = browser.version();
    for (let index = 0; index < DASHBOARD_COLD_SAMPLES; index += 1) {
      const context = await authenticatedContext(browser);
      try {
        samples.push(await measureDashboard(context));
      } finally {
        await context.close();
      }
    }
    const context = await authenticatedContext(browser);
    try {
      for (let index = DASHBOARD_COLD_SAMPLES; index < DASHBOARD_SAMPLES; index += 1) {
        samples.push(await measureDashboard(context));
      }
    } finally {
      await context.close();
    }
    const tracePath = `test-results/phase5/${name}-performance-trace.zip`;
    const searchContext = await authenticatedContext(browser);
    let assetSearchSamples;
    let ownershipSearchSamples;
    let traceStarted = false;
    try {
      await searchContext.tracing.start({ screenshots: true, snapshots: true, sources: false });
      traceStarted = true;
      assetSearchSamples = await measureAssetSearch(searchContext);
      ownershipSearchSamples = await measureOwnershipSearch(searchContext);
    } finally {
      if (traceStarted)
        await searchContext.tracing.stop({ path: tracePath }).catch(() => undefined);
      await searchContext.close();
    }
    browserResults[name] = {
      version: browserVersion,
      samples: samples.length,
      coldSamples: DASHBOARD_COLD_SAMPLES,
      p95Ms: percentile(samples, 95),
      rawMs: samples,
      assetSearch: searchResult(assetSearchSamples),
      ownershipSearch: searchResult(ownershipSearchSamples),
      tracePath,
    };
  } finally {
    await browser.close();
  }
}

const ownershipP95 = percentile(ownershipSamples, 95);
const failures = Object.entries(browserResults)
  .filter(([, result]) => result.p95Ms > DASHBOARD_P95_LIMIT_MS)
  .map(([name, result]) => `${name} dashboard p95 ${result.p95Ms.toFixed(1)} ms`);
for (const [name, result] of Object.entries(browserResults)) {
  if (result.assetSearch.p95Ms > OWNERSHIP_P95_LIMIT_MS) {
    failures.push(`${name} rendered asset search p95 ${result.assetSearch.p95Ms.toFixed(1)} ms`);
  }
  if (result.ownershipSearch.p95Ms > OWNERSHIP_P95_LIMIT_MS) {
    failures.push(
      `${name} rendered ownership search p95 ${result.ownershipSearch.p95Ms.toFixed(1)} ms`,
    );
  }
}
if (ownershipP95 > OWNERSHIP_P95_LIMIT_MS) {
  failures.push(`ownership p95 ${ownershipP95.toFixed(1)} ms`);
}
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  outcome: failures.length ? "Fail" : "Pass",
  environment: { baseURL, revision, seedId, assetId },
  cacheClassification: {
    dashboard: "10 isolated cold contexts followed by 40 same-context warm navigations",
    search: "same authenticated context; debounce and rendering included; changing query values",
    ownershipApi: "authenticated API timing only; not a substitute for rendered preview timing",
  },
  thresholdsMs: { dashboardP95: DASHBOARD_P95_LIMIT_MS, ownershipP95: OWNERSHIP_P95_LIMIT_MS },
  ownershipApi: {
    samples: OWNERSHIP_SAMPLES,
    exactSamples: 10,
    prefixSamples: 10,
    noResultSamples: 10,
    p95Ms: ownershipP95,
    rawMs: ownershipSamples,
  },
  browsers: browserResults,
};
await writeFile(
  "test-results/phase5/performance.json",
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(report, null, 2));
if (failures.length)
  throw new Error(`Phase 5 performance threshold failed: ${failures.join("; ")}`);

async function assertOwnershipFixture() {
  let cursor;
  let count = 0;
  let firstAccount;
  do {
    const query = new URLSearchParams({ limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const response = await apiRequest(
      baseURL,
      orgA,
      `/api/assets/${encodeURIComponent(assetId)}/ownership?${query}`,
    );
    const body = await response.json();
    firstAccount ??= body.holders?.items?.[0]?.account;
    count += body.holders?.items?.length ?? 0;
    cursor = body.holders?.nextCursor ?? undefined;
  } while (cursor && count <= 5_000);
  if (count !== 5_000) {
    throw new Error(`NOT EXECUTED: Phase 5 ownership fixture has ${count} rows; expected 5000`);
  }
  if (!firstAccount) throw new Error("NOT EXECUTED: Phase 5 ownership fixture is empty");
  return firstAccount;
}

async function authenticatedContext(browser) {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  await context.addCookies([playwrightCookie(baseURL, orgA)]);
  return context;
}

async function measureDashboard(context) {
  const page = await context.newPage();
  const started = performance.now();
  const response = await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
  if (!response?.ok())
    throw new Error(`Dashboard failed (HTTP ${response?.status() ?? "unknown"})`);
  await page.getByRole("heading", { name: "Workspace dashboard" }).waitFor({ timeout: 30_000 });
  await page.getByLabel("Lifecycle summary").waitFor({ timeout: 30_000 });
  const elapsed = performance.now() - started;
  await page.close();
  return elapsed;
}

async function measureAssetSearch(context) {
  const page = await context.newPage();
  await page.goto(`${baseURL}/assets`, { waitUntil: "domcontentloaded" });
  const input = page.getByLabel("Search assets by name or registration number");
  const samples = [];
  for (let index = 0; index < SEARCH_SAMPLES; index += 1) {
    const mode = index % 3;
    const query =
      mode === 0 ? "Phase 2 A Asset 0001" : mode === 1 ? "Phase 2 A Asset 00" : "No Result Asset";
    const started = performance.now();
    await input.fill("Obsolete Asset Request");
    await input.fill(query);
    if (mode === 0) {
      await page.getByRole("link", { name: "Phase 2 A Asset 0001", exact: true }).waitFor();
    } else if (mode === 1) {
      await page
        .getByRole("link", { name: /Phase 2 A Asset 00/ })
        .first()
        .waitFor();
    } else {
      await page.getByRole("heading", { name: "No matching assets" }).waitFor();
    }
    samples.push(performance.now() - started);
  }
  await page.close();
  return samples;
}

async function measureOwnershipSearch(context) {
  const page = await context.newPage();
  await page.goto(`${baseURL}/ownership-registry?assetId=${encodeURIComponent(assetId)}`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("heading", { name: "Testnet Ownership Proof" }).waitFor();
  const input = page.getByLabel("Account search");
  const submit = page.getByRole("button", { name: "Search" });
  const samples = [];
  for (let index = 0; index < SEARCH_SAMPLES; index += 1) {
    const mode = index % 3;
    const query =
      mode === 0 ? firstAccount : mode === 1 ? firstAccount.slice(0, 12) : noResultAccount;
    const started = performance.now();
    await input.fill(noResultAccount);
    await submit.click();
    await input.fill(query);
    await submit.click();
    if (mode === 2) {
      await page.getByText("No accounts match this search.").waitFor();
    } else {
      await page.getByText(firstAccount, { exact: true }).waitFor();
    }
    samples.push(performance.now() - started);
  }
  await page.close();
  return samples;
}

function searchResult(samples) {
  return {
    samples: samples.length,
    exactSamples: 10,
    prefixSamples: 10,
    noResultSamples: 10,
    p95Ms: percentile(samples, 95),
    rawMs: samples,
  };
}

function percentile(samples, value) {
  const sorted = [...samples].sort((left, right) => left - right);
  return sorted[Math.ceil((value / 100) * sorted.length) - 1];
}

function requiredEnvironment(name, pattern) {
  const value = process.env[name];
  if (!value || !pattern.test(value))
    throw new Error(`NOT EXECUTED: ${name} is missing or invalid`);
  return value;
}
