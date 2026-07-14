import { expect, test } from "@playwright/test";

import { playwrightCookie, readPhase2Environment } from "../scripts/phase2/env.mjs";

const environment = readPhase2Environment();

test("authenticated asset workflow, conflict recovery, and Organization isolation", async ({
  browser,
}) => {
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
    await expect(page).toHaveURL(/\/assets\/[0-9a-f-]{36}$/);
    const assetId = page.url().split("/").at(-1);
    expect(assetId).toBeTruthy();
    await expect(page.getByRole("heading", { name: originalName })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: originalName })).toBeVisible();
    await page.goto(`${environment.baseURL}/assets`);
    await page.getByLabel("Search assets by name or registration number").fill(unique);
    await expect(page.getByRole("link", { name: originalName })).toBeVisible();
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
    await expect(page.getByRole("alert")).toContainText("A newer version is available");
    await page.getByRole("button", { name: "I reviewed the latest version" }).click();
    await page.getByRole("button", { name: "Retry update" }).click();
    await expect(page.getByRole("alert")).not.toBeVisible();
    await page.goto(`${environment.baseURL}/assets/${assetId}`);
    await expect(page.getByRole("heading", { name: editedName })).toBeVisible();

    await page.goto(`${environment.baseURL}/dashboard`);
    await expect(page.getByRole("heading", { name: "Workspace dashboard" })).toBeVisible();
    await expect(page.getByLabel("Lifecycle summary")).toBeVisible();

    const foreignResponse = await contextB.request.get(
      `${environment.baseURL}/api/assets/${assetId}`,
    );
    expect(foreignResponse.status()).toBe(404);
    const pageB = await contextB.newPage();
    await pageB.goto(`${environment.baseURL}/assets`);
    await pageB.getByLabel("Search assets by name or registration number").fill(unique);
    await expect(pageB.getByText("No matching assets")).toBeVisible();
  } finally {
    await Promise.all([contextA.close(), contextB.close()]);
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
