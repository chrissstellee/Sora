import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const roots = [
  "apps/web/app/(pages)/assets",
  "apps/web/app/(pages)/dashboard",
  "apps/web/app/(pages)/activity-log",
  "apps/web/features/assets",
  "apps/web/features/dashboard",
  "apps/web/features/activity-log",
];
const forbiddenModules = [
  "apps/web/features/assets/asset-list/lib/mock-assets.ts",
  "apps/web/features/assets/asset-details/lib/mock-asset-detail.ts",
  "apps/web/features/dashboard/lib/mock-dashboard.ts",
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
    if (entry.isDirectory()) {
      await scan(target);
    } else if (
      /\.[cm]?[jt]sx?$/.test(entry.name) &&
      !/\.(?:test|spec|stories)\.[jt]sx?$/.test(entry.name)
    ) {
      const source = await readFile(target, "utf8");
      if (/\b(?:from|import\s*\()\s*["'][^"']*mock[^"']*["']/i.test(source)) {
        findings.push(`${target}: imports runtime mock data`);
      }
    }
  }
}

for (const root of roots) await scan(root);
for (const modulePath of forbiddenModules) {
  try {
    await readFile(modulePath);
    findings.push(`${modulePath}: affected runtime mock module still exists`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

if (findings.length) {
  console.error(
    `Phase 2 production mock check failed:\n${findings.map((item) => `- ${item}`).join("\n")}`,
  );
  process.exitCode = 1;
} else {
  console.log("Phase 2 production mock check passed.");
}
