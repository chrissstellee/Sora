import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const roots = [
  "apps/web/features/ownership-registry",
  "apps/web/features/activity-log",
  "apps/web/app/api/activity",
  "apps/web/app/api/assets",
  "apps/web/features/tokenization-queue",
];
const forbiddenFiles = [
  "apps/web/features/ownership-registry/lib/mock-ownership-registry.ts",
  "apps/web/features/ownership-registry/components/recent-transfer-table.tsx",
];
const forbidden = [
  ["runtime mock import", /\b(?:from|import\s*\()\s*["'][^"']*mock[^"']*["']/i],
  ["prohibited holder classification", /\b(?:Institutional|Retail)\b/],
  [
    "browser Horizon enumeration",
    /(?:Horizon\.Server|horizon-testnet\.stellar\.org\/accounts|NEXT_PUBLIC_STELLAR_HORIZON_URL)/,
  ],
  ["arbitrary explorer URL", /https?:\/\/stellar\.expert\/explorer\//],
  ["browser transaction signing", /\b(?:Keypair|TransactionBuilder|signTransaction|signedTxXdr)\b/],
  ["Friendbot", /friendbot/i],
  ["browser fault control", /PHASE5_(?:FAULTS|OPERATOR)|after-submit-before-result-persist/],
];
const findings = [];

async function scan(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await scan(target);
    else if (/\.[cm]?[jt]sx?$/.test(entry.name) && !/\.(?:test|spec)\.[jt]sx?$/.test(entry.name)) {
      const source = await readFile(target, "utf8");
      for (const [label, pattern] of forbidden) {
        if (pattern.test(source)) findings.push(`${target}: contains ${label}`);
      }
    }
  }
}

async function scanCanonicalActivity(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await scanCanonicalActivity(target);
    else if (entry.name.endsWith(".ts") && !target.endsWith(`activityWriter.ts`)) {
      const source = await readFile(target, "utf8");
      if (/\.insert\(\s*["']activityEvents["']/.test(source)) {
        findings.push(`${target}: bypasses the canonical Activity writer`);
      }
    }
  }
}

for (const root of roots) await scan(root);
await scanCanonicalActivity("packages/backend/convex");
for (const file of forbiddenFiles) {
  try {
    await readFile(file);
    findings.push(`${file}: prohibited Phase 5 runtime artifact still exists`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

if (findings.length) {
  console.error(`Phase 5 safety check failed:\n${findings.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}
console.log("Phase 5 ownership, proof, mock, and fault-control safety check passed.");
