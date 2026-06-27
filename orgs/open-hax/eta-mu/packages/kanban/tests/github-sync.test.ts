import { describe, expect, it } from "vitest";

import {
  buildIssueBody,
  desiredIssueLabels,
  extractTaskUuidFromIssue,
  planGitHubIssueSync
} from "../src/github-sync.js";
import type { GitHubRepoState, KanbanTask } from "../src/index.js";

const sampleTask: KanbanTask = {
  uuid: "task-123",
  title: "Sync Kanban to GitHub",
  slug: "sync-kanban-to-github",
  status: "in_progress",
  priority: "P1",
  labels: ["kanban sync", "github"],
  createdAt: "2026-05-31T00:00:00.000Z",
  content: "Create or update GitHub issues from markdown cards.",
  sourcePath: "/workspace/kanban/sync-kanban.md"
};

describe("GitHub issue sync", () => {
  it("embeds and reads a stable task UUID marker", () => {
    const body = buildIssueBody(sampleTask, { cwd: "/workspace" });

    expect(body).toContain('<!-- openhax-kanban-sync uuid="task-123" -->');
    expect(body).toContain("`kanban/sync-kanban.md`");
    expect(extractTaskUuidFromIssue({ body })).toBe("task-123");
  });

  it("normalizes labels from status, priority, and frontmatter labels", () => {
    expect(desiredIssueLabels(sampleTask)).toEqual([
      "kanban",
      "status:in_progress",
      "priority:P1",
      "kanban-sync",
      "github"
    ]);
  });

  it("creates labels and issues for open tasks", () => {
    const state: GitHubRepoState = { labels: [], issues: [] };
    const plan = planGitHubIssueSync([sampleTask], state, {
      repo: "open-hax/example",
      dryRun: true,
      cwd: "/workspace"
    });

    expect(plan.summary.createLabels).toBe(5);
    expect(plan.summary.createIssues).toBe(1);
    expect(plan.summary.updateIssues).toBe(0);
    expect(plan.operations.some((operation) => operation.type === "createIssue")).toBe(true);
  });

  it("updates existing issues by UUID and closes done tasks", () => {
    const doneTask = { ...sampleTask, status: "done" };
    const body = buildIssueBody(sampleTask, { cwd: "/workspace" });
    const state: GitHubRepoState = {
      labels: desiredIssueLabels(doneTask).map((name) => ({ name })),
      issues: [
        {
          number: 42,
          title: "Old title",
          body,
          state: "open",
          labels: [{ name: "kanban" }]
        }
      ]
    };
    const plan = planGitHubIssueSync([doneTask], state, {
      repo: "open-hax/example",
      dryRun: true,
      cwd: "/workspace"
    });

    expect(plan.summary.createIssues).toBe(0);
    expect(plan.summary.updateIssues).toBe(1);
    expect(plan.operations).toContainEqual(
      expect.objectContaining({
        type: "updateIssue",
        issueNumber: 42,
        state: "closed",
        stateReason: "completed"
      })
    );
  });

  it("does not create new closed issues for already-done local tasks", () => {
    const doneTask = { ...sampleTask, status: "done" };
    const state: GitHubRepoState = { labels: [], issues: [] };
    const plan = planGitHubIssueSync([doneTask], state, {
      repo: "open-hax/example",
      dryRun: true,
      cwd: "/workspace"
    });

    expect(plan.summary.createIssues).toBe(0);
    expect(plan.summary.skippedClosedTasks).toBe(1);
  });
});
