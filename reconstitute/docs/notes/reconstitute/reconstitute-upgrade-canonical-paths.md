## Upgrade pass: canonical paths + notes-augmented context + deterministic session ordering

This version implements the 3 upgrades we queued:

1. **Better path canonicalization**

   * cleans punctuation/quotes
   * resolves `./src/foo` and `src/foo` → `<root>/src/foo`
   * maps `repoName/...` → `<root>/...`
   * strips trailing `/` (except for the root)

2. **Notes-driven augmentation**

   * every Q/A call prepends a **notes context snippet** (top semantic note hits) as a `system` message
   * so the agent can use what it already learned without having to re-derive it

3. **Deterministic context builder**

   * uses `sess:<id>:order` from LevelDB for window expansion
   * sorts merged context chunks by **created_at** (stored in LevelDB at index time), falling back safely

Below is a **full replacement** for `src/reconstitute.ts`.

---

## `src/reconstitute.ts`

```ts
#!/usr/bin/env node
/* eslint-disable no-console */

import "dotenv/config";

import { createOpencodeClient } from "@opencode-ai/sdk";
import { ChromaClient, IncludeEnum } from "chromadb";
import { Level } from "level";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

// -----------------------------
// Types
// -----------------------------

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

type Env = {
  // storage
  LEVEL_DIR: string;
  OUTPUT_DIR: string;

  // opencode
  OPENCODE_BASE_URL: string;
  OPENCODE_API_KEY?: string;

  // chroma
  CHROMA_URL: string;
  CHROMA_TENANT?: string;
  CHROMA_DATABASE?: string;
  CHROMA_TOKEN?: string;
  CHROMA_COLLECTION_SESSIONS: string;
  CHROMA_COLLECTION_NOTES: string;

  // ollama
  OLLAMA_BASE_URL: string;
  OLLAMA_EMBED_MODEL: string; // qwen3-embedding:8b
  OLLAMA_CHAT_MODEL: string; // qwen3-vl:8b-instruct
  OLLAMA_NUM_CTX: number;

  // caching
  TTL_EMBED_MS: number;
  TTL_SEARCH_MS: number;
  TTL_CHAT_MS: number;

  // workflow
  BATCH_SIZE: number;
  WINDOW: number;
  SEARCH_LIMIT: number;
  SEARCH_THRESHOLD: number | null;

  NOTES_LIMIT: number;
  NOTES_THRESHOLD: number | null;
  NOTES_MAX_CHARS: number;

  MAX_TOOL_ITERS: number;
  MAX_PATH_EXTRACTION_PASSES: number;
  MAX_PATHS: number;
};

type Hit = { id: string; distance: number | null; meta: any };

// -----------------------------
// Env / utils
// -----------------------------

function env(): Env {
  return {
    LEVEL_DIR: process.env.LEVEL_DIR ?? ".reconstitute/level",
    OUTPUT_DIR: process.env.OUTPUT_DIR ?? ".reconstitute/output",

    OPENCODE_BASE_URL: process.env.OPENCODE_BASE_URL ?? "http://localhost:4096",
    OPENCODE_API_KEY: process.env.OPENCODE_API_KEY || undefined,

    CHROMA_URL: process.env.CHROMA_URL ?? "http://localhost:8000",
    CHROMA_TENANT: process.env.CHROMA_TENANT || undefined,
    CHROMA_DATABASE: process.env.CHROMA_DATABASE || undefined,
    CHROMA_TOKEN: process.env.CHROMA_TOKEN || undefined,
    CHROMA_COLLECTION_SESSIONS: process.env.CHROMA_COLLECTION_SESSIONS ?? "opencode_messages_v1",
    CHROMA_COLLECTION_NOTES: process.env.CHROMA_COLLECTION_NOTES ?? "reconstitute_notes_v1",

    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    OLLAMA_EMBED_MODEL: process.env.OLLAMA_EMBED_MODEL ?? "qwen3-embedding:8b",
    OLLAMA_CHAT_MODEL: process.env.OLLAMA_CHAT_MODEL ?? "qwen3-vl:8b-instruct",
    OLLAMA_NUM_CTX: Number(process.env.OLLAMA_NUM_CTX ?? "32768"),

    TTL_EMBED_MS: Number(process.env.TTL_EMBED_MS ?? `${1000 * 60 * 60 * 24 * 30}`),
    TTL_SEARCH_MS: Number(process.env.TTL_SEARCH_MS ?? `${1000 * 60 * 30}`),
    TTL_CHAT_MS: Number(process.env.TTL_CHAT_MS ?? `${1000 * 60 * 10}`),

    BATCH_SIZE: Number(process.env.BATCH_SIZE ?? "32"),
    WINDOW: Number(process.env.WINDOW ?? "2"),
    SEARCH_LIMIT: Number(process.env.SEARCH_LIMIT ?? "25"),
    SEARCH_THRESHOLD: process.env.SEARCH_THRESHOLD ? Number(process.env.SEARCH_THRESHOLD) : null,

    NOTES_LIMIT: Number(process.env.NOTES_LIMIT ?? "6"),
    NOTES_THRESHOLD: process.env.NOTES_THRESHOLD ? Number(process.env.NOTES_THRESHOLD) : null,
    NOTES_MAX_CHARS: Number(process.env.NOTES_MAX_CHARS ?? "1800"),

    MAX_TOOL_ITERS: Number(process.env.MAX_TOOL_ITERS ?? "10"),
    MAX_PATH_EXTRACTION_PASSES: Number(process.env.MAX_PATH_EXTRACTION_PASSES ?? "6"),
    MAX_PATHS: Number(process.env.MAX_PATHS ?? "2000"),
  };
}

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function nowIso(): string {
  return new Date().toISOString();
}

function unwrap<T>(resp: any): T {
  return resp && typeof resp === "object" && "data" in resp ? (resp.data as T) : (resp as T);
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function normalizePathKey(p: string): string {
  return (p ?? "").replace(/\\/g, "/").replace(/\/+/g, "/").trim();
}

function stripWrappingJunk(s: string): string {
  let x = (s ?? "").trim();

  // strip wrapping quotes/backticks/brackets
  x = x.replace(/^['"`<(\[]+/, "").replace(/['"`>)}\]]+$/, "");

  // strip trailing punctuation commonly adjacent to paths in prose
  x = x.replace(/[.,;:!?]+$/, "");

  // collapse
  return x.trim();
}

function lastSegment(p: string): string {
  const n = normalizePathKey(p).replace(/\/+$/, "");
  const segs = n.split("/").filter(Boolean);
  return segs[segs.length - 1] ?? "";
}

function isProbablyUrlOrDrive(p: string): boolean {
  const x = p.trim();
  if (/^[a-zA-Z]+:\/\//.test(x)) return true; // url
  if (/^[a-zA-Z]:[\\/]/.test(x)) return true; // windows drive
  return false;
}

function canonicalizePath(candidate: string, root: string): string {
  const r = normalizePathKey(root).replace(/\/+$/, "");
  if (!r) return normalizePathKey(stripWrappingJunk(candidate));

  let c = normalizePathKey(stripWrappingJunk(candidate));

  if (!c) return c;
  if (c === r) return c;

  // Keep absolute-ish paths as-is
  if (c.startsWith("/") || c.startsWith("~") || isProbablyUrlOrDrive(c)) {
    // still normalize trailing slashes
    c = c.replace(/\/+$/, "");
    return c === "" ? c : c;
  }

  // Map ./foo -> root/foo
  if (c.startsWith("./")) {
    c = `${r}/${c.slice(2)}`;
  }

  // If begins with repoName/..., map to root/...
  const rootName = lastSegment(r);
  if (rootName && (c === rootName || c.startsWith(rootName + "/"))) {
    const rel = c === rootName ? "" : c.slice(rootName.length + 1);
    c = rel ? `${r}/${rel}` : r;
  }

  // If still not under root and looks like a relative path (has a slash), prefix root
  if (!c.startsWith(r + "/") && !c.startsWith(r) && c.includes("/")) {
    c = `${r}/${c}`;
  }

  // Remove trailing slash (unless it is exactly root)
  c = c.replace(/\/+$/, "");
  if (c === "") return c;
  return c;
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

function truncate(s: string, n: number): string {
  const x = s ?? "";
  if (x.length <= n) return x;
  return x.slice(0, n) + "…";
}

// -----------------------------
// LevelDB TTL cache
// -----------------------------

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

// -----------------------------
// Ollama API
// -----------------------------

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
  const json = await resp.json();
  const emb = (json.embeddings?.[0] ?? []) as number[];
  await ttlSet(db, ck, emb, E.TTL_EMBED_MS);
  return emb;
}

async function ollamaEmbedMany(E: Env, db: Level<string, any>, inputs: string[]): Promise<number[][]> {
  const cached: Array<number[] | null> = [];
  const missDocs: string[] = [];
  const missIdx: number[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const text = inputs[i] ?? "";
    const ck = `cache:embed:${E.OLLAMA_EMBED_MODEL}:${sha256(text)}`;
    const hit = await ttlGet<number[]>(db, ck);
    if (hit) cached.push(hit);
    else {
      cached.push(null);
      missIdx.push(i);
      missDocs.push(text);
    }
  }

  if (missDocs.length) {
    const resp = await fetch(`${E.OLLAMA_BASE_URL}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: E.OLLAMA_EMBED_MODEL,
        input: missDocs,
        truncate: true,
        options: { num_ctx: E.OLLAMA_NUM_CTX },
      }),
    });

    if (!resp.ok) throw new Error(`Ollama embed failed: ${resp.status} ${await resp.text()}`);
    const json = await resp.json();
    const got = (json.embeddings ?? []) as number[][];

    for (let j = 0; j < missIdx.length; j++) {
      const i = missIdx[j];
      cached[i] = got[j];
      const ck = `cache:embed:${E.OLLAMA_EMBED_MODEL}:${sha256(inputs[i] ?? "")}`;
      await ttlSet(db, ck, got[j], E.TTL_EMBED_MS);
    }
  }

  return cached.map((x) => x ?? []);
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

// -----------------------------
// Chroma init
// -----------------------------

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

// -----------------------------
// OpenCode -> Ollama replay conversion (lossless-ish)
// -----------------------------

function flattenMessageParts(entry: any): { role: "user" | "assistant" | "system"; text: string; toolish: any[] } {
  const info = entry?.info ?? {};
  const parts: any[] = Array.isArray(entry?.parts) ? entry.parts : [];

  const roleRaw = info.role ?? info.type ?? "assistant";
  const role: "user" | "assistant" | "system" = roleRaw === "user" ? "user" : roleRaw === "system" ? "system" : "assistant";

  const textChunks: string[] = [];
  const toolish: any[] = [];

  for (const p of parts) {
    if (p?.type === "text" && typeof p.text === "string") {
      textChunks.push(p.text);
      continue;
    }

    const toolName = p?.tool_name ?? p?.name ?? p?.tool?.name ?? p?.function?.name;
    const toolArgs = p?.arguments ?? p?.args ?? p?.input ?? p?.tool?.input ?? p?.function?.arguments;
    const toolOut = p?.output ?? p?.result ?? p?.tool?.output ?? (p?.type === "tool_result" ? p?.content : undefined);

    if (toolName) {
      toolish.push({ toolName: String(toolName), toolArgs, toolOut, raw: p });
      textChunks.push(`[tool:${String(toolName)}] ${toolArgs ? JSON.stringify(toolArgs) : ""}`.trim());
      if (toolOut != null) textChunks.push(`[tool_result:${String(toolName)}] ${typeof toolOut === "string" ? toolOut : JSON.stringify(toolOut)}`);
      continue;
    }

    textChunks.push(`[opencode_part:${p?.type ?? "unknown"}] ${JSON.stringify(p)}`);
  }

  return { role, text: textChunks.join("\n").trim(), toolish };
}

function opencodeEntryToOllamaReplay(entry: any): OllamaMessage[] {
  const { role, text, toolish } = flattenMessageParts(entry);

  const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const toolResults: Array<{ name: string; out: string }> = [];

  for (const t of toolish) {
    const name = String(t.toolName ?? "");
    if (!name) continue;

    const args =
      t.toolArgs && typeof t.toolArgs === "object" && !Array.isArray(t.toolArgs) ? (t.toolArgs as Record<string, unknown>) : {};

    toolCalls.push({ name, args });

    if (t.toolOut != null) {
      const out = typeof t.toolOut === "string" ? t.toolOut : JSON.stringify(t.toolOut);
      toolResults.push({ name, out });
    }
  }

  if (toolCalls.length) {
    const msgs: OllamaMessage[] = [
      {
        role: "assistant",
        content: text || undefined,
        tool_calls: toolCalls.map((tc, i) => ({
          type: "function",
          function: { index: i, name: tc.name, arguments: tc.args },
        })),
      },
      ...toolResults.map((tr) => ({ role: "tool" as const, tool_name: tr.name, content: tr.out })),
    ];
    return msgs;
  }

  return [{ role, content: text }];
}

function flattenForEmbedding(ollamaMsgs: OllamaMessage[]): string {
  const lines: string[] = [];
  for (const m of ollamaMsgs) {
    if (m.role === "tool") {
      lines.push(`[tool:${m.tool_name}] ${m.content}`);
    } else if (m.role === "assistant" && "tool_calls" in m && m.tool_calls?.length) {
      for (const tc of m.tool_calls) {
        lines.push(`[tool_call:${tc.function.name}] ${JSON.stringify(tc.function.arguments)}`);
      }
      if (m.content) lines.push(`[assistant] ${m.content}`);
    } else {
      lines.push(`[${m.role}] ${("content" in m && m.content) ? m.content : ""}`);
    }
  }
  return lines.join("\n");
}

function extractPathsLoose(text: string): string[] {
  const out = new Set<string>();
  const re = /(^|[\s"'`(])((?:\.{0,2}\/)?(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+)(?=$|[\s"'`),.:;!?])/g;
  for (const m of text.matchAll(re)) {
    const tok = stripWrappingJunk(m[2]);
    if (tok) out.add(normalizePathKey(tok));
  }
  return [...out];
}

// -----------------------------
// Run-scoped state helpers
// -----------------------------

function runKey(runId: string, k: string): string {
  return `run:${runId}:${k}`;
}

async function runGetList(db: Level<string, any>, key: string): Promise<string[]> {
  return ((await db.get(key).catch(() => [])) as string[]).map(normalizePathKey);
}

async function runPutList(db: Level<string, any>, key: string, xs: string[]) {
  await db.put(key, uniq(xs.map(normalizePathKey)));
}

async function recordPathRun(db: Level<string, any>, runId: string, pathStr: string, root: string): Promise<boolean> {
  const canon = canonicalizePath(pathStr, root);
  if (!canon) return false;

  const key = runKey(runId, "recorded_paths");
  const current = await runGetList(db, key);
  if (current.includes(canon)) return false;

  current.push(canon);
  await runPutList(db, key, current);
  return true;
}

async function listRecordedPaths(db: Level<string, any>, runId: string): Promise<string[]> {
  return await runGetList(db, runKey(runId, "recorded_paths"));
}

async function getFileDescription(db: Level<string, any>, runId: string, pathStr: string, root: string): Promise<string> {
  const p = canonicalizePath(pathStr, root);
  return (await db.get(runKey(runId, `desc:path:${p}`)).catch(() => "")) as string;
}

async function describeFile(db: Level<string, any>, runId: string, pathStr: string, root: string, append: string): Promise<void> {
  const p = canonicalizePath(pathStr, root);
  const prev = await getFileDescription(db, runId, p, root);
  const next = prev ? `${prev}\n\n${append}` : append;
  await db.put(runKey(runId, `desc:path:${p}`), next);
}

async function listAllDescriptions(db: Level<string, any>, runId: string): Promise<Array<{ path: string; body: string }>> {
  const out: Array<{ path: string; body: string }> = [];
  const prefix = runKey(runId, "desc:path:");
  for await (const [k, v] of db.iterator()) {
    if (typeof k === "string" && k.startsWith(prefix)) {
      const p = k.slice(prefix.length);
      out.push({ path: p, body: typeof v === "string" ? v : String(v) });
    }
  }
  return out;
}

async function addNoteTitle(db: Level<string, any>, runId: string, title: string) {
  const key = runKey(runId, "notes:index");
  const current = ((await db.get(key).catch(() => [])) as string[]).slice();
  const t = title.trim();
  if (!t) return;
  if (!current.includes(t)) {
    current.push(t);
    await db.put(key, current);
  }
}

async function listNotesTitles(db: Level<string, any>, runId: string): Promise<string[]> {
  const key = runKey(runId, "notes:index");
  return ((await db.get(key).catch(() => [])) as string[]).slice().sort();
}

// -----------------------------
// Index command: OpenCode -> Chroma + Level replay + Level meta
// -----------------------------

async function cmdIndex(E: Env) {
  await ensureDir(path.dirname(E.LEVEL_DIR));
  const db = new Level<string, any>(E.LEVEL_DIR, { valueEncoding: "json" });

  const { sessions: sessionsCol } = await initChroma(E);

  const oc = createOpencodeClient({ baseUrl: E.OPENCODE_BASE_URL, apiKey: E.OPENCODE_API_KEY });
  const sessions = unwrap<any[]>(await oc.session.list());

  console.log(`Sessions: ${sessions.length}`);

  for (const s of sessions) {
    const sessionId = String(s.id);
    const sessionTitle = String(s.title ?? s.name ?? "");
    const entries = unwrap<any[]>(await oc.session.messages({ path: { id: sessionId } }));

    console.log(`- ${sessionId} msgs=${entries.length}`);
    await db.put(`sess:${sessionId}:meta`, { id: sessionId, title: sessionTitle });

    const order: string[] = [];
    const docs: string[] = [];
    const metas: any[] = [];
    const replays: Record<string, OllamaMessage[]> = {};

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const rowId = `${sessionId}:${i}`;
      order.push(rowId);

      const hash = sha256(JSON.stringify(entry));
      const prevHash = await db.get(`msg:${rowId}:hash`).catch(() => null);
      if (prevHash === hash) continue;

      const replay = opencodeEntryToOllamaReplay(entry);
      const doc = flattenForEmbedding(replay);
      const paths = extractPathsLoose(doc).join("|");

      const created_at = entry?.info?.createdAt ? new Date(entry.info.createdAt).getTime() : Date.now();
      const role = entry?.info?.role ?? entry?.info?.type ?? "assistant";

      // store replay + meta in LevelDB
      replays[rowId] = replay;
      await db.put(`msg:${rowId}:hash`, hash);
      await db.put(`msg:${rowId}:ollama`, replay);
      await db.put(`msg:${rowId}:meta`, {
        session_id: sessionId,
        session_title: sessionTitle,
        message_index: i,
        role,
        created_at,
        paths,
      });

      docs.push(doc);
      metas.push({
        session_id: sessionId,
        session_title: sessionTitle,
        message_index: i,
        role,
        created_at,
        paths,
      });
    }

    await db.put(`sess:${sessionId}:order`, order);

    // embed + upsert changed docs
    for (let start = 0; start < docs.length; start += E.BATCH_SIZE) {
      const bDocs = docs.slice(start, start + E.BATCH_SIZE);
      const bMetas = metas.slice(start, start + E.BATCH_SIZE);
      const bIds = bMetas.map((m) => `${m.session_id}:${m.message_index}`);

      const bEmb = await ollamaEmbedMany(E, db, bDocs);

      await sessionsCol.upsert({
        ids: bIds,
        embeddings: bEmb,
        documents: bDocs,
        metadatas: bMetas,
      });

      console.log(`  upserted ${bIds.length}`);
    }
  }

  await db.close();
  console.log("Index complete.");
}

// -----------------------------
// Chroma search + deterministic context builder
// -----------------------------

async function chromaSearchOnce(
  E: Env,
  db: Level<string, any>,
  sessionsCol: any,
  query: string,
  where?: any,
  limitOverride?: number,
  thresholdOverride?: number | null
): Promise<{ hits: Hit[] }> {
  const limit = limitOverride ?? E.SEARCH_LIMIT;
  const threshold = thresholdOverride ?? E.SEARCH_THRESHOLD;

  const ck = `cache:search:${sha256(JSON.stringify({ q: query, where, limit, threshold, win: E.WINDOW }))}`;
  const cached = await ttlGet<{ hits: Hit[] }>(db, ck);
  if (cached) return cached;

  const qEmb = await ollamaEmbedOne(E, db, query);
  const results = await sessionsCol.query({
    queryEmbeddings: [qEmb],
    nResults: limit,
    where: where ?? undefined,
    include: [IncludeEnum.Metadatas, IncludeEnum.Distances],
  });

  const ids = results.ids?.[0] ?? [];
  const metadatas = results.metadatas?.[0] ?? [];
  const distances = results.distances?.[0] ?? [];

  const hits: Hit[] = ids
    .map((id: string, i: number) => ({
      id,
      meta: metadatas[i] ?? null,
      distance: distances[i] ?? null,
    }))
    .filter((h) => (threshold == null ? true : h.distance != null && h.distance <= threshold));

  const out = { hits };
  await ttlSet(db, ck, out, E.TTL_SEARCH_MS);
  return out;
}

async function getSessionOrder(db: Level<string, any>, sessionId: string): Promise<string[] | null> {
  const order = await db.get(`sess:${sessionId}:order`).catch(() => null);
  if (!order || !Array.isArray(order)) return null;
  return order as string[];
}

async function buildWindowedIdsDeterministic(
  E: Env,
  db: Level<string, any>,
  hits: Hit[]
): Promise<string[]> {
  const needed = new Set<string>();

  // include window around each hit based on sess:<id>:order when possible
  for (const h of hits) {
    const sid = String(h.meta?.session_id ?? "").trim();
    const idx = Number(h.meta?.message_index ?? NaN);
    if (!sid || Number.isNaN(idx)) continue;

    const rowId = `${sid}:${idx}`;
    const order = await getSessionOrder(db, sid);

    if (order) {
      const pos = order.indexOf(rowId);
      if (pos !== -1) {
        for (let p = Math.max(0, pos - E.WINDOW); p <= Math.min(order.length - 1, pos + E.WINDOW); p++) {
          needed.add(order[p]);
        }
        continue;
      }
    }

    // fallback
    for (let j = Math.max(0, idx - E.WINDOW); j <= idx + E.WINDOW; j++) {
      needed.add(`${sid}:${j}`);
    }
  }

  return [...needed];
}

async function loadMetaCreatedAt(db: Level<string, any>, id: string): Promise<number | null> {
  const m = await db.get(`msg:${id}:meta`).catch(() => null);
  if (m && typeof m.created_at === "number") return m.created_at;
  return null;
}

async function searchUnionAsContext(
  E: Env,
  db: Level<string, any>,
  sessionsCol: any,
  queries: string[],
  where?: any,
  limitOverride?: number,
  thresholdOverride?: number | null
): Promise<{ hits: Hit[]; context_messages: OllamaMessage[]; missing: string[] }> {
  const clean = uniq(queries.map((q) => q.trim()).filter(Boolean));
  const byId = new Map<string, Hit>();

  for (const q of clean) {
    const { hits } = await chromaSearchOnce(E, db, sessionsCol, q, where, limitOverride, thresholdOverride);
    for (const h of hits) {
      const prev = byId.get(h.id);
      if (!prev) byId.set(h.id, h);
      else {
        const a = prev.distance ?? Number.POSITIVE_INFINITY;
        const b = h.distance ?? Number.POSITIVE_INFINITY;
        if (b < a) byId.set(h.id, h);
      }
    }
  }

  const hits = [...byId.values()].sort((a, b) => {
    const da = a.distance ?? Number.POSITIVE_INFINITY;
    const dbb = b.distance ?? Number.POSITIVE_INFINITY;
    return da - dbb;
  });

  const windowedIds = await buildWindowedIdsDeterministic(E, db, hits);

  // sort by created_at where possible, else stable by session/id
  const withTime: Array<{ id: string; t: number | null }> = [];
  for (const id of windowedIds) withTime.push({ id, t: await loadMetaCreatedAt(db, id) });

  withTime.sort((a, b) => {
    const ta = a.t ?? Number.POSITIVE_INFINITY;
    const tb = b.t ?? Number.POSITIVE_INFINITY;
    if (ta !== tb) return ta - tb;
    // fallback stable
    return a.id.localeCompare(b.id);
  });

  const context_messages: OllamaMessage[] = [];
  const missing: string[] = [];

  for (const { id } of withTime) {
    const blob = await db.get(`msg:${id}:ollama`).catch(() => null);
    if (!blob) {
      missing.push(id);
      continue;
    }
    for (const m of blob as OllamaMessage[]) context_messages.push(m);
  }

  return { hits, context_messages, missing };
}

// -----------------------------
// Notes augmentation (runner-side, not model-side)
// -----------------------------

async function getNotesSnippetMessages(
  E: Env,
  db: Level<string, any>,
  notesCol: any,
  runId: string,
  query: string
): Promise<OllamaMessage[]> {
  if (E.NOTES_LIMIT <= 0) return [];

  const qEmb = await ollamaEmbedOne(E, db, query);
  const res = await notesCol.query({
    queryEmbeddings: [qEmb],
    nResults: E.NOTES_LIMIT,
    where: { run_id: runId },
    include: [IncludeEnum.Metadatas, IncludeEnum.Documents, IncludeEnum.Distances],
  });

  const ids = res.ids?.[0] ?? [];
  const docs = res.documents?.[0] ?? [];
  const metas = res.metadatas?.[0] ?? [];
  const dists = res.distances?.[0] ?? [];

  const hits = ids
    .map((id: string, i: number) => ({
      id,
      distance: dists[i] ?? null,
      title: metas[i]?.title ?? null,
      doc: docs[i] ?? "",
    }))
    .filter((h: any) => (E.NOTES_THRESHOLD == null ? true : h.distance != null && h.distance <= E.NOTES_THRESHOLD));

  if (hits.length === 0) return [];

  const lines: string[] = [];
  lines.push(`Recovered notes relevant to: ${query}`);
  lines.push(`(Use these as hints; prefer hard evidence from session context.)`);
  lines.push("");

  for (const h of hits) {
    const title = h.title ? String(h.title) : h.id;
    lines.push(`- ${title}`);
    lines.push(`  ${truncate(String(h.doc ?? "").replace(/\s+/g, " ").trim(), E.NOTES_MAX_CHARS)}`);
    lines.push("");
  }

  return [{ role: "system", content: lines.join("\n").trim() }];
}

// -----------------------------
// Tools + tool loop
// -----------------------------

type ToolHandler = (args: Record<string, any>) => Promise<string>;

function buildTools(
  E: Env,
  db: Level<string, any>,
  runId: string,
  runState: { root: string },
  sessionsCol: any,
  notesCol: any
): { tools: ToolDef[]; handlers: Record<string, ToolHandler> } {
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
        description: "Add a path to the unique set. Returns is_new true/false.",
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
        description: "Append text to the path's accumulated description.",
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
        description: "Search indexed sessions and return an Ollama chat-ready context message array.",
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

  const handlers: Record<string, ToolHandler> = {
    async take_note(args) {
      const title = String(args.title ?? "").trim();
      const body = String(args.body ?? "").trim();
      if (!title || !body) return JSON.stringify({ ok: false, error: "title/body required" });

      await addNoteTitle(db, runId, title);

      const emb = await ollamaEmbedOne(E, db, body);
      const id = `note:${sha256(title)}:${Date.now()}`;
      await notesCol.upsert({
        ids: [id],
        embeddings: [emb],
        documents: [body],
        metadatas: [{ title, run_id: runId, created_at: Date.now() }],
      });

      return JSON.stringify({ ok: true, id, title });
    },

    async list_notes() {
      const titles = await listNotesTitles(db, runId);
      return JSON.stringify({ ok: true, titles });
    },

    async search_notes(args) {
      const q = String(args.query ?? "").trim();
      const limit = Number(args.result_limit ?? 10);
      const threshold = args.threshold != null ? Number(args.threshold) : null;

      const where = args.metadata_filter ?? {};
      // ensure run isolation unless caller explicitly overrides
      const where2 = { run_id: runId, ...where };

      const qEmb = await ollamaEmbedOne(E, db, q);
      const res = await notesCol.query({
        queryEmbeddings: [qEmb],
        nResults: Number.isFinite(limit) && limit > 0 ? limit : 10,
        where: where2,
        include: [IncludeEnum.Metadatas, IncludeEnum.Documents, IncludeEnum.Distances, IncludeEnum.Ids],
      });

      const ids = res.ids?.[0] ?? [];
      const docs = res.documents?.[0] ?? [];
      const metas = res.metadatas?.[0] ?? [];
      const dists = res.distances?.[0] ?? [];

      const hits = ids
        .map((id: string, i: number) => ({
          id,
          distance: dists[i] ?? null,
          metadata: metas[i] ?? null,
          document: docs[i] ?? null,
        }))
        .filter((h: any) => (threshold == null ? true : h.distance != null && h.distance <= threshold));

      return JSON.stringify({ ok: true, hits });
    },

    async record_path(args) {
      const raw = String(args.path ?? "");
      const canon = canonicalizePath(raw, runState.root);
      const isNew = await recordPathRun(db, runId, canon, runState.root);
      return JSON.stringify({
        ok: true,
        path: canon,
        is_new: isNew,
        within_root: isWithinRoot(canon, runState.root),
      });
    },

    async list_recorded_paths() {
      const paths = await listRecordedPaths(db, runId);
      return JSON.stringify({ ok: true, paths });
    },

    async get_file_description(args) {
      const p = String(args.path ?? "");
      const body = await getFileDescription(db, runId, p, runState.root);
      return JSON.stringify({ ok: true, path: canonicalizePath(p, runState.root), description: body });
    },

    async describe_file(args) {
      const p = String(args.path ?? "");
      const text = String(args.text ?? "").trim();
      if (!p || !text) return JSON.stringify({ ok: false, error: "path/text required" });
      await describeFile(db, runId, p, runState.root, text);
      return JSON.stringify({ ok: true, path: canonicalizePath(p, runState.root), appended_chars: text.length });
    },

    async search_sessions(args) {
      const q = String(args.query ?? "").trim();
      const where = args.metadata_filter ?? undefined;
      const limit = args.result_limit != null ? Number(args.result_limit) : E.SEARCH_LIMIT;
      const threshold = args.threshold != null ? Number(args.threshold) : E.SEARCH_THRESHOLD;

      const out = await searchUnionAsContext(E, db, sessionsCol, [q], where, limit, threshold);
      return JSON.stringify({
        ok: true,
        query: q,
        hits: out.hits.slice(0, 10),
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
  handlers: Record<string, ToolHandler>,
  maxIters: number
): Promise<{ messages: OllamaMessage[]; finalText: string; toolCallsSeen: number }> {
  const messages: OllamaMessage[] = [...baseMessages];
  let finalText = "";
  let toolCallsSeen = 0;

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
      return { messages, finalText, toolCallsSeen };
    }

    toolCallsSeen += toolCalls.length;

    for (const tc of toolCalls) {
      const name = tc?.function?.name ?? tc?.name;
      const args = tc?.function?.arguments ?? tc?.arguments ?? {};
      const handler = handlers[String(name)];

      let out = "";
      try {
        out = handler ? await handler(args) : JSON.stringify({ ok: false, error: "unknown tool" });
      } catch (e: any) {
        out = JSON.stringify({ ok: false, error: String(e?.message ?? e) });
      }

      messages.push({ role: "tool", tool_name: String(name), content: out });
    }
  }

  return { messages, finalText, toolCallsSeen };
}

// -----------------------------
// Reconstruction prompts
// -----------------------------

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
    `Root to reconstruct: ${normalizePathKey(root)}`,
    ``,
    `Rules:`,
    `- Whenever you see a file/folder path, call record_path(path).`,
    `- Answer using ONLY the provided conversation context + tool results.`,
    `- Append a structured description using describe_file(path, text).`,
    `- If you discover a durable insight, call take_note(title, body).`,
    ``,
    `If info is missing: say what is missing, and what evidence you do have.`,
  ].join("\n");
}

function qfmt(pathStr: string, tmpl: string) {
  return tmpl.replaceAll("{path}", normalizePathKey(pathStr));
}

function buildAdaptiveQueries(root: string, targetPath: string, question: string): string[] {
  const p = normalizePathKey(targetPath);
  const base = `${p}\n${question}\n${root}`;

  const qs = [base];

  const lower = question.toLowerCase();
  if (lower.includes("entry point")) {
    qs.push(`${p} entry point main index cli server app start init bootstrap`);
    qs.push(`${p} package.json shadow-cljs deps.edn project.clj build script`);
  } else if (lower.includes("language")) {
    qs.push(`${p} language clojure cljs typescript javascript python java go rust`);
    qs.push(`${p} .clj .cljs .ts .js .py .java .edn .json .yaml`);
  } else if (lower.includes("api")) {
    qs.push(`${p} api public interface exported functions methods endpoints routes`);
    qs.push(`${p} http ws websocket rpc handler client server`);
  } else {
    qs.push(`${p} file path folder directory src README docs usage`);
  }

  // also query root itself, to capture overview threads
  qs.push(`${root} ${p}`);

  return uniq(qs);
}

// -----------------------------
// Path extraction passes (repeat until stable)
// -----------------------------

async function extractPathsPass(
  E: Env,
  db: Level<string, any>,
  runId: string,
  root: string,
  currentPath: string,
  tools: ToolDef[],
  handlers: Record<string, ToolHandler>,
  sessionsCol: any,
  notesCol: any
): Promise<{ newCount: number }> {
  const before = (await listRecordedPaths(db, runId)).length;

  const queries = uniq([
    `${currentPath}`,
    `${root} ${currentPath} README docs overview`,
    `${currentPath} src lib packages modules files`,
  ]);

  const search = await searchUnionAsContext(E, db, sessionsCol, queries);

  const notesMsgs = await getNotesSnippetMessages(E, db, notesCol, runId, `${currentPath} paths files modules`);

  const systemMsg: OllamaMessage = { role: "system", content: makeSystemPrompt(root) };
  const userMsg: OllamaMessage = {
    role: "user",
    content: [
      `Extract every file/folder path mentioned in the conversation context above.`,
      `For each unique path, call record_path(path).`,
      `Repeat until you believe you've recorded all paths that appear in the context.`,
      `Then call list_recorded_paths once.`,
      ``,
      `Focus especially on paths under: ${root}`,
      `Current focus path: ${currentPath}`,
    ].join("\n"),
  };

  await runToolLoop(
    E,
    db,
    [systemMsg, ...notesMsgs, ...search.context_messages, userMsg],
    tools,
    handlers,
    E.MAX_TOOL_ITERS
  );

  const after = (await listRecordedPaths(db, runId)).length;
  return { newCount: Math.max(0, after - before) };
}

// -----------------------------
// Export markdown tree
// -----------------------------

async function exportMarkdownTree(E: Env, db: Level<string, any>, runId: string, root: string) {
  const outRoot = path.resolve(E.OUTPUT_DIR, runId);
  await ensureDir(outRoot);

  const descriptions = await listAllDescriptions(db, runId);
  const within = descriptions.filter((d) => isWithinRoot(d.path, root));

  const recorded = (await listRecordedPaths(db, runId)).filter((p) => isWithinRoot(p, root));

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
    // Avoid illegal / empty file names
    const safeP = p.replace(/^\/*/, "");
    const mdPath = path.join(outRoot, safeP + ".md");
    await ensureDir(path.dirname(mdPath));

    const body = [
      `# ${p}`,
      ``,
      `## Description`,
      ``,
      d.body.trim() ? d.body.trim() : `_No description yet._`,
      ``,
    ].join("\n");

    await fs.writeFile(mdPath, body, "utf8");
  }

  console.log(`Exported ${within.length} markdown files to: ${outRoot}`);
}

// -----------------------------
// Commands
// -----------------------------

async function cmdSearch(E: Env, query: string) {
  await ensureDir(path.dirname(E.LEVEL_DIR));
  const db = new Level<string, any>(E.LEVEL_DIR, { valueEncoding: "json" });
  const { sessions: sessionsCol } = await initChroma(E);

  const out = await searchUnionAsContext(E, db, sessionsCol, [query]);

  console.log(
    JSON.stringify(
      {
        query,
        hits: out.hits.slice(0, 10),
        missing: out.missing,
        context_messages: out.context_messages,
      },
      null,
      2
    )
  );

  await db.close();
}

async function cmdRun(E: Env, targetRoot: string) {
  const root = normalizePathKey(targetRoot).replace(/\/+$/, "");
  const runId = `run_${sha256(root).slice(0, 12)}`;

  await ensureDir(path.dirname(E.LEVEL_DIR));
  await ensureDir(E.OUTPUT_DIR);

  const db = new Level<string, any>(E.LEVEL_DIR, { valueEncoding: "json" });
  const { sessions: sessionsCol, notes: notesCol } = await initChroma(E);

  // init run state
  await recordPathRun(db, runId, root, root);

  const processedKey = runKey(runId, "processed");
  const queueKey = runKey(runId, "queue");

  const processed = new Set<string>(await runGetList(db, processedKey));
  const queue = await runGetList(db, queueKey);

  if (queue.length === 0) queue.push(root);

  const runState = { root };
  const { tools, handlers } = buildTools(E, db, runId, runState, sessionsCol, notesCol);

  console.log(`run_id=${runId}`);
  console.log(`root=${root}`);
  console.log(`queue_size=${queue.length}`);

  let safetyCounter = 0;

  while (queue.length > 0) {
    if (safetyCounter++ > E.MAX_PATHS) {
      console.warn(`Reached MAX_PATHS=${E.MAX_PATHS}. Stopping.`);
      break;
    }

    const rawPath = queue.shift()!;
    const currentPath = canonicalizePath(rawPath, root);

    if (!isWithinRoot(currentPath, root)) continue;
    if (processed.has(currentPath)) continue;
    processed.add(currentPath);

    console.log(`\n=== PATH: ${currentPath} ===`);

    // 1) Path extraction passes (repeat until stable)
    for (let pass = 0; pass < E.MAX_PATH_EXTRACTION_PASSES; pass++) {
      const { newCount } = await extractPathsPass(
        E,
        db,
        runId,
        root,
        currentPath,
        tools,
        handlers,
        sessionsCol,
        notesCol
      );
      console.log(`path_extraction_pass=${pass + 1} new_paths=${newCount}`);
      if (newCount === 0) break;
    }

    // refresh queue with any new paths under root
    {
      const recorded = await listRecordedPaths(db, runId);
      for (const p of recorded) {
        if (isWithinRoot(p, root) && !processed.has(p) && !queue.includes(p)) queue.push(p);
      }
    }

    // 2) Q/A loop
    for (let qi = 0; qi < DEFAULT_QUESTIONS.length; qi++) {
      const question = qfmt(currentPath, DEFAULT_QUESTIONS[qi]);
      const queries = buildAdaptiveQueries(root, currentPath, question);

      const search = await searchUnionAsContext(E, db, sessionsCol, queries);
      const notesMsgs = await getNotesSnippetMessages(E, db, notesCol, runId, `${currentPath} ${question}`);

      const systemMsg: OllamaMessage = { role: "system", content: makeSystemPrompt(root) };
      const userMsg: OllamaMessage = { role: "user", content: question };

      console.log(`\n--- Q${qi + 1}/${DEFAULT_QUESTIONS.length} ---`);
      console.log(`search_queries=${queries.length} hits=${search.hits.length} context_msgs=${search.context_messages.length}`);

      const { finalText } = await runToolLoop(
        E,
        db,
        [systemMsg, ...notesMsgs, ...search.context_messages, userMsg],
        tools,
        handlers,
        E.MAX_TOOL_ITERS
      );

      await describeFile(
        db,
        runId,
        currentPath,
        root,
        [
          `## Q: ${question}`,
          ``,
          `### A`,
          finalText && finalText.trim() ? finalText.trim() : `_No response content returned._`,
          ``,
          `---`,
        ].join("\n")
      );

      // backup path extraction from answer text (in case model forgot tool calls)
      for (const p of extractPathsLoose(finalText || "")) {
        await recordPathRun(db, runId, p, root);
      }

      // update queue
      const recorded = await listRecordedPaths(db, runId);
      for (const p of recorded) {
        if (isWithinRoot(p, root) && !processed.has(p) && !queue.includes(p)) queue.push(p);
      }

      // persist run state after each question
      await runPutList(db, processedKey, [...processed]);
      await runPutList(db, queueKey, queue);
    }
  }

  await exportMarkdownTree(E, db, runId, root);
  await db.close();
}

// -----------------------------
// CLI
// -----------------------------

function usage() {
  console.log(`
reconstitute <command> [...args]

Commands:
  index
      Index ALL OpenCode sessions into Chroma and store Ollama-replay blobs + meta in LevelDB.

  search "<query>"
      Semantic search sessions and print { context_messages[] } suitable for Ollama chat.

  run <path>
      Reconstruct a directory tree into markdown descriptions.

Examples:
  pnpm reconstitute index
  pnpm reconstitute search "orgs/octave-commons/cephalon-clj websocket rpc"
  pnpm reconstitute run orgs/octave-commons/cephalon-clj
`);
}

async function main() {
  const E = env();
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd || cmd === "-h" || cmd === "--help") {
    usage();
    process.exit(cmd ? 0 : 2);
  }

  if (cmd === "index") {
    await cmdIndex(E);
    return;
  }

  if (cmd === "search") {
    const q = argv.slice(1).join(" ").trim();
    if (!q) throw new Error(`Missing query. Example: reconstitute search "foo bar"`);
    await cmdSearch(E, q);
    return;
  }

  if (cmd === "run") {
    const target = argv[1];
    if (!target) throw new Error(`Missing path. Example: reconstitute run orgs/octave-commons/cephalon-clj`);
    await cmdRun(E, target);
    return;
  }

  throw new Error(`Unknown command: ${cmd}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

---

## New/updated env knobs (optional)

Add to your `.env` if you want to tune notes behavior:

```dotenv
NOTES_LIMIT=6
NOTES_THRESHOLD=
NOTES_MAX_CHARS=1800
```

* `NOTES_THRESHOLD` is a distance cutoff (smaller is better). Leave blank to include top-N regardless.

---

## What to do next

1. Re-index once so `msg:<id>:meta` and `sess:<id>:order` exist:

```bash
pnpm reconstitute index
```

2. Run reconstruction:

```bash
pnpm reconstitute run orgs/octave-commons/cephalon-clj
```

