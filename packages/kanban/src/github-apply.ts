import { defaultStatusOrder, type KanbanStatus, statusDisplayNames } from "./fsm.js";
import type { GitHubIssueClientEnv, GitHubLabelDefinition, makeGitHubIssueClient } from "./github.js";
import type { GitHubRefinedItem, GitHubRefinementResult } from "./github-triage.js";

type GitHubClient = ReturnType<typeof makeGitHubIssueClient>;

export type GitHubApplyFilter = {
  repo: string;
  states?: string[];
  kinds?: Array<GitHubRefinedItem["kind"]>;
  numbers?: number[];
};

export type GitHubApplyOptions = GitHubApplyFilter & {
  dryRun?: boolean;
};

export type GitHubApplyResult = {
  repo: string;
  selectedCount: number;
  ensuredLabels: string[];
  updatedItems: Array<{
    kind: GitHubRefinedItem["kind"];
    number: number;
    title: string;
    labels: string[];
    dryRun: boolean;
  }>;
};

const stateColors: Record<KanbanStatus, string> = {
  icebox: "c5def5",
  incoming: "d4c5f9",
  accepted: "0e8a16",
  breakdown: "fbca04",
  blocked: "b60205",
  ready: "5319e7",
  todo: "1d76db",
  in_progress: "0052cc",
  in_review: "006b75",
  testing: "bfdadc",
  document: "c2e0c6",
  done: "0e8a16",
  rejected: "e4e669"
};

const labelDefinitions = new Map<string, GitHubLabelDefinition>([
  ["kanban", { name: "kanban", color: "5319e7", description: "Tracked in the OpenHax Kanban FSM" }],
  ["artifact:issue", { name: "artifact:issue", color: "1d76db", description: "Refined GitHub issue tracked by kanban tooling" }],
  ["artifact:pr", { name: "artifact:pr", color: "0e8a16", description: "Refined pull request tracked by kanban tooling" }],
  ["priority:P0", { name: "priority:P0", color: "b60205", description: "Critical priority" }],
  ["priority:P1", { name: "priority:P1", color: "d93f0b", description: "High priority" }],
  ["priority:P2", { name: "priority:P2", color: "fbca04", description: "Medium priority" }],
  ["priority:P3", { name: "priority:P3", color: "0e8a16", description: "Low priority" }],
  ["source:coderabbit", { name: "source:coderabbit", color: "5319e7", description: "Originated from CodeRabbit review feedback" }],
  ["source:dependabot", { name: "source:dependabot", color: "0366d6", description: "Originated from Dependabot automation" }],
  ["triage:cluster-candidate", { name: "triage:cluster-candidate", color: "c2e0c6", description: "Candidate for batching or clustering during triage" }],
  ["triage:stale", { name: "triage:stale", color: "fef2c0", description: "Stale item that likely needs revive/close/defer decision" }],
  ["triage:placeholder", { name: "triage:placeholder", color: "ededed", description: "Placeholder/test item that likely should be closed or replaced" }],
  ["triage:blocked", { name: "triage:blocked", color: "b60205", description: "Blocked during triage by failing checks or merge conflicts" }],
  ["triage:mirror-aware", { name: "triage:mirror-aware", color: "bfdadc", description: "Item participates in a mirrored repository queue" }],
  ["triage:mirror-collapsed", { name: "triage:mirror-collapsed", color: "bfdadc", description: "Locally collapsed from multiple mirrored repositories" }],
  ["checks:failing", { name: "checks:failing", color: "ededed", description: "Blocked by failing status checks" }],
  ["merge:dirty", { name: "merge:dirty", color: "b60205", description: "Blocked by merge conflicts or dirty merge state" }],
  ["risk:security", { name: "risk:security", color: "b60205", description: "Security-sensitive issue requiring elevated attention" }],
  ["risk:correctness", { name: "risk:correctness", color: "d93f0b", description: "Correctness or reliability risk" }],
  ["bug", { name: "bug", color: "d73a4a", description: "Something is not working" }],
  ["enhancement", { name: "enhancement", color: "a2eeef", description: "New feature or request" }]
]);

for (const status of defaultStatusOrder) {
  labelDefinitions.set(`state:${status}`, {
    name: `state:${status}`,
    color: stateColors[status],
    description: `Canonical Kanban FSM state: ${statusDisplayNames[status]}`
  });
}

const managedPrefixes = ["state:", "priority:", "artifact:", "source:", "triage:", "risk:", "checks:", "merge:"];
const managedAliases = new Set(["kanban", "bug", "enhancement"]);

const normalizeLabel = (label: string): string => {
  switch (label) {
    case "kind:bug":
      return "bug";
    case "kind:enhancement":
      return "enhancement";
    default:
      return label;
  }
};

export const resolveManagedLabels = (proposedLabels: readonly string[]): string[] =>
  Array.from(new Set(proposedLabels.map(normalizeLabel).filter(Boolean))).sort();

export const isManagedLabel = (label: string): boolean =>
  managedAliases.has(label) || managedPrefixes.some((prefix) => label.startsWith(prefix));

export const mergeManagedLabels = (existingLabels: readonly string[], proposedLabels: readonly string[]): string[] => {
  const unmanaged = existingLabels.filter((label) => !isManagedLabel(label));
  return Array.from(new Set([...unmanaged, ...resolveManagedLabels(proposedLabels)])).sort();
};

export const filterRefinedItems = (
  refinement: GitHubRefinementResult,
  filter: GitHubApplyFilter
): GitHubRefinedItem[] => {
  const stateSet = new Set((filter.states ?? []).filter(Boolean));
  const kindSet = new Set((filter.kinds ?? []).filter(Boolean));
  const numberSet = new Set(filter.numbers ?? []);

  return refinement.items.filter((item) => {
    if (item.canonicalRepo !== filter.repo) {
      return false;
    }
    if (stateSet.size > 0 && !stateSet.has(item.proposedStatus)) {
      return false;
    }
    if (kindSet.size > 0 && !kindSet.has(item.kind)) {
      return false;
    }
    if (numberSet.size > 0 && !numberSet.has(item.number)) {
      return false;
    }
    return true;
  });
};

export const getLabelDefinitions = (labels: readonly string[]): GitHubLabelDefinition[] =>
  resolveManagedLabels(labels)
    .map((label) => labelDefinitions.get(label))
    .filter((definition): definition is GitHubLabelDefinition => Boolean(definition));

const parseRepoSlug = (repo: string): GitHubIssueClientEnv => {
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new Error(`Invalid repo slug: ${repo}`);
  }

  return { owner, repo: name };
};

const ensureLabelsExist = async (client: GitHubClient, labels: readonly string[]): Promise<string[]> => {
  const existing = new Set((await client.listRepositoryLabels()).map((label) => label.name));
  const created: string[] = [];

  for (const definition of getLabelDefinitions(labels)) {
    if (existing.has(definition.name)) {
      continue;
    }

    const result = await client.createLabel(definition);
    if ("skipped" in result) {
      throw new Error(`Cannot create labels without token (${result.reason})`);
    }
    if (!result.ok) {
      throw new Error(`Failed to create label ${definition.name} (status ${result.status})`);
    }
    existing.add(definition.name);
    created.push(definition.name);
  }

  return created;
};

export const applyRefinedLabels = async (
  clientFactory: (env: GitHubIssueClientEnv) => GitHubClient,
  refinement: GitHubRefinementResult,
  options: GitHubApplyOptions & { token?: string }
): Promise<GitHubApplyResult> => {
  const repoEnv = parseRepoSlug(options.repo);
  const client = clientFactory({ ...repoEnv, token: options.token });
  const selected = filterRefinedItems(refinement, options);

  const ensuredLabels = options.dryRun
    ? Array.from(new Set(selected.flatMap((item) => resolveManagedLabels(item.proposedLabels)))).sort()
    : await ensureLabelsExist(client, selected.flatMap((item) => item.proposedLabels));

  const updatedItems: GitHubApplyResult["updatedItems"] = [];

  for (const item of selected) {
    const liveLabels = options.dryRun ? item.currentLabels : await client.getIssueLabels(item.number);
    const finalLabels = mergeManagedLabels(liveLabels, item.proposedLabels);

    if (!options.dryRun) {
      const result = await client.replaceLabels(item.number, finalLabels);
      if ("skipped" in result) {
        throw new Error(`Cannot apply labels without token (${result.reason})`);
      }
      if (!result.ok) {
        throw new Error(`Failed to update labels for ${options.repo}#${item.number} (status ${result.status})`);
      }
    }

    updatedItems.push({
      kind: item.kind,
      number: item.number,
      title: item.title,
      labels: finalLabels,
      dryRun: options.dryRun === true
    });
  }

  return {
    repo: options.repo,
    selectedCount: selected.length,
    ensuredLabels,
    updatedItems
  };
};
