import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { formatRepoName, loadPullRequestContext, type PullRequestContext } from "./github";
import { runCommand } from "./process";
import type { RepoSlug } from "./types";

export interface PiReviewOptions {
  readonly repo: RepoSlug;
  readonly pullRequestNumber: number;
  readonly model: string;
  readonly cwd: string;
}

const MAX_REVIEW_DIFF_CHARS = 4_000;

const buildReviewPrompt = (repo: RepoSlug, pullRequestNumber: number, context: PullRequestContext): string => {
  const fileSummary = context.files
    .slice(0, 100)
    .map((file) => `- ${file.path} (+${file.additions} / -${file.deletions})`)
    .join("\n");

  const diff = context.diff.length > MAX_REVIEW_DIFF_CHARS
    ? `${context.diff.slice(0, MAX_REVIEW_DIFF_CHARS)}\n…[truncated]`
    : context.diff;

  return [
    `# Auto Fork Tax Review`,
    ``,
    `Repository: ${formatRepoName(repo)}`,
    `PR: #${pullRequestNumber} ${context.url}`,
    `Base: ${context.baseRefName}`,
    `Head: ${context.headRefName}`,
    `Title: ${context.title}`,
    ``,
    `## Body`,
    context.body || `(no body)`,
    ``,
    `## Files`,
    fileSummary || `(no files)`,
    ``,
    `## Instructions`,
    `Review this PR like a strict but constructive code review agent. Focus on:`,
    `1. safety and automation hazards`,
    `2. git / branch / PR protocol mistakes`,
    `3. missing verification or rollback paths`,
    `4. correctness bugs or fragile assumptions`,
    `5. whether this should be blocked, cautioned, or approved`,
    ``,
    `Return markdown with exactly these sections:`,
    `- Summary`,
    `- Risks`,
    `- Missing Checks`,
    `- Verdict`,
    ``,
    `Use short bullets. Be direct.`,
    ``,
    `## Diff`,
    diff,
  ].join("\n");
};

export const runPiReview = async (options: PiReviewOptions): Promise<string> => {
  const context = await loadPullRequestContext(options.repo, options.pullRequestNumber);
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "pi-auto-fork-tax-review-"));
  const promptPath = path.join(tempDir, "prompt.md");
  try {
    await writeFile(promptPath, buildReviewPrompt(options.repo, options.pullRequestNumber, context), "utf8");
    const result = await runCommand("pi", [
      "-p",
      "--no-session",
      "--no-tools",
      "--model",
      options.model,
      "--thinking",
      "minimal",
      `@${promptPath}`,
    ], {
      cwd: options.cwd,
      env: process.env,
    });
    return result.stdout.trim();
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};
