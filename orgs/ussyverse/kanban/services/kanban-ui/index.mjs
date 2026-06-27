import http from "node:http";
import path from "node:path";
import { mkdir, readdir, readFile, rename, stat, writeFile } from "node:fs/promises";

const json = (res, status, payload) => {
  const body = JSON.stringify(payload, null, 2);
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(body);
};

const text = (res, status, payload, contentType = "text/plain; charset=utf-8") => {
  res.statusCode = status;
  res.setHeader("content-type", contentType);
  res.setHeader("cache-control", "no-store");
  res.end(payload);
};

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return undefined;
  return JSON.parse(raw);
};

const defaultStatusOrder = [
  "icebox",
  "incoming",
  "accepted",
  "breakdown",
  "blocked",
  "ready",
  "todo",
  "in_progress",
  "review",
  "document",
  "done",
  "rejected"
];

const normalizeStatus = (status) => {
  if (!status) return "incoming";
  return status.trim().toLowerCase().replace(/[\s-]+/g, "_");
};

const slugify = (value) =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "task";

const buildColumnTitle = (status) =>
  status
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");

const frontmatterPattern = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/u;

const parseInlineValue = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((entry) => entry.trim().replace(/^['\"]|['\"]$/g, ""))
      .filter(Boolean);
  }
  return trimmed.replace(/^['\"]|['\"]$/g, "");
};

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
      if (Array.isArray(arr)) {
        arr.push(String(parseInlineValue(arrayItemMatch[1] ?? "")));
      }
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
    data[key] = parseInlineValue(raw);
  }
  return { data, content: source.slice(match[0].length).trim() };
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

const normalizeStringArray = (value) => {
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

const loadTasks = async (tasksDir) => {
  const files = await collectMarkdownFiles(tasksDir);
  const tasks = await Promise.all(
    files.map(async (filePath) => {
      const source = await readFile(filePath, "utf8");
      const parsed = parseFrontmatterFallback(source);
      const fileStats = await stat(filePath);
      const fm = parsed.data;

      const title = typeof fm.title === "string" ? fm.title.trim() : path.basename(filePath, ".md");
      const priority = typeof fm.priority === "string" ? fm.priority.toUpperCase() : "P3";
      const labels = [...normalizeStringArray(fm.labels), ...normalizeStringArray(fm.tags)];
      const uniqueLabels = Array.from(new Set(labels));
      const uuid = typeof fm.uuid === "string" ? fm.uuid : slugify(title);

      return {
        uuid,
        title,
        slug: typeof fm.slug === "string" ? fm.slug : slugify(title),
        status: normalizeStatus(typeof fm.status === "string" ? fm.status : undefined),
        priority,
        labels: uniqueLabels,
        createdAt: typeof fm.created_at === "string" ? fm.created_at : fileStats.mtime.toISOString(),
        content: parsed.content.trim(),
        sourcePath: filePath
      };
    })
  );

  return tasks;
};

const buildBoardSnapshot = (tasks) => {
  const statuses = Array.from(new Set([...defaultStatusOrder, ...tasks.map((t) => t.status)]));
  return {
    generatedAt: new Date().toISOString(),
    totalTasks: tasks.length,
    columns: statuses.map((status) => {
      const columnTasks = tasks.filter((t) => t.status === status);
      return {
        status,
        title: buildColumnTitle(status),
        taskCount: columnTasks.length,
        tasks: columnTasks
      };
    })
  };
};

const updateFrontmatterStatus = (source, nextStatus) => {
  const match = source.match(frontmatterPattern);
  if (!match) return source;
  const newline = match[0].includes("\r\n") ? "\r\n" : "\n";
  const fm = match[1] ?? "";
  const rest = source.slice(match[0].length);
  const lines = fm.split(/\r?\n/u);

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

  return `---${newline}${nextLines.join(newline)}${newline}---${newline}` + rest;
};

const looksLikeStatusFolderTree = (tasksDir, taskPath, taskStatus) => {
  const relative = path.relative(tasksDir, taskPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return false;
  const segments = relative.split(path.sep).filter(Boolean);
  const parent = segments.length >= 2 ? segments[0] : undefined;
  return parent === taskStatus && defaultStatusOrder.includes(parent);
};

const maybeMoveTaskFile = async (tasksDir, task, nextStatus) => {
  if (task.status === nextStatus) return task.sourcePath;
  if (!looksLikeStatusFolderTree(tasksDir, task.sourcePath, task.status)) return task.sourcePath;

  const fileName = path.basename(task.sourcePath);
  const nextDir = path.join(tasksDir, nextStatus);
  const nextPath = path.join(nextDir, fileName);
  if (nextPath === task.sourcePath) return task.sourcePath;

  await mkdir(nextDir, { recursive: true });
  try {
    await readFile(nextPath, "utf8");
    return task.sourcePath;
  } catch {
    // ok
  }

  await rename(task.sourcePath, nextPath);
  return nextPath;
};

const writeTaskStatus = async (task, tasksDir, nextStatus) => {
  const source = await readFile(task.sourcePath, "utf8");
  const updatedSource = updateFrontmatterStatus(source, nextStatus);
  await writeFile(task.sourcePath, updatedSource, "utf8");

  const movedPath = await maybeMoveTaskFile(tasksDir, task, nextStatus);
  if (movedPath !== task.sourcePath) {
    await writeFile(movedPath, updatedSource, "utf8");
  }

  return { ...task, status: nextStatus, sourcePath: movedPath };
};

const html = String.raw;

const indexHtml = html`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ussyverse Kanban UI</title>
    <style>
      :root {
        --bg: #0b0b10;
        --panel: #12121a;
        --text: #e7e7f1;
        --muted: #9aa0aa;
        --accent: #7c5cff;
        --border: rgba(255,255,255,0.12);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        height: 100vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        background: radial-gradient(1200px 800px at 20% 0%, rgba(124,92,255,0.18), transparent 60%), var(--bg);
        color: var(--text);
      }
      header {
        position: sticky;
        top: 0;
        z-index: 10;
        padding: 12px 14px;
        background: rgba(11,11,16,0.85);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--border);
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
      }
      header h1 { margin: 0; font-size: 14px; letter-spacing: 0.02em; }
      header .controls { display: flex; gap: 8px; align-items: center; }
      input[type="search"] {
        width: min(420px, 54vw);
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: rgba(18,18,26,0.9);
        color: var(--text);
        outline: none;
      }
      button {
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: rgba(18,18,26,0.9);
        color: var(--text);
        cursor: pointer;
      }
      .wrap { padding: 12px; flex: 1 1 auto; min-height: 0; overflow: hidden; }
      .board {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(260px, 1fr);
        grid-template-rows: 1fr;
        gap: 10px;
        height: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        overscroll-behavior: contain;
      }
      .col {
        background: linear-gradient(180deg, rgba(18,18,26,0.95), rgba(18,18,26,0.78));
        border: 1px solid var(--border);
        border-radius: 14px;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
      .col header { position: initial; backdrop-filter: none; background: transparent; border-bottom: 1px solid var(--border); padding: 10px; }
      .col header .title { display: flex; align-items: baseline; justify-content: space-between; width: 100%; gap: 10px; }
      .col header .name { font-weight: 650; font-size: 13px; }
      .col header .count { color: var(--muted); font-size: 12px; }
      .list {
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
      }
      .card {
        background: linear-gradient(180deg, rgba(16,16,24,0.95), rgba(16,16,24,0.75));
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 12px;
        padding: 10px;
        cursor: grab;
      }
      .card.dragging { opacity: 0.4; }
      .card .top { display: flex; justify-content: space-between; gap: 10px; align-items: start; }
      .card .title { font-size: 13px; line-height: 1.25; font-weight: 600; }
      .pill { font-size: 11px; padding: 2px 7px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12); color: var(--muted); }
      .pill.prio { color: #fff; border-color: rgba(124,92,255,0.45); background: rgba(124,92,255,0.14); }
      .meta { margin-top: 8px; color: var(--muted); font-size: 11px; display: flex; gap: 6px; flex-wrap: wrap; }
      .toast { position: fixed; bottom: 12px; right: 12px; max-width: min(520px, 92vw); padding: 10px 12px; border-radius: 12px; border: 1px solid var(--border); background: rgba(18,18,26,0.92); color: var(--text); display: none; white-space: pre-wrap; }
      .toast.show { display: block; }
      .dropHint { outline: 2px dashed rgba(124,92,255,0.55); outline-offset: -4px; }
    </style>
  </head>
  <body>
    <header>
      <h1>Ussyverse Kanban UI — drag cards to change status</h1>
      <div class="controls">
        <input id="q" type="search" placeholder="filter… (title/labels/path)" />
        <button id="reload">reload</button>
      </div>
    </header>

    <div class="wrap">
      <div id="board" class="board"></div>
    </div>

    <div id="toast" class="toast"></div>

    <script>
      const $ = (sel) => document.querySelector(sel);
      const toast = (msg) => {
        const el = $("#toast");
        el.textContent = msg;
        el.classList.add("show");
        setTimeout(() => el.classList.remove("show"), 3200);
      };
      const escapeHtml = (s) => (s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

      let snapshot = null;

      const fetchBoard = async () => {
        const res = await fetch("/api/board", { cache: "no-store" });
        if (!res.ok) throw new Error("failed to load board: " + res.status);
        snapshot = await res.json();
        return snapshot;
      };

      const moveTask = async (uuid, status) => {
        const res = await fetch("/api/task/" + encodeURIComponent(uuid) + "/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || ("move failed: " + res.status));
        }
        return await res.json();
      };

      const cardMatchesQuery = (task, q) => {
        if (!q) return true;
        const hay = [task.title, task.priority, (task.labels||[]).join(" "), task.sourcePath].join(" ").toLowerCase();
        return hay.includes(q.toLowerCase());
      };

      const render = () => {
        const q = $("#q").value.trim();
        const boardEl = $("#board");
        boardEl.innerHTML = "";

        for (const col of snapshot.columns) {
          const colEl = document.createElement("section");
          colEl.className = "col";
          colEl.dataset.status = col.status;

          const head = document.createElement("header");
          head.innerHTML =
            '<div class="title">' +
              '<div class="name">' + escapeHtml(col.title) + '</div>' +
              '<div class="count">' + col.taskCount + '</div>' +
            '</div>';

          const list = document.createElement("div");
          list.className = "list";

          const tasks = (col.tasks || []).filter((t) => cardMatchesQuery(t, q));

          for (const task of tasks) {
            const card = document.createElement("div");
            card.className = "card";
            card.draggable = true;
            card.dataset.uuid = task.uuid;

            const labelPills = (task.labels || [])
              .slice(0, 6)
              .map((l) => '<span class="pill">' + escapeHtml(l) + '</span>')
              .join(' ');

            card.innerHTML =
              '<div class="top">' +
                '<div class="title">' + escapeHtml(task.title) + '</div>' +
                '<div class="pill prio">' + escapeHtml(task.priority) + '</div>' +
              '</div>' +
              '<div class="meta">' +
                labelPills +
                ' <span class="pill">' + escapeHtml(task.sourcePath) + '</span>' +
              '</div>';

            card.addEventListener("dragstart", (e) => {
              card.classList.add("dragging");
              e.dataTransfer.setData("text/plain", task.uuid);
              e.dataTransfer.effectAllowed = "move";
            });
            card.addEventListener("dragend", () => card.classList.remove("dragging"));

            list.appendChild(card);
          }

          const allowDrop = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          };

          list.addEventListener("dragenter", (e) => { allowDrop(e); list.classList.add("dropHint"); });
          list.addEventListener("dragover", allowDrop);
          list.addEventListener("dragleave", () => list.classList.remove("dropHint"));
          list.addEventListener("drop", async (e) => {
            e.preventDefault();
            list.classList.remove("dropHint");
            const uuid = e.dataTransfer.getData("text/plain");
            if (!uuid) return;
            try {
              await moveTask(uuid, col.status);
              await refresh();
            } catch (err) {
              toast(String(err?.message || err));
            }
          });

          colEl.appendChild(head);
          colEl.appendChild(list);
          boardEl.appendChild(colEl);
        }
      };

      const refresh = async () => {
        try {
          await fetchBoard();
          render();
        } catch (err) {
          toast(String(err?.message || err));
        }
      };

      $("#reload").addEventListener("click", refresh);
      $("#q").addEventListener("input", () => snapshot && render());

      refresh();
    </script>
  </body>
</html>`;

const PORT = Number(process.env.PORT ?? "8788");
const HOST = process.env.HOST ?? "0.0.0.0";
const TASKS_DIR = path.resolve(process.env.TASKS_DIR ?? path.join(process.cwd(), "..", "..", "tasks"));

const stripBase = (baseDir, value) => {
  const relative = path.relative(baseDir, value);
  return relative.startsWith("..") ? value : relative;
};

const start = () => {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

      if (req.method === "GET" && url.pathname === "/") {
        text(res, 200, indexHtml, "text/html; charset=utf-8");
        return;
      }

      if (req.method === "GET" && url.pathname === "/health") {
        json(res, 200, { ok: true });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/board") {
        const tasks = await loadTasks(TASKS_DIR);
        const snapshot = buildBoardSnapshot(tasks);
        // make paths relative to tasks dir
        snapshot.columns.forEach((col) => {
          col.tasks.forEach((t) => {
            t.sourcePath = stripBase(TASKS_DIR, t.sourcePath);
          });
        });
        json(res, 200, snapshot);
        return;
      }

      const m = url.pathname.match(/^\/api\/task\/([^/]+)\/status$/u);
      if (m) {
        if (req.method !== "POST") {
          text(res, 405, "method not allowed\n");
          return;
        }
        const uuid = decodeURIComponent(m[1] ?? "");
        const body = await readJsonBody(req);
        const nextStatus = typeof body?.status === "string" ? body.status.trim() : "";
        if (!nextStatus) {
          text(res, 400, "missing status\n");
          return;
        }

        const tasks = await loadTasks(TASKS_DIR);
        const task = tasks.find((t) => t.uuid === uuid);
        if (!task) {
          text(res, 404, "unknown uuid\n");
          return;
        }

        const updated = await writeTaskStatus(task, TASKS_DIR, nextStatus);
        updated.sourcePath = stripBase(TASKS_DIR, updated.sourcePath);
        json(res, 200, updated);
        return;
      }

      text(res, 404, "not found\n");
    } catch (err) {
      json(res, 500, { ok: false, error: err?.message ?? String(err) });
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`kanban-ui listening on http://${HOST}:${PORT}`);
    console.log(`tasks: ${TASKS_DIR}`);
  });
};

start();
