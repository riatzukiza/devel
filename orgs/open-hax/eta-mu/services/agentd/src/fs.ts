import { promises as fs } from "fs";
import { existsSync, readFileSync } from "fs";
import path from "path";

const REPO_PATH = process.env.REPO_PATH!;

let submodulePaths: Set<string> | null = null;

function resolvePath(relPath: string) {
  const safeRel = relPath && relPath !== "." ? relPath : ".";
  const absolute = path.resolve(REPO_PATH, safeRel);
  const repoRoot = path.resolve(REPO_PATH);
  const relative = path.relative(repoRoot, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid path");
  }
  return { absolute, repoRoot };
}

async function statSafe(target: string) {
  try {
    return await fs.stat(target);
  } catch (e) {
    return null;
  }
}

function loadSubmodules() {
  if (submodulePaths) return submodulePaths;
  const gitmodulesPath = path.join(REPO_PATH, ".gitmodules");
  if (!existsSync(gitmodulesPath)) {
    submodulePaths = new Set();
    return submodulePaths;
  }

  const raw = readFileSync(gitmodulesPath, "utf8");
  const matches = [...raw.matchAll(/path\s*=\s*(.+)/g)];
  submodulePaths = new Set(matches.map(m => m[1].trim()));
  return submodulePaths;
}

async function isSubmoduleDir(relPath: string, absolutePath: string) {
  const subs = loadSubmodules();
  if (subs.has(relPath)) return true;
  const gitFile = path.join(absolutePath, ".git");
  if (existsSync(gitFile)) {
    try {
      const contents = readFileSync(gitFile, "utf8");
      return contents.includes("gitdir:");
    } catch {
      return false;
    }
  }
  return false;
}

export async function listFiles(relPath = ".") {
  const { absolute, repoRoot } = resolvePath(relPath);
  const entries = await fs.readdir(absolute, { withFileTypes: true });
  const results = [] as Array<{
    name: string;
    path: string;
    type: "file" | "dir";
    isSubmodule: boolean;
    size: number | null;
    mtime: number | null;
  }>;

  for (const entry of entries) {
    const entryAbs = path.join(absolute, entry.name);
    const entryRel = path.relative(repoRoot, entryAbs) || ".";
    const stats = await statSafe(entryAbs);
    const isDir = entry.isDirectory();
    const submodule = isDir && (await isSubmoduleDir(entryRel, entryAbs));
    results.push({
      name: entry.name,
      path: entryRel,
      type: isDir ? "dir" : "file",
      isSubmodule: submodule,
      size: stats ? stats.size : null,
      mtime: stats ? stats.mtimeMs : null
    });
  }

  return {
    path: relPath,
    entries: results.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "dir" ? -1 : 1;
    })
  };
}
