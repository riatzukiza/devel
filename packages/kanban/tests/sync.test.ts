import { describe, expect, it } from "vitest";

import { buildCardDescription, extractTaskUuidFromCard, planTrelloSync } from "../src/sync.js";
import { extractBoardId } from "../src/trello-client.js";
import type { KanbanTask, TrelloBoardState } from "../src/types.js";

const sampleTask: KanbanTask = {
  uuid: "task-123",
  title: "Rewrite Kanban",
  slug: "rewrite-kanban",
  status: "in_progress",
  priority: "P1",
  labels: ["kanban", "trello"],
  createdAt: "2026-03-11T00:00:00.000Z",
  content: "Make it portable.",
  sourcePath: "/tmp/rewrite-kanban.md"
};

describe("extractBoardId", () => {
  it("accepts board urls and raw ids", () => {
    expect(extractBoardId("https://trello.com/b/Mu2BmeDE/ussyverse")).toBe("Mu2BmeDE");
    expect(extractBoardId("Mu2BmeDE")).toBe("Mu2BmeDE");
  });
});

describe("planTrelloSync", () => {
  it("creates missing lists and cards", () => {
    const boardState: TrelloBoardState = {
      board: {
        id: "board-1",
        name: "ussyverse",
        url: "https://trello.com/b/Mu2BmeDE/ussyverse",
        shortUrl: "https://trello.com/b/Mu2BmeDE",
        closed: false
      },
      lists: [],
      labels: [],
      cards: []
    };

    const plan = planTrelloSync([sampleTask], boardState, {
      dryRun: true,
      archiveMissing: false
    });

    expect(plan.summary.createLists).toBeGreaterThan(0);
    expect(plan.summary.createLabels).toBe(4);
    expect(plan.summary.createCards).toBe(1);
  });

  it("updates existing cards by uuid and archives missing cards when requested", () => {
    const boardState: TrelloBoardState = {
      board: {
        id: "board-1",
        name: "ussyverse",
        url: "https://trello.com/b/Mu2BmeDE/ussyverse",
        shortUrl: "https://trello.com/b/Mu2BmeDE",
        closed: false
      },
      lists: [
        { id: "list-1", idBoard: "board-1", name: "In Progress", closed: false, pos: 1 },
        { id: "list-2", idBoard: "board-1", name: "Done", closed: false, pos: 2 }
      ],
      labels: [
        { id: "label-1", idBoard: "board-1", name: "P1", color: "red" },
        { id: "label-2", idBoard: "board-1", name: "P0", color: "black" },
        { id: "label-3", idBoard: "board-1", name: "P2", color: "orange" },
        { id: "label-4", idBoard: "board-1", name: "P3", color: "green" }
      ],
      cards: [
        {
          id: "card-1",
          idList: "list-2",
          name: "Old Title",
          desc: buildCardDescription({ ...sampleTask, title: "Old Title", status: "done" }),
          closed: false,
          idLabels: ["label-1"],
          labels: [{ id: "label-1", idBoard: "board-1", name: "P1", color: "red" }],
          shortUrl: "https://trello.com/c/card-1"
        },
        {
          id: "card-2",
          idList: "list-2",
          name: "Deleted Task",
          desc: "Kanban UUID: missing-task\nStatus: done",
          closed: false,
          idLabels: [],
          labels: [],
          shortUrl: "https://trello.com/c/card-2"
        }
      ]
    };

    const plan = planTrelloSync([sampleTask], boardState, {
      dryRun: true,
      archiveMissing: true
    });

    expect(plan.summary.updateCards).toBe(1);
    expect(plan.summary.archiveCards).toBe(1);
    expect(plan.operations.find((operation) => operation.type === "updateCard")).toBeTruthy();
    expect(plan.operations.find((operation) => operation.type === "archiveCard")).toBeTruthy();
  });
});

describe("extractTaskUuidFromCard", () => {
  it("reads the UUID marker from descriptions", () => {
    expect(extractTaskUuidFromCard({ desc: "Kanban UUID: task-123\nStatus: todo" })).toBe("task-123");
  });
});
