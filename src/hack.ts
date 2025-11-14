#!/usr/bin/env node

import { execSync } from "child_process";
import * as path from "path";
import { walkDir, listFiles, type FileEntry } from "@promethean-os/fs";
import fetch from "node-fetch";

const OLLOMA_API_URL =
  process.env.OLLAMA_API_URL || "http://localhost:11434/v1/chat/completions";
const MODEL = process.env.MODEL || "gpt-oss:20b-cloud";
const ROOT_DIR = process.argv[2] || ".";
const EXCLUDE = (process.env.EXCLUDE_DIRS || "").split(",");

type RepoInfo = {
  rootPath: string;
  parentRepo?: string;
};

/** run a shell command synchronously in cwd */
function run(cmd: string, cwd: string): string {
  return execSync(cmd, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/** detect if a directory is a git root (has a .git folder) */
function isGitRoot(dir: string): boolean {
  try {
    return require("fs").statSync(path.join(dir, ".git")).isDirectory();
  } catch {
    return false;
  }
}

/** find all git roots under `dir`, including nested ones */
function findAllGitRoots(dir: string): RepoInfo[] {
  const results: RepoInfo[] = [];
  const allEntries = walkDir(dir, { skip: EXCLUDE });
  for (const entry of allEntries) {
    if (entry.type === "directory") {
      const full = path.resolve(entry.path);
      if (isGitRoot(full)) {
        results.push({ rootPath: full });
      }
    }
  }
  // Optionally: sort by depth so parent repos appear before children
  results.sort(
    (a, b) =>
      a.rootPath.split(path.sep).length - b.rootPath.split(path.sep).length,
  );
  // Determine parent-child relationship
  for (let i = 0; i < results.length; i++) {
    const child = results[i];
    for (let j = 0; j < i; j++) {
      const parent = results[j];
      if (child.rootPath.startsWith(parent.rootPath + path.sep)) {
        child.parentRepo = parent.rootPath;
        break;
      }
    }
  }
  return results;
}

/** convert a nested repo into a submodule under its parent */
function convertToSubmodule(childPath: string, parentPath: string): void {
  console.log(
    `Converting nested repo ${childPath} into submodule of ${parentPath}`,
  );
  const rel = path.relative(parentPath, childPath);
  run(`git add ${rel}`, parentPath);
  run(`git submodule add ./ ${rel}`, parentPath);
  run(`git commit -m "Add submodule ${rel}"`, parentPath);
}

/** list worktrees for a repo root */
function listWorktrees(repoRoot: string): string[] {
  const out = run("git worktree list --porcelain", repoRoot);
  return out
    .split(/\r?\n/)
    .filter((l) => l.startsWith("worktree "))
    .map((l) => l.substr("worktree ".length).trim());
}

/** get unstaged diff for a working tree path */
function getUnstagedDiff(wtPath: string): string {
  try {
    return run("git diff", wtPath);
  } catch {
    return "";
  }
}

/** generate commit message via Ollama API */
async function generateCommitMessage(diff: string): Promise<string> {
  const systemPrompt = `You are a helpful assistant that writes concise, meaningful git commit messages.`;
  const userPrompt = `Here is a git diff of unstaged changes:\n\n${diff}\n\nWrite a clear and succinct commit message (50 characters or less recommended) summarizing the changes.`;
  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
  };
  const resp = await fetch(OLLOMA_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Ollama API error: ${resp.status} ${text}`);
  }
  const data = await resp.json();
  const msg = data.choices?.[0]?.message?.content;
  if (!msg)
    throw new Error(`No message in API response: ${JSON.stringify(data)}`);
  return msg.trim();
}

async function main(): Promise<void> {
  console.log(`Scanning directory tree: ${ROOT_DIR}`);
  const repos = findAllGitRoots(path.resolve(ROOT_DIR));
  console.log(`Detected ${repos.length} Git roots.`);

  for (const repo of repos) {
    console.log(`\nRepository root: ${repo.rootPath}`);
    if (repo.parentRepo) {
      console.log(`  Nested inside: ${repo.parentRepo}`);
      convertToSubmodule(repo.rootPath, repo.parentRepo);
    }

    const worktrees = listWorktrees(repo.rootPath);
    if (worktrees.length === 0) {
      // include the root itself as a “worktree”
      worktrees.push(repo.rootPath);
    }
    console.log(`  Worktrees: ${worktrees.join(", ")}`);

    for (const wt of worktrees) {
      console.log(`    Checking worktree: ${wt}`);
      const diff = getUnstagedDiff(wt);
      if (!diff) {
        console.log(`      No unstaged changes.`);
        continue;
      }
      console.log(`      Found unstaged changes — generating commit message.`);
      try {
        const msg = await generateCommitMessage(diff);
        console.log(`      → Generated message: "${msg}"`);
        // Optionally: write msg to file or commit automatically:
        // run(`git commit -am "${msg}"`, wt);  // if you want auto-commit
      } catch (err) {
        console.error(`      Error generating commit message:`, err);
      }
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
