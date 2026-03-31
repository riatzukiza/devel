import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import { buildKanbanTitle, defaultStatusOrder, normalizeKanbanStatus } from "./fsm.js";
import type { KanbanTask } from "./types.js";

const priorityRank: Record<string, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3
};

export const normalizeStatus = (status: string | undefined): string => {
  const normalized = normalizeKanbanStatus(status);
  return typeof normalized === "string" ? normalized : "incoming";
};

export const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "") || "task";

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => (typeof entry === "string" ? entry.split(",") : []))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
};

const parseInlineValue = (value: string): unknown => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  if (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) {
    return trimmedValue
      .slice(1, -1)
      .split(",")
      .map((entry) => entry.trim().replace(/^['"]|['"]$/gu, ""))
      .filter(Boolean);
  }

  return trimmedValue.replace(/^['"]|['"]$/gu, "");
};

const parseFallbackFrontmatter = (source: string): { data: Record<string, unknown>; content: string } => {
  const frontmatterMatch = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/u);
  if (!frontmatterMatch) {
    return {
      data: {},
      content: source.trim()
    };
  }

  const data: Record<string, unknown> = {};
  let currentArrayKey: string | undefined;

  for (const rawLine of frontmatterMatch[1].split("\n")) {
    const arrayItemMatch = rawLine.match(/^\s*-\s+(.+)$/u);
    if (currentArrayKey && arrayItemMatch) {
      const arrayValue = data[currentArrayKey];
      if (Array.isArray(arrayValue)) {
        arrayValue.push(String(parseInlineValue(arrayItemMatch[1] ?? "")));
      }
      continue;
    }

    currentArrayKey = undefined;
    const keyValueMatch = rawLine.match(/^\s*([A-Za-z0-9_]+):\s*(.*)$/u);
    if (!keyValueMatch) {
      continue;
    }

    const key = keyValueMatch[1] ?? "";
    const rawValue = keyValueMatch[2] ?? "";
    if (!rawValue.trim()) {
      data[key] = [];
      currentArrayKey = key;
      continue;
    }

    data[key] = parseInlineValue(rawValue);
  }

  return {
    data,
    content: source.slice(frontmatterMatch[0].length).trim()
  };
};

const parseTaskFile = (source: string): { data: Record<string, unknown>; content: string } => {
  try {
    const parsed = matter(source);
    return {
      data: parsed.data as Record<string, unknown>,
      content: parsed.content
    };
  } catch {
    return parseFallbackFrontmatter(source);
  }
};

const collectMarkdownFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectMarkdownFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
    })
  );

  return files.flat();
};

const taskSort = (left: KanbanTask, right: KanbanTask): number => {
  const leftStatusIndex = defaultStatusOrder.indexOf(left.status as (typeof defaultStatusOrder)[number]);
  const rightStatusIndex = defaultStatusOrder.indexOf(right.status as (typeof defaultStatusOrder)[number]);
  const normalizedLeftStatusIndex = leftStatusIndex === -1 ? defaultStatusOrder.length : leftStatusIndex;
  const normalizedRightStatusIndex = rightStatusIndex === -1 ? defaultStatusOrder.length : rightStatusIndex;

  if (normalizedLeftStatusIndex !== normalizedRightStatusIndex) {
    return normalizedLeftStatusIndex - normalizedRightStatusIndex;
  }

  const leftPriority = priorityRank[left.priority] ?? priorityRank.P3;
  const rightPriority = priorityRank[right.priority] ?? priorityRank.P3;
  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return left.title.localeCompare(right.title);
};

export const buildColumnTitle = (status: string): string => buildKanbanTitle(status);

export const loadTasks = async (tasksDir: string): Promise<KanbanTask[]> => {
  const files = await collectMarkdownFiles(tasksDir);
  const tasks = await Promise.all(
    files.map(async (filePath) => {
      const source = await readFile(filePath, "utf8");
      const parsed = parseTaskFile(source);
      const fileStats = await stat(filePath);
      const frontmatter = parsed.data;

      const title = typeof frontmatter.title === "string" ? frontmatter.title.trim() : path.basename(filePath, ".md");
      const priority = typeof frontmatter.priority === "string" ? frontmatter.priority.toUpperCase() : "P3";
      const labels = [
        ...normalizeStringArray(frontmatter.labels),
        ...normalizeStringArray(frontmatter.tags)
      ];

      const uniqueLabels = Array.from(new Set(labels));
      const uuid = typeof frontmatter.uuid === "string" ? frontmatter.uuid : slugify(title);

      return {
        uuid,
        title,
        slug: typeof frontmatter.slug === "string" ? frontmatter.slug : slugify(title),
        status: normalizeStatus(typeof frontmatter.status === "string" ? frontmatter.status : undefined),
        priority,
        labels: uniqueLabels,
        createdAt:
          typeof frontmatter.created_at === "string"
            ? frontmatter.created_at
            : fileStats.mtime.toISOString(),
        content: parsed.content.trim(),
        sourcePath: filePath
      } satisfies KanbanTask;
    })
  );

  return tasks.sort(taskSort);
};
