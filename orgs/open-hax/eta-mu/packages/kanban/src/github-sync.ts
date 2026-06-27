import { execFileSync } from "node:child_process";
import path from "node:path";

import type { KanbanTask } from "./types.js";

export interface GitHubAuthConfig {
  token: string;
  baseUrl?: string;
}

export interface GitHubLabelState {
  name: string;
  color?: string;
  description?: string | null;
}

export interface GitHubIssueState {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  labels: GitHubLabelState[];
  htmlUrl?: string;
}

export interface GitHubRepoState {
  labels: GitHubLabelState[];
  issues: GitHubIssueState[];
}

export interface GitHubSyncOptions {
  repo: string;
  dryRun?: boolean;
  closeDone?: boolean;
  closeRejected?: boolean;
  manageLabels?: boolean;
  cwd?: string;
  writeDelayMs?: number;
  maxWrites?: number;
}

export type GitHubSyncOperation =
  | {
      type: "createLabel";
      label: GitHubLabelState;
    }
  | {
      type: "createIssue";
      task: KanbanTask;
      title: string;
      body: string;
      labels: string[];
    }
  | {
      type: "updateIssue";
      issueNumber: number;
      task: KanbanTask;
      title: string;
      body: string;
      labels: string[];
      state: "open" | "closed";
      stateReason?: "completed" | "not_planned";
    };

export interface GitHubSyncPlan {
  operations: GitHubSyncOperation[];
  summary: {
    createLabels: number;
    createIssues: number;
    updateIssues: number;
    skippedClosedTasks: number;
  };
}

export interface GitHubSyncResult {
  repo: string;
  plan: GitHubSyncPlan;
  appliedOperations: GitHubSyncOperation[];
}

const uuidMarkerPrefix = "openhax-kanban-sync";
const uuidMarkerPattern = /<!--\s*openhax-kanban-sync\s+uuid="([^"]+)"\s*-->/u;

const defaultLabelColors: Record<string, string> = {
  kanban: "5319e7",
  "priority:P0": "000000",
  "priority:P1": "d93f0b",
  "priority:P2": "fbca04",
  "priority:P3": "0e8a16"
};

const statusColor = "cfd3d7";
const defaultTaskLabelColor = "ededed";

const normalizeGitHubLabelName = (label: string): string =>
  label
    .trim()
    .replace(/\s+/gu, "-")
    .replace(/[^\p{L}\p{N}_.:/-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 50);

const unique = <T>(items: T[]): T[] => Array.from(new Set(items));

export const extractTaskUuidFromIssue = (issue: Pick<GitHubIssueState, "body">): string | undefined => {
  const body = issue.body ?? "";
  const markerMatch = body.match(uuidMarkerPattern);
  if (markerMatch?.[1]) {
    return markerMatch[1];
  }

  const legacyMatch = body.match(/^Kanban UUID:\s*(.+)$/imu);
  return legacyMatch?.[1]?.trim();
};

export const desiredIssueLabels = (task: KanbanTask): string[] =>
  unique(
    [
      "kanban",
      `status:${task.status}`,
      task.priority ? `priority:${task.priority}` : undefined,
      ...task.labels
    ]
      .filter((label): label is string => Boolean(label?.trim()))
      .map(normalizeGitHubLabelName)
      .filter((label) => label.length > 0)
  );

export const labelStateForName = (name: string): GitHubLabelState => ({
  name,
  color: defaultLabelColors[name] ?? (name.startsWith("status:") ? statusColor : defaultTaskLabelColor),
  description: name === "kanban" ? "Synced from OpenHax markdown kanban." : undefined
});

const relativeSourcePath = (task: KanbanTask, cwd: string): string => {
  const relative = path.relative(cwd, task.sourcePath);
  return relative.startsWith("..") ? task.sourcePath : relative;
};

const truncateBody = (body: string): string => (body.length <= 58_000 ? body : `${body.slice(0, 57_900)}\n\n… truncated by kanban sync …\n`);

export const buildIssueBody = (task: KanbanTask, options: { cwd?: string } = {}): string => {
  const cwd = options.cwd ?? process.cwd();
  const sourcePath = relativeSourcePath(task, cwd);
  const header = [
    `<!-- ${uuidMarkerPrefix} uuid="${task.uuid}" -->`,
    "<!-- This section is managed by eta-mu kanban sync github. -->",
    "",
    "## Kanban metadata",
    "",
    `- UUID: \`${task.uuid}\``,
    `- Status: \`${task.status}\``,
    `- Priority: \`${task.priority}\``,
    `- Source: \`${sourcePath}\``,
    task.labels.length > 0 ? `- Labels: ${task.labels.map((label) => `\`${label}\``).join(", ")}` : "- Labels: none",
    "",
    "---",
    ""
  ].join("\n");

  return truncateBody(`${header}${task.content.trim()}\n`);
};

const desiredIssueState = (
  task: KanbanTask,
  options: Pick<GitHubSyncOptions, "closeDone" | "closeRejected">
): { state: "open" | "closed"; stateReason?: "completed" | "not_planned" } => {
  if (task.status === "done" && options.closeDone !== false) {
    return { state: "closed", stateReason: "completed" };
  }

  if (task.status === "rejected" && options.closeRejected !== false) {
    return { state: "closed", stateReason: "not_planned" };
  }

  return { state: "open" };
};

const sameLabels = (current: string[], desired: string[]): boolean => {
  const left = [...current].sort();
  const right = [...desired].sort();
  return left.length === right.length && left.every((label, index) => label === right[index]);
};

export const planGitHubIssueSync = (
  tasks: KanbanTask[],
  state: GitHubRepoState,
  options: GitHubSyncOptions
): GitHubSyncPlan => {
  const operations: GitHubSyncOperation[] = [];
  const existingLabels = new Set(state.labels.map((label) => label.name.toLowerCase()));
  const issuesByUuid = new Map<string, GitHubIssueState>();
  let skippedClosedTasks = 0;

  for (const issue of state.issues) {
    const uuid = extractTaskUuidFromIssue(issue);
    if (uuid) {
      issuesByUuid.set(uuid, issue);
    }
  }

  const desiredLabels = unique(tasks.flatMap(desiredIssueLabels));
  if (options.manageLabels !== false) {
    for (const labelName of desiredLabels) {
      if (!existingLabels.has(labelName.toLowerCase())) {
        operations.push({ type: "createLabel", label: labelStateForName(labelName) });
      }
    }
  }

  for (const task of tasks) {
    const issue = issuesByUuid.get(task.uuid);
    const labels = desiredIssueLabels(task);
    const title = task.title;
    const body = buildIssueBody(task, { cwd: options.cwd });
    const desiredState = desiredIssueState(task, options);

    if (!issue) {
      if (desiredState.state === "closed") {
        skippedClosedTasks += 1;
        continue;
      }

      operations.push({ type: "createIssue", task, title, body, labels });
      continue;
    }

    const currentLabels = issue.labels.map((label) => label.name);
    if (
      issue.title !== title ||
      (issue.body ?? "") !== body ||
      issue.state !== desiredState.state ||
      !sameLabels(currentLabels, labels)
    ) {
      operations.push({
        type: "updateIssue",
        issueNumber: issue.number,
        task,
        title,
        body,
        labels,
        state: desiredState.state,
        stateReason: desiredState.stateReason
      });
    }
  }

  return {
    operations,
    summary: {
      createLabels: operations.filter((operation) => operation.type === "createLabel").length,
      createIssues: operations.filter((operation) => operation.type === "createIssue").length,
      updateIssues: operations.filter((operation) => operation.type === "updateIssue").length,
      skippedClosedTasks
    }
  };
};

const parseLinkHeader = (linkHeader: string | null): string | undefined => {
  if (!linkHeader) return undefined;
  const next = linkHeader
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.endsWith('rel="next"'));
  const match = next?.match(/^<([^>]+)>/u);
  return match?.[1];
};

export class GitHubClient {
  private readonly token: string;
  private readonly baseUrl: string;

  constructor(config: GitHubAuthConfig) {
    this.token = config.token;
    this.baseUrl = config.baseUrl ?? "https://api.github.com";
  }

  private async request<T>(endpointOrUrl: string, init: RequestInit = {}): Promise<T> {
    const url = endpointOrUrl.startsWith("http") ? endpointOrUrl : `${this.baseUrl}${endpointOrUrl}`;
    const response = await fetch(url, {
      ...init,
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${this.token}`,
        "x-github-api-version": "2022-11-28",
        ...(init.headers ?? {})
      }
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub API ${response.status} ${response.statusText}: ${body}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  private async paginate<T>(endpoint: string): Promise<T[]> {
    const items: T[] = [];
    let nextUrl: string | undefined = `${this.baseUrl}${endpoint}`;

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          accept: "application/vnd.github+json",
          authorization: `Bearer ${this.token}`,
          "x-github-api-version": "2022-11-28"
        }
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`GitHub API ${response.status} ${response.statusText}: ${body}`);
      }

      items.push(...((await response.json()) as T[]));
      nextUrl = parseLinkHeader(response.headers.get("link"));
    }

    return items;
  }

  async getLabels(repo: string): Promise<GitHubLabelState[]> {
    return this.paginate<GitHubLabelState>(`/repos/${repo}/labels?per_page=100`);
  }

  async getIssues(repo: string): Promise<GitHubIssueState[]> {
    const issues = await this.paginate<{
      number: number;
      title: string;
      body: string | null;
      state: "open" | "closed";
      labels: GitHubLabelState[];
      html_url: string;
      pull_request?: unknown;
    }>(`/repos/${repo}/issues?state=all&per_page=100`);

    return issues
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        labels: issue.labels,
        htmlUrl: issue.html_url
      }));
  }

  async createLabel(repo: string, label: GitHubLabelState): Promise<void> {
    try {
      await this.request(`/repos/${repo}/labels`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(label)
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("already_exists") && !message.includes("Validation Failed")) {
        throw error;
      }
    }
  }

  async createIssue(repo: string, input: { title: string; body: string; labels: string[] }): Promise<void> {
    await this.request(`/repos/${repo}/issues`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    });
  }

  async updateIssue(
    repo: string,
    issueNumber: number,
    input: { title: string; body: string; labels: string[]; state: "open" | "closed"; state_reason?: string }
  ): Promise<void> {
    await this.request(`/repos/${repo}/issues/${issueNumber}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    });
  }
}

export const inferGitHubRepo = (cwd: string): string | undefined => {
  try {
    const remoteUrl = execFileSync("git", ["-C", cwd, "remote", "get-url", "origin"], { encoding: "utf8" }).trim();
    const match =
      remoteUrl.match(/^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/u) ??
      remoteUrl.match(/^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/u);
    return match?.[1]?.replace(/\.git$/u, "");
  } catch {
    return undefined;
  }
};

const sleep = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const syncTasksToGitHub = async (
  client: GitHubClient,
  tasks: KanbanTask[],
  options: GitHubSyncOptions
): Promise<GitHubSyncResult> => {
  const repoState: GitHubRepoState = {
    labels: await client.getLabels(options.repo),
    issues: await client.getIssues(options.repo)
  };
  const plan = planGitHubIssueSync(tasks, repoState, options);
  const appliedOperations: GitHubSyncOperation[] = [];
  const maxWrites = options.maxWrites ?? Number.POSITIVE_INFINITY;
  const writeDelayMs = options.writeDelayMs ?? 0;

  if (!options.dryRun) {
    for (const operation of plan.operations) {
      if (appliedOperations.length >= maxWrites) {
        break;
      }

      switch (operation.type) {
        case "createLabel":
          await client.createLabel(options.repo, operation.label);
          appliedOperations.push(operation);
          break;
        case "createIssue":
          await client.createIssue(options.repo, {
            title: operation.title,
            body: operation.body,
            labels: operation.labels
          });
          appliedOperations.push(operation);
          break;
        case "updateIssue":
          await client.updateIssue(options.repo, operation.issueNumber, {
            title: operation.title,
            body: operation.body,
            labels: operation.labels,
            state: operation.state,
            state_reason: operation.stateReason
          });
          appliedOperations.push(operation);
          break;
      }

      if (writeDelayMs > 0 && appliedOperations.length < maxWrites) {
        await sleep(writeDelayMs);
      }
    }
  }

  return { repo: options.repo, plan, appliedOperations };
};
