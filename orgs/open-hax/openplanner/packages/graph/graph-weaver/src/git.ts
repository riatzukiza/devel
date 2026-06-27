import { spawn } from "node:child_process";

function normalizeRepoPath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

const ignoredRepoDirs = new Set([
  ".pnpm-store",
  ".clj-kondo",
  ".cpcache",
  ".shadow-cljs",
  "node_modules",
  "dist",
  "target",
]);

function isIgnoredRepoPath(filePath: string): boolean {
  const normalized = normalizeRepoPath(filePath);
  const parts = normalized.split("/");
  return parts.some((part) => ignoredRepoDirs.has(part));
}

function runGitZ(args: string[], cwd: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];
    child.stdout.on("data", (c) => chunks.push(Buffer.from(c)));
    child.stderr.on("data", (c) => errChunks.push(Buffer.from(c)));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(Buffer.concat(errChunks).toString("utf8") || `git ${args.join(" ")} failed`));
        return;
      }
      const out = Buffer.concat(chunks);
      const parts = out
        .toString("utf8")
        .split("\u0000")
        .map((p) => p.trim())
        .filter(Boolean);
      resolve(parts);
    });
  });
}

function runGitText(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];
    child.stdout.on("data", (c) => chunks.push(Buffer.from(c)));
    child.stderr.on("data", (c) => errChunks.push(Buffer.from(c)));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(Buffer.concat(errChunks).toString("utf8") || `git ${args.join(" ")} failed`));
        return;
      }
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
  });
}

export async function repoRootFromGit(cwd: string): Promise<string | null> {
  try {
    const rows = await runGitZ(["rev-parse", "--show-toplevel"], cwd);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function listRepoFiles(repoRoot: string): Promise<string[]> {
  const tracked = await runGitZ(["ls-files", "-z", "--recurse-submodules"], repoRoot);
  const set = new Set<string>(tracked.filter((file) => !isIgnoredRepoPath(file)).map(normalizeRepoPath));

  // Root repo untracked (git does *not* support --recurse-submodules with --others).
  const untrackedRoot = await runGitZ(["ls-files", "-z", "--others", "--exclude-standard"], repoRoot);
  for (const file of untrackedRoot) {
    if (!isIgnoredRepoPath(file)) set.add(normalizeRepoPath(file));
  }

  // Submodule untracked (best-effort).
  let submoduleLines = "";
  try {
    submoduleLines = await runGitText(["submodule", "status", "--recursive"], repoRoot);
  } catch {
    submoduleLines = "";
  }
  const submodulePaths = submoduleLines
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(/\s+/)[1])
    .filter((p): p is string => Boolean(p));

  for (const subPath of submodulePaths) {
    const abs = `${repoRoot}/${subPath}`;
    let rows: string[] = [];
    try {
      rows = await runGitZ(["ls-files", "-z", "--others", "--exclude-standard"], abs);
    } catch {
      continue;
    }
    for (const rel of rows) {
      const joined = normalizeRepoPath(`${subPath}/${rel}`);
      if (!isIgnoredRepoPath(joined)) set.add(joined);
    }
  }

  return [...set.values()].sort((a, b) => a.localeCompare(b));
}
