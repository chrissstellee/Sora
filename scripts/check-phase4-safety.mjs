import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const browserRoots = [
  "apps/web/features/tokenization-queue",
  "apps/web/app/api/issuances",
  "apps/web/app/api/assets",
];
const forbidden = [
  ["client signing", /\b(?:Keypair|TransactionBuilder|signTransaction|signedTxXdr)\b/],
  ["Friendbot", /friendbot/i],
  ["custody seed", /STELLAR_TESTNET_(?:ISSUER|DISTRIBUTOR)_SEED/],
  ["issuance mock", /mock-issuance-queue/i],
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

for (const root of browserRoots) await scan(root);
if (findings.length) {
  console.error(
    `Phase 4 browser safety check failed:\n${findings.map((item) => `- ${item}`).join("\n")}`,
  );
  process.exit(1);
}
console.log("Phase 4 browser safety check passed.");
