import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const roots = [
  "apps/web/features/documents",
  "apps/web/features/assets/asset-details",
  "apps/web/features/tokenization-queue",
  "apps/web/app/api/documents",
  "apps/web/app/api/tokenization",
];
const forbiddenFiles = [
  "apps/web/features/documents/lib/mock-documents.ts",
  "apps/web/features/tokenization-queue/lib/mock-issuance-queue.ts",
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
      if (/\b(?:from|import\s*\()\s*["'][^"']*mock[^"']*["']/i.test(source)) {
        findings.push(`${target}: imports runtime mock data`);
      }
    }
  }
}

for (const root of roots) await scan(root);
for (const file of forbiddenFiles) {
  try {
    await readFile(file);
    findings.push(`${file}: runtime mock module still exists`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

if (findings.length) {
  console.error(
    `Phase 3 production mock check failed:\n${findings.map((item) => `- ${item}`).join("\n")}`,
  );
  process.exit(1);
}
console.log("Phase 3 production mock check passed.");
