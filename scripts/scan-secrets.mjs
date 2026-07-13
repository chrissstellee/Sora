import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const generatedRoots = ["apps/web/.next/static", "evidence", "logs"];
const allowedExtensions = new Set([
  ".cjs",
  ".css",
  ".env",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".log",
  ".map",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".txt",
  ".xdr",
  ".yaml",
  ".yml",
]);
const rules = [
  ["stellar-secret-seed", /S[A-Z2-7]{55}/],
  ["production-api-key", /sk_live_[A-Za-z0-9_-]+/],
  ["private-key-marker", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["credential-assignment", /(?:secret|seed|private[_-]?key)\s*[:=]\s*["'][^"']{16,}["']/i],
];

function walk(path, output) {
  if (!existsSync(path)) return;
  if (statSync(path).isFile()) {
    output.add(path);
    return;
  }
  for (const name of readdirSync(path)) {
    if (["node_modules", ".git", ".turbo", "coverage"].includes(name)) continue;
    walk(join(path, name), output);
  }
}

const files = new Set();
const tracked = spawnSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], {
  encoding: "utf8",
});
const deleted = spawnSync("git", ["ls-files", "-d", "-z"], { encoding: "utf8" });
if (tracked.status !== 0 || deleted.status !== 0) {
  console.error("Secret scan failed closed: Git file enumeration was unsuccessful.");
  process.exit(1);
}
const deletedFiles = new Set(deleted.stdout.split("\0").filter(Boolean));
for (const file of tracked.stdout.split("\0").filter(Boolean)) {
  if (
    !deletedFiles.has(file) &&
    !file.startsWith(".agents/") &&
    !file.startsWith(".codex/") &&
    !file.includes("node_modules/") &&
    file !== "pnpm-lock.yaml"
  ) {
    files.add(file);
  }
}
for (const root of generatedRoots) walk(root, files);

const findings = [];
for (const file of files) {
  if (!allowedExtensions.has(extname(file)) && !file.endsWith(".env.example")) continue;
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    findings.push({ file: relative(process.cwd(), file), category: "unreadable-file" });
    continue;
  }
  for (const [category, pattern] of rules) {
    if (pattern.test(content)) findings.push({ file: relative(process.cwd(), file), category });
  }
}

if (findings.length) {
  console.error(`Secret scan failed with ${findings.length} redacted finding(s):`);
  for (const finding of findings) console.error(`- ${finding.file}: ${finding.category}`);
  process.exit(1);
}
console.log(`Secret scan passed (${files.size} files checked; matched values are never printed).`);
