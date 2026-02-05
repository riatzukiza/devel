import { execSync, spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const [target, ...flags] = process.argv.slice(2);
const printOnly = flags.includes("--print");
if (!target) {
  console.error("Usage: node scripts/nx-affected.mjs <target>");
  process.exit(2);
}

const ROOT = process.cwd();

const CHANGES_COMMANDS = ["git diff --name-only", "git diff --name-only --cached"];
const UNTRACKED_COMMAND = "git ls-files --others --exclude-standard";

const EXCLUDE_PREFIXES = [
  ".clobber/",
  ".codex/",
  ".reconstitute/",
  ".sisyphus/",
  "archives/",
  "docs/notes/",
  "node_modules/",
  "tmp/",
  "temp/",
];

const EXCLUDE_CONTAINS = ["/.clj-kondo/"];
const ORGS_UNTRACKED_ALLOWED_SEGMENTS = [
  "/src/",
  "/packages/",
  "/services/",
  "/tools/",
  "/scripts/",
  "/config/",
  "/docs/",
];

const files = new Set();
const submoduleRoots = new Set();
const submoduleProjectMap = new Map();

function readGitLines(command, cwd = ROOT) {
  try {
    const output = execSync(command, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function shouldInclude(path, isUntracked) {
  if (EXCLUDE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return false;
  }
  if (EXCLUDE_CONTAINS.some((segment) => path.includes(segment))) {
    return false;
  }
  if (!isUntracked) {
    return true;
  }
  if (path.startsWith("orgs/")) {
    return ORGS_UNTRACKED_ALLOWED_SEGMENTS.some((segment) => path.includes(segment));
  }
  if (path.startsWith("tools/") || path.startsWith("scripts/")) {
    return true;
  }
  if (path.startsWith(".opencode/") || path.startsWith(".github/")) {
    return true;
  }
  if (path.startsWith("ecosystems/") || path.startsWith("config/") || path.startsWith("spec/")) {
    return true;
  }
  return [
    "AGENTS.md",
    "README.md",
    "package.json",
    "pnpm-workspace.yaml",
    "nx.json",
    ".nxignore",
    ".marksman.toml",
    ".ignore",
    ".gitmodules",
  ].includes(path);
}

function addFiles(paths, prefix = "", isUntracked = false) {
  for (const file of paths) {
    const normalized = prefix ? `${prefix}/${file}` : file;
    if (submoduleRoots.has(normalized)) {
      files.add(`${normalized}/.gitmodules`);
      continue;
    }
    if (shouldInclude(normalized, isUntracked)) {
      files.add(normalized);
    }
  }
}

function readSubmodules() {
  const gitmodulesPath = join(ROOT, ".gitmodules");
  if (!existsSync(gitmodulesPath)) return [];
  const content = readFileSync(gitmodulesPath, "utf8");
  return [...content.matchAll(/^\s*path\s*=\s*(.+)$/gm)]
    .map((match) => match[1]?.trim())
    .filter((path) => Boolean(path));
}

function pathToNxName(path) {
  return path.replace(/[^A-Za-z0-9]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase();
}

const submodulePaths = readSubmodules();
for (const subPath of submodulePaths) {
  submoduleRoots.add(subPath);
  if (subPath.startsWith("orgs/")) {
    submoduleProjectMap.set(pathToNxName(subPath), subPath);
  }
}

for (const command of CHANGES_COMMANDS) {
  addFiles(readGitLines(command));
}
addFiles(readGitLines(UNTRACKED_COMMAND), "", true);

for (const subPath of submodulePaths) {
  const absPath = join(ROOT, subPath);
  if (!existsSync(absPath)) continue;
  for (const command of CHANGES_COMMANDS) {
    addFiles(readGitLines(command, absPath), subPath);
  }
}

const changedFiles = Array.from(files).sort();
if (changedFiles.length === 0) {
  console.log("No uncommitted changes detected; skipping nx affected.");
  process.exit(0);
}

if (printOnly) {
  console.log(changedFiles.join("\n"));
  process.exit(0);
}

const affectedResult = spawnSync(
  "pnpm",
  [
    "exec",
    "nx",
    "show",
    "projects",
    "--affected",
    `--files=${changedFiles.join(",")}`,
  ],
  { encoding: "utf8", env: { ...process.env, NX_DAEMON: "false" } }
);

if (affectedResult.status !== 0) {
  console.error(affectedResult.stderr ?? "");
  process.exit(affectedResult.status ?? 1);
}

const affectedProjects = (affectedResult.stdout ?? "")
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

if (affectedProjects.length === 0) {
  console.log("No affected projects detected; skipping nx affected.");
  process.exit(0);
}

const submoduleTargets = [];
const nxTargets = [];

for (const project of affectedProjects) {
  const subPath = submoduleProjectMap.get(project);
  if (subPath) {
    submoduleTargets.push(subPath);
    continue;
  }
  if (project === "devel") {
    continue;
  }
  nxTargets.push(project);
}

let exitCode = 0;

for (const subPath of submoduleTargets) {
  const result = spawnSync(
    "bun",
    ["run", "src/giga/run-submodule.ts", subPath, target],
    { stdio: "inherit" }
  );
  if (result.status !== 0) {
    exitCode = result.status ?? 1;
  }
}

if (nxTargets.length > 0) {
  const result = spawnSync(
    "pnpm",
    ["exec", "nx", "run-many", `--target=${target}`, `--projects=${nxTargets.join(",")}`],
    { stdio: "inherit", env: { ...process.env, NX_DAEMON: "false" } }
  );
  if (result.status !== 0) {
    exitCode = result.status ?? 1;
  }
}

process.exit(exitCode);
