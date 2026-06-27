import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildColumnTitle } from "./tasks.js";
import { defaultStatusOrder, type KanbanBoardSnapshot, type KanbanTask } from "./types.js";

export const buildBoardSnapshot = (tasks: KanbanTask[]): KanbanBoardSnapshot => {
  const statuses = Array.from(
    new Set([...defaultStatusOrder, ...tasks.map((task) => task.status)])
  );

  return {
    generatedAt: new Date().toISOString(),
    totalTasks: tasks.length,
    columns: statuses.map((status) => {
      const columnTasks = tasks.filter((task) => task.status === status);
      return {
        status,
        title: buildColumnTitle(status),
        taskCount: columnTasks.length,
        tasks: columnTasks
      };
    })
  };
};

export const writeBoardSnapshot = async (
  snapshot: KanbanBoardSnapshot,
  outputPath: string
): Promise<void> => {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
};
