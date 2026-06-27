import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";

const REPO_PATH = process.env.REPO_PATH!;
const WORKTREE_BASE_DIR = process.env.WORKTREE_BASE_DIR || "worktrees";

export function getRepoInfo() {
  if (!existsSync(REPO_PATH)) {
    return { error: "Repository not found", path: REPO_PATH };
  }

  try {
    const remotes = execSync("git remote -v", { cwd: REPO_PATH, encoding: "utf8" })
      .trim()
      .split("\n")
      .map(line => {
        const [name, url, type] = line.split(/\s+/);
        return { name, url, type: type.replace("(", "").replace(")", "") };
      });

    const branches = execSync("git branch -a", { cwd: REPO_PATH, encoding: "utf8" })
      .trim()
      .split("\n")
      .map(line => line.replace(/^\*?\s+/, "").trim());

    const currentBranch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: REPO_PATH, encoding: "utf8" }).trim();

    const recentCommits = execSync("git log --oneline -10", { cwd: REPO_PATH, encoding: "utf8" })
      .trim()
      .split("\n")
      .map(line => {
        const [hash, ...message] = line.split(" ");
        return { hash, message: message.join(" ") };
      });

    const status = execSync("git status --porcelain", { cwd: REPO_PATH, encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(line => line.length > 0);

    return {
      path: REPO_PATH,
      slug: process.env.REPO_SLUG || "unknown/unknown",
      remotes,
      branches,
      currentBranch,
      recentCommits,
      status,
      isClean: status.length === 0
    };
  } catch (error) {
    return { error: String(error), path: REPO_PATH };
  }
}

export async function createWorktree(issue: number) {
  const branch = `issue/${issue}`;
  const path = `${WORKTREE_BASE_DIR}/${issue}`;
  
  // For now, return a mock response to test frontend functionality
  // TODO: Fix git execution environment issues
  console.log("Mock worktree creation for issue:", issue);
  return { 
    branch, 
    path,
    mock: true,
    message: "Mock worktree created - git execution disabled due to environment issues"
  };
}

export async function runTaskInWorktree(worktreePath: string, command: string) {
  const fullPath = path.join(REPO_PATH, worktreePath);
  execSync(command, { cwd: fullPath, stdio: "inherit" });
}

export async function pushBranch(branch: string) {
  execSync(`git push origin ${branch}`, { cwd: REPO_PATH, stdio: "inherit" });
}

export function getWorktreeConfig() {
  return {
    baseDir: WORKTREE_BASE_DIR,
    repoPath: REPO_PATH
  };
}

export function listWorktrees() {
  try {
    // Mock worktrees for testing - TODO: Fix git execution environment
    console.log("Mock worktrees list - git execution disabled");
    return [
      {
        path: "worktrees/3870",
        branch: "issue/3870",
        issue: 3870,
        commit: "abc123"
      }
    ];
  } catch (error) {
    console.error("Error listing worktrees:", error);
    return [];
  }
}
