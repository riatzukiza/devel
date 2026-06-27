import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { EtaMuConfig, AutofixResult, GitHubEventContext, RepoSlug } from "./types.js";
import { runEtaMuAutofix } from "./pi-agent.js";

const execFileAsync = promisify(execFile);

const run = async (command: string, args: readonly string[], cwd?: string): Promise<string> => {
  const { stdout } = await execFileAsync(command, [...args], {
    cwd,
    env: process.env,
    maxBuffer: 16 * 1024 * 1024,
  });
  return stdout.trim();
};

const gitStatusFiles = async (cwd: string): Promise<readonly string[]> => {
  const output = await run("git", ["status", "--porcelain"], cwd);
  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
};

const gitAuthUrl = (repoFullName: string, token: string): string =>
  `https://x-access-token:${encodeURIComponent(token)}@github.com/${repoFullName}.git`;

const buildSystemPrompt = (): string => [
  "You are eta-mu, a highly capable autonomous pull-request fixer built on pi.",
  "Work only inside the checked-out repository.",
  "Resolve the requested code-review or user-requested change precisely.",
  "Prefer the smallest correct diff.",
  "Run the smallest relevant verification before finishing.",
  "Do not commit, push, or open pull requests; the wrapper handles git publication.",
  "When no code change is needed, leave the worktree unchanged and explain why briefly.",
].join("\n");

const buildPrompt = (context: GitHubEventContext, instructions: string): string => {
  const payload = {
    pullRequestNumber: context.pullRequestNumber,
    pullRequestTitle: context.pullRequestTitle,
    pullRequestUrl: context.pullRequestUrl,
    head: context.pullRequestHead,
    base: context.pullRequestBase,
    comment: context.comment,
    reviewSummary: context.reviewSummary,
    pullRequestFiles: context.pullRequestFiles,
    unresolvedReviewThreads: context.unresolvedReviewThreads,
    instructions,
  };
  return [
    "Autofix this pull request.",
    "",
    JSON.stringify(payload, null, 2),
    "",
    "Make the change directly in the repository, run minimal verification, and stop when the worktree reflects the fix.",
  ].join("\n");
};

const buildSummary = (result: { changedFiles: readonly string[]; commitSha?: string; summary: string; reason: string; pushed: boolean }): string => {
  const lines = [result.reason];
  if (result.commitSha) {
    lines.push(`commit: ${result.commitSha}`);
  }
  if (result.changedFiles.length > 0) {
    lines.push(`changed files: ${result.changedFiles.join(", ")}`);
  }
  if (result.summary) {
    lines.push(result.summary);
  }
  return lines.join("\n\n");
};

export const runAutofixForEvent = async (
  repo: RepoSlug,
  context: GitHubEventContext,
  instructions: string,
  config: EtaMuConfig,
  token: string,
): Promise<AutofixResult> => {
  if (!context.pullRequestNumber || !context.pullRequestHead?.ref || !context.pullRequestHead?.repoFullName) {
    return {
      applied: false,
      pushed: false,
      reason: "Eta-mu can only auto-fix pull request events with a concrete head ref.",
      changedFiles: [],
      summary: "",
    };
  }

  const canonicalRepo = `${repo.owner}/${repo.name}`.toLowerCase();
  const headRepo = context.pullRequestHead.repoFullName.toLowerCase();
  if (headRepo !== canonicalRepo) {
    return {
      applied: false,
      pushed: false,
      reason: `Eta-mu skipped auto-fix because the PR head repo (${context.pullRequestHead.repoFullName}) differs from the protected base repo (${repo.owner}/${repo.name}). Install eta-mu on the fork or ask for a manual follow-up branch instead.`,
      changedFiles: [],
      summary: "",
    };
  }

  const worktree = await mkdtemp(path.join(tmpdir(), "eta-mu-autofix-"));
  try {
    await run("git", ["clone", "--depth", "1", "--branch", context.pullRequestHead.ref, gitAuthUrl(context.pullRequestHead.repoFullName, token), worktree]);
    await writeFile(path.join(worktree, ".eta-mu-autofix-context.json"), JSON.stringify({ context, instructions }, null, 2), "utf8");

    const summary = await runEtaMuAutofix(
      worktree,
      buildSystemPrompt(),
      buildPrompt(context, instructions),
      config.modelProvider,
      config.modelId,
    );

    const changedFiles = await gitStatusFiles(worktree);
    if (changedFiles.length === 0) {
      return {
        applied: false,
        pushed: false,
        reason: "Eta-mu reviewed the request but did not produce any repository changes.",
        changedFiles,
        summary,
      };
    }

    await run("git", ["config", "user.name", config.commitAuthorName], worktree);
    await run("git", ["config", "user.email", config.commitAuthorEmail], worktree);
    await run("git", ["add", "-A"], worktree);
    await run("git", ["commit", "-m", `eta-mu: auto-fix PR #${context.pullRequestNumber}`], worktree);
    const commitSha = await run("git", ["rev-parse", "--short", "HEAD"], worktree);
    await run("git", ["push", "origin", `HEAD:${context.pullRequestHead.ref}`], worktree);

    return {
      applied: true,
      pushed: true,
      reason: "Eta-mu applied and pushed an autofix commit to the PR branch.",
      changedFiles,
      commitSha,
      summary: buildSummary({ changedFiles, commitSha, summary, reason: "Autofix completed", pushed: true }),
    };
  } finally {
    await rm(worktree, { recursive: true, force: true });
  }
};
