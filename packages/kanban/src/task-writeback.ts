import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { defaultStatusOrder, type KanbanTask } from "./types.js";

const frontmatterPattern = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/u;

const updateFrontmatterStatus = (source: string, nextStatus: string): string => {
  const match = source.match(frontmatterPattern);
  if (!match) {
    return source;
  }

  const newline = match[0].includes("\r\n") ? "\r\n" : "\n";
  const frontmatter = match[1] ?? "";
  const rest = source.slice(match[0].length);
  const lines = frontmatter.split(/\r?\n/u);

  let updated = false;
  const nextLines = lines.map((line) => {
    if (/^\s*status\s*:/iu.test(line)) {
      updated = true;
      const prefixMatch = line.match(/^(\s*status\s*:\s*).*/iu);
      const prefix = prefixMatch?.[1] ?? "status: ";
      return `${prefix}${nextStatus}`;
    }
    return line;
  });

  if (!updated) {
    const titleIndex = nextLines.findIndex((line) => /^\s*title\s*:/iu.test(line));
    const insertIndex = titleIndex >= 0 ? titleIndex + 1 : nextLines.length;
    nextLines.splice(insertIndex, 0, `status: ${nextStatus}`);
  }

  const nextFrontmatter = nextLines.join(newline);
  const normalizedPrefix = `---${newline}${nextFrontmatter}${newline}---${newline}`;
  return normalizedPrefix + rest;
};

const looksLikeStatusFolderTree = (tasksDir: string, taskPath: string, taskStatus: string): boolean => {
  const relative = path.relative(tasksDir, taskPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return false;
  }

  const segments = relative.split(path.sep).filter(Boolean);
  const parent = segments.length >= 2 ? segments[0] : undefined;
  if (!parent) {
    return false;
  }

  return parent === taskStatus && defaultStatusOrder.includes(parent as (typeof defaultStatusOrder)[number]);
};

const maybeMoveTaskFile = async (
  tasksDir: string,
  task: KanbanTask,
  nextStatus: string
): Promise<string> => {
  if (task.status === nextStatus) {
    return task.sourcePath;
  }

  if (!looksLikeStatusFolderTree(tasksDir, task.sourcePath, task.status)) {
    return task.sourcePath;
  }

  const fileName = path.basename(task.sourcePath);
  const nextDir = path.join(tasksDir, nextStatus);
  const nextPath = path.join(nextDir, fileName);

  if (nextPath === task.sourcePath) {
    return task.sourcePath;
  }

  await mkdir(nextDir, { recursive: true });

  try {
    await readFile(nextPath, "utf8");
    // target exists -> don't move; avoid collisions.
    return task.sourcePath;
  } catch {
    // ok
  }

  await rename(task.sourcePath, nextPath);
  return nextPath;
};

export const writeTaskStatus = async (task: KanbanTask, tasksDir: string, nextStatus: string): Promise<KanbanTask> => {
  const source = await readFile(task.sourcePath, "utf8");
  const updatedSource = updateFrontmatterStatus(source, nextStatus);
  await writeFile(task.sourcePath, updatedSource, "utf8");

  const movedPath = await maybeMoveTaskFile(tasksDir, task, nextStatus);
  // if file moved, we already wrote to old location; move after write.
  // rewrite after move to ensure the moved file carries the updated content.
  if (movedPath !== task.sourcePath) {
    await writeFile(movedPath, updatedSource, "utf8");
  }

  return {
    ...task,
    status: nextStatus,
    sourcePath: movedPath
  };
};
