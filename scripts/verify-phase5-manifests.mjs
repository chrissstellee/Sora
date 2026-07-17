import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const directory = "docs/phase-5/evidence/runs";
let files;
try {
  files = (await readdir(directory)).filter((file) => file.endsWith(".json")).sort();
} catch (error) {
  if (error?.code === "ENOENT") {
    throw new Error("NOT EXECUTED: no Phase 5 live evidence directory exists");
  }
  throw error;
}
if (files.length < 5) {
  throw new Error(`NOT EXECUTED: ${files.length}/5 Phase 5 live run manifests are present`);
}

const manifests = [];
for (const file of files) {
  const manifest = JSON.parse(await readFile(path.join(directory, file), "utf8"));
  assertManifest(manifest, file);
  manifests.push(manifest);
}
manifests.sort((left, right) => Date.parse(left.finalizedAt) - Date.parse(right.finalizedAt));
const campaign = manifests.slice(-5);
const revisions = new Set(campaign.map((manifest) => manifest.revision));
if (revisions.size !== 1) throw new Error("Phase 5 manifests do not share one exact revision");
if (new Set(campaign.map((manifest) => manifest.runId)).size !== 5) {
  throw new Error("Phase 5 manifests do not contain five unique consecutive runs");
}
if (
  !campaign.some((manifest) => manifest.recoveryScenario === "after-submit-before-result-persist")
) {
  throw new Error("Phase 5 manifests do not include the required controlled recovery run");
}
console.log(
  `Phase 5 live gate passed: five sanitized manifests at revision ${campaign[0].revision}.`,
);

function assertManifest(manifest, file) {
  const serialized = JSON.stringify(manifest);
  if (
    /(?:secret|seed|privateKey|session|cookie|boundaryKey|signedXdr|envelope|rawResponse)/i.test(
      serialized,
    )
  ) {
    throw new Error(`${file}: contains a forbidden private evidence field`);
  }
  if (
    manifest.schemaVersion !== 1 ||
    manifest.outcome !== "Pass" ||
    manifest.environment !== "demo-testnet" ||
    !/^[0-9a-f-]{36}$/i.test(manifest.runId ?? "") ||
    !/^S5[A-F0-9]{10}$/.test(manifest.asset?.code ?? "") ||
    !/^[0-9a-f]{64}$/.test(manifest.payment?.hash ?? "") ||
    !Number.isInteger(manifest.payment?.ledger) ||
    manifest.ownership?.confirmedSupply !== manifest.ownership?.observedSupply ||
    !Number.isInteger(manifest.ownership?.holderCount) ||
    manifest.ownership.holderCount < 1 ||
    !/^[0-9a-f]{40}$/.test(manifest.revision ?? "") ||
    !Number.isFinite(Date.parse(manifest.finalizedAt ?? ""))
  ) {
    throw new Error(`${file}: invalid or incomplete Phase 5 manifest`);
  }
}
