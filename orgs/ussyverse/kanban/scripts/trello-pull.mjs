#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const CONFIG_PATH = process.argv.includes("--config")
  ? process.argv[process.argv.indexOf("--config") + 1]
  : "ussyverse.kanban.json";

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_API_TOKEN = process.env.TRELLO_API_TOKEN;

if (!TRELLO_API_KEY || !TRELLO_API_TOKEN) {
  throw new Error("Missing TRELLO_API_KEY or TRELLO_API_TOKEN");
}

const normalizeStatus = (status) => (status ?? "incoming").trim().toLowerCase().replace(/[\s-]+/g, "_");
const slugify = (value) =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "task";

const readConfig = () => {
  const raw = readFileSync(CONFIG_PATH, "utf8");
  return JSON.parse(raw);
};

const config = readConfig();
const tasksDir = path.resolve(process.cwd(), config.tasksDir ?? "./tasks");

const trelloGetJson = async (url) => {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Trello GET failed: ${res.status} ${msg}`);
  }
  return res.json();
};

const parseBoardShortlink = (boardUrl) => {
  const u = new URL(boardUrl);
  const parts = u.pathname.split("/").filter(Boolean);
  const bIndex = parts.indexOf("b");
  return bIndex >= 0 ? parts[bIndex + 1] : undefined;
};

const boardIdOrShortlink = () => {
  const boardUrl = config.trello?.boardUrl;
  if (!boardUrl) {
    throw new Error("Missing trello.boardUrl in config");
  }
  const shortlink = parseBoardShortlink(boardUrl);
  if (!shortlink) {
    throw new Error(`Unable to parse board shortlink from ${boardUrl}`);
  }
  return shortlink;
};

const buildTrelloUrl = (p, params = {}) => {
  const url = new URL(`https://api.trello.com/1/${p}`);
  url.searchParams.set("key", TRELLO_API_KEY);
  url.searchParams.set("token", TRELLO_API_TOKEN);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  return url.toString();
};

const uuidFromCardDesc = (desc) => {
  const m = String(desc ?? "").match(/Kanban UUID:\s*(.+)$/m);
  return m?.[1]?.trim();
};

const parseDescPayload = (desc) => {
  const lines = String(desc ?? "").split(/\r?\n/);
  const meta = {};
  let i = 0;
  for (; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (!line.trim()) {
      i += 1;
      break;
    }
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      meta[key] = value;
    }
  }
  const body = lines.slice(i).join("\n").trim();
  return { meta, body };
};

const priorityFromMeta = (meta) => {
  const raw = String(meta?.Priority ?? "").trim().toUpperCase();
  return /^P[0-3]$/.test(raw) ? raw : "P3";
};

const labelsFromMeta = (meta) => {
  const raw = String(meta?.Labels ?? "");
  if (!raw || raw === "none") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((v, idx, all) => all.indexOf(v) === idx);
};

const invertListMapping = (mapping) => {
  const out = new Map();
  Object.entries(mapping ?? {}).forEach(([status, listName]) => {
    if (typeof listName === "string") {
      out.set(listName, normalizeStatus(status));
    }
  });
  return out;
};

const collectMarkdownFiles = async (directory) => {
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

const frontmatterPattern = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/u;

const parseFrontmatterFallback = (source) => {
  const match = source.match(frontmatterPattern);
  if (!match) {
    return { data: {}, content: source.trim() };
  }
  const data = {};
  let currentArrayKey;
  for (const rawLine of (match[1] ?? "").split("\n")) {
    const arrayItemMatch = rawLine.match(/^\s*-\s+(.+)$/u);
    if (currentArrayKey && arrayItemMatch) {
      const arr = data[currentArrayKey];
      if (Array.isArray(arr)) arr.push(String(arrayItemMatch[1] ?? "").trim());
      continue;
    }
    currentArrayKey = undefined;
    const kv = rawLine.match(/^\s*([A-Za-z0-9_]+):\s*(.*)$/u);
    if (!kv) continue;
    const key = kv[1];
    const raw = kv[2] ?? "";
    if (!raw.trim()) {
      data[key] = [];
      currentArrayKey = key;
      continue;
    }
    if (raw.startsWith("[") && raw.endsWith("]")) {
      data[key] = raw
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^['\"]|['\"]$/g, ""))
        .filter(Boolean);
    } else {
      data[key] = raw.trim().replace(/^['\"]|['\"]$/g, "");
    }
  }
  return { data, content: source.slice(match[0].length).trim() };
};

const loadExistingTasksByUuid = async () => {
  if (!existsSync(tasksDir)) {
    return new Map();
  }
  const files = await collectMarkdownFiles(tasksDir);
  const out = new Map();
  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    const parsed = parseFrontmatterFallback(source);
    const uuid = typeof parsed.data.uuid === "string" ? parsed.data.uuid : undefined;
    if (uuid) {
      out.set(uuid, filePath);
    }
  }
  return out;
};

const renderTask = ({ uuid, title, status, priority, labels, createdAt, body }) => {
  const lines = [
    "---",
    `uuid: ${uuid}`,
    `title: ${JSON.stringify(title)}`,
    `status: ${status}`,
    `priority: ${priority}`,
    "labels:",
    ...(labels.length ? labels.map((l) => `  - ${l}`) : ["  - []"]).filter((l) => l !== "  - []"),
    ...(labels.length ? [] : ["  []"]),
    `created_at: ${createdAt}`,
    "---",
    "",
    body ?? ""
  ];

  // fix labels serialization for empty list (YAML wants [] not a weird entry)
  return lines
    .join("\n")
    .replace(/^labels:\n  \[\]$/m, "labels: []")
    .replace(/^labels:\n  - \[\]$/m, "labels: []")
    .replace(/^labels:\n  \[\]$/m, "labels: []")
    .trimEnd() +
    "\n";
};

const ensureDir = async (dir) => {
  await mkdir(dir, { recursive: true });
};

const main = async () => {
  const shortlink = boardIdOrShortlink();
  const board = await trelloGetJson(buildTrelloUrl(`boards/${shortlink}`, { fields: "id,name,url" }));

  const lists = await trelloGetJson(
    buildTrelloUrl(`boards/${board.id}/lists`, { fields: "id,name,closed" })
  );
  const cards = await trelloGetJson(
    buildTrelloUrl(`boards/${board.id}/cards`, { fields: "id,idList,name,desc,closed,labels" })
  );

  const listMapping = config.trello?.listMapping ?? {};
  const listNameToStatus = invertListMapping(listMapping);
  const listIdToName = new Map(lists.map((l) => [l.id, l.name]));

  const existingByUuid = await loadExistingTasksByUuid();

  for (const card of cards) {
    if (card.closed) {
      continue;
    }

    const uuid = uuidFromCardDesc(card.desc) ?? card.id;
    const listName = listIdToName.get(card.idList) ?? "incoming";
    const status = listNameToStatus.get(listName) ?? normalizeStatus(listName);

    const { meta, body } = parseDescPayload(card.desc);
    const priority = priorityFromMeta(meta);
    const labels = labelsFromMeta(meta);

    const title = String(card.name ?? "").trim() || `Card ${uuid}`;

    const createdAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

    const existingPath = existingByUuid.get(uuid);

    const destDir = path.join(tasksDir, status);
    await ensureDir(destDir);

    const destPath = existingPath ?? path.join(destDir, `trello-${slugify(title)}.md`);

    const taskText = renderTask({ uuid, title, status, priority, labels, createdAt, body });

    await writeFile(destPath, taskText, "utf8");
  }

  console.log(`Pulled ${cards.length} cards from Trello board ${board.name}`);
};

main().catch((err) => {
  console.error(err?.stack ?? String(err));
  process.exitCode = 1;
});
