import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { exec } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildBoardSnapshot } from "./board.js";
import { parseTaskContent, updateFrontmatterField, appendComment } from "./content-parser.js";
import { loadTasks } from "./tasks.js";
import type { KanbanBoardSnapshot, KanbanProject, KanbanTask } from "./types.js";
import { writeTaskStatus } from "./task-writeback.js";

export interface KanbanServerOptions {
  tasksDir?: string;
  projects?: KanbanProject[];
  defaultProjectId?: string;
  host?: string;
  port: number;
}

const readJsonBody = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return undefined;
  }
  return JSON.parse(raw) as unknown;
};

const sendJson = (res: ServerResponse, status: number, payload: unknown): void => {
  const body = JSON.stringify(payload, null, 2);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(body);
};

const sendText = (res: ServerResponse, status: number, body: string, contentType = "text/plain; charset=utf-8"): void => {
  res.statusCode = status;
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "no-store");
  res.end(body);
};

const html = String.raw;

const indexHtml = html`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OpenHax Kanban (local)</title>
    <style>
      :root {
        --bg: #0b0b10;
        --panel: #12121a;
        --panel2: #171724;
        --text: #e7e7f1;
        --muted: #9aa0aa;
        --accent: #7c5cff;
        --border: rgba(255,255,255,0.12);
        --card: #101018;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        height: 100vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
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
      header h1 {
        margin: 0;
        font-size: 14px;
        letter-spacing: 0.02em;
        color: var(--text);
      }
      header .controls {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      input[type="search"], select {
        width: min(420px, 54vw);
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: rgba(18,18,26,0.9);
        color: var(--text);
        outline: none;
      }
      select { width: min(240px, 32vw); }
      button {
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: rgba(18,18,26,0.9);
        color: var(--text);
        cursor: pointer;
      }
      button:hover { border-color: rgba(124,92,255,0.55); }
      .wrap {
        padding: 12px;
        flex: 1 1 auto;
        min-height: 0;
        overflow: hidden;
      }
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
      .col header {
        position: initial;
        backdrop-filter: none;
        background: transparent;
        border-bottom: 1px solid var(--border);
        padding: 10px;
      }
      .col header .title {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        width: 100%;
        gap: 10px;
      }
      .col header .name {
        font-weight: 650;
        font-size: 13px;
      }
      .col header .count {
        color: var(--muted);
        font-size: 12px;
      }
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
      .card:active { cursor: grabbing; }
      .card.dragging { opacity: 0.4; }
      .card .top {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: start;
      }
      .card .title {
        font-size: 13px;
        line-height: 1.25;
        font-weight: 600;
      }
      .pill {
        font-size: 11px;
        padding: 2px 7px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.12);
        color: var(--muted);
      }
      .pill.prio { color: #fff; border-color: rgba(124,92,255,0.45); background: rgba(124,92,255,0.14); }
      .meta {
        margin-top: 8px;
        color: var(--muted);
        font-size: 11px;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .toast {
        position: fixed;
        bottom: 12px;
        right: 12px;
        max-width: min(520px, 92vw);
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: rgba(18,18,26,0.92);
        color: var(--text);
        display: none;
        white-space: pre-wrap;
      }
      .toast.show { display: block; }
      .dropHint {
        outline: 2px dashed rgba(124,92,255,0.55);
        outline-offset: -4px;
      }
      a { color: var(--accent); }
    </style>
  </head>
  <body>
    <header>
      <h1 id="title">OpenHax Kanban (local) — drag cards to change status</h1>
      <div class="controls">
        <select id="project"></select>
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
      let projects = [];
      let currentProjectId = "";

      const projectQuery = () => currentProjectId ? "?project=" + encodeURIComponent(currentProjectId) : "";

      const fetchProjects = async () => {
        const res = await fetch("/api/projects", { cache: "no-store" });
        if (!res.ok) throw new Error("failed to load projects: " + res.status);
        const payload = await res.json();
        projects = payload.projects || [];
        currentProjectId = currentProjectId || payload.defaultProjectId || projects[0]?.id || "";
        const select = $("#project");
        select.innerHTML = "";
        for (const project of projects) {
          const opt = document.createElement("option");
          opt.value = project.id;
          opt.textContent = project.title || project.id;
          opt.selected = project.id === currentProjectId;
          select.appendChild(opt);
        }
      };

      const fetchBoard = async () => {
        const res = await fetch("/api/board" + projectQuery(), { cache: "no-store" });
        if (!res.ok) throw new Error("failed to load board: " + res.status);
        snapshot = await res.json();
        return snapshot;
      };

      const moveTask = async (uuid, status) => {
        const res = await fetch("/api/task/" + encodeURIComponent(uuid) + "/status" + projectQuery(), {
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

        const project = snapshot.project || projects.find((candidate) => candidate.id === currentProjectId);
        $("#title").textContent = "OpenHax Kanban — " + (project?.title || currentProjectId || "local") + " — " + snapshot.totalTasks + " tasks";

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
          if (projects.length === 0) await fetchProjects();
          await fetchBoard();
          render();
        } catch (err) {
          toast(String(err?.message || err));
        }
      };

      $("#reload").addEventListener("click", refresh);
      $("#q").addEventListener("input", () => snapshot && render());
      $("#project").addEventListener("change", async (event) => {
        currentProjectId = event.target.value;
        snapshot = null;
        await refresh();
      });

      refresh();
    </script>
  </body>
</html>`;

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const sendFile = async (res: ServerResponse, filePath: string): Promise<boolean> => {
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return false;
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] ?? "application/octet-stream";
    const body = await readFile(filePath);
    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");
    res.end(body);
    return true;
  } catch {
    return false;
  }
};

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/web");

const resolveNotFound = (res: ServerResponse): void => {
  sendText(res, 404, "not found\n");
};

const resolveMethodNotAllowed = (res: ServerResponse): void => {
  sendText(res, 405, "method not allowed\n");
};

const stripBase = (baseDir: string, value: string): string => {
  const relative = path.relative(baseDir, value);
  return relative.startsWith("..") ? value : relative;
};

const normalizeProjectId = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "") || "kanban";

const normalizeProjects = ({ tasksDir, projects, defaultProjectId }: KanbanServerOptions): {
  projects: KanbanProject[];
  defaultProjectId: string;
} => {
  const rawProjects = projects && projects.length > 0
    ? projects
    : tasksDir
      ? [{ id: normalizeProjectId(path.basename(tasksDir)), title: path.basename(tasksDir), tasksDir }]
      : [];

  if (rawProjects.length === 0) {
    throw new Error("Kanban server requires at least one tasksDir or project.");
  }

  const seen = new Set<string>();
  const normalized = rawProjects.map((project, index) => {
    const baseId = normalizeProjectId(project.id || project.title || path.basename(project.tasksDir) || `project-${index + 1}`);
    let id = baseId;
    let suffix = 2;
    while (seen.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }
    seen.add(id);

    return {
      id,
      title: project.title || id,
      tasksDir: path.resolve(project.tasksDir)
    } satisfies KanbanProject;
  });

  const fallbackProjectId = normalized[0]?.id;
  if (!fallbackProjectId) {
    throw new Error("Kanban server requires at least one project.");
  }

  const resolvedDefaultProjectId =
    defaultProjectId && normalized.some((project) => project.id === defaultProjectId)
      ? defaultProjectId
      : fallbackProjectId;

  return { projects: normalized, defaultProjectId: resolvedDefaultProjectId };
};

export type StartedKanbanServer = Readonly<{
  server: http.Server;
  host: string;
  port: number;
  url: string;
  tasksDir: string;
  projects: KanbanProject[];
  defaultProjectId: string;
}>;

export const startKanbanServer = async (options: KanbanServerOptions): Promise<StartedKanbanServer> => {
  const { host, port } = options;
  const resolvedHost = host ?? "127.0.0.1";
  const projectState = normalizeProjects(options);
  const projectsById = new Map(projectState.projects.map((project) => [project.id, project]));

  const pickProject = (url: URL): KanbanProject | undefined => {
    const requestedProjectId = url.searchParams.get("project")?.trim() || projectState.defaultProjectId;
    return projectsById.get(requestedProjectId);
  };

  const serializeTask = (project: KanbanProject, task: KanbanTask): KanbanTask => ({
    ...task,
    sourcePath: stripBase(project.tasksDir, task.sourcePath)
  });

  const serializeBoard = (project: KanbanProject, snapshot: KanbanBoardSnapshot): KanbanBoardSnapshot & { project: KanbanProject } => ({
    ...snapshot,
    project,
    columns: snapshot.columns.map((col) => ({
      ...col,
      tasks: col.tasks.map((task) => serializeTask(project, task))
    }))
  });

  const requireProject = (url: URL, res: ServerResponse): KanbanProject | undefined => {
    const project = pickProject(url);
    if (!project) {
      sendJson(res, 404, {
        error: "unknown project",
        project: url.searchParams.get("project") ?? projectState.defaultProjectId,
        knownProjects: projectState.projects.map((candidate) => candidate.id)
      });
      return undefined;
    }
    return project;
  };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

      // API routes first
      if (req.method === "GET" && url.pathname === "/api/projects") {
        sendJson(res, 200, {
          defaultProjectId: projectState.defaultProjectId,
          projects: projectState.projects
        });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/board") {
        const project = requireProject(url, res);
        if (!project) return;
        const tasks = await loadTasks(project.tasksDir);
        const snapshot = buildBoardSnapshot(tasks);
        sendJson(res, 200, serializeBoard(project, snapshot));
        return;
      }

      const moveMatch = url.pathname.match(/^\/api\/task\/([^/]+)\/status$/u);
      if (moveMatch) {
        if (req.method !== "POST") {
          resolveMethodNotAllowed(res);
          return;
        }

        const project = requireProject(url, res);
        if (!project) return;
        const uuid = decodeURIComponent(moveMatch[1] ?? "");
        const body = (await readJsonBody(req)) as { status?: unknown } | undefined;
        const nextStatus = typeof body?.status === "string" ? body.status.trim() : "";
        if (!nextStatus) {
          sendText(res, 400, "missing status\n");
          return;
        }

        const tasks = await loadTasks(project.tasksDir);
        const task = tasks.find((candidate) => candidate.uuid === uuid);
        if (!task) {
          sendText(res, 404, `unknown uuid: ${uuid}\n`);
          return;
        }

        const updated = await writeTaskStatus(task, project.tasksDir, nextStatus);
        sendJson(res, 200, serializeTask(project, updated));
        return;
      }

      const contentMatch = url.pathname.match(/^\/api\/task\/([^/]+)\/content$/u);
      if (contentMatch && req.method === "GET") {
        const project = requireProject(url, res);
        if (!project) return;
        const uuid = decodeURIComponent(contentMatch[1] ?? "");
        const tasks = await loadTasks(project.tasksDir);
        const task = tasks.find((candidate) => candidate.uuid === uuid);
        if (!task) {
          sendText(res, 404, `unknown uuid: ${uuid}\n`);
          return;
        }
        const rawContent = await readFile(task.sourcePath, "utf8");
        const parsed = parseTaskContent(rawContent);
        sendJson(res, 200, {
          ...parsed,
          sourcePath: stripBase(project.tasksDir, task.sourcePath),
          absolutePath: task.sourcePath,
        });
        return;
      }

      const frontmatterMatch = url.pathname.match(/^\/api\/task\/([^/]+)\/frontmatter$/u);
      if (frontmatterMatch && req.method === "PATCH") {
        const project = requireProject(url, res);
        if (!project) return;
        const uuid = decodeURIComponent(frontmatterMatch[1] ?? "");
        const tasks = await loadTasks(project.tasksDir);
        const task = tasks.find((candidate) => candidate.uuid === uuid);
        if (!task) {
          sendText(res, 404, `unknown uuid: ${uuid}\n`);
          return;
        }
        const body = (await readJsonBody(req)) as { key?: string; value?: unknown } | undefined;
        if (!body?.key) {
          sendText(res, 400, "missing key\n");
          return;
        }
        const updated = await updateFrontmatterField(task.sourcePath, body.key, body.value);
        sendJson(res, 200, updated);
        return;
      }

      const commentMatch = url.pathname.match(/^\/api\/task\/([^/]+)\/comment$/u);
      if (commentMatch && req.method === "POST") {
        const project = requireProject(url, res);
        if (!project) return;
        const uuid = decodeURIComponent(commentMatch[1] ?? "");
        const tasks = await loadTasks(project.tasksDir);
        const task = tasks.find((candidate) => candidate.uuid === uuid);
        if (!task) {
          sendText(res, 404, `unknown uuid: ${uuid}\n`);
          return;
        }
        const body = (await readJsonBody(req)) as { text?: string } | undefined;
        if (!body?.text?.trim()) {
          sendText(res, 400, "missing text\n");
          return;
        }
        const updated = await appendComment(task.sourcePath, body.text.trim());
        sendJson(res, 200, updated);
        return;
      }

      const openEditorMatch = url.pathname.match(/^\/api\/task\/([^/]+)\/open-editor$/u);
      if (openEditorMatch && req.method === "POST") {
        const project = requireProject(url, res);
        if (!project) return;
        const uuid = decodeURIComponent(openEditorMatch[1] ?? "");
        const tasks = await loadTasks(project.tasksDir);
        const task = tasks.find((candidate) => candidate.uuid === uuid);
        if (!task) {
          sendText(res, 404, `unknown uuid: ${uuid}\n`);
          return;
        }
        const editor = process.env.EDITOR || process.env.VISUAL || "xdg-open";
        const child = exec(`${editor} "${task.sourcePath}"`, (error) => {
          if (error) {
            console.error(`Failed to open editor: ${error.message}`);
          }
        });
        child.unref();
        sendJson(res, 200, { ok: true, file: stripBase(project.tasksDir, task.sourcePath), editor });
        return;
      }

      // Serve built web frontend (after API routes)
      if (req.method === "GET") {
        const staticPath = path.join(webDir, url.pathname);
        if (url.pathname !== "/" && await sendFile(res, staticPath)) {
          return;
        }
        const indexPath = path.join(webDir, "index.html");
        if (await sendFile(res, indexPath)) {
          return;
        }
        sendText(res, 200, indexHtml, "text/html; charset=utf-8");
        return;
      }

      resolveNotFound(res);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      sendText(res, 500, message + "\n");
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(port, resolvedHost, () => resolve());
  });

  const address = server.address();
  const resolvedPort = typeof address === "object" && address ? address.port : port;
  const url = `http://${resolvedHost}:${resolvedPort}`;

  console.log(`Kanban UI running at ${url}`);
  console.log(`Projects: ${projectState.projects.map((project) => `${project.id}=${project.tasksDir}`).join(", ")}`);

  return {
    server,
    host: resolvedHost,
    port: resolvedPort,
    url,
    tasksDir: projectsById.get(projectState.defaultProjectId)?.tasksDir ?? projectState.projects[0]?.tasksDir ?? "",
    projects: projectState.projects,
    defaultProjectId: projectState.defaultProjectId
  };
};
