import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { playwrightCookie, readPhase5Environment } from "../scripts/phase5/env.mjs";

const environment = readPhase5Environment({ requireAsset: true });
const assetId = required(environment.assetId, "PHASE5_ASSET_ID");
const organizationBSession = required(environment.orgB, "PHASE5_ORG_B_SESSION_COOKIE");

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([playwrightCookie(environment.baseURL, environment.orgA)]);
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("authenticated ownership proof is exact, keyboard-safe, and accessible", async ({ page }) => {
  await page.goto(
    `${environment.baseURL}/ownership-registry?assetId=${encodeURIComponent(assetId)}`,
  );
  await expect(page.getByRole("heading", { name: "Testnet Ownership Proof" })).toBeVisible();
  await expect(page.getByText(/do not establish legal or beneficial ownership/i)).toBeVisible();
  await expect(page.getByText(/Classic account trustline balances only/i)).toBeVisible();
  await expect(page.getByText(/confirmed and observed account-held supply match/i)).toBeVisible({
    timeout: 30_000,
  });

  const refresh = page.getByRole("button", { name: "Refresh proof" });
  await refresh.focus();
  await expect(refresh).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: /refresh|synchroniz/i })
      .first(),
  ).toBeVisible();

  const proofLinks = page.locator('a[href^="https://stellar.expert/explorer/testnet/"]');
  for (const link of await proofLinks.all()) {
    const target = new URL((await link.getAttribute("href"))!);
    expect(target.origin).toBe("https://stellar.expert");
    expect(target.pathname).toMatch(/^\/explorer\/testnet\/(account|tx|ledger|asset)\//);
    expect(target.search).toBe("");
    expect(target.hash).toBe("");
  }
  expect(await accessibilityViolations(page)).toEqual([]);
});

test("Activity supports run filtering, proof safety, and session recovery states", async ({
  browser,
  page,
}) => {
  await page.goto(`${environment.baseURL}/activity-log`);
  await expect(page.getByRole("heading", { name: /Activity/i })).toBeVisible();
  await page.getByLabel("Formal run ID").fill("no-matching-formal-run");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText("No activity matches these filters.")).toBeVisible();
  expect(await accessibilityViolations(page)).toEqual([]);

  const expired = await browser.newContext();
  try {
    const expiredPage = await expired.newPage();
    await expiredPage.goto(`${environment.baseURL}/activity-log`);
    await expect(expiredPage).toHaveURL(/\/login/);
  } finally {
    await expired.close();
  }
});

test("ownership and Activity are isolated between Organizations", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addCookies([playwrightCookie(environment.baseURL, organizationBSession)]);
  try {
    const ownership = await context.request.get(
      `${environment.baseURL}/api/assets/${encodeURIComponent(assetId)}/ownership?limit=10`,
    );
    expect([401, 404]).toContain(ownership.status());
    const activity = await context.request.get(
      `${environment.baseURL}/api/activity?assetId=${encodeURIComponent(assetId)}&limit=10`,
    );
    expect(activity.ok()).toBeTruthy();
    expect((await activity.json()).items).toEqual([]);
  } finally {
    await context.close();
  }
});

test("required ownership and Activity states have no serious or critical WCAG findings", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const base = ownershipFixture();
  let response: { status: number; body: unknown } = { status: 200, body: base };
  await page.route("**/api/assets/*/ownership?**", (route) =>
    route.fulfill({
      status: response.status,
      contentType: "application/json",
      body: JSON.stringify(response.body),
    }),
  );
  const url = `${environment.baseURL}/ownership-registry?assetId=${encodeURIComponent(assetId)}`;
  const states = [
    {
      body: { ...base, snapshot: { ...base.snapshot!, synchronizedAt: Date.now() - 61_000 } },
      text: /older than 60 seconds/i,
    },
    {
      body: { ...base, sync: { state: "failed", safeErrorCode: "OWNERSHIP_SUPPLY_MISMATCH" } },
      text: /reconciliation is pending/i,
    },
    {
      body: {
        ...base,
        snapshot: null,
        sync: { state: "unavailable" },
        holders: { items: [], nextCursor: null },
      },
      text: /No complete matching ownership proof/i,
    },
    {
      body: {
        ...base,
        snapshot: { ...base.snapshot!, holderCount: 0 },
        holders: { items: [], nextCursor: null },
      },
      text: /verified zero non-zero account holders/i,
    },
    { body: { ...base, sync: { state: "refreshing" } }, text: /Synchronizing now/i },
    {
      body: {
        ...base,
        holders: {
          items: [{ account: "GINVALID", balance: "25.0000000", share: "100.0000", ledger: 1 }],
          nextCursor: null,
        },
      },
      text: /Proof unavailable/i,
    },
  ];
  for (const state of states) {
    response = { status: 200, body: state.body };
    await page.goto(url);
    await expect(page.getByText(state.text).first()).toBeVisible();
    expect(await accessibilityViolations(page)).toEqual([]);
  }
  for (const failure of [
    { status: 404, code: "NOT_FOUND", text: /not found or is not available/i },
    { status: 429, code: "RATE_LIMITED", text: /rate limited/i },
    { status: 503, code: "SERVICE_UNAVAILABLE", text: /could not be loaded/i },
  ]) {
    response = {
      status: failure.status,
      body: {
        error: { code: failure.code, message: "Safe Phase 5 state", correlationId: "p5-a11y" },
      },
    };
    await page.goto(url);
    await expect(page.getByText(failure.text).first()).toBeVisible();
    expect(await accessibilityViolations(page)).toEqual([]);
  }

  await page.unroute("**/api/assets/*/ownership?**");
  await page.route("**/api/activity?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Safe Activity failure",
          correlationId: "p5-a11y",
        },
      }),
    }),
  );
  await page.goto(`${environment.baseURL}/activity-log`);
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  expect(await accessibilityViolations(page)).toEqual([]);
});

async function accessibilityViolations(page: import("@playwright/test").Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return result.violations
    .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
    }));
}

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`NOT EXECUTED: ${name} is required`);
  return value;
}

function ownershipFixture() {
  const account = "GCFIRY65OQE7DFP5KLNS2PF2LVZMUZYJX4OZIEQ36N2IQANUB5XVYOJR";
  return {
    asset: {
      assetId,
      assetCode: "S5A11Y",
      issuerAccount: account,
      network: "Testnet",
      confirmedSupply: "25.0000000",
    },
    snapshot: {
      snapshotId: "snapshot-a11y",
      confirmedSupply: "25.0000000",
      observedSupply: "25.0000000",
      holderCount: 1,
      holdersHash: "a".repeat(64),
      firstLedger: 1,
      lastLedger: 1,
      synchronizedAt: Date.now(),
    },
    sync: { state: "fresh" },
    holders: {
      items: [{ account, balance: "25.0000000", share: "100.0000", ledger: 1 }],
      nextCursor: null,
    },
  };
}
