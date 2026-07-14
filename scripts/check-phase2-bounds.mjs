import { readFile } from "node:fs/promises";

const assets = await readFile("packages/backend/convex/assets.ts", "utf8");
const activity = await readFile("packages/backend/convex/activity.ts", "utf8");
const findings = [];

for (const [path, source] of [
  ["packages/backend/convex/assets.ts", assets],
  ["packages/backend/convex/activity.ts", activity],
]) {
  if (/\.collect\s*\(/.test(source)) findings.push(`${path}: contains an unbounded collect()`);
}

if (!/\.paginate\(args\.paginationOpts\)/.test(assets)) {
  findings.push("packages/backend/convex/assets.ts: default list is not natively paginated");
}
if (!/assetLifecycleCounts\.count\(/.test(assets)) {
  findings.push(
    "packages/backend/convex/assets.ts: lifecycle counts do not use the aggregate index",
  );
}
if (!/\.take\(/.test(activity)) {
  findings.push("packages/backend/convex/activity.ts: activity reads are not bounded");
}

if (findings.length) {
  console.error(
    `Phase 2 bounded-query check failed:\n${findings.map((item) => `- ${item}`).join("\n")}`,
  );
  process.exitCode = 1;
} else {
  console.log("Phase 2 bounded-query check passed.");
}
