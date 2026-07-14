import { createHash } from "node:crypto";

import { apiRequest, readPhase2Environment } from "./env.mjs";

const ASSET_COUNT = 5_000;
const TARGET_VERSION = 5;
const DEFAULT_CONCURRENCY = 20;
const { baseURL, orgA, orgB } = readPhase2Environment();
const concurrency = positiveInteger(process.env.PHASE2_SEED_CONCURRENCY, DEFAULT_CONCURRENCY);

await assertAuthenticated(baseURL, orgA, "Organization A");
await assertAuthenticated(baseURL, orgB, "Organization B");

for (const [organization, cookie] of [
  ["A", orgA],
  ["B", orgB],
]) {
  process.stdout.write(`Seeding Organization ${organization}: 0/${ASSET_COUNT}\r`);
  let completed = 0;
  await mapConcurrent(
    Array.from({ length: ASSET_COUNT }, (_, index) => index),
    concurrency,
    async (index) => {
      await seedAsset(baseURL, cookie, organization, index);
      completed += 1;
      if (completed % 100 === 0 || completed === ASSET_COUNT) {
        process.stdout.write(`Seeding Organization ${organization}: ${completed}/${ASSET_COUNT}\r`);
      }
    },
  );
  process.stdout.write(`Seeding Organization ${organization}: ${ASSET_COUNT}/${ASSET_COUNT}\n`);
  const summaryResponse = await apiRequest(baseURL, cookie, "/api/workspace/summary");
  const summary = await summaryResponse.json();
  if (summary.counts?.total !== ASSET_COUNT) {
    throw new Error(
      `Fixture Organization ${organization} contains ${summary.counts?.total ?? "an unknown number of"} assets; use a clean preview deployment`,
    );
  }
}

console.log(
  "Phase 2 fixture ready: 5,000 assets and 25,000 deterministic asset events per Organization.",
);

async function assertAuthenticated(url, cookie, label) {
  const response = await apiRequest(url, cookie, "/api/auth/me");
  const body = await response.json();
  if (!body.authenticated) throw new Error(`NOT EXECUTED: ${label} session is not authenticated`);
}

async function seedAsset(url, cookie, organization, index) {
  const number = String(index).padStart(4, "0");
  const input = {
    name: `Phase 2 ${organization} Asset ${number}`,
    category: ["Real Estate", "Aviation", "Energy", "Maritime"][index % 4],
    description: `Deterministic Phase 2 performance fixture asset ${number} for Organization ${organization}.`,
    estimatedValue: `${100000 + index}.00`,
    currency: ["USD", "EUR", "GBP", "SGD"][index % 4],
    countryCode: ["US", "GB", "SG", "PH"][index % 4],
    legalOwner: `Fixture Owner ${organization} ${number}`,
    registrationNumber: `P2-${organization}-${number}`,
    ownershipType: ["Individual", "Organization", "Trust", "Joint Venture"][index % 4],
    contactEmail: `phase2-${organization.toLowerCase()}-${number}@example.test`,
    address: `Fixture address ${number}`,
    contactPhone: "",
    internalNotes: "Fixture revision 0",
  };
  const create = await apiRequest(url, cookie, "/api/assets", {
    method: "POST",
    body: JSON.stringify({ ...input, requestId: deterministicUUID(`${organization}:${index}`) }),
  });
  let { asset } = await create.json();
  if (asset.version > TARGET_VERSION) {
    throw new Error(
      `Fixture ${organization}/${number} is at unexpected version ${asset.version}; use a clean preview deployment`,
    );
  }
  while (asset.version < TARGET_VERSION) {
    const revision = asset.version;
    const update = await apiRequest(url, cookie, `/api/assets/${asset.assetId}`, {
      method: "PATCH",
      body: JSON.stringify({
        ...input,
        internalNotes: `Fixture revision ${revision}`,
        expectedVersion: asset.version,
      }),
    });
    ({ asset } = await update.json());
  }
}

function deterministicUUID(value) {
  const bytes = Buffer.from(createHash("sha256").update(value).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function mapConcurrent(values, limit, worker) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, async () => {
      while (next < values.length) {
        const current = next++;
        await worker(values[current]);
      }
    }),
  );
}

function positiveInteger(value, fallback) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new Error("NOT EXECUTED: PHASE2_SEED_CONCURRENCY must be an integer from 1 to 100");
  }
  return parsed;
}
