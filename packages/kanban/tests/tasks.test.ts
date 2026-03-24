import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildBoardSnapshot } from "../src/board.js";
import { loadTasks } from "../src/tasks.js";

describe("loadTasks", () => {
  it("parses markdown frontmatter and normalizes task metadata", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "openhax-kanban-"));
    const nestedDir = path.join(tempDir, "nested");
    await mkdir(nestedDir, { recursive: true });

    await writeFile(
      path.join(tempDir, "alpha.md"),
      `---
uuid: alpha-1
title: Alpha Task
status: In Progress
priority: p1
labels: [alpha, platform]
---

Ship alpha.
`,
      "utf8"
    );

    await writeFile(
      path.join(nestedDir, "beta.md"),
      `---
title: Beta Task
status: ready
tags: [beta, sync]
---

Ship beta.
`,
      "utf8"
    );

    const tasks = await loadTasks(tempDir);

    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toMatchObject({
      title: "Beta Task",
      status: "ready",
      priority: "P3",
      labels: ["beta", "sync"]
    });
    expect(tasks[1]).toMatchObject({
      uuid: "alpha-1",
      status: "in_progress",
      priority: "P1",
      labels: ["alpha", "platform"]
    });
  });

  it("falls back when frontmatter yaml is malformed", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "openhax-kanban-malformed-"));

    await writeFile(
      path.join(tempDir, "broken.md"),
      `---
title: Broken Task
status: todo
labels: [alpha, "unterminated]
---

Still readable.
`,
      "utf8"
    );

    const tasks = await loadTasks(tempDir);

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      title: "Broken Task",
      status: "todo"
    });
  });
});

describe("buildBoardSnapshot", () => {
  it("groups tasks into ordered columns", () => {
    const snapshot = buildBoardSnapshot([
      {
        uuid: "1",
        title: "One",
        slug: "one",
        status: "todo",
        priority: "P2",
        labels: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        content: "",
        sourcePath: "/tmp/one.md"
      },
      {
        uuid: "2",
        title: "Two",
        slug: "two",
        status: "done",
        priority: "P1",
        labels: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        content: "",
        sourcePath: "/tmp/two.md"
      }
    ]);

    expect(snapshot.totalTasks).toBe(2);
    expect(snapshot.columns.find((column) => column.status === "todo")?.taskCount).toBe(1);
    expect(snapshot.columns.find((column) => column.status === "done")?.taskCount).toBe(1);
  });
});
