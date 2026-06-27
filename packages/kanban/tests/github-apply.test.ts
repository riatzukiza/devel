import { describe, expect, it } from "vitest";

import { applyRefinedLabels, filterRefinedItems, mergeManagedLabels, resolveManagedLabels } from "../src/github-apply.js";
import type { GitHubRefinementResult } from "../src/github-triage.js";

const sampleRefinement: GitHubRefinementResult = {
  generatedAt: "2026-03-21T21:00:00Z",
  excludedRepos: [],
  collapsedMirrorGroups: {},
  repoSummaries: [],
  items: [
    {
      id: "open-hax/proxx|issue|65",
      canonicalRepo: "open-hax/proxx",
      repos: ["open-hax/proxx"],
      kind: "issue",
      number: 65,
      title: "Critical secret issue",
      url: "https://github.com/open-hax/proxx/issues/65",
      ageDays: 1,
      idleDays: 1,
      proposedStatus: "breakdown",
      proposedPriority: "P0",
      currentLabels: ["legacy"],
      proposedLabels: [
        "kanban",
        "artifact:issue",
        "state:breakdown",
        "priority:P0",
        "kind:bug",
        "risk:security"
      ],
      reasoning: []
    },
    {
      id: "open-hax/proxx|pr|15",
      canonicalRepo: "open-hax/proxx",
      repos: ["open-hax/proxx"],
      kind: "pr",
      number: 15,
      title: "Reviewable PR",
      url: "https://github.com/open-hax/proxx/pull/15",
      ageDays: 1,
      idleDays: 1,
      proposedStatus: "in_review",
      proposedPriority: "P3",
      currentLabels: [],
      proposedLabels: ["kanban", "artifact:pr", "state:in_review", "priority:P3"],
      reasoning: []
    }
  ]
};

describe("github apply helpers", () => {
  it("maps kind labels to GitHub-native labels", () => {
    expect(resolveManagedLabels(["kind:bug", "kanban", "state:breakdown"])).toEqual([
      "bug",
      "kanban",
      "state:breakdown"
    ]);
  });

  it("replaces managed labels but preserves unrelated labels", () => {
    expect(mergeManagedLabels(["legacy", "state:incoming", "priority:P3"], ["state:breakdown", "priority:P0", "kanban"]))
      .toEqual(["kanban", "legacy", "priority:P0", "state:breakdown"]);
  });

  it("filters refined items by repo/state/kind", () => {
    const filtered = filterRefinedItems(sampleRefinement, {
      repo: "open-hax/proxx",
      states: ["breakdown"],
      kinds: ["issue"]
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.number).toBe(65);
  });

  it("produces a dry-run apply plan", async () => {
    const fakeClientFactory = () => ({
      listRepositoryLabels: async () => [],
      createLabel: async () => ({ ok: true, status: 201 }),
      getIssueLabels: async () => ["legacy", "state:incoming"],
      replaceLabels: async () => ({ ok: true, status: 200 }),
      applyLabels: async () => ({ ok: true, status: 200 }),
      comment: async () => ({ ok: true, status: 200 })
    });

    const result = await applyRefinedLabels(fakeClientFactory as never, sampleRefinement, {
      repo: "open-hax/proxx",
      states: ["breakdown"],
      kinds: ["issue"],
      dryRun: true
    });

    expect(result.selectedCount).toBe(1);
    expect(result.updatedItems[0]?.labels).toContain("state:breakdown");
    expect(result.updatedItems[0]?.labels).toContain("bug");
    expect(result.updatedItems[0]?.labels).toContain("legacy");
  });
});