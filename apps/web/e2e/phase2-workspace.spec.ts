import { expect, test } from "@playwright/test";

import { playwrightCookie, readPhase2Environment } from "../scripts/phase2/env.mjs";

const environment = readPhase2Environment();
const WORKSPACE_READY_TIMEOUT_MS = 30_000;

test("authenticated asset workflow, conflict recovery, and Organization isolation", async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  await contextA.addCookies([playwrightCookie(environment.baseURL, environment.orgA)]);
  await contextB.addCookies([playwrightCookie(environment.baseURL, environment.orgB)]);
  const page = await contextA.newPage();
  const unique = Date.now().toString(36);
  const originalName = `E2E Solar Facility ${unique}`;
  const editedName = `${originalName} Updated`;

  try {
    const auth = await contextA.request.get(`${environment.baseURL}/api/auth/me`);
    expect(auth.ok()).toBeTruthy();
    expect((await auth.json()).authenticated).toBe(true);

    await page.goto(`${environment.baseURL}/assets/create`);
    await page.getByLabel("Asset name").fill(originalName);
    await page.getByLabel("Estimated value").fill("1250000.50");
    await page
      .getByLabel("Description")
      .fill("A persisted solar energy facility created by the Phase 2 browser acceptance test.");
    await page.getByLabel("Country code").fill("PH");
    await page.getByLabel("Legal owner").fill("Phase 2 Acceptance Holdings");
    await page.getByLabel("Registration number").fill(`E2E-${unique}`);
    await page.getByLabel("Contact email").fill(`phase2-${unique}@example.test`);
    await page.getByRole("button", { name: "Create asset" }).click();
    await expect(page).toHaveURL(/\/assets\/[0-9a-f-]{36}$/, { timeout: 30_000 });
    const assetId = page.url().split("/").at(-1);
    expect(assetId).toBeTruthy();
    await expect(page.getByRole("heading", { name: originalName })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: originalName })).toBeVisible();
    await page.goto(`${environment.baseURL}/assets`);
    await page.getByLabel("Search assets by name or registration number").fill(originalName);
    await expect(page.getByRole("link", { name: originalName })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: originalName }).click();
    await expect(page).toHaveURL(new RegExp(`/assets/${assetId}$`));

    await page.getByRole("link", { name: "Edit record" }).click();
    await expect(page.getByRole("heading", { name: `Edit ${originalName}` })).toBeVisible();
    const currentResponse = await contextA.request.get(
      `${environment.baseURL}/api/assets/${assetId}`,
    );
    const { asset: current } = await currentResponse.json();
    const externalUpdate = await contextA.request.patch(
      `${environment.baseURL}/api/assets/${assetId}`,
      {
        data: {
          ...toAssetInput(current),
          internalNotes: "Concurrent acceptance-test update",
          expectedVersion: current.version,
        },
      },
    );
    expect(externalUpdate.ok()).toBeTruthy();

    await page.getByLabel("Asset name").fill(editedName);
    await page.getByRole("button", { name: "Save changes" }).click();
    const conflictAlert = page
      .getByRole("alert")
      .filter({ hasText: "A newer version is available" });
    await expect(conflictAlert).toBeVisible();
    await page.getByRole("button", { name: "I reviewed the latest version" }).click();
    await page.getByRole("button", { name: "Retry update" }).click();
    await expect(conflictAlert).not.toBeVisible();
    await page.goto(`${environment.baseURL}/assets/${assetId}`);
    await expect(page.getByRole("heading", { name: editedName })).toBeVisible();

    await page.goto(`${environment.baseURL}/dashboard`);
    await expect(page.getByRole("heading", { name: "Workspace dashboard" })).toBeVisible({
      timeout: WORKSPACE_READY_TIMEOUT_MS,
    });
    await expect(page.getByLabel("Lifecycle summary")).toBeVisible({
      timeout: WORKSPACE_READY_TIMEOUT_MS,
    });
    await expect(page.getByRole("link", { name: editedName })).toBeVisible({
      timeout: WORKSPACE_READY_TIMEOUT_MS,
    });

    const summaryResponseA = await contextA.request.get(
      `${environment.baseURL}/api/workspace/summary`,
    );
    expect(summaryResponseA.ok()).toBeTruthy();
    const summaryA = await summaryResponseA.json();
    expect(summaryA.counts.total).toBeGreaterThan(0);
    expect(
      summaryA.recentAssets.some((asset: { assetId: string }) => asset.assetId === assetId),
    ).toBe(true);
    const activityResponseA = await contextA.request.get(
      `${environment.baseURL}/api/activity?assetId=${assetId}&limit=25`,
    );
    expect(activityResponseA.ok()).toBeTruthy();
    const activityA = await activityResponseA.json();
    expect(activityA.items.map((event: { eventType: string }) => event.eventType)).toEqual(
      expect.arrayContaining(["asset.created", "asset.updated"]),
    );

    const foreignResponse = await contextB.request.get(
      `${environment.baseURL}/api/assets/${assetId}`,
    );
    expect(foreignResponse.status()).toBe(404);
    const foreignUpdate = await contextB.request.patch(
      `${environment.baseURL}/api/assets/${assetId}`,
      {
        data: { ...toAssetInput(current), expectedVersion: current.version },
      },
    );
    expect(foreignUpdate.status()).toBe(404);
    const summaryResponseB = await contextB.request.get(
      `${environment.baseURL}/api/workspace/summary`,
    );
    expect(summaryResponseB.ok()).toBeTruthy();
    const summaryB = await summaryResponseB.json();
    expect(
      summaryB.recentAssets.some((asset: { assetId: string }) => asset.assetId === assetId),
    ).toBe(false);
    const activityResponseB = await contextB.request.get(
      `${environment.baseURL}/api/activity?assetId=${assetId}&limit=25`,
    );
    expect(activityResponseB.ok()).toBeTruthy();
    expect((await activityResponseB.json()).items).toEqual([]);
    const pageB = await contextB.newPage();
    await pageB.goto(`${environment.baseURL}/assets`);
    await pageB.getByLabel("Search assets by name or registration number").fill(originalName);
    await expect(pageB.getByText("No matching assets")).toBeVisible({ timeout: 15_000 });
  } finally {
    await Promise.all([contextA.close(), contextB.close()]);
  }
});

test("dashboard exposes empty, failure, retry, and keyboard-focus states", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addCookies([playwrightCookie(environment.baseURL, environment.orgA)]);
  const page = await context.newPage();
  const emptySummary = {
    counts: {
      total: 0,
      Draft: 0,
      Review: 0,
      Ready: 0,
      Issuing: 0,
      Active: 0,
      Failed: 0,
      Archived: 0,
    },
    recentAssets: [],
  };

  try {
    await page.route("**/api/workspace/summary", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(emptySummary),
      }),
    );
    await page.route("**/api/activity?**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: '{"items":[]}' }),
    );
    await page.goto(`${environment.baseURL}/dashboard`);
    await expect(page.getByText("No assets have been created yet.")).toBeVisible();
    await expect(page.getByText("No recent workspace activity.")).toBeVisible();

    await page.unroute("**/api/workspace/summary");
    await page.route("**/api/workspace/summary", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Temporary acceptance-test failure",
            correlationId: "phase2-e2e-failure",
          },
        }),
      }),
    );
    await page.reload();
    const retry = page.getByRole("button", { name: "Retry" });
    const workspaceAlert = page
      .getByRole("alert")
      .filter({ hasText: "Workspace data is unavailable" });
    await expect(workspaceAlert).toContainText("Temporary acceptance-test failure");
    await retry.focus();
    await expect(retry).toBeFocused();
  } finally {
    await context.close();
  }
});

function toAssetInput(asset: Record<string, unknown>) {
  const fields = [
    "name",
    "category",
    "description",
    "estimatedValue",
    "currency",
    "countryCode",
    "legalOwner",
    "registrationNumber",
    "ownershipType",
    "contactEmail",
    "address",
    "contactPhone",
    "internalNotes",
  ];
  return Object.fromEntries(fields.map((field) => [field, asset[field] ?? ""]));
}
