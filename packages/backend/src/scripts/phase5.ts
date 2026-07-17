import { execFile as execFileCallback } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { ConvexHttpClient } from "convex/browser";

import { api } from "../../convex/_generated/api.js";

const command = process.argv[2];
const convexUrl = process.env.CONVEX_URL;
const boundaryKey = process.env.CONVEX_SERVER_BOUNDARY_KEY;
const operatorKey = process.env.PHASE5_OPERATOR_KEY;

if (!convexUrl || !boundaryKey || !operatorKey) {
  throw new Error(
    "NOT EXECUTED: CONVEX_URL, CONVEX_SERVER_BOUNDARY_KEY, and PHASE5_OPERATOR_KEY are required",
  );
}
if (
  !command ||
  !["prepare", "preflight", "fault-arm", "evidence", "reset", "seed-ownership"].includes(command)
) {
  throw new Error(
    "Usage: phase5 <prepare|preflight|fault-arm|evidence|reset|seed-ownership> [--run-id <id>]",
  );
}

const client = new ConvexHttpClient(convexUrl);
const common = { boundaryKey, operatorKey };
const execFile = promisify(execFileCallback);

if (command === "prepare") {
  const requestId = argument("--request-id") ?? randomUUID();
  const browserTarget = argument("--browser-target") ?? "chromium-freighter";
  const result = await client.mutation(api.demo.prepare, { ...common, requestId, browserTarget });
  print(result);
} else if (command === "seed-ownership") {
  const assetId = process.env.PHASE5_PERF_ASSET_ID;
  if (!assetId) throw new Error("NOT EXECUTED: PHASE5_PERF_ASSET_ID is required");
  print(await client.action(api.demoWorker.seedPerformanceOwnership, { ...common, assetId }));
} else {
  const runId = requiredArgument("--run-id");
  if (command === "preflight") {
    print(await client.action(api.demoWorker.preflight, { ...common, runId }));
  } else if (command === "fault-arm") {
    print(await client.mutation(api.demo.armFault, { ...common, runId }));
  } else if (command === "reset") {
    print(await client.mutation(api.demo.reset, { ...common, runId }));
  } else {
    const revision = await resolveRevision();
    const result = await client.action(api.demoWorker.evidence, { ...common, runId });
    const manifest = { ...result.manifest, revision };
    const outputDirectory = process.env.PHASE5_EVIDENCE_DIR ?? "../../docs/phase-5/evidence/runs";
    await mkdir(outputDirectory, { recursive: true });
    const target = path.resolve(outputDirectory, `${runId}.json`);
    const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
    try {
      await writeFile(target, serialized, { encoding: "utf8", flag: "wx" });
    } catch (error) {
      if (
        !(error instanceof Error && "code" in error && error.code === "EEXIST") ||
        (await readFile(target, "utf8")) !== serialized
      ) {
        throw error;
      }
    }
    print({ ...result, manifest, manifestPath: target });
  }
}

async function resolveRevision(): Promise<string> {
  const configured = process.env.PHASE5_REVISION;
  if (configured) {
    if (!/^[0-9a-f]{40}$/.test(configured)) throw new Error("PHASE5_REVISION_INVALID");
    return configured;
  }
  const status = (await execFile("git", ["status", "--porcelain", "--untracked-files=all"])).stdout;
  if (status.trim()) {
    throw new Error(
      "NOT EXECUTED: the worktree is dirty; commit the deployed revision or set PHASE5_REVISION explicitly",
    );
  }
  const revision = (await execFile("git", ["rev-parse", "HEAD"])).stdout.trim();
  if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error("PHASE5_REVISION_INVALID");
  return revision;
}

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function requiredArgument(name: string): string {
  const value = argument(name);
  if (!value) throw new Error(`NOT EXECUTED: ${name} is required`);
  return value;
}

function print(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
