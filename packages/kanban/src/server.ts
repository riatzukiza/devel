import http, { type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";

import { buildBoardSnapshot } from "./board.js";
import { loadTasks } from "./tasks.js";
import type { KanbanBoardSnapshot, KanbanTask } from "./types.js";
import { writeTaskStatus } from "./task-writeback.js";

export interface KanbanServerOptions {
  tasksDir: string;
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
      <h1>OpenHax Kanban (local) — drag cards to change status</h1>
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

export type StartedKanbanServer = Readonly<{
  server: http.Server;
  host: string;
  port: number;
  url: string;
  tasksDir: string;
}>;

export const startKanbanServer = async ({ tasksDir, host, port }: KanbanServerOptions): Promise<StartedKanbanServer> => {
  const resolvedHost = host ?? "127.0.0.1";

  const serializeTask = (task: KanbanTask): KanbanTask => ({
    ...task,
    sourcePath: stripBase(tasksDir, task.sourcePath)
  });

  const serializeBoard = (snapshot: KanbanBoardSnapshot): KanbanBoardSnapshot => ({
    ...snapshot,
    columns: snapshot.columns.map((col) => ({
      ...col,
      tasks: col.tasks.map(serializeTask)
    }))
  });

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

      if (req.method === "GET" && url.pathname === "/") {
        sendText(res, 200, indexHtml, "text/html; charset=utf-8");
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/board") {
        const tasks = await loadTasks(tasksDir);
        const snapshot = buildBoardSnapshot(tasks);
        sendJson(res, 200, serializeBoard(snapshot));
        return;
      }

      const moveMatch = url.pathname.match(/^\/api\/task\/([^/]+)\/status$/u);
      if (moveMatch) {
        if (req.method !== "POST") {
          resolveMethodNotAllowed(res);
          return;
        }

        const uuid = decodeURIComponent(moveMatch[1] ?? "");
        const body = (await readJsonBody(req)) as { status?: unknown } | undefined;
        const nextStatus = typeof body?.status === "string" ? body.status.trim() : "";
        if (!nextStatus) {
          sendText(res, 400, "missing status\n");
          return;
        }

        const tasks = await loadTasks(tasksDir);
        const task = tasks.find((candidate) => candidate.uuid === uuid);
        if (!task) {
          sendText(res, 404, `unknown uuid: ${uuid}\n`);
          return;
        }

        const updated = await writeTaskStatus(task, tasksDir, nextStatus);
        sendJson(res, 200, serializeTask(updated));
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
  console.log(`Tasks: ${tasksDir}`);

  return {
    server,
    host: resolvedHost,
    port: resolvedPort,
    url,
    tasksDir
  };
};
