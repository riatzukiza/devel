## Upgrade pass: token-budgeted context compaction (no message edits), per-session caps, dedupe + boilerplate drop

This pass adds **context compaction** while keeping **replay exactness** (we never modify message content—only decide which message-groups to include):

* **Budgeted context builder**

  * caps by `CONTEXT_MAX_CHARS` and `CONTEXT_MAX_MESSAGES`
  * optional `CONTEXT_MAX_TOKENS` (converted to chars via `CHARS_PER_TOKEN`, default `4`)
* **Per-session cap**

  * limits how many message-groups can come from any single session (`PER_SESSION_MAX_IDS`)
* **Dedupe**

  * drops duplicate message-groups by normalized hash
* **Boilerplate / low-signal trimming**

  * optionally drops tiny “continue/ok” messages and common assistant boilerplate

Below are full replacements for `package.json`, `.env.example`, and `src/reconstitute.ts`.

---

## `package.json`

```json
{
  "name": "reconstitute",
  "version": "0.2.0",
  "private": true,
  "type": "module",
  "bin": {
    "reconstitute": "dist/reconstitute.js"
  },
  "scripts": {
    "dev": "tsx src/reconstitute.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/reconstitute.js",
    "reconstitute": "tsx src/reconstitute.ts"
  },
  "dependencies": {
    "@opencode-ai/sdk": "^0.0.0",
    "chromadb": "^2.2.0",
    "dotenv": "^16.4.5",
    "level": "^9.0.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.5.0"
  }
}
```

---

## `.env.example`

```dotenv
# OpenCode
OPENCODE_BASE_URL=http://localhost:4096
OPENCODE_API_KEY=

# Chroma
CHROMA_URL=http://localhost:8000
CHROMA_TENANT=default_tenant
CHROMA_DATABASE=default_database
CHROMA_TOKEN=
CHROMA_COLLECTION_SESSIONS=opencode_messages_v1
CHROMA_COLLECTION_NOTES=reconstitute_notes_v1

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=qwen3-embedding:8b
OLLAMA_CHAT_MODEL=qwen3-vl:8b-instruct
OLLAMA_NUM_CTX=32768

# Local storage
LEVEL_DIR=.reconstitute/level
OUTPUT_DIR=.reconstitute/output

# Indexing
BATCH_SIZE=32

# Search
WINDOW=2
SEARCH_LIMIT=25
SEARCH_THRESHOLD=

# Tool loop
MAX_TOOL_ITERS=10
MAX_PATH_EXTRACTION_PASSES=6
MAX_PATHS=2000

# Caches
TTL_EMBED_MS=2592000000
TTL_SEARCH_MS=1800000
TTL_CHAT_MS=600000

# Notes augmentation
NOTES_LIMIT=6
NOTES_THRESHOLD=
NOTES_MAX_CHARS=1800

# Context compaction (budgeted selection; does NOT edit messages)
CONTEXT_MAX_CHARS=120000
CONTEXT_MAX_MESSAGES=400
PER_SESSION_MAX_IDS=40

# Optional token budget (overrides CONTEXT_MAX_CHARS if set)
CONTEXT_MAX_TOKENS=
CHARS_PER_TOKEN=4

# Dedupe / trimming
DEDUP_ENABLED=true
DROP_TINY_MESSAGES=true
DROP_ASSISTANT_BOILERPLATE=true

# Force include top-N best hits even if compaction gets aggressive
FORCE_HITS=6
```

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

  // context compaction
  CONTEXT_MAX_CHARS: number;
  CONTEXT_MAX_MESSAGES: number;
  PER_SESSION_MAX_IDS: number;
  CONTEXT_MAX_TOKENS: number | null;
  CHARS_PER_TOKEN: number;

  DEDUP_ENABLED: boolean;
  DROP_TINY_MESSAGES: boolean;
  DROP_ASSISTANT_BOILERPLATE: boolean;
  FORCE_HITS: number;

  MAX_TOOL_ITERS: number;
  MAX_PATH_EXTRACTION_PASSES: number;
  MAX_PATHS: number;
};

type Hit = { id: string; distance: number | null; meta: any };

// -----------------------------
// Env / utils
// -----------------------------

function env(): Env {
  const bool = (v: string | undefined, d: boolean) => {
    if (v == null) return d;
    const s = v.toLowerCase().trim();
    return s === "1" || s === "true" || s === "yes" || s === "y";
  };

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

    CONTEXT_MAX_CHARS: Number(process.env.CONTEXT_MAX_CHARS ?? "120000"),
    CONTEXT_MAX_MESSAGES: Number(process.env.CONTEXT_MAX_MESSAGES ?? "400"),
    PER_SESSION_MAX_IDS: Number(process.env.PER_SESSION_MAX_IDS ?? "40"),
    CONTEXT_MAX_TOKENS: process.env.CONTEXT_MAX_TOKENS ? Number(process.env.CONTEXT_MAX_TOKENS) : null,
    CHARS_PER_TOKEN: Number(process.env.CHARS_PER_TOKEN ?? "4"),

    DEDUP_ENABLED: bool(process.env.DEDUP_ENABLED, true),
    DROP_TINY_MESSAGES: bool(process.env.DROP_TINY_MESSAGES, true),
    DROP_ASSISTANT_BOILERPLATE: bool(process.env.DROP_ASSISTANT_BOILERPLATE, true),
    FORCE_HITS: Number(process.env.FORCE_HITS ?? "6"),

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
  x = x.replace(/^['"`<(\[]+/, "").replace(/['"`>)}\]]+$/, "");
  x = x.replace(/[.,;:!?]+$/, "");
  return x.trim();
}

function lastSegment(p: string): string {
  const n = normalizePathKey(p).replace(/\/+$/, "");
  const segs = n.split("/").filter(Boolean);
  return segs[segs.length - 1] ?? "";
}

function isProbablyUrlOrDrive(p: string): boolean {
  const x = p.trim();
  if (/^[a-zA-Z]+:\/\//.test(x)) return true;
  if (/^[a-zA-Z]:[\\/]/.test(x)) return true;
  return false;
}

function canonicalizePath(candidate: string, root: string): string {
  const r = normalizePathKey(root).replace(/\/+$/, "");
  let c = normalizePathKey(stripWrappingJunk(candidate));
  if (!c) return c;
  if (!r) return c.replace(/\/+$/, "");

  if (c === r) return c;

  if (c.startsWith("/") || c.startsWith("~") || isProbablyUrlOrDrive(c)) {
    c = c.replace(/\/+$/, "");
    return c;
  }

  if (c.startsWith("./")) c = `${r}/${c.slice(2)}`;

  const rootName = lastSegment(r);
  if (rootName && (c === rootName || c.startsWith(rootName + "/"))) {
    const rel = c === rootName ? "" : c.slice(rootName.length + 1);
    c = rel ? `${r}/${rel}` : r;
  }

  if (!c.startsWith(r + "/") && !c.startsWith(r) && c.includes("/")) c = `${r}/${c}`;
  c = c.replace(/\/+$/, "");
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
  return x.length <= n ? x : x.slice(0, n) + "…";
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
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
      options: { num_ctx: E.OLLAMA_NUM_CTX }
    })
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
        options: { num_ctx: E.OLLAMA_NUM_CTX }
      })
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
      temperature: args.temperature ?? 0
    })
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
            tokenHeaderType: "AUTHORIZATION"
          }
        }
      : {})
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
      if (toolOut != null) {
        textChunks.push(
          `[tool_result:${String(toolName)}] ${typeof toolOut === "string" ? toolOut : JSON.stringify(toolOut)}`
        );
      }
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
    return [
      {
        role: "assistant",
        content: text || undefined,
        tool_calls: toolCalls.map((tc, i) => ({
          type: "function",
          function: { index: i, name: tc.name, arguments: tc.args }
        }))
      },
      ...toolResults.map((tr) => ({ role: "tool" as const, tool_name: tr.name, content: tr.out }))
    ];
  }

  return [{ role, content: text }];
}

function flattenForEmbedding(ollamaMsgs: OllamaMessage[]): string {
  const lines: string[] = [];
  for (const m of ollamaMsgs) {
    if (m.role === "tool") {
      lines.push(`[tool:${m.tool_name}] ${m.content}`);
    } else if (m.role === "assistant" && "tool_calls" in m && m.tool_calls?.length) {
      for (const tc of m.tool_calls) lines.push(`[tool_call:${tc.function.name}] ${JSON.stringify(tc.function.arguments)}`);
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

      await db.put(`msg:${rowId}:hash`, hash);
      await db.put(`msg:${rowId}:ollama`, replay);
      await db.put(`msg:${rowId}:meta`, {
        session_id: sessionId,
        session_title: sessionTitle,
        message_index: i,
        role,
        created_at,
        paths
      });

      docs.push(doc);
      metas.push({
        session_id: sessionId,
        session_title: sessionTitle,
        message_index: i,
        role,
        created_at,
        paths
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
        metadatas: bMetas
      });

      console.log(`  upserted ${bIds.length}`);
    }
  }

  await db.close();
  console.log("Index complete.");
}

// -----------------------------
// Notes augmentation (runner-side)
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
    include: [IncludeEnum.Metadatas, IncludeEnum.Documents, IncludeEnum.Distances]
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
      doc: docs[i] ?? ""
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
// Chroma search + deterministic window ids
// -----------------------------

async function chromaSearchOnce(
  E: Env,
  db: Level<string, any>,
  sessionsCol: any,
  query: string,
  where?: any,
  limitOverride?: number,
  thresholdOverride?: number | null
): Promise<{ hits: { id: string; distance: number | null; meta: any }[] }> {
  const limit = limitOverride ?? E.SEARCH_LIMIT;
  const threshold = thresholdOverride ?? E.SEARCH_THRESHOLD;

  // include selection/budget knobs in cache key so we never reuse stale “shape”
  const ck = `cache:search:${sha256(
    JSON.stringify({
      q: query,
      where,
      limit,
      threshold,
      window: E.WINDOW
    })
  )}`;

  const cached = await ttlGet<{ hits: Hit[] }>(db, ck);
  if (cached) return cached;

  const qEmb = await ollamaEmbedOne(E, db, query);
  const results = await sessionsCol.query({
    queryEmbeddings: [qEmb],
    nResults: limit,
    where: where ?? undefined,
    include: [IncludeEnum.Metadatas, IncludeEnum.Distances]
  });

  const ids = results.ids?.[0] ?? [];
  const metadatas = results.metadatas?.[0] ?? [];
  const distances = results.distances?.[0] ?? [];

  const hits: Hit[] = ids
    .map((id: string, i: number) => ({
      id,
      meta: metadatas[i] ?? null,
      distance: distances[i] ?? null
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

    for (let j = Math.max(0, idx - E.WINDOW); j <= idx + E.WINDOW; j++) needed.add(`${sid}:${j}`);
  }

  return [...needed];
}

async function loadMeta(db: Level<string, any>, id: string): Promise<any | null> {
  return await db.get(`msg:${id}:meta`).catch(() => null);
}

async function loadReplay(db: Level<string, any>, id: string): Promise<OllamaMessage[] | null> {
  return (await db.get(`msg:${id}:ollama`).catch(() => null)) as OllamaMessage[] | null;
}

// -----------------------------
// Context compaction (selection only, no edits)
// -----------------------------

function normalizeForDedupe(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s:/.-]+/g, "")
    .trim();
}

function isTinyLowSignalGroup(msgs: OllamaMessage[]): boolean {
  if (msgs.length === 0) return true;

  // consider first non-tool message content
  for (const m of msgs) {
    if (m.role === "tool") continue;
    const content = ("content" in m && typeof (m as any).content === "string") ? String((m as any).content).trim() : "";
    if (!content) continue;

    const c = content.toLowerCase();
    if (c.length <= 10 && /^(ok|okay|k|cool|nice|thanks|ty|continue|go on|yep|yup|sure)\.?$/.test(c)) return true;
    return false;
  }
  return true;
}

function isAssistantBoilerplateGroup(msgs: OllamaMessage[]): boolean {
  for (const m of msgs) {
    if (m.role !== "assistant") continue;
    const content = ("content" in m && typeof (m as any).content === "string") ? String((m as any).content) : "";
    if (!content) continue;
    const c = content.toLowerCase();

    // common unwanted boilerplate in captured sessions
    const patterns = [
      /as an ai language model/,
      /i (can'?t|cannot) (help|assist) with/,
      /i'?m sorry/,
      /i can'?t comply/,
      /policy/,
      /safety/,
      /i don'?t have the ability to/,
      /i cannot browse/
    ];

    const hit = patterns.some((re) => re.test(c));
    if (hit && content.length < 1500) return true;
  }
  return false;
}

function estimateGroupChars(msgs: OllamaMessage[]): number {
  let n = 0;
  for (const m of msgs) {
    if (m.role === "tool") n += (m.content ?? "").length + (m.tool_name ?? "").length + 16;
    else if (m.role === "assistant" && "tool_calls" in m && (m as any).tool_calls?.length) {
      const tc = (m as any).tool_calls as any[];
      n += (m.content ?? "").length + 16;
      for (const t of tc) n += JSON.stringify(t).length;
    } else {
      n += ((m as any).content ?? "").length + 8;
    }
  }
  return n;
}

type Candidate = {
  id: string;
  sid: string;
  idx: number;
  created_at: number | null;
  role: string | null;
  distance: number | null; // direct hit distance if hit
  weight: number;
  chars: number;
  msgsCount: number;
  replay: OllamaMessage[];
};

async function compactSelectContext(
  E: Env,
  db: Level<string, any>,
  hits: Hit[],
  windowedIds: string[]
): Promise<{ selectedIds: string[]; context_messages: OllamaMessage[]; missing: string[]; stats: any }> {
  const missing: string[] = [];

  const hitById = new Map<string, Hit>();
  const hitIdxBySession: Map<string, number[]> = new Map();
  for (const h of hits) {
    hitById.set(h.id, h);
    const sid = String(h.meta?.session_id ?? "");
    const idx = Number(h.meta?.message_index ?? NaN);
    if (sid && !Number.isNaN(idx)) {
      const a = hitIdxBySession.get(sid) ?? [];
      a.push(idx);
      hitIdxBySession.set(sid, a);
    }
  }
  for (const [sid, arr] of hitIdxBySession) {
    arr.sort((a, b) => a - b);
    hitIdxBySession.set(sid, arr);
  }

  const candidates: Candidate[] = [];

  // load candidates (replay + meta) so we can budget accurately
  for (const id of windowedIds) {
    const meta = await loadMeta(db, id);
    const replay = await loadReplay(db, id);
    if (!replay || !meta) {
      missing.push(id);
      continue;
    }

    const sid = String(meta.session_id ?? "");
    const idx = Number(meta.message_index ?? NaN);
    const created_at = typeof meta.created_at === "number" ? meta.created_at : null;
    const role = meta.role ? String(meta.role) : null;

    const docLike = flattenForEmbedding(replay);
    const direct = hitById.get(id);
    const dist = direct?.distance ?? null;

    // distance score (smaller distance = higher weight)
    const distScore = dist == null ? 0 : 1 / (dist + 1e-6);

    // adjacency score: closer to any hit in same session is better
    let adj = 0;
    const hitIdxs = hitIdxBySession.get(sid);
    if (hitIdxs && Number.isFinite(idx)) {
      // find nearest hit index
      let best = Number.POSITIVE_INFINITY;
      for (const hi of hitIdxs) best = Math.min(best, Math.abs(hi - idx));
      // cap adjacency influence; best=0 => 1.0, best=5 => ~0.16
      adj = 1 / (1 + best);
    }

    // favor direct hits strongly; neighbors get a bump
    const weight = distScore * 3 + adj;

    const chars = estimateGroupChars(replay);
    const msgsCount = replay.length;

    // trimming filters (selection only)
    if (E.DROP_TINY_MESSAGES && isTinyLowSignalGroup(replay)) continue;
    if (E.DROP_ASSISTANT_BOILERPLATE && isAssistantBoilerplateGroup(replay)) continue;

    // also avoid empty content groups unless they contain tool data
    const hasSome = docLike.trim().length > 0;
    if (!hasSome) continue;

    candidates.push({ id, sid, idx, created_at, role, distance: dist, weight, chars, msgsCount, replay });
  }

  // dedupe groups by normalized hash of flattened text
  const seen = new Set<string>();
  const filtered: Candidate[] = [];
  if (E.DEDUP_ENABLED) {
    for (const c of candidates) {
      const key = sha256(normalizeForDedupe(flattenForEmbedding(c.replay)));
      if (seen.has(key)) continue;
      seen.add(key);
      filtered.push(c);
    }
  } else {
    filtered.push(...candidates);
  }

  // budget settings
  const maxChars =
    E.CONTEXT_MAX_TOKENS != null
      ? Math.max(1, Math.floor(E.CONTEXT_MAX_TOKENS * E.CHARS_PER_TOKEN))
      : E.CONTEXT_MAX_CHARS;

  const maxMsgs = E.CONTEXT_MAX_MESSAGES;

  // selection strategy:
  // 1) force include top-N direct hits (by distance)
  // 2) fill remaining by weight desc
  const directHitsSorted = filtered
    .filter((c) => hitById.has(c.id))
    .sort((a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY));

  const forced = directHitsSorted.slice(0, Math.max(0, E.FORCE_HITS));

  const byId = new Map<string, Candidate>();
  for (const c of filtered) byId.set(c.id, c);

  const chosenIds: string[] = [];
  const perSessionCount = new Map<string, number>();
  let usedChars = 0;
  let usedMsgs = 0;

  const tryAdd = (c: Candidate): boolean => {
    const sid = c.sid;
    const sc = perSessionCount.get(sid) ?? 0;
    if (sc >= E.PER_SESSION_MAX_IDS) return false;

    if (usedChars + c.chars > maxChars) return false;
    if (usedMsgs + c.msgsCount > maxMsgs) return false;

    chosenIds.push(c.id);
    perSessionCount.set(sid, sc + 1);
    usedChars += c.chars;
    usedMsgs += c.msgsCount;
    return true;
  };

  for (const c of forced) tryAdd(c);

  const remaining = filtered
    .filter((c) => !chosenIds.includes(c.id))
    .sort((a, b) => b.weight - a.weight);

  for (const c of remaining) {
    if (tryAdd(c)) continue;
    // stop early if we’re basically full
    if (usedChars >= maxChars * 0.98 || usedMsgs >= maxMsgs * 0.98) break;
  }

  // final order must be chronological for replay
  const chosen: Candidate[] = chosenIds.map((id) => byId.get(id)!).filter(Boolean);
  chosen.sort((a, b) => {
    const ta = a.created_at ?? Number.POSITIVE_INFINITY;
    const tb = b.created_at ?? Number.POSITIVE_INFINITY;
    if (ta !== tb) return ta - tb;
    return a.id.localeCompare(b.id);
  });

  const context_messages: OllamaMessage[] = [];
  for (const c of chosen) for (const m of c.replay) context_messages.push(m);

  const stats = {
    candidates_total: windowedIds.length,
    candidates_loaded: candidates.length,
    candidates_after_dedupe: filtered.length,
    selected_groups: chosen.length,
    selected_messages: context_messages.length,
    used_chars: usedChars,
    max_chars: maxChars,
    used_messages: usedMsgs,
    max_messages: maxMsgs,
    per_session_max_ids: E.PER_SESSION_MAX_IDS
  };

  return { selectedIds: chosen.map((c) => c.id), context_messages, missing, stats };
}

async function searchUnionAsContext(
  E: Env,
  db: Level<string, any>,
  sessionsCol: any,
  queries: string[],
  where?: any,
  limitOverride?: number,
  thresholdOverride?: number | null
): Promise<{ hits: Hit[]; context_messages: OllamaMessage[]; missing: string[]; stats: any }> {
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

  // compaction selection happens here
  const compacted = await compactSelectContext(E, db, hits, windowedIds);

  return {
    hits,
    context_messages: compacted.context_messages,
    missing: compacted.missing,
    stats: compacted.stats
  };
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
          additionalProperties: false
        }
      }
    },
    {
      type: "function",
      function: {
        name: "list_notes",
        description: "List note titles.",
        parameters: { type: "object", properties: {}, additionalProperties: false }
      }
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
            threshold: { type: "number" }
          },
          required: ["query"],
          additionalProperties: false
        }
      }
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
          additionalProperties: false
        }
      }
    },
    {
      type: "function",
      function: {
        name: "list_recorded_paths",
        description: "List all recorded paths.",
        parameters: { type: "object", properties: {}, additionalProperties: false }
      }
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
          additionalProperties: false
        }
      }
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
          additionalProperties: false
        }
      }
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
            threshold: { type: "number" }
          },
          required: ["query"],
          additionalProperties: false
        }
      }
    }
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
        metadatas: [{ title, run_id: runId, created_at: Date.now() }]
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
      const where2 = { run_id: runId, ...where };

      const qEmb = await ollamaEmbedOne(E, db, q);
      const res = await notesCol.query({
        queryEmbeddings: [qEmb],
        nResults: Number.isFinite(limit) && limit > 0 ? limit : 10,
        where: where2,
        include: [IncludeEnum.Metadatas, IncludeEnum.Documents, IncludeEnum.Distances, IncludeEnum.Ids]
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
          document: docs[i] ?? null
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
        within_root: isWithinRoot(canon, runState.root)
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
        stats: out.stats,
        context_messages: out.context_messages
      });
    }
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
      tool_calls: Array.isArray(msg.tool_calls) ? msg.tool_calls : undefined
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
  "List important modules/files under {path} and what each does."
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
    `If info is missing: say what is missing, and what evidence you do have.`
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
    `${currentPath} src lib packages modules files`
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
      `Current focus path: ${currentPath}`
    ].join("\n")
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
    ``
  ].join("\n");

  await fs.writeFile(path.join(outRoot, "index.md"), indexBody, "utf8");

  for (const d of within) {
    const p = normalizePathKey(d.path);
    const safeP = p.replace(/^\/*/, "");
    const mdPath = path.join(outRoot, safeP + ".md");
    await ensureDir(path.dirname(mdPath));

    const body = [
      `# ${p}`,
      ``,
      `## Description`,
      ``,
      d.body.trim() ? d.body.trim() : `_No description yet._`,
      ``
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
        stats: out.stats,
        missing: out.missing,
        context_messages: out.context_messages
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

    // 1) Path extraction passes
    for (let pass = 0; pass < E.MAX_PATH_EXTRACTION_PASSES; pass++) {
      const { newCount } = await extractPathsPass(E, db, runId, root, currentPath, tools, handlers, sessionsCol, notesCol);
      console.log(`path_extraction_pass=${pass + 1} new_paths=${newCount}`);
      if (newCount === 0) break;
    }

    // refresh queue with new paths
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
      console.log(
        `search_queries=${queries.length} hits=${search.hits.length} ctx_msgs=${search.context_messages.length} compact=${JSON.stringify(search.stats)}`
      );

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
          `---`
        ].join("\n")
      );

      // fallback path extraction from answer text
      for (const p of extractPathsLoose(finalText || "")) await recordPathRun(db, runId, p, root);

      // update queue
      const recorded = await listRecordedPaths(db, runId);
      for (const p of recorded) {
        if (isWithinRoot(p, root) && !processed.has(p) && !queue.includes(p)) queue.push(p);
      }

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
      Includes "stats" so you can see compaction decisions.

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

## What you get from this pass

* `reconstitute search "..."` now prints:

  * `hits` (top 10)
  * `stats` (how many candidates were considered vs selected; budget usage)
  * `context_messages` (already compacted)

That same compacted builder is what `run` uses internally for each question.

