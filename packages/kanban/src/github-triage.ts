import { buildKanbanTitle, defaultStatusOrder, type KanbanStatus, toKanbanStateLabel } from "./fsm.js";

type GitHubLabel = string | { name?: string | null };

type GitHubUser = {
  login?: string | null;
  is_bot?: boolean;
  name?: string | null;
};

type GitHubCheck = {
  __typename?: string;
  name?: string;
  workflowName?: string;
  conclusion?: string | null;
  context?: string;
  state?: string | null;
};

export interface GitHubIssueSummary {
  number: number;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  state?: string;
  author?: GitHubUser;
  labels?: GitHubLabel[];
  comments?: unknown[];
}

export interface GitHubPrSummary {
  number: number;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  state?: string;
  author?: GitHubUser;
  labels?: GitHubLabel[];
  isDraft?: boolean;
  reviewDecision?: string;
  mergeStateStatus?: string;
  statusCheckRollup?: GitHubCheck[];
  headRefName?: string;
  baseRefName?: string;
}

export interface GitHubRepoSweep {
  owner_repo: string;
  issueCount?: number;
  prCount?: number;
  issues?: GitHubIssueSummary[];
  prs?: GitHubPrSummary[];
  paths?: string[];
  urls?: string[];
}

export interface GitHubSweepSnapshot {
  generatedAt?: string;
  repos: GitHubRepoSweep[];
  excluded?: unknown[];
  errors?: unknown[];
}

export interface GitHubRefinementOptions {
  now?: Date;
  excludeRepos?: string[];
  collapseMirrors?: boolean;
  mirrorGroups?: Record<string, string>;
}

export interface GitHubRefinedItem {
  id: string;
  canonicalRepo: string;
  repos: string[];
  kind: "issue" | "pr";
  number: number;
  title: string;
  url: string;
  author?: string;
  ageDays: number;
  idleDays: number;
  proposedStatus: KanbanStatus;
  proposedPriority: "P0" | "P1" | "P2" | "P3";
  currentLabels: string[];
  proposedLabels: string[];
  reasoning: string[];
}

export interface GitHubRepoRefinementSummary {
  repo: string;
  itemCount: number;
  issueCount: number;
  prCount: number;
  byStatus: Record<string, number>;
}

export interface GitHubRefinementResult {
  generatedAt: string;
  inputGeneratedAt?: string;
  excludedRepos: string[];
  collapsedMirrorGroups: Record<string, string>;
  repoSummaries: GitHubRepoRefinementSummary[];
  items: GitHubRefinedItem[];
}

const defaultMirrorGroups: Record<string, string> = {
  "octave-commons/promethean": "octave-commons/promethean",
  "riatzukiza/promethean": "octave-commons/promethean",
  "open-hax/openhax": "open-hax/openhax",
  "riatzukiza/openhax": "open-hax/openhax"
};

const securityPattern = /security|credential|secret|plaintext|token|symlink|sandbox escape|vulnerab|leak/i;
const criticalPattern = /critical|data loss|crash|abort|mutual exclusion|hang|timeout/i;
const bugPattern = /\bbug\b|failure|fails|broken|error|crash|leak|regression/i;
const enhancementPattern = /feature|enhancement|dashboard|metrics|auto-update|richer|add /i;
const placeholderPattern = /^testing$/i;

const priorityOrder: Record<GitHubRefinedItem["proposedPriority"], number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3
};

const parseDate = (value: string | undefined, fallback: Date): Date => {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

const ageInDays = (from: Date, to: Date): number =>
  Math.max(0, Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));

const extractLabelNames = (labels: GitHubLabel[] | undefined): string[] =>
  Array.from(
    new Set(
      (labels ?? [])
        .map((label) => (typeof label === "string" ? label : label?.name ?? ""))
        .map((label) => label.trim())
        .filter(Boolean)
    )
  );

const normalizeForMatch = (value: string): string => value.trim().toLowerCase();

const hasLabel = (labels: readonly string[], ...candidates: string[]): boolean => {
  const normalized = labels.map(normalizeForMatch);
  return candidates.some((candidate) => normalized.includes(normalizeForMatch(candidate)));
};

const mergePriority = (
  left: GitHubRefinedItem["proposedPriority"],
  right: GitHubRefinedItem["proposedPriority"]
): GitHubRefinedItem["proposedPriority"] => (priorityOrder[left] <= priorityOrder[right] ? left : right);

const derivePriority = (title: string, labels: readonly string[]): GitHubRefinedItem["proposedPriority"] => {
  let priority: GitHubRefinedItem["proposedPriority"] = "P3";

  const loweredLabels = labels.map(normalizeForMatch);
  for (const label of loweredLabels) {
    if (["p0", "priority-p0", "priority:p0"].includes(label)) {
      priority = mergePriority(priority, "P0");
    }
    if (["p1", "priority-p1", "priority:p1", "prio:high", "priority-high"].includes(label)) {
      priority = mergePriority(priority, "P1");
    }
    if (["p2", "priority-p2", "priority:p2", "priority-medium"].includes(label)) {
      priority = mergePriority(priority, "P2");
    }
    if (["p3", "priority-p3", "priority:p3", "priority-low"].includes(label)) {
      priority = mergePriority(priority, "P3");
    }
  }

  if (securityPattern.test(title)) {
    priority = mergePriority(priority, "P0");
  } else if (criticalPattern.test(title)) {
    priority = mergePriority(priority, "P1");
  } else if (bugPattern.test(title)) {
    priority = mergePriority(priority, "P2");
  }

  return priority;
};

const collectCheckFailures = (checks: GitHubCheck[] | undefined): string[] => {
  const failures: string[] = [];

  for (const check of checks ?? []) {
    if (check.__typename === "CheckRun") {
      if (["FAILURE", "TIMED_OUT", "CANCELLED", "ACTION_REQUIRED", "STARTUP_FAILURE"].includes(check.conclusion ?? "")) {
        failures.push(check.name ?? check.workflowName ?? "check-run");
      }
      continue;
    }

    if (check.__typename === "StatusContext" && ["FAILURE", "ERROR", "EXPECTED"].includes(check.state ?? "")) {
      failures.push(check.context ?? "status-context");
    }
  }

  return failures;
};

const buildBaseLabels = (
  kind: GitHubRefinedItem["kind"],
  status: KanbanStatus,
  priority: GitHubRefinedItem["proposedPriority"]
): string[] => ["kanban", `artifact:${kind}`, toKanbanStateLabel(status), `priority:${priority}`];

const classifyIssue = (
  repo: string,
  issue: GitHubIssueSummary,
  ageDays: number,
  idleDays: number
): Omit<GitHubRefinedItem, "id" | "canonicalRepo" | "repos"> => {
  const currentLabels = extractLabelNames(issue.labels);
  const author = issue.author?.login ?? undefined;
  const reasoning: string[] = [];
  let proposedStatus: KanbanStatus = "incoming";
  let proposedPriority = derivePriority(issue.title, currentLabels);
  const proposedLabels = new Set<string>();

  if (author === "app/coderabbitai") {
    proposedLabels.add("source:coderabbit");
    proposedLabels.add("triage:cluster-candidate");
    reasoning.push("Bot-generated review follow-up should be clustered with its source PR/date.");
  }

  if (placeholderPattern.test(issue.title.trim())) {
    proposedStatus = "rejected";
    proposedLabels.add("triage:placeholder");
    reasoning.push("Placeholder/test issue does not describe a durable unit of work.");
  } else if (hasLabel(currentLabels, "blocked")) {
    proposedStatus = "blocked";
    proposedPriority = mergePriority(proposedPriority, "P2");
    reasoning.push("Existing labels already mark this work as blocked.");
  } else if (securityPattern.test(issue.title)) {
    proposedStatus = "breakdown";
    proposedPriority = mergePriority(proposedPriority, "P0");
    proposedLabels.add("kind:bug");
    proposedLabels.add("risk:security");
    reasoning.push("Security or secret-handling risk should be actively refined before implementation.");
  } else if (criticalPattern.test(issue.title)) {
    proposedStatus = "breakdown";
    proposedPriority = mergePriority(proposedPriority, "P1");
    proposedLabels.add("kind:bug");
    proposedLabels.add("risk:correctness");
    reasoning.push("Critical correctness/availability issue warrants breakdown into a fix slice.");
  } else if (author === "app/coderabbitai" && issue.title.startsWith("[Major]")) {
    proposedStatus = "breakdown";
    proposedPriority = mergePriority(proposedPriority, "P2");
    proposedLabels.add("kind:bug");
    reasoning.push("Major CodeRabbit finding should be refined into an explicit implementation slice.");
  } else if (author === "app/coderabbitai" && issue.title.startsWith("[Minor]")) {
    proposedStatus = "incoming";
    reasoning.push("Minor CodeRabbit note should remain in triage until clustered or batched.");
  } else if (bugPattern.test(issue.title) || hasLabel(currentLabels, "bug")) {
    proposedStatus = "accepted";
    proposedPriority = mergePriority(proposedPriority, "P2");
    proposedLabels.add("kind:bug");
    reasoning.push("Concrete bug report is worth keeping in the active queue.");
  } else if (enhancementPattern.test(issue.title) || hasLabel(currentLabels, "enhancement")) {
    proposedStatus = idleDays > 90 ? "icebox" : "incoming";
    proposedLabels.add("kind:enhancement");
    reasoning.push(
      idleDays > 90 ? "Long-idle enhancement request is better deferred to icebox." : "Enhancement request still needs intake triage."
    );
  }

  if (idleDays > 90 && proposedStatus !== "rejected") {
    proposedLabels.add("triage:stale");
  }

  if (repo.endsWith("/openhax") && issue.title.trim().toLowerCase() === "testing") {
    proposedStatus = "rejected";
    proposedLabels.add("triage:placeholder");
    reasoning.push("OpenHax placeholder/testing issue should be closed or replaced with a real task.");
  }

  for (const label of buildBaseLabels("issue", proposedStatus, proposedPriority)) {
    proposedLabels.add(label);
  }

  return {
    kind: "issue",
    number: issue.number,
    title: issue.title,
    url: issue.url,
    author,
    ageDays,
    idleDays,
    proposedStatus,
    proposedPriority,
    currentLabels,
    proposedLabels: Array.from(proposedLabels).sort(),
    reasoning
  };
};

const classifyPr = (
  repo: string,
  pr: GitHubPrSummary,
  ageDays: number,
  idleDays: number
): Omit<GitHubRefinedItem, "id" | "canonicalRepo" | "repos"> => {
  const currentLabels = extractLabelNames(pr.labels);
  const author = pr.author?.login ?? undefined;
  const reasoning: string[] = [];
  let proposedStatus: KanbanStatus = "in_review";
  let proposedPriority = derivePriority(pr.title, currentLabels);
  const proposedLabels = new Set<string>();
  const failingChecks = collectCheckFailures(pr.statusCheckRollup);

  if (author === "app/dependabot") {
    proposedLabels.add("source:dependabot");
  }

  if (pr.isDraft) {
    proposedStatus = "in_progress";
    proposedLabels.add("pr:draft");
    reasoning.push("Draft PR is active work, not review-ready.");
  } else if (pr.mergeStateStatus === "DIRTY") {
    proposedStatus = "blocked";
    proposedLabels.add("triage:blocked");
    proposedLabels.add("merge:dirty");
    reasoning.push("PR has merge conflicts and is blocked until rebased or superseded.");
  } else if (failingChecks.length > 0 || pr.mergeStateStatus === "UNSTABLE") {
    proposedStatus = "blocked";
    proposedLabels.add("triage:blocked");
    proposedLabels.add("checks:failing");
    reasoning.push(`PR is blocked by failing checks: ${failingChecks.join(", ") || "mergeability"}.`);
  } else if (idleDays > 90) {
    proposedStatus = "icebox";
    proposedLabels.add("triage:stale");
    reasoning.push("Long-idle PR should be explicitly revived or deferred instead of lingering in active review.");
  } else {
    proposedStatus = "in_review";
    reasoning.push("Reviewable PR belongs in the In Review lane.");
  }

  if (securityPattern.test(pr.title)) {
    proposedPriority = mergePriority(proposedPriority, "P0");
  } else if (criticalPattern.test(pr.title)) {
    proposedPriority = mergePriority(proposedPriority, "P1");
  } else if (failingChecks.length > 0) {
    proposedPriority = mergePriority(proposedPriority, "P2");
  }

  if (idleDays > 90 && proposedStatus !== "icebox") {
    proposedLabels.add("triage:stale");
  }

  for (const label of buildBaseLabels("pr", proposedStatus, proposedPriority)) {
    proposedLabels.add(label);
  }

  if (repo.endsWith("/openhax") || repo.endsWith("/promethean")) {
    proposedLabels.add("triage:mirror-aware");
  }

  return {
    kind: "pr",
    number: pr.number,
    title: pr.title,
    url: pr.url,
    author,
    ageDays,
    idleDays,
    proposedStatus,
    proposedPriority,
    currentLabels,
    proposedLabels: Array.from(proposedLabels).sort(),
    reasoning
  };
};

const sortItems = (items: GitHubRefinedItem[]): GitHubRefinedItem[] =>
  [...items].sort((left, right) => {
    const statusDelta = defaultStatusOrder.indexOf(left.proposedStatus) - defaultStatusOrder.indexOf(right.proposedStatus);
    if (statusDelta !== 0) {
      return statusDelta;
    }

    const priorityDelta = priorityOrder[left.proposedPriority] - priorityOrder[right.proposedPriority];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return `${left.canonicalRepo}#${left.number}`.localeCompare(`${right.canonicalRepo}#${right.number}`);
  });

export const refineGitHubSweep = (
  snapshot: GitHubSweepSnapshot,
  options: GitHubRefinementOptions = {}
): GitHubRefinementResult => {
  const now = options.now ?? new Date();
  const excludedRepos = new Set(options.excludeRepos ?? []);
  const mirrorGroups = { ...defaultMirrorGroups, ...(options.mirrorGroups ?? {}) };
  const collapseMirrors = options.collapseMirrors !== false;
  const byId = new Map<string, GitHubRefinedItem>();

  for (const repo of snapshot.repos) {
    if (excludedRepos.has(repo.owner_repo)) {
      continue;
    }

    const canonicalRepo = collapseMirrors ? mirrorGroups[repo.owner_repo] ?? repo.owner_repo : repo.owner_repo;

    for (const issue of repo.issues ?? []) {
      const createdAt = parseDate(issue.createdAt, now);
      const updatedAt = parseDate(issue.updatedAt, createdAt);
      const partial = classifyIssue(repo.owner_repo, issue, ageInDays(createdAt, now), ageInDays(updatedAt, now));
      const id = `${canonicalRepo}|issue|${issue.number}|${issue.title}`;
      const existing = byId.get(id);

      if (existing) {
        existing.repos = Array.from(new Set([...existing.repos, repo.owner_repo])).sort();
        continue;
      }

      byId.set(id, {
        ...partial,
        id,
        canonicalRepo,
        repos: [repo.owner_repo]
      });
    }

    for (const pr of repo.prs ?? []) {
      const createdAt = parseDate(pr.createdAt, now);
      const updatedAt = parseDate(pr.updatedAt, createdAt);
      const partial = classifyPr(repo.owner_repo, pr, ageInDays(createdAt, now), ageInDays(updatedAt, now));
      const id = `${canonicalRepo}|pr|${pr.number}|${pr.title}`;
      const existing = byId.get(id);

      if (existing) {
        existing.repos = Array.from(new Set([...existing.repos, repo.owner_repo])).sort();
        continue;
      }

      byId.set(id, {
        ...partial,
        id,
        canonicalRepo,
        repos: [repo.owner_repo]
      });
    }
  }

  const items = sortItems(
    Array.from(byId.values()).map((item) => {
      if (item.repos.length > 1) {
        const labels = new Set(item.proposedLabels);
        labels.add("triage:mirror-collapsed");
        item.proposedLabels = Array.from(labels).sort();
        item.reasoning = [...item.reasoning, `Mirror-collapsed across repos: ${item.repos.join(", ")}.`];
      }
      return item;
    })
  );

  const repoSummaries = Array.from(
    items.reduce<Map<string, GitHubRepoRefinementSummary>>((acc, item) => {
      const summary = acc.get(item.canonicalRepo) ?? {
        repo: item.canonicalRepo,
        itemCount: 0,
        issueCount: 0,
        prCount: 0,
        byStatus: {}
      };

      summary.itemCount += 1;
      summary.issueCount += item.kind === "issue" ? 1 : 0;
      summary.prCount += item.kind === "pr" ? 1 : 0;
      summary.byStatus[item.proposedStatus] = (summary.byStatus[item.proposedStatus] ?? 0) + 1;
      acc.set(item.canonicalRepo, summary);
      return acc;
    }, new Map())
  )
    .map(([, summary]) => summary)
    .sort((left, right) => right.itemCount - left.itemCount || left.repo.localeCompare(right.repo));

  return {
    generatedAt: now.toISOString(),
    inputGeneratedAt: snapshot.generatedAt,
    excludedRepos: Array.from(excludedRepos).sort(),
    collapsedMirrorGroups: collapseMirrors ? mirrorGroups : {},
    repoSummaries,
    items
  };
};

export const renderGitHubRefinementReport = (result: GitHubRefinementResult): string => {
  const lines: string[] = [
    `# GitHub refinement report (${result.generatedAt.slice(0, 10)})`,
    "",
    "## Summary",
    `- Refined items: ${result.items.length}`,
    `- Excluded repos: ${result.excludedRepos.length > 0 ? result.excludedRepos.join(", ") : "(none)"}`,
    ""
  ];

  if (result.repoSummaries.length > 0) {
    lines.push("## Repo summaries", "");
    for (const summary of result.repoSummaries) {
      const statusSummary = defaultStatusOrder
        .filter((status) => summary.byStatus[status] != null)
        .map((status) => `${buildKanbanTitle(status)}=${summary.byStatus[status]}`)
        .join(", ");
      lines.push(
        `- ${summary.repo}: ${summary.itemCount} items (${summary.issueCount} issues, ${summary.prCount} PRs) — ${statusSummary}`
      );
    }
    lines.push("");
  }

  lines.push("## Kanban buckets", "");
  for (const status of defaultStatusOrder) {
    const items = result.items.filter((item) => item.proposedStatus === status);
    if (items.length === 0) {
      continue;
    }

    lines.push(`### ${buildKanbanTitle(status)} (${items.length})`, "");
    for (const item of items) {
      lines.push(
        `- ${item.canonicalRepo}#${item.number} [${item.kind}] — ${item.title}`,
        `  - labels: ${item.proposedLabels.join(", ")}`,
        `  - why: ${item.reasoning.join(" ") || "No additional rationale recorded."}`,
        `  - source repos: ${item.repos.join(", ")}`
      );
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
};
