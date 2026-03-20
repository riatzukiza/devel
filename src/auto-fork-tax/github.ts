import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { runCommand, runJsonCommand } from "./process";
import type { RepoSlug } from "./types";

const slugPattern = /^(?:https?:\/\/github\.com\/|ssh:\/\/git@github\.com\/|[^@\s]+@github\.com:)([^/]+)\/([^/.]+)(?:\.git)?$/i;

export const parseGithubSlug = (value: string): RepoSlug | null => {
  const trimmed = value.trim();
  const match = slugPattern.exec(trimmed);
  if (!match) {
    return null;
  }
  return {
    owner: match[1] ?? "",
    name: match[2] ?? "",
  };
};

export const formatHttpsSlug = ({ owner, name }: RepoSlug): string => `https://github.com/${owner}/${name}.git`;

export const formatRepoName = ({ owner, name }: RepoSlug): string => `${owner}/${name}`;

export const repoExists = async (slug: RepoSlug): Promise<boolean> => {
  const result = await runCommand("gh", ["repo", "view", formatRepoName(slug), "--json", "name"], {
    reject: false,
  });
  return result.exitCode === 0;
};

const ownerAccountType = async (owner: string): Promise<"User" | "Organization" | null> => {
  const result = await runCommand("gh", ["api", `users/${owner}`, "--jq", ".type"], {
    reject: false,
  });
  if (result.exitCode !== 0) {
    return null;
  }
  const value = result.stdout.trim();
  return value === "User" || value === "Organization" ? value : null;
};

export const ensureFork = async (source: RepoSlug, desiredOwner: string): Promise<RepoSlug> => {
  const forkSlug: RepoSlug = { owner: desiredOwner, name: source.name };
  if (await repoExists(forkSlug)) {
    return forkSlug;
  }

  const args = [
    "repo",
    "fork",
    formatRepoName(source),
    "--clone=false",
    "--default-branch-only",
  ];
  if ((await ownerAccountType(desiredOwner)) === "Organization") {
    args.splice(3, 0, "--org", desiredOwner);
  }

  await runCommand("gh", args);
  return forkSlug;
};

interface PullRequestSummary {
  readonly number: number;
  readonly url: string;
  readonly headRefName: string;
  readonly baseRefName: string;
}

export const findOpenPullRequestByHead = async (
  repo: RepoSlug,
  headBranch: string,
): Promise<PullRequestSummary | null> => {
  const result = await runCommand(
    "gh",
    [
      "pr",
      "list",
      "--repo",
      formatRepoName(repo),
      "--head",
      headBranch,
      "--state",
      "open",
      "--json",
      "number,url,headRefName,baseRefName",
    ],
    { reject: false },
  );
  if (result.exitCode !== 0 || result.stdout.trim().length === 0) {
    return null;
  }
  const prs = JSON.parse(result.stdout) as readonly PullRequestSummary[];
  return prs[0] ?? null;
};

export const createPullRequest = async (params: {
  readonly repo: RepoSlug;
  readonly baseBranch: string;
  readonly headBranch: string;
  readonly title: string;
  readonly body: string;
}): Promise<PullRequestSummary> => {
  const existing = await findOpenPullRequestByHead(params.repo, params.headBranch);
  if (existing) {
    return existing;
  }

  const result = await runCommand("gh", [
    "pr",
    "create",
    "--repo",
    formatRepoName(params.repo),
    "--base",
    params.baseBranch,
    "--head",
    params.headBranch,
    "--title",
    params.title,
    "--body",
    params.body,
  ]);

  const url = result.stdout.trim().split(/\s+/).find((token) => token.startsWith("https://"));
  if (!url) {
    throw new Error(`Unable to parse PR URL from gh output: ${result.stdout}`);
  }

  const summary = await runJsonCommand<PullRequestSummary>("gh", [
    "pr",
    "view",
    url,
    "--repo",
    formatRepoName(params.repo),
    "--json",
    "number,url,headRefName,baseRefName",
  ]);
  return summary;
};

export interface PullRequestContext {
  readonly title: string;
  readonly body: string;
  readonly url: string;
  readonly headRefName: string;
  readonly baseRefName: string;
  readonly files: ReadonlyArray<{ readonly path: string; readonly additions: number; readonly deletions: number }>;
  readonly diff: string;
}

export const loadPullRequestContext = async (repo: RepoSlug, pullRequestNumber: number): Promise<PullRequestContext> => {
  const view = await runJsonCommand<{
    readonly title: string;
    readonly body: string;
    readonly url: string;
    readonly headRefName: string;
    readonly baseRefName: string;
    readonly files: ReadonlyArray<{ readonly path: string; readonly additions: number; readonly deletions: number }>;
  }>("gh", [
    "pr",
    "view",
    String(pullRequestNumber),
    "--repo",
    formatRepoName(repo),
    "--json",
    "title,body,url,headRefName,baseRefName,files",
  ]);

  const diffResult = await runCommand("gh", [
    "pr",
    "diff",
    String(pullRequestNumber),
    "--repo",
    formatRepoName(repo),
  ]);

  return { ...view, diff: diffResult.stdout };
};

export const commentOnPullRequest = async (repo: RepoSlug, pullRequestNumber: number, body: string): Promise<string> => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "auto-fork-tax-comment-"));
  const bodyPath = path.join(tempDir, "comment.md");
  try {
    await writeFile(bodyPath, body, "utf8");
    const result = await runCommand("gh", [
      "pr",
      "comment",
      String(pullRequestNumber),
      "--repo",
      formatRepoName(repo),
      "--body-file",
      bodyPath,
    ]);
    return result.stdout.trim();
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};
