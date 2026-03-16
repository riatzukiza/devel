#!/usr/bin/env node
/**
 * reconstitute.ts
 *
 * Reconstruction agent that:
 * - Searches OpenCode sessions via Chroma
 * - Loads Ollama-ready message blobs from LevelDB
 * - Runs a tool-using agent on qwen3-vl:8b-instruct
 * - Records paths, descriptions, and notes
 * - Exports a markdown tree mirroring recovered structure
 *
 * Usage:
 *   pnpm tsx reconstitute.ts <path>
 *
 * Environment:
 *   LEVEL_DIR                    - LevelDB directory (default: .reconstitute/level)
 *   OUTPUT_DIR                   - Output directory (default: .reconstitute/output)
 *   CHROMA_URL                   - Chroma server URL (default: http://localhost:8000)
 *   CHROMA_COLLECTION_SESSIONS   - Sessions collection (default: opencode_messages_v1)
 *   CHROMA_COLLECTION_NOTES      - Notes collection (default: reconstitute_notes_v1)
 *   OLLAMA_BASE_URL              - Ollama server URL (default: http://localhost:11434)
 *   OLLAMA_EMBED_MODEL           - Embedding model (default: qwen3-embedding:8b)
 *   OLLAMA_CHAT_MODEL            - Chat model (default: qwen3-vl:8b-instruct)
 *   OLLAMA_NUM_CTX               - Context length (default: 32768)
 *   SEARCH_LIMIT                 - Search result limit (default: 25)
 *   WINDOW                       - Messages around each hit (default: 2)
 */
import "dotenv/config";

import { ChromaClient, IncludeEnum } from "chromadb";
import { Level } from "level";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

type OllamaMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "assistant";
      content?: string;
      tool_calls?: Array<{
        type: "function";
        function: { index: number; name: string; arguments: Record<string, unknown> };
      }>;
    }
  | { role: "tool"; tool_name: string; content: string };

type ToolDef = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: string[];
      additionalProperties?: boolean;
    };
  };
};

interface Env {
  LEVEL_DIR: string;
  OUTPUT_DIR: string;
  CHROMA_URL: string;
  CHROMA_TENANT?: string;
  CHROMA_DATABASE?: string;
  CHROMA_TOKEN?: string;
  CHROMA_COLLECTION_SESSIONS: string;
  CHROMA_COLLECTION_NOTES: string;
  OLLAMA_BASE_URL: string;
  OLLAMA_EMBED_MODEL: string;
  OLLAMA_CHAT_MODEL: string;
  OLLAMA_NUM_CTX: number;
  TTL_EMBED_MS: number;
  TTL_SEARCH_MS: number;
  TTL_CHAT_MS: number;
  SEARCH_LIMIT: number;
  SEARCH_THRESHOLD: number | null;
  WINDOW: number;
  BATCH_SIZE: number;
  MAX_TOOL_ITERS: number;
  MAX_AGENT_TURNS_PER_QUESTION: number;
  MAX_PATHS: number;
}

function env(): Env {
  return {
    LEVEL_DIR: process.env.LEVEL_DIR ?? ".reconstitute/level",
    OUTPUT_DIR: process.env.OUTPUT_DIR ?? ".reconstitute/output",
    CHROMA_URL: process.env.CHROMA_URL ?? "http://localhost:8000",
    CHROMA_TENANT: process.env.CHROMA_TENANT,
    CHROMA_DATABASE: process.env.CHROMA_DATABASE,
    CHROMA_TOKEN: process.env.CHROMA_TOKEN,
    CHROMA_COLLECTION_SESSIONS: process.env.CHROMA_COLLECTION_SESSIONS ?? "opencode_messages_v1",
    CHROMA_COLLECTION_NOTES: process.env.CHROMA_COLLECTION_NOTES ?? "reconstitute_notes_v1",
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    OLLAMA_EMBED_MODEL: process.env.OLLAMA_EMBED_MODEL ?? "qwen3-embedding:8b",
    OLLAMA_CHAT_MODEL: process.env.OLLAMA_CHAT_MODEL ?? "qwen3-vl:8b-instruct",
    OLLAMA_NUM_CTX: Number(process.env.OLLAMA_NUM_CTX ?? "32768"),
    TTL_EMBED_MS: Number(process.env.TTL_EMBED_MS ?? `${1000 * 60 * 60 * 24 * 30}`),
    TTL_SEARCH_MS: Number(process.env.TTL_SEARCH_MS ?? `${1000 * 60 * 30}`),
    TTL_CHAT_MS: Number(process.env.TTL_CHAT_MS ?? `${1000 * 60 * 10}`),
    SEARCH_LIMIT: Number(process.env.SEARCH_LIMIT ?? "25"),
    SEARCH_THRESHOLD: process.env.SEARCH_THRESHOLD ? Number(process.env.SEARCH_THRESHOLD) : null,
    WINDOW: Number(process.env.WINDOW ?? "2"),
    BATCH_SIZE: Number(process.env.BATCH_SIZE ?? "32"),
    MAX_TOOL_ITERS: Number(process.env.MAX_TOOL_ITERS ?? "8"),
    MAX_AGENT_TURNS_PER_QUESTION: Number(process.env.MAX_AGENT_TURNS_PER_QUESTION ?? "6"),
    MAX_PATHS: Number(process.env.MAX_PATHS ?? "2000"),
  };
}

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizePathKey(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+/g, "/").trim();
}

function isWithinRoot(candidate: string, root: string): boolean {
  const c = normalizePathKey(candidate);
  const r = normalizePathKey(root).replace(/\/+$/, "");
  if (!r) return false;
  return c === r || c.startsWith(r + "/");
}

function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function ttlGet<T>(db: Level<string, any>, key: string): Promise<T | null> {
  try {
    const v = await db.get(key);
    if (!v) return null;
    if (typeof v.expiresAt === "number" && Date.now() > v.expiresAt) return null;
    return v.value as T;
  } catch {
    return null;
  }
}

async function ttlSet<T>(db: Level<string, any>, key: string, value: T, ttlMs: number) {
  await db.put(key, { value, expiresAt: Date.now() + ttlMs });
}

async function ollamaEmbedOne(E: Env, db: Level<string, any>, input: string): Promise<number[]> {
  const text = input ?? "";
  const ck = `cache:embed:${E.OLLAMA_EMBED_MODEL}:${sha256(text)}`;
  const cached = await ttlGet<number[]>(db, ck);
  if (cached) return cached;

  const resp = await fetch(`${E.OLLAMA_BASE_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: E.OLLAMA_EMBED_MODEL,
      input: text,
      truncate: true,
      options: { num_ctx: E.OLLAMA_NUM_CTX },
    }),
  });

  if (!resp.ok) throw new Error(`Ollama embed failed: ${resp.status} ${await resp.text()}`);
  const json = (await resp.json()) as { embeddings?: number[][] };
  const emb = (json.embeddings?.[0] ?? []) as number[];
  await ttlSet(db, ck, emb, E.TTL_EMBED_MS);
  return emb;
}

type OllamaChatResponse = {
  model: string;
  created_at?: string;
  message: any;
  done: boolean;
};

async function ollamaChat(
  E: Env,
  db: Level<string, any>,
  args: { messages: OllamaMessage[]; tools?: ToolDef[]; temperature?: number }
): Promise<OllamaChatResponse> {
  const key = `cache:chat:${sha256(
    JSON.stringify({ model: E.OLLAMA_CHAT_MODEL, messages: args.messages, tools: args.tools, t: args.temperature ?? 0 })
  )}`;

  const cached = await ttlGet<OllamaChatResponse>(db, key);
  if (cached) return cached;

  const resp = await fetch(`${E.OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: E.OLLAMA_CHAT_MODEL,
      messages: args.messages,
      tools: args.tools,
      stream: false,
      options: { num_ctx: E.OLLAMA_NUM_CTX },
      temperature: args.temperature ?? 0,
    }),
  });

  if (!resp.ok) throw new Error(`Ollama chat failed: ${resp.status} ${await resp.text()}`);
  const json = (await resp.json()) as OllamaChatResponse;
  await ttlSet(db, key, json, E.TTL_CHAT_MS);
  return json;
}

async function initChroma(E: Env) {
  const chroma = new ChromaClient({
    path: E.CHROMA_URL,
    ...(E.CHROMA_TENANT ? { tenant: E.CHROMA_TENANT } : {}),
    ...(E.CHROMA_DATABASE ? { database: E.CHROMA_DATABASE } : {}),
    ...(E.CHROMA_TOKEN
      ? {
          auth: {
            provider: "token",
            credentials: E.CHROMA_TOKEN,
            tokenHeaderType: "AUTHORIZATION",
          },
        }
      : {}),
  });

  const sessions = await chroma.getOrCreateCollection({ name: E.CHROMA_COLLECTION_SESSIONS });
  const notes = await chroma.getOrCreateCollection({ name: E.CHROMA_COLLECTION_NOTES });
  return { chroma, sessions, notes };
}

async function recordPath(db: Level<string, any>, pathStr: string): Promise<boolean> {
  const p = normalizePathKey(pathStr);
  if (!p) return false;
  const key = `state:recorded_paths`;
  const current = (await db.get(key).catch(() => [])) as string[];
  if (current.includes(p)) return false;
  current.push(p);
  await db.put(key, current);
  return true;
}

async function listRecordedPaths(db: Level<string, any>): Promise<string[]> {
  return ((await db.get(`state:recorded_paths`).catch(() => [])) as string[]).map(normalizePathKey);
}

async function getFileDescription(db: Level<string, any>, pathStr: string): Promise<string> {
  const p = normalizePathKey(pathStr);
  return (await db.get(`desc:path:${p}`).catch(() => "")) as string;
}

async function describeFile(db: Level<string, any>, pathStr: string, append: string): Promise<void> {
  const p = normalizePathKey(pathStr);
  const prev = await getFileDescription(db, p);
  const next = prev ? `${prev}\n\n${append}` : append;
  await db.put(`desc:path:${p}`, next);
}

async function listAllDescriptions(db: Level<string, any>): Promise<Array<{ path: string; body: string }>> {
  const out: Array<{ path: string; body: string }> = [];
  for await (const [k, v] of db.iterator()) {
    if (typeof k === "string" && k.startsWith("desc:path:")) {
      const p = k.slice("desc:path:".length);
      out.push({ path: p, body: typeof v === "string" ? v : String(v) });
    }
  }
  return out;
}

async function addNoteTitle(db: Level<string, any>, title: string) {
  const key = `notes:index`;
  const current = (await db.get(key).catch(() => [])) as string[];
  const t = title.trim();
  if (!t) return;
  if (!current.includes(t)) {
    current.push(t);
    await db.put(key, current);
  }
}

async function listNotesTitles(db: Level<string, any>): Promise<string[]> {
  return ((await db.get(`notes:index`).catch(() => [])) as string[]).slice().sort();
}

interface Hit {
  id: string;
  distance: number | null;
  meta: any;
}

async function searchSessionsAsContext(
  E: Env,
  db: Level<string, any>,
  sessionsCol: any,
  query: string,
  where?: any
) {
  const ck = `cache:search:${sha256(JSON.stringify({ q: query, where, limit: E.SEARCH_LIMIT, win: E.WINDOW }))}`;
  const cached = await ttlGet<any>(db, ck);
  if (cached) return cached;

  const qEmb = await ollamaEmbedOne(E, db, query);

  const results = await sessionsCol.query({
    queryEmbeddings: [qEmb],
    nResults: E.SEARCH_LIMIT,
    where: where ?? undefined,
    include: [IncludeEnum.metadatas, IncludeEnum.distances],
  });

  const ids = results.ids?.[0] ?? [];
  const metadatas = results.metadatas?.[0] ?? [];
  const distances = results.distances?.[0] ?? [];

  const hits: Hit[] = ids.map((id: string, i: number) => ({
    id,
    meta: metadatas[i] ?? null,
    distance: distances[i] ?? null,
  }));

  const filtered = hits.filter((h) => (E.SEARCH_THRESHOLD == null ? true : h.distance != null && h.distance <= E.SEARCH_THRESHOLD));

  const needed = new Set<string>();
  for (const h of filtered) {
    const sid = String(h.meta?.session_id ?? "").trim();
    const idx = Number(h.meta?.message_index ?? NaN);
    if (!sid || Number.isNaN(idx)) continue;
    for (let j = Math.max(0, idx - E.WINDOW); j <= idx + E.WINDOW; j++) {
      needed.add(`${sid}:${j}`);
    }
  }

  const neededSorted = [...needed].sort((a, b) => {
    const [sa, ia] = a.split(":");
    const [sb, ib] = b.split(":");
    if (sa < sb) return -1;
    if (sa > sb) return 1;
    return Number(ia) - Number(ib);
  });

  const context_messages: OllamaMessage[] = [];
  const missing: string[] = [];
  for (const id of neededSorted) {
    const blob = await db.get(`msg:${id}:ollama`).catch(() => null);
    if (!blob) {
      missing.push(id);
      continue;
    }
    for (const m of blob as OllamaMessage[]) context_messages.push(m);
  }

  const out = { query, where: where ?? null, hits: filtered, context_messages, missing };
  await ttlSet(db, ck, out, E.TTL_SEARCH_MS);
  return out;
}

function buildTools(
  E: Env,
  db: Level<string, any>,
  sessionsCol: any,
  notesCol: any,
  runState: { root: string }
): { tools: ToolDef[]; handlers: Record<string, (args: Record<string, any>) => Promise<string>> } {
  const tools: ToolDef[] = [
    {
      type: "function",
      function: {
        name: "take_note",
        description: "Make an observation about the codebase and add it to a notes collection.",
        parameters: {
          type: "object",
          properties: { title: { type: "string" }, body: { type: "string" } },
          required: ["title", "body"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "list_notes",
        description: "List note titles.",
        parameters: { type: "object", properties: {}, additionalProperties: false },
      },
    },
    {
      type: "function",
      function: {
        name: "search_notes",
        description: "Semantic search notes.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
            metadata_filter: { type: "object" },
            result_limit: { type: "number" },
            threshold: { type: "number" },
          },
          required: ["query"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "record_path",
        description: "Record a path into the unique set. Returns true if newly encountered.",
        parameters: {
          type: "object",
          properties: { path: { type: "string" } },
          required: ["path"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "list_recorded_paths",
        description: "List all recorded paths.",
        parameters: { type: "object", properties: {}, additionalProperties: false },
      },
    },
    {
      type: "function",
      function: {
        name: "get_file_description",
        description: "Get the accumulated description for a path.",
        parameters: {
          type: "object",
          properties: { path: { type: "string" } },
          required: ["path"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "describe_file",
        description: "Append a string to a path's accumulated description.",
        parameters: {
          type: "object",
          properties: { path: { type: "string" }, text: { type: "string" } },
          required: ["path", "text"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "search_sessions",
        description: "Search indexed OpenCode sessions and return Ollama-ready context messages.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
            metadata_filter: { type: "object" },
            result_limit: { type: "number" },
            threshold: { type: "number" },
          },
          required: ["query"],
          additionalProperties: false,
        },
      },
    },
  ];

  const handlers: Record<string, (args: Record<string, any>) => Promise<string>> = {
    async take_note(args) {
      const title = String(args.title ?? "").trim();
      const body = String(args.body ?? "").trim();
      if (!title || !body) return `{"ok":false,"error":"title/body required"}`;
      await addNoteTitle(db, title);
      const emb = await ollamaEmbedOne(E, db, body);
      const id = `note:${sha256(title)}:${Date.now()}`;
      await notesCol.upsert({
        ids: [id],
        embeddings: [emb],
        documents: [body],
        metadatas: [{ title, created_at: Date.now() }],
      });
      return JSON.stringify({ ok: true, id, title });
    },

    async list_notes() {
      const titles = await listNotesTitles(db);
      return JSON.stringify({ ok: true, titles });
    },

    async search_notes(args) {
      const q = String(args.query ?? "").trim();
      const limit = Number(args.result_limit ?? 10);
      const threshold = args.threshold != null ? Number(args.threshold) : null;
      const where = args.metadata_filter ?? undefined;
      const qEmb = await ollamaEmbedOne(E, db, q);
      const res = await notesCol.query({
        queryEmbeddings: [qEmb],
        nResults: Number.isFinite(limit) && limit > 0 ? limit : 10,
        where,
        include: [IncludeEnum.metadatas, IncludeEnum.documents, IncludeEnum.distances],
      });
      const ids = res.ids?.[0] ?? [];
      const docs = res.documents?.[0] ?? [];
      const metas = res.metadatas?.[0] ?? [];
      const dists = res.distances?.[0] ?? [];
      const hits = ids.map((id: string, i: number) => ({
        id,
        distance: dists[i] ?? null,
        metadata: metas[i] ?? null,
        document: docs[i] ?? null,
      }));
      return JSON.stringify({ ok: true, hits });
    },

    async record_path(args) {
      const p = normalizePathKey(String(args.path ?? ""));
      const isNew = await recordPath(db, p);
      return JSON.stringify({ ok: true, path: p, is_new: isNew, within_root: isWithinRoot(p, runState.root) });
    },

    async list_recorded_paths() {
      const paths = await listRecordedPaths(db);
      return JSON.stringify({ ok: true, paths });
    },

    async get_file_description(args) {
      const p = normalizePathKey(String(args.path ?? ""));
      const body = await getFileDescription(db, p);
      return JSON.stringify({ ok: true, path: p, description: body });
    },

    async describe_file(args) {
      const p = normalizePathKey(String(args.path ?? ""));
      const text = String(args.text ?? "").trim();
      if (!p || !text) return `{"ok":false,"error":"path/text required"}`;
      await describeFile(db, p, text);
      return JSON.stringify({ ok: true, path: p, appended_chars: text.length });
    },

    async search_sessions(args) {
      const q = String(args.query ?? "").trim();
      const where = args.metadata_filter ?? undefined;
      const oldLimit = E.SEARCH_LIMIT;
      const oldThresh = E.SEARCH_THRESHOLD;
      const limit = args.result_limit != null ? Number(args.result_limit) : oldLimit;
      const threshold = args.threshold != null ? Number(args.threshold) : oldThresh;
      const E2: Env = { ...E, SEARCH_LIMIT: Number.isFinite(limit) ? limit : oldLimit, SEARCH_THRESHOLD: threshold };
      const out = await searchSessionsAsContext(E2, db, sessionsCol, q, where);
      return JSON.stringify({
        ok: true,
        query: out.query,
        hits: out.hits?.slice(0, 10) ?? [],
        context_messages: out.context_messages,
        missing: out.missing,
      });
    },
  };

  return { tools, handlers };
}

async function runToolLoop(
  E: Env,
  db: Level<string, any>,
  baseMessages: OllamaMessage[],
  tools: ToolDef[],
  handlers: Record<string, (args: Record<string, any>) => Promise<string>>,
  maxIters: number
): Promise<{ messages: OllamaMessage[]; finalText: string }> {
  const messages: OllamaMessage[] = [...baseMessages];
  let finalText = "";

  for (let iter = 0; iter < maxIters; iter++) {
    const res = await ollamaChat(E, db, { messages, tools, temperature: 0 });
    const msg = res.message ?? {};

    const assistantMsg: OllamaMessage = {
      role: "assistant",
      content: typeof msg.content === "string" ? msg.content : undefined,
      tool_calls: Array.isArray(msg.tool_calls) ? msg.tool_calls : undefined,
    };

    messages.push(assistantMsg);

    const toolCalls = (assistantMsg as any).tool_calls as any[] | undefined;
    if (!toolCalls || toolCalls.length === 0) {
      finalText = typeof msg.content === "string" ? msg.content : "";
      return { messages, finalText };
    }

    for (const tc of toolCalls) {
      const name = tc?.function?.name ?? tc?.name;
      const args = tc?.function?.arguments ?? tc?.arguments ?? {};
      const handler = handlers[String(name)];
      if (!handler) {
        messages.push({ role: "tool", tool_name: String(name), content: JSON.stringify({ ok: false, error: "unknown tool" }) });
        continue;
      }
      let out = "";
      try {
        out = await handler(args);
      } catch (e: any) {
        out = JSON.stringify({ ok: false, error: String(e?.message ?? e) });
      }
      messages.push({ role: "tool", tool_name: String(name), content: out });
    }
  }

  return { messages, finalText };
}

function extractPathsLoose(text: string): string[] {
  const paths = new Set<string>();
  const re = /(^|[\s"'`(])((?:\.{0,2}\/)?(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+)(?=$|[\s"'`),.:;])/g;
  for (const m of text.matchAll(re)) paths.add(normalizePathKey(m[2]));
  return [...paths];
}

async function exportMarkdownTree(E: Env, db: Level<string, any>, root: string, runId: string) {
  const outRoot = path.resolve(E.OUTPUT_DIR, runId);
  await ensureDir(outRoot);

  const descriptions = await listAllDescriptions(db);
  const within = descriptions.filter((d) => isWithinRoot(d.path, root));

  const recorded = (await listRecordedPaths(db)).filter((p) => isWithinRoot(p, root));
  const indexBody = [
    `# Reconstitute output`,
    ``,
    `- run_id: \`${runId}\``,
    `- root: \`${normalizePathKey(root)}\``,
    `- generated_at: \`${nowIso()}\``,
    ``,
    `## Recorded paths`,
    ...recorded.map((p) => `- ${p}`),
    ``,
  ].join("\n");

  await fs.writeFile(path.join(outRoot, "index.md"), indexBody, "utf8");

  for (const d of within) {
    const p = normalizePathKey(d.path);
    const filePath = path.join(outRoot, p + ".md");
    await ensureDir(path.dirname(filePath));
    const body = [
      `# ${p}`,
      ``,
      `## Description`,
      ``,
      d.body.trim() ? d.body.trim() : `_No description yet._`,
      ``,
    ].join("\n");
    await fs.writeFile(filePath, body, "utf8");
  }

  console.log(`Exported ${within.length} markdown files to: ${outRoot}`);
}

const DEFAULT_QUESTIONS = [
  "Explain what exists at {path}.",
  "What is {path}?",
  "What is the entry point for {path}?",
  "What language is {path} written in?",
  "What API does {path} provide?",
  "List important modules/files under {path} and what each does.",
];

function makeSystemPrompt(root: string) {
  return [
    `You are Reconstitute, a reconstruction agent.`,
    ``,
    `You will be given:`,
    `- a root path to reconstruct: ${normalizePathKey(root)}`,
    `- a conversation context array from prior OpenCode sessions (as chat messages)`,
    ``,
    `Your job:`,
    `1) When you see any file or folder path, call record_path(path).`,
    `   - Prefer paths under the root, but still record everything you see.`,
    `2) Answer the user's question using ONLY the provided context and tool results.`,
    `3) Append your best structured description of the target path using describe_file(path, text).`,
    `   - Make it high signal: purpose, responsibilities, entry points, API, important files, assumptions.`,
    `4) If you discover a general insight that will help later reconstruction, use take_note(title, body).`,
    ``,
    `Constraints:`,
    `- If information is missing, say what's missing and what evidence you DO have.`,
    `- Prefer short, concrete claims tied to evidence from the conversation context.`,
  ].join("\n");
}

function makeUserPromptForQuestion(pathStr: string, question: string) {
  return question.replaceAll("{path}", normalizePathKey(pathStr));
}

async function reconstitute(E: Env, targetRoot: string) {
  const root = normalizePathKey(targetRoot);
  const runId = `run_${sha256(root).slice(0, 12)}`;

  await ensureDir(path.dirname(E.LEVEL_DIR));
  await ensureDir(E.OUTPUT_DIR);

  const db = new Level<string, any>(E.LEVEL_DIR, { valueEncoding: "json" });
  const { sessions, notes } = await initChroma(E);

  await recordPath(db, root);

  const processedKey = `run:${runId}:processed`;
  const queueKey = `run:${runId}:queue`;

  const processed = new Set<string>(((await db.get(processedKey).catch(() => [])) as string[]).map(normalizePathKey));
  const queueArr = ((await db.get(queueKey).catch(() => [root])) as string[]).map(normalizePathKey);
  const queue: string[] = uniq(queueArr.filter((p) => isWithinRoot(p, root)));

  const runState = { root };
  const { tools, handlers } = buildTools(E, db, sessions, notes, runState);

  console.log(`run_id=${runId}`);
  console.log(`root=${root}`);
  console.log(`queue_size=${queue.length}`);

  let safetyCounter = 0;

  while (queue.length > 0) {
    if (safetyCounter++ > E.MAX_PATHS) {
      console.warn(`Reached MAX_PATHS=${E.MAX_PATHS}. Stopping.`);
      break;
    }

    const currentPath = queue.shift()!;
    if (processed.has(currentPath)) continue;
    processed.add(currentPath);

    console.log(`\n=== PATH: ${currentPath} ===`);

    for (let qi = 0; qi < DEFAULT_QUESTIONS.length; qi++) {
      const question = makeUserPromptForQuestion(currentPath, DEFAULT_QUESTIONS[qi]);
      const searchQuery = `${currentPath}\n${question}\n${root}`;
      const search = await searchSessionsAsContext(E, db, sessions, searchQuery);

      const systemMsg: OllamaMessage = { role: "system", content: makeSystemPrompt(root) };
      const userMsg: OllamaMessage = { role: "user", content: question };
      const baseMessages: OllamaMessage[] = [systemMsg, ...search.context_messages, userMsg];

      console.log(`\n--- Q${qi + 1}/${DEFAULT_QUESTIONS.length} ---`);
      console.log(`search_hits=${(search.hits ?? []).length} context_msgs=${search.context_messages.length}`);

      const { messages: _msgs, finalText } = await runToolLoop(E, db, baseMessages, tools, handlers, E.MAX_TOOL_ITERS);

      if (finalText && finalText.trim()) {
        await describeFile(db, currentPath, [`## Q: ${question}`, ``, `### A`, finalText.trim(), ``, `---`].join("\n"));
      } else {
        await describeFile(db, currentPath, [`## Q: ${question}`, ``, `### A`, `_No response content returned._`, ``, `---`].join("\n"));
      }

      const extra = extractPathsLoose(finalText || "");
      for (const p of extra) await recordPath(db, p);

      const recorded = await listRecordedPaths(db);
      for (const p of recorded) {
        if (isWithinRoot(p, root) && !processed.has(p) && !queue.includes(p)) {
          queue.push(p);
        }
      }

      await db.put(processedKey, [...processed]);
      await db.put(queueKey, queue);
    }
  }

  await exportMarkdownTree(E, db, root, runId);
  await db.close();
}

function usage() {
  console.log(`
reconstitute <path>

Environment:
  LEVEL_DIR=.reconstitute/level
  OUTPUT_DIR=.reconstitute/output
  CHROMA_URL=http://localhost:8000
  CHROMA_COLLECTION_SESSIONS=opencode_messages_v1
  CHROMA_COLLECTION_NOTES=reconstitute_notes_v1
  OLLAMA_BASE_URL=http://localhost:11434
  OLLAMA_EMBED_MODEL=qwen3-embedding:8b
  OLLAMA_CHAT_MODEL=qwen3-vl:8b-instruct
  SEARCH_LIMIT=25
  WINDOW=2

Run:
  pnpm tsx reconstitute.ts orgs/octave-commons/cephalon-clj
`);
}

async function main() {
  const E = env();
  const argv = process.argv.slice(2);
  const target = argv[0];

  if (!target || target === "-h" || target === "--help") {
    usage();
    process.exit(target ? 0 : 2);
  }

  await reconstitute(E, target);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
