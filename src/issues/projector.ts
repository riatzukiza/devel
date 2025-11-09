#!/usr/bin/env bun

import { Octokit } from "@octokit/rest";
import { mkdir, readFile, writeFile, rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import process from "process";
import { URL } from "url";

type CliOptions = {
  outputRoot: string;
  repo?: string;
  type: "all" | "issues" | "prs";
  state: "open" | "closed" | "all";
  limit?: number;
  clean: boolean;
};

type SubmoduleRepo = {
  readonly path: string;
  readonly url: string;
  readonly owner: string;
  readonly name: string;
};

type BasicUser = { readonly login: string; readonly url: string } | undefined;

type IssueComment = {
  readonly id: number;
  readonly body: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly author: BasicUser;
};

type IssueThread = {
  readonly number: number;
  readonly title: string;
  readonly state: string;
  readonly url: string;
  readonly author: BasicUser;
  readonly labels: readonly string[];
  readonly assignees: readonly string[];
  readonly milestone?: string;
  readonly body: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly closedAt?: string;
  readonly comments: readonly IssueComment[];
};

type ReviewComment = {
  readonly id: number;
  readonly body: string;
  readonly path: string;
  readonly diffHunk: string;
  readonly position?: number | null;
  readonly originalLine?: number | null;
  readonly line?: number | null;
  readonly author: BasicUser;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly reviewId?: number | null;
};

type ReviewProjection = {
  readonly id: number;
  readonly state: string;
  readonly body: string;
  readonly submittedAt?: string;
  readonly author: BasicUser;
  readonly comments: readonly ReviewComment[];
};

type FileDiffProjection = {
  readonly filename: string;
  readonly status: string;
  readonly additions: number;
  readonly deletions: number;
  readonly changes: number;
  readonly patch?: string;
};

type PullRequestProjection = {
  readonly number: number;
  readonly title: string;
  readonly state: string;
  readonly url: string;
  readonly author: BasicUser;
  readonly body: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly mergedAt?: string | null;
  readonly draft: boolean;
  readonly headLabel: string;
  readonly baseLabel: string;
  readonly comments: readonly IssueComment[];
  readonly reviews: readonly ReviewProjection[];
  readonly files: readonly FileDiffProjection[];
};

type ProjectionSummary = {
  readonly repo: string;
  readonly issuesProjected: number;
  readonly prsProjected: number;
};

const DEFAULT_OUTPUT = "issues/org";

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("GITHUB_TOKEN is required to project issues/PRs.");
    process.exit(1);
  }

  const octokit = new Octokit({
    auth: token,
    userAgent: "devel-issues-projector",
  });

  if (opts.clean && existsSync(opts.outputRoot)) {
    console.log(`Cleaning output root ${opts.outputRoot}`);
    await rm(opts.outputRoot, { recursive: true, force: true });
  }

  await mkdir(opts.outputRoot, { recursive: true });

  const repos = await discoverSubmodules(opts.repo);
  if (!repos.length) {
    console.error("No matching repositories found under orgs/.");
    process.exit(1);
  }

  const summaries: ProjectionSummary[] = [];

  for (const repo of repos) {
    const repoSlug = `${repo.owner}/${repo.name}`;
    console.log(`\n→ Projecting ${repoSlug}`);
    const repoOutputRoot = path.join(opts.outputRoot, repo.owner, repo.name);
    await mkdir(repoOutputRoot, { recursive: true });

    let issuesProjected = 0;
    let prsProjected = 0;

    if (opts.type === "all" || opts.type === "issues") {
      const issues = await collectIssues(octokit, repo, opts.state, opts.limit);
      console.log(`  Issues fetched: ${issues.length}`);
      for (const issue of issues) {
        const folder = path.join(
          repoOutputRoot,
          "issues",
          `${issue.number}-${slugify(issue.title)}`,
        );
        await mkdir(folder, { recursive: true });
        const threadPath = path.join(folder, "thread.md");
        await writeIfChanged(threadPath, renderIssueThread(issue));
        issuesProjected += 1;
      }
    }

    if (opts.type === "all" || opts.type === "prs") {
      const prs = await collectPullRequests(octokit, repo, opts.state, opts.limit);
      console.log(`  Pull Requests fetched: ${prs.length}`);
      for (const pr of prs) {
        const folder = path.join(
          repoOutputRoot,
          "prs",
          `${pr.number}-${slugify(pr.title)}`,
        );
        const reviewsDir = path.join(folder, "reviews");
        const filesDir = path.join(folder, "files");
        await mkdir(folder, { recursive: true });
        await mkdir(reviewsDir, { recursive: true });
        await mkdir(filesDir, { recursive: true });

        await writeIfChanged(
          path.join(folder, "thread.md"),
          renderPullRequestThread(pr),
        );

        for (const review of pr.reviews) {
          const reviewPath = path.join(reviewsDir, `${review.id}.md`);
          await writeIfChanged(reviewPath, renderReview(review));
        }

        const commentsByFile = mapCommentsByFile(pr.reviews);
        for (const file of pr.files) {
          const target = path.join(filesDir, `${file.filename}.md`);
          await mkdir(path.dirname(target), { recursive: true });
          const relatedComments = commentsByFile.get(file.filename) ?? [];
          await writeIfChanged(target, renderFileDiff(file, relatedComments));
        }

        prsProjected += 1;
      }
    }

    summaries.push({ repo: repoSlug, issuesProjected, prsProjected });
  }

  console.log("\nProjection summary:");
  for (const summary of summaries) {
    console.log(
      `  ${summary.repo}: ${summary.issuesProjected} issue threads, ${summary.prsProjected} PR threads`,
    );
  }
}

function parseArgs(argv: readonly string[]): CliOptions {
  const opts: CliOptions = {
    outputRoot: DEFAULT_OUTPUT,
    type: "all",
    state: "all",
    clean: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--output":
        opts.outputRoot = requireValue(argv, ++i, "--output");
        break;
      case "--repo":
        opts.repo = requireValue(argv, ++i, "--repo");
        break;
      case "--type": {
        const value = requireValue(argv, ++i, "--type");
        if (!value.match(/^(all|issues|prs)$/)) {
          throw new Error(`Invalid --type value: ${value}`);
        }
        opts.type = value as CliOptions["type"];
        break;
      }
      case "--state": {
        const value = requireValue(argv, ++i, "--state");
        if (!value.match(/^(open|closed|all)$/)) {
          throw new Error(`Invalid --state value: ${value}`);
        }
        opts.state = value as CliOptions["state"];
        break;
      }
      case "--limit": {
        const raw = requireValue(argv, ++i, "--limit");
        const parsed = Number.parseInt(raw, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          throw new Error(`Invalid --limit value: ${raw}`);
        }
        opts.limit = parsed;
        break;
      }
      case "--clean":
        opts.clean = true;
        break;
      case "--help":
        printHelp();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return opts;
}

function printHelp(): void {
  console.log(`Usage: bun run src/issues/projector.ts [options]

Options:
  --output <dir>   Output root (default: ${DEFAULT_OUTPUT})
  --repo <owner/name>  Only project a single repository
  --type <all|issues|prs>  Which artifacts to project (default: all)
  --state <open|closed|all> Issue/PR state filter (default: all)
  --limit <n>      Limit number of issues and PRs per repo
  --clean          Remove output root before projection
  --help           Show this help message
`);
}

function requireValue(argv: readonly string[], idx: number, flag: string): string {
  const value = argv[idx];
  if (!value) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

async function discoverSubmodules(filter?: string): Promise<SubmoduleRepo[]> {
  const gitmodulesPath = path.join(process.cwd(), ".gitmodules");
  const content = await readFile(gitmodulesPath, "utf8");
  const lines = content.split(/\r?\n/);
  const entries: SubmoduleRepo[] = [];
  let currentPath: string | undefined;
  let currentUrl: string | undefined;

  const pushCurrent = (): void => {
    if (!currentPath || !currentUrl) {
      return;
    }
    const parsed = parseRemoteUrl(currentUrl);
    entries.push({ path: currentPath, url: currentUrl, ...parsed });
    currentPath = undefined;
    currentUrl = undefined;
  };

  for (const line of lines) {
    if (line.startsWith("[submodule")) {
      pushCurrent();
    } else if (line.includes("path")) {
      const [, value] = line.split("=");
      currentPath = value?.trim();
    } else if (line.includes("url")) {
      const [, value] = line.split("=");
      currentUrl = value?.trim();
    }
  }
  pushCurrent();

  const filtered = entries.filter((entry) => {
    if (!filter) {
      return true;
    }
    return `${entry.owner}/${entry.name}`.toLowerCase() === filter.toLowerCase();
  });

  return filter ? filtered : entries;
}

function parseRemoteUrl(url: string): { readonly owner: string; readonly name: string } {
  if (!url) {
    throw new Error("Remote URL is empty");
  }
  let hostPart = url;
  let pathPart: string | undefined;

  if (url.includes("://")) {
    const parsed = new URL(url);
    hostPart = parsed.host;
    pathPart = parsed.pathname;
  } else if (url.includes(":")) {
    const [host, pathCandidate] = url.split(":", 2);
    hostPart = host.split("@").pop() ?? host;
    pathPart = `/${pathCandidate}`;
  }

  if (!pathPart) {
    throw new Error(`Unable to parse remote URL: ${url}`);
  }

  const sanitized = pathPart.replace(/^\/+/, "").replace(/\.git$/, "");
  const [owner, name] = sanitized.split("/");
  if (!owner || !name) {
    throw new Error(`Invalid remote path derived from ${url}`);
  }
  return { owner, name };
}

async function collectIssues(
  octokit: Octokit,
  repo: SubmoduleRepo,
  state: "open" | "closed" | "all",
  limit?: number,
): Promise<IssueThread[]> {
  const issues: IssueThread[] = [];
  let processed = 0;

  for await (const response of octokit.paginate.iterator(
    octokit.issues.listForRepo,
    {
      owner: repo.owner,
      repo: repo.name,
      per_page: 100,
      state,
      direction: "asc",
    },
  )) {
    for (const issue of response.data) {
      if ((issue as { pull_request?: unknown }).pull_request) {
        continue;
      }

      const commentsResponse = await octokit.paginate(
        octokit.issues.listComments,
        {
          owner: repo.owner,
          repo: repo.name,
          issue_number: issue.number,
          per_page: 100,
        },
      );

      const comments: IssueComment[] = commentsResponse.map((comment) => ({
        id: comment.id,
        body: comment.body ?? "",
        createdAt: comment.created_at ?? "",
        updatedAt: comment.updated_at ?? undefined,
        author: comment.user
          ? { login: comment.user.login ?? "unknown", url: comment.user.html_url ?? "" }
          : undefined,
      }));

      issues.push({
        number: issue.number,
        title: issue.title ?? `Issue ${issue.number}`,
        state: issue.state ?? "unknown",
        url: issue.html_url ?? "",
        author: issue.user
          ? { login: issue.user.login ?? "unknown", url: issue.user.html_url ?? "" }
          : undefined,
        labels: (issue.labels ?? [])
          .map((label) => (typeof label === "string" ? label : label.name ?? ""))
          .filter(Boolean),
        assignees: (issue.assignees ?? [])
          .map((assignee) => assignee?.login)
          .filter((val): val is string => Boolean(val)),
        milestone: issue.milestone?.title ?? undefined,
        body: issue.body ?? "",
        createdAt: issue.created_at ?? "",
        updatedAt: issue.updated_at ?? "",
        closedAt: issue.closed_at ?? undefined,
        comments: comments.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      });

      processed += 1;
      if (limit && processed >= limit) {
        return issues;
      }
    }
  }

  return issues;
}

async function collectPullRequests(
  octokit: Octokit,
  repo: SubmoduleRepo,
  state: "open" | "closed" | "all",
  limit?: number,
): Promise<PullRequestProjection[]> {
  const pullRequests: PullRequestProjection[] = [];
  let processed = 0;

  for await (const response of octokit.paginate.iterator(
    octokit.pulls.list,
    {
      owner: repo.owner,
      repo: repo.name,
      per_page: 50,
      state,
      direction: "asc",
    },
  )) {
    for (const pr of response.data) {
      const commentsResponse = await octokit.paginate(
        octokit.issues.listComments,
        {
          owner: repo.owner,
          repo: repo.name,
          issue_number: pr.number,
          per_page: 100,
        },
      );

      const reviewsResponse = await octokit.paginate(
        octokit.pulls.listReviews,
        {
          owner: repo.owner,
          repo: repo.name,
          pull_number: pr.number,
          per_page: 100,
        },
      );

      const reviewCommentsResponse = await octokit.paginate(
        octokit.pulls.listReviewComments,
        {
          owner: repo.owner,
          repo: repo.name,
          pull_number: pr.number,
          per_page: 100,
        },
      );

      const filesResponse = await octokit.paginate(
        octokit.pulls.listFiles,
        {
          owner: repo.owner,
          repo: repo.name,
          pull_number: pr.number,
          per_page: 100,
        },
      );

      const comments: IssueComment[] = commentsResponse.map((comment) => ({
        id: comment.id,
        body: comment.body ?? "",
        createdAt: comment.created_at ?? "",
        updatedAt: comment.updated_at ?? undefined,
        author: comment.user
          ? { login: comment.user.login ?? "unknown", url: comment.user.html_url ?? "" }
          : undefined,
      }));

      const reviewComments = reviewCommentsResponse.map((comment) => ({
        id: comment.id,
        body: comment.body ?? "",
        path: comment.path ?? "",
        diffHunk: comment.diff_hunk ?? "",
        position: comment.position ?? null,
        originalLine: comment.original_line ?? null,
        line: (comment as { line?: number }).line ?? null,
        author: comment.user
          ? { login: comment.user.login ?? "unknown", url: comment.user.html_url ?? "" }
          : undefined,
        createdAt: comment.created_at ?? "",
        updatedAt: comment.updated_at ?? "",
        reviewId: comment.pull_request_review_id ?? null,
      }));

      const commentsGroupedByReview = groupCommentsByReview(reviewComments);

      const reviews: ReviewProjection[] = reviewsResponse.map((review) => ({
        id: review.id,
        state: review.state ?? "COMMENTED",
        body: review.body ?? "",
        submittedAt: review.submitted_at ?? undefined,
        author: review.user
          ? { login: review.user.login ?? "unknown", url: review.user.html_url ?? "" }
          : undefined,
        comments: (commentsGroupedByReview.get(review.id) ?? []).sort((a, b) =>
          (a.createdAt ?? "").localeCompare(b.createdAt ?? ""),
        ),
      }));

      const files: FileDiffProjection[] = filesResponse.map((file) => ({
        filename: file.filename,
        status: file.status ?? "modified",
        additions: file.additions ?? 0,
        deletions: file.deletions ?? 0,
        changes: file.changes ?? 0,
        patch: file.patch ?? undefined,
      }));

      pullRequests.push({
        number: pr.number,
        title: pr.title ?? `PR ${pr.number}`,
        state: pr.state ?? "open",
        url: pr.html_url ?? "",
        author: pr.user
          ? { login: pr.user.login ?? "unknown", url: pr.user.html_url ?? "" }
          : undefined,
        body: pr.body ?? "",
        createdAt: pr.created_at ?? "",
        updatedAt: pr.updated_at ?? "",
        mergedAt: (pr as { merged_at?: string | null }).merged_at ?? undefined,
        draft: Boolean((pr as { draft?: boolean }).draft),
        headLabel: `${pr.head?.label ?? pr.head?.ref ?? "unknown"}`,
        baseLabel: `${pr.base?.label ?? pr.base?.ref ?? "unknown"}`,
        comments: comments.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        reviews: reviews.sort((a, b) =>
          (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""),
        ),
        files,
      });

      processed += 1;
      if (limit && processed >= limit) {
        return pullRequests;
      }
    }
  }

  return pullRequests;
}

function groupCommentsByReview(
  comments: readonly ReviewComment[],
): Map<number, ReviewComment[]> {
  const map = new Map<number, ReviewComment[]>();
  for (const comment of comments) {
    const reviewId = comment.reviewId;
    if (!reviewId) {
      continue;
    }
    if (!map.has(reviewId)) {
      map.set(reviewId, []);
    }
    map.get(reviewId)?.push(comment);
  }
  return map;
}

function mapCommentsByFile(
  reviews: readonly ReviewProjection[],
): Map<string, ReviewComment[]> {
  const fileMap = new Map<string, ReviewComment[]>();
  for (const review of reviews) {
    for (const comment of review.comments) {
      if (!comment.path) {
        continue;
      }
      if (!fileMap.has(comment.path)) {
        fileMap.set(comment.path, []);
      }
      fileMap.get(comment.path)?.push(comment);
    }
  }
  for (const [, comments] of fileMap) {
    comments.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  }
  return fileMap;
}

function renderIssueThread(issue: IssueThread): string {
  const lines: string[] = [];
  lines.push(`# Issue #${issue.number}: ${issue.title}`);
  lines.push("");
  lines.push(`- State: ${issue.state}`);
  if (issue.closedAt) {
    lines.push(`- Closed: ${formatDate(issue.closedAt)}`);
  }
  lines.push(`- Author: ${formatAuthor(issue.author)}`);
  if (issue.labels.length) {
    lines.push(`- Labels: ${issue.labels.join(", ")}`);
  }
  if (issue.assignees.length) {
    lines.push(`- Assignees: ${issue.assignees.join(", ")}`);
  }
  if (issue.milestone) {
    lines.push(`- Milestone: ${issue.milestone}`);
  }
  lines.push(`- URL: ${issue.url}`);
  lines.push("");
  lines.push(`Opened ${formatDate(issue.createdAt)} — updated ${formatDate(issue.updatedAt)}`);
  lines.push("");
  lines.push("## Description");
  lines.push(issue.body.trim() ? issue.body.trim() : "_No description provided._");
  lines.push("");
  if (issue.comments.length) {
    lines.push("## Conversation");
    for (const comment of issue.comments) {
      lines.push(
        `### ${formatDate(comment.createdAt)} — ${formatAuthor(comment.author)} (#${comment.id})`,
      );
      lines.push(comment.body.trim() ? comment.body.trim() : "_No comment body._");
      lines.push("");
    }
  } else {
    lines.push("_No comments._");
  }
  return lines.join("\n");
}

function renderPullRequestThread(pr: PullRequestProjection): string {
  const lines: string[] = [];
  lines.push(`# PR #${pr.number}: ${pr.title}`);
  lines.push("");
  lines.push(`- State: ${pr.state}${pr.draft ? " (draft)" : ""}`);
  if (pr.mergedAt) {
    lines.push(`- Merged: ${formatDate(pr.mergedAt)}`);
  }
  lines.push(`- Author: ${formatAuthor(pr.author)}`);
  lines.push(`- Head: ${pr.headLabel}`);
  lines.push(`- Base: ${pr.baseLabel}`);
  lines.push(`- URL: ${pr.url}`);
  lines.push("");
  lines.push(`Opened ${formatDate(pr.createdAt)} — updated ${formatDate(pr.updatedAt)}`);
  lines.push("");

  lines.push("## Description");
  lines.push(pr.body.trim() ? pr.body.trim() : "_No description provided._");
  lines.push("");

  if (pr.comments.length) {
    lines.push("## Conversation");
    for (const comment of pr.comments) {
      lines.push(
        `### ${formatDate(comment.createdAt)} — ${formatAuthor(comment.author)} (#${comment.id})`,
      );
      lines.push(comment.body.trim() ? comment.body.trim() : "_No comment body._");
      lines.push("");
    }
  } else {
    lines.push("_No general PR comments._");
    lines.push("");
  }

  if (pr.reviews.length) {
    lines.push("## Reviews");
    for (const review of pr.reviews) {
      lines.push(
        `- Review #${review.id} (${review.state}) by ${formatAuthor(review.author)} at ${formatDate(review.submittedAt ?? "")}`,
      );
    }
  }

  return lines.join("\n");
}

function renderReview(review: ReviewProjection): string {
  const lines: string[] = [];
  lines.push(`# Review #${review.id} (${review.state})`);
  lines.push("");
  lines.push(`- Author: ${formatAuthor(review.author)}`);
  if (review.submittedAt) {
    lines.push(`- Submitted: ${formatDate(review.submittedAt)}`);
  }
  lines.push("");
  lines.push("## Summary");
  lines.push(review.body.trim() ? review.body.trim() : "_No summary provided._");
  lines.push("");

  if (!review.comments.length) {
    lines.push("_No inline comments._");
    return lines.join("\n");
  }

  lines.push("## Inline Comments");
  const byFile = groupBy(review.comments, (comment) => comment.path ?? "unknown");
  for (const [file, comments] of byFile) {
    lines.push("");
    lines.push(`### ${file}`);
    for (const comment of comments) {
      if (comment.diffHunk) {
        lines.push("```diff");
        lines.push(comment.diffHunk.trim());
        lines.push("```");
      }
      lines.push(
        `> ${formatAuthor(comment.author)} at ${formatDate(comment.createdAt)} (comment #${comment.id})`,
      );
      lines.push(comment.body.trim() ? comment.body.trim() : "_No comment body._");
      lines.push("");
    }
  }

  return lines.join("\n");
}

function renderFileDiff(
  file: FileDiffProjection,
  comments: readonly ReviewComment[],
): string {
  const lines: string[] = [];
  lines.push(`# ${file.filename}`);
  lines.push("");
  lines.push(`- Status: ${file.status}`);
  lines.push(`- Changes: +${file.additions} / -${file.deletions} (${file.changes} total)`);
  lines.push("");

  if (file.patch) {
    lines.push("```diff");
    lines.push(file.patch.trim());
    lines.push("```");
  } else {
    lines.push("_Binary or large file; diff not available._");
  }

  if (comments.length) {
    lines.push("");
    lines.push("## Inline Comments");
    for (const comment of comments) {
      if (comment.diffHunk) {
        lines.push("```diff");
        lines.push(comment.diffHunk.trim());
        lines.push("```");
      }
      lines.push(
        `> ${formatAuthor(comment.author)} (${formatDate(comment.createdAt)}) — review #${comment.reviewId ?? "n/a"}`,
      );
      lines.push(comment.body.trim() ? comment.body.trim() : "_No comment body._");
      lines.push("");
    }
  }

  return lines.join("\n");
}

function groupBy<T>(values: readonly T[], getKey: (value: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const value of values) {
    const key = getKey(value);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)?.push(value);
  }
  return map;
}

function slugify(input: string): string {
  const base = input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (base.length === 0) {
    return "untitled";
  }
  return base.slice(0, 80);
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return "unknown";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString();
}

function formatAuthor(user: BasicUser | undefined): string {
  if (!user) {
    return "unknown";
  }
  return user.login;
}

async function writeIfChanged(target: string, content: string): Promise<void> {
  await mkdir(path.dirname(target), { recursive: true });
  let existing: string | undefined;
  try {
    existing = await readFile(target, "utf8");
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code && code !== "ENOENT") {
      throw error;
    }
    existing = undefined;
  }
  if (existing === content) {
    return;
  }
  await writeFile(target, content, "utf8");
}

main().catch((error) => {
  console.error("Projection failed:", error);
  process.exit(1);
});
