import { access, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { parseGitmodules } from "../nss/gitmodules";
import { runCommand } from "./process";

const expandHome = (value: string): string => {
  if (value === "~") {
    return os.homedir();
  }
  if (value.startsWith("~/")) {
    return path.join(os.homedir(), value.slice(2));
  }
  return value;
};

export interface BootstrapCloneOptions {
  readonly sourceRoot: string;
  readonly cloneDir: string;
  readonly branch: string;
  readonly installHooks: boolean;
}

export interface BootstrapCloneResult {
  readonly cloneDir: string;
  readonly branch: string;
  readonly originUrl: string;
  readonly action: "cloned" | "updated";
}

const installDependencies = async (cwd: string): Promise<void> => {
  await runCommand("pnpm", ["install", "--no-frozen-lockfile", "--ignore-scripts"], {
    cwd,
    reject: false,
  });
};

const topLevelSubmodulePaths = async (cwd: string): Promise<readonly string[]> => {
  try {
    const content = await readFile(path.join(cwd, ".gitmodules"), "utf8");
    return parseGitmodules(content).map((record) => record.path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const syncSubmodules = async (cwd: string): Promise<void> => {
  await runCommand("git", ["submodule", "sync", "--recursive"], { cwd, reject: false });
  for (const submodulePath of await topLevelSubmodulePaths(cwd)) {
    await runCommand("git", ["submodule", "update", "--init", "--", submodulePath], {
      cwd,
      reject: false,
    });
  }
  await runCommand(
    "git",
    [
      "submodule",
      "foreach",
      "--quiet",
      "git reset --hard HEAD >/dev/null 2>&1 || true; git submodule sync --recursive >/dev/null 2>&1 || true; git submodule update --init --recursive >/dev/null 2>&1 || true; git reset --hard HEAD >/dev/null 2>&1 || true",
    ],
    { cwd, reject: false },
  );
};

const pathExists = async (target: string): Promise<boolean> => {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
};

const isGitRepo = async (cwd: string): Promise<boolean> => {
  const result = await runCommand("git", ["rev-parse", "--git-dir"], { cwd, reject: false });
  return result.exitCode === 0;
};

const ensureClean = async (cwd: string): Promise<void> => {
  const result = await runCommand("git", ["status", "--porcelain"], { cwd });
  if (result.stdout.trim().length > 0) {
    throw new Error(`automation clone at ${cwd} is dirty; refusing to reset it`);
  }
};

export const bootstrapClone = async (options: BootstrapCloneOptions): Promise<BootstrapCloneResult> => {
  const cloneDir = path.resolve(expandHome(options.cloneDir));
  const originUrl = (await runCommand("git", ["remote", "get-url", "origin"], { cwd: options.sourceRoot })).stdout.trim();

  if (!(await pathExists(cloneDir))) {
    await runCommand("git", [
      "clone",
      "--branch",
      options.branch,
      "--single-branch",
      originUrl,
      cloneDir,
    ]);
    await syncSubmodules(cloneDir);
    await installDependencies(cloneDir);
    if (options.installHooks) {
      await runCommand("pnpm", ["hooks:install"], { cwd: cloneDir, reject: false });
    }
    return {
      cloneDir,
      branch: options.branch,
      originUrl,
      action: "cloned",
    };
  }

  if (!(await isGitRepo(cloneDir))) {
    throw new Error(`${cloneDir} exists but is not a git repository`);
  }

  await ensureClean(cloneDir);
  await runCommand("git", ["fetch", "origin", "--tags"], { cwd: cloneDir });
  await runCommand("git", ["checkout", options.branch], { cwd: cloneDir });
  await runCommand("git", ["reset", "--hard", `origin/${options.branch}`], { cwd: cloneDir });
  await syncSubmodules(cloneDir);
  await installDependencies(cloneDir);
  if (options.installHooks) {
    await runCommand("pnpm", ["hooks:install"], { cwd: cloneDir, reject: false });
  }
  return {
    cloneDir,
    branch: options.branch,
    originUrl,
    action: "updated",
  };
};
