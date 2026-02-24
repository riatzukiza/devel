## MCP server: session search + session reconstitution (OpenCode → Ollama chat context)

This is a **TypeScript MCP stdio server** that exposes tools to:

* **semantic search** your **indexed OpenCode sessions** stored in a **remote Chroma** collection, using **Ollama** embeddings (`qwen3-embedding:8b`)
* **reconstitute** a session (or search hits) into **Ollama `/api/chat`-compatible `messages[]`**, including **tool-call + tool-result** message shapes

It follows the MCP TS server pattern (`McpServer`, `StdioServerTransport`, `registerTool`) ([Model Context Protocol][1]), uses the OpenCode SDK client-only mode (`createOpencodeClient`, default baseUrl `http://localhost:4096`) ([OpenCode][2]), calls Ollama’s embeddings endpoint (`POST /api/embed`, supports `truncate` + `options`) ([Ollama Docs][3]), and emits Ollama tool messages in the documented format (`role:"tool"`, `tool_name`) ([Ollama Docs][4]).
Chroma JS client usage shown here matches `new ChromaClient({ path: "http://localhost:8000" })` ([GitHub][5]).

---

# Folder layout

```text
reconstitute-mcp/
  package.json
  tsconfig.json
  src/
    index.ts
    lib/
      config.ts
      chroma.ts
      ollama.ts
      opencode.ts
      convert.ts
      paths.ts
      level.ts
      ttl.ts
      log.ts
```

---

# `package.json`

```json
{
  "name": "reconstitute-mcp",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "reconstitute-mcp": "./build/index.js"
  },
  "scripts": {
    "build": "tsc && chmod 755 build/index.js",
    "dev": "node --enable-source-maps --loader ts-node/esm src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@opencode-ai/sdk": "^1.0.0",
    "level": "^9.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.6.3"
  }
}
```

> Note: This server **never** uses `console.log()` (stdout) because MCP stdio servers must not write to stdout ([Model Context Protocol][1]).

---

# `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

# `src/lib/log.ts`

```ts
export function log(...args: unknown[]) {
  // stderr is safe for MCP stdio servers
  console.error("[reconstitute-mcp]", ...args);
}

export function warn(...args: unknown[]) {
  console.error("[reconstitute-mcp][warn]", ...args);
}

export function err(...args: unknown[]) {
  console.error("[reconstitute-mcp][err]", ...args);
}
```

---

# `src/lib/config.ts`

```ts
import os from "node:os";
import path from "node:path";

export type Config = {
  opencodeBaseUrl: string;
  chromaUrl: string;
  chromaCollectionSessions: string;
  chromaCollectionNotes: string;

  ollamaApiBase: string; // default http://localhost:11434/api
  ollamaEmbedModel: string; // qwen3-embedding:8b
  ollamaEmbedNumCtx: number; // 32768
  ollamaEmbedTruncate: boolean;

  dbPath: string; // leveldb root
  cacheTtlSeconds: number;
};

export function getConfig(): Config {
  const home = os.homedir();
  const root = process.env.RECONSTITUTE_HOME ?? path.join(home, ".reconstitute");

  return {
    opencodeBaseUrl: process.env.OPENCODE_BASE_URL ?? "http://localhost:4096",
    chromaUrl: process.env.CHROMA_URL ?? "http://localhost:8000",
    chromaCollectionSessions:
      process.env.CHROMA_COLLECTION_SESSIONS ?? "opencode_sessions",
    chromaCollectionNotes: process.env.CHROMA_COLLECTION_NOTES ?? "reconstitute_notes",

    // Ollama API base URL is http://localhost:11434/api by default :contentReference[oaicite:6]{index=6}
    ollamaApiBase: process.env.OLLAMA_API_BASE ?? "http://localhost:11434/api",
    ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL ?? "qwen3-embedding:8b",
    ollamaEmbedNumCtx: Number(process.env.OLLAMA_EMBED_NUM_CTX ?? 32768),
    ollamaEmbedTruncate: (process.env.OLLAMA_EMBED_TRUNCATE ?? "true") === "true",

    dbPath: process.env.RECONSTITUTE_DB_PATH ?? path.join(root, "leveldb"),
    cacheTtlSeconds: Number(process.env.RECONSTITUTE_CACHE_TTL ?? 3600)
  };
}
```

---

# `src/lib/level.ts`

```ts
import { Level } from "level";
import { getConfig } from "./config.js";

export type Db = Level<string, string>;

export function openDb(): Db {
  const cfg = getConfig();
  return new Level<string, string>(cfg.dbPath, { valueEncoding: "utf8" });
}
```

---

# `src/lib/ttl.ts`

```ts
import type { Db } from "./level.js";

type Envelope<T> = {
  expiresAt: number; // epoch ms
  value: T;
};

export async function ttlGet<T>(db: Db, key: string): Promise<T | null> {
  try {
    const raw = await db.get(key);
    const env = JSON.parse(raw) as Envelope<T>;
    if (Date.now() > env.expiresAt) {
      await db.del(key).catch(() => {});
      return null;
    }
    return env.value;
  } catch {
    return null;
  }
}

export async function ttlSet<T>(
  db: Db,
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const env: Envelope<T> = {
    expiresAt: Date.now() + ttlSeconds * 1000,
    value
  };
  await db.put(key, JSON.stringify(env));
}

export function cacheKey(parts: Record<string, unknown>): string {
  // stable-ish deterministic key
  const keys = Object.keys(parts).sort();
  const obj: Record<string, unknown> = {};
  for (const k of keys) obj[k] = parts[k];
  return JSON.stringify(obj);
}
```

---

# `src/lib/ollama.ts`

```ts
import { getConfig } from "./config.js";

export type OllamaToolCall = {
  type: "function";
  function: {
    index: number;
    name: string;
    arguments: Record<string, unknown>;
  };
};

export type OllamaMessage =
  | { role: "system" | "user" | "assistant"; content: string; tool_calls?: OllamaToolCall[] }
  | { role: "tool"; tool_name: string; content: string };

type EmbedResponse = {
  model: string;
  embeddings: number[][];
};

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const cfg = getConfig();

  // Ollama embeddings endpoint: POST /api/embed (supports truncate/options) :contentReference[oaicite:7]{index=7}
  const resp = await fetch(`${cfg.ollamaApiBase}/embed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: cfg.ollamaEmbedModel,
      input: texts,
      truncate: cfg.ollamaEmbedTruncate,
      options: {
        num_ctx: cfg.ollamaEmbedNumCtx
      }
    })
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Ollama embed failed (${resp.status}): ${body}`);
  }

  const data = (await resp.json()) as EmbedResponse;
  if (!Array.isArray(data.embeddings)) {
    throw new Error("Ollama embed: missing embeddings[]");
  }
  return data.embeddings;
}
```

---

# `src/lib/chroma.ts`

```ts
import { getConfig } from "./config.js";
import { err } from "./log.js";

type ChromaCollection = any;
type ChromaClient = any;

async function loadChroma(): Promise<{ ChromaClient: any }> {
  // chromadb package has historically had CJS/ESM export differences; dynamic import is safest.
  const mod: any = await import("chromadb");
  const ChromaClientCtor = mod.ChromaClient ?? mod.default?.ChromaClient ?? mod.default;
  if (!ChromaClientCtor) {
    throw new Error("Failed to resolve ChromaClient from chromadb module");
  }
  return { ChromaClient: ChromaClientCtor };
}

export type ChromaHit = {
  id: string;
  document: string;
  metadata: Record<string, any>;
  distance?: number;
};

export async function getChromaClient(): Promise<ChromaClient> {
  const cfg = getConfig();
  const { ChromaClient } = await loadChroma();

  // Remote client: new ChromaClient({ path: "http://localhost:8000" }) :contentReference[oaicite:8]{index=8}
  return new ChromaClient({ path: cfg.chromaUrl });
}

export async function getOrCreateCollection(
  name: string
): Promise<ChromaCollection> {
  const client = await getChromaClient();
  try {
    return await client.getCollection({ name });
  } catch {
    // create if missing
    return await client.createCollection({ name });
  }
}

export async function queryCollection(opts: {
  collectionName: string;
  queryEmbedding: number[];
  nResults: number;
  where?: Record<string, any>;
}): Promise<ChromaHit[]> {
  const col = await getOrCreateCollection(opts.collectionName);

  const res = await col.query({
    queryEmbeddings: [opts.queryEmbedding],
    nResults: opts.nResults,
    where: opts.where,
    include: ["documents", "metadatas", "distances", "ids"]
  });

  const ids: string[] = res.ids?.[0] ?? [];
  const docs: string[] = res.documents?.[0] ?? [];
  const metas: any[] = res.metadatas?.[0] ?? [];
  const dists: number[] = res.distances?.[0] ?? [];

  const hits: ChromaHit[] = [];
  for (let i = 0; i < ids.length; i++) {
    hits.push({
      id: ids[i],
      document: docs[i] ?? "",
      metadata: metas[i] ?? {},
      distance: dists[i]
    });
  }
  return hits;
}

export async function addToCollection(opts: {
  collectionName: string;
  ids: string[];
  documents: string[];
  metadatas: Record<string, any>[];
  embeddings?: number[][];
}): Promise<void> {
  const col = await getOrCreateCollection(opts.collectionName);
  try {
    await col.add({
      ids: opts.ids,
      documents: opts.documents,
      metadatas: opts.metadatas,
      embeddings: opts.embeddings
    });
  } catch (e) {
    err("Chroma add failed:", e);
    throw e;
  }
}
```

---

# `src/lib/opencode.ts`

```ts
import { createOpencodeClient } from "@opencode-ai/sdk";
import { getConfig } from "./config.js";

export function getOpenCodeClient() {
  const cfg = getConfig();
  // client-only mode: createOpencodeClient({ baseUrl }) :contentReference[oaicite:9]{index=9}
  return createOpencodeClient({
    baseUrl: cfg.opencodeBaseUrl
  });
}

export type OpenCodeSession = any;
export type OpenCodeSessionMessage = { info: any; parts: any[] };

export async function listSessions(): Promise<OpenCodeSession[]> {
  const client = getOpenCodeClient();
  const res = await client.session.list();
  return res.data;
}

export async function getSessionMessages(sessionId: string): Promise<OpenCodeSessionMessage[]> {
  const client = getOpenCodeClient();
  const res = await client.session.messages({ path: { id: sessionId } });
  return res.data;
}
```

---

# `src/lib/paths.ts`

```ts
// Heuristic path extraction from text (good enough for iterative discovery loops)
const PATH_RE =
  /(?:^|[\s"'`(])((?:\/[^\s"'`)+]|(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+\.[A-Za-z0-9]{1,8}|(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+)(?=$|[\s"'`),.;:])/g;

export function extractPaths(text: string): string[] {
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = PATH_RE.exec(text)) !== null) {
    const p = (m[1] ?? "").trim();
    if (!p) continue;
    // skip obvious URLs
    if (p.startsWith("http://") || p.startsWith("https://")) continue;
    out.add(p);
  }
  return [...out];
}
```

---

# `src/lib/convert.ts` (OpenCode message → Ollama messages)

```ts
import type { OllamaMessage, OllamaToolCall } from "./ollama.js";

type OpenCodeMsg = { info: any; parts: any[] };

// Best-effort conversion:
// - text parts → content
// - tool call/result parts → Ollama tool_calls + role:"tool" messages
// Ollama tool message format is documented with role:"tool" + tool_name :contentReference[oaicite:10]{index=10}
export function openCodeToOllamaMessages(msgs: OpenCodeMsg[]): OllamaMessage[] {
  const out: OllamaMessage[] = [];

  for (const m of msgs) {
    const role = normalizeRole(m.info);
    const { text, toolCalls, toolResults } = squashParts(m.parts);

    if (toolCalls.length > 0) {
      const assistant: OllamaMessage = {
        role: role === "user" ? "assistant" : role,
        content: text ?? "",
        tool_calls: toolCalls
      };
      out.push(assistant);

      for (const r of toolResults) {
        out.push({
          role: "tool",
          tool_name: r.name,
          content: r.content
        });
      }
      continue;
    }

    out.push({
      role,
      content: text ?? ""
    });
  }

  return coalesceAdjacent(out);
}

function normalizeRole(info: any): "system" | "user" | "assistant" {
  const r = (info?.role ?? info?.type ?? info?.author ?? "").toString().toLowerCase();
  if (r.includes("system")) return "system";
  if (r.includes("user")) return "user";
  return "assistant";
}

function squashParts(parts: any[]): {
  text: string;
  toolCalls: OllamaToolCall[];
  toolResults: { name: string; content: string }[];
} {
  let text = "";
  const toolCalls: OllamaToolCall[] = [];
  const toolResults: { name: string; content: string }[] = [];

  let toolIndex = 0;

  for (const p of parts ?? []) {
    const t = (p?.type ?? "").toString();

    // Common case: {type:"text", text:"..."}
    if (t === "text" && typeof p.text === "string") {
      text += (text ? "\n" : "") + p.text;
      continue;
    }

    // Tool-ish shapes (OpenCode varies; we do a best-effort parse)
    // Try to detect call vs result:
    // - call: has name + input/args, but no output/result
    // - result: has name + output/result
    const name =
      (p?.name ?? p?.tool_name ?? p?.toolName ?? p?.function?.name ?? "").toString();

    const argsObj =
      p?.args ?? p?.arguments ?? p?.input ?? p?.function?.arguments ?? null;

    const outputObj =
      p?.output ?? p?.result ?? p?.content ?? p?.response ?? null;

    const looksTooly =
      t.includes("tool") ||
      t.includes("function") ||
      !!name ||
      argsObj != null ||
      outputObj != null;

    if (!looksTooly) {
      // fallback: stringify unknown parts
      text += (text ? "\n" : "") + safeStringify(p);
      continue;
    }

    const hasOutput = outputObj != null && safeStringify(outputObj).trim().length > 0;
    const hasArgs = argsObj != null && safeStringify(argsObj).trim().length > 0;

    if (hasArgs && !hasOutput) {
      toolCalls.push({
        type: "function",
        function: {
          index: toolIndex++,
          name: name || "unknown_tool",
          arguments: asObject(argsObj)
        }
      });
      continue;
    }

    if (hasOutput) {
      toolResults.push({
        name: name || "unknown_tool",
        content: typeof outputObj === "string" ? outputObj : safeStringify(outputObj)
      });
      continue;
    }

    // If ambiguous, treat as text
    text += (text ? "\n" : "") + safeStringify(p);
  }

  return { text, toolCalls, toolResults };
}

function asObject(v: any): Record<string, unknown> {
  if (!v) return {};
  if (typeof v === "object") return v as Record<string, unknown>;
  try {
    const parsed = JSON.parse(String(v));
    return typeof parsed === "object" && parsed ? parsed : { value: v };
  } catch {
    return { value: v };
  }
}

function safeStringify(v: any): string {
  try {
    if (typeof v === "string") return v;
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

// Reduce token waste in RAG contexts
function coalesceAdjacent(msgs: OllamaMessage[]): OllamaMessage[] {
  const out: OllamaMessage[] = [];
  for (const m of msgs) {
    const prev = out[out.length - 1] as any;
    if (
      prev &&
      prev.role === m.role &&
      m.role !== "tool" &&
      !prev.tool_calls &&
      !(m as any).tool_calls
    ) {
      prev.content = (prev.content ?? "") + "\n" + (m as any).content;
    } else {
      out.push(m);
    }
  }
  return out;
}
```

---

# `src/index.ts` (the MCP server)

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { getConfig } from "./lib/config.js";
import { openDb } from "./lib/level.js";
import { ttlGet, ttlSet, cacheKey } from "./lib/ttl.js";
import { embedTexts } from "./lib/ollama.js";
import { addToCollection, queryCollection } from "./lib/chroma.js";
import { getSessionMessages, listSessions } from "./lib/opencode.js";
import { openCodeToOllamaMessages } from "./lib/convert.js";
import { extractPaths } from "./lib/paths.js";
import { log } from "./lib/log.js";

const cfg = getConfig();
const db = openDb();

const server = new McpServer({
  name: "reconstitute",
  version: "0.1.0"
});

// ---------- Tool: search_sessions ----------
server.registerTool(
  "search_sessions",
  {
    description:
      "Semantic search over OpenCode sessions already indexed in Chroma. Returns hits plus an Ollama /api/chat compatible messages[] context.",
    inputSchema: {
      query: z.string().min(1),
      metadata_filter: z.record(z.any()).optional(),
      result_limit: z.number().int().min(1).max(200).default(25),
      // Chroma returns distances; this acts as max distance filter (lower is closer).
      threshold: z.number().min(0).max(10).default(1.0),
      context_window: z.number().int().min(0).max(50).default(6)
    }
  },
  async (input) => {
    const { query, metadata_filter, result_limit, threshold, context_window } = input;

    // Cache the embedding + query result for speed / resume
    const ck = "search_sessions:" + cacheKey({ query, metadata_filter, result_limit, threshold, context_window });
    const cached = await ttlGet<any>(db, ck);
    if (cached) {
      return { content: [{ type: "text", text: JSON.stringify(cached, null, 2) }] };
    }

    const [qEmb] = await embedTexts([query]);

    const hits = await queryCollection({
      collectionName: cfg.chromaCollectionSessions,
      queryEmbedding: qEmb,
      nResults: result_limit,
      where: metadata_filter
    });

    const filtered = hits.filter((h) => (h.distance ?? 999) <= threshold);

    // Build an Ollama context by expanding around hit message indices
    const expanded: { session_id: string; from: number; to: number }[] = [];
    for (const h of filtered) {
      const sid = String(h.metadata?.session_id ?? "");
      const mi = Number(h.metadata?.message_index ?? -1);
      if (!sid || mi < 0) continue;
      expanded.push({
        session_id: sid,
        from: Math.max(0, mi - context_window),
        to: mi + context_window
      });
    }

    // merge ranges per session
    const bySession = new Map<string, { from: number; to: number }>();
    for (const r of expanded) {
      const cur = bySession.get(r.session_id);
      if (!cur) bySession.set(r.session_id, { from: r.from, to: r.to });
      else bySession.set(r.session_id, { from: Math.min(cur.from, r.from), to: Math.max(cur.to, r.to) });
    }

    const contextMsgs: any[] = [];
    const discoveredPaths = new Set<string>();

    for (const [sid, range] of bySession.entries()) {
      const msgs = await getSessionMessages(sid);
      const slice = msgs.slice(range.from, Math.min(msgs.length, range.to + 1));
      const ollamaMsgs = openCodeToOllamaMessages(slice);

      for (const om of ollamaMsgs) {
        if (om.role !== "tool" && "content" in om && typeof om.content === "string") {
          for (const p of extractPaths(om.content)) discoveredPaths.add(p);
        }
      }

      contextMsgs.push(...ollamaMsgs);
    }

    const result = {
      query,
      threshold,
      hit_count: filtered.length,
      hits: filtered.map((h) => ({
        id: h.id,
        distance: h.distance,
        metadata: h.metadata,
        excerpt: (h.document ?? "").slice(0, 500)
      })),
      ollama_messages: contextMsgs,
      discovered_paths: [...discoveredPaths]
    };

    await ttlSet(db, ck, result, cfg.cacheTtlSeconds);

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// ---------- Tool: reconstitute_session ----------
server.registerTool(
  "reconstitute_session",
  {
    description:
      "Fetch a full OpenCode session and convert it into Ollama /api/chat compatible messages[] (including tool call/result structure when possible).",
    inputSchema: {
      session_id: z.string().min(1),
      from_index: z.number().int().min(0).optional(),
      to_index: z.number().int().min(0).optional()
    }
  },
  async ({ session_id, from_index, to_index }) => {
    const ck = "reconstitute_session:" + cacheKey({ session_id, from_index, to_index });
    const cached = await ttlGet<any>(db, ck);
    if (cached) {
      return { content: [{ type: "text", text: JSON.stringify(cached, null, 2) }] };
    }

    const msgs = await getSessionMessages(session_id);
    const from = from_index ?? 0;
    const to = to_index ?? msgs.length - 1;

    const slice = msgs.slice(from, Math.min(msgs.length, to + 1));
    const ollamaMsgs = openCodeToOllamaMessages(slice);

    const result = {
      session_id,
      from,
      to,
      message_count: slice.length,
      ollama_messages: ollamaMsgs
    };

    await ttlSet(db, ck, result, cfg.cacheTtlSeconds);

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// ---------- Tool: index_sessions (optional but practical) ----------
server.registerTool(
  "index_sessions",
  {
    description:
      "Index all OpenCode sessions into the Chroma sessions collection (documents=message text, embeddings via Ollama). Safe to run repeatedly (ids are stable).",
    inputSchema: {
      limit_sessions: z.number().int().min(1).max(100000).default(100000)
    }
  },
  async ({ limit_sessions }) => {
    const sessions = await listSessions();
    const take = sessions.slice(0, limit_sessions);

    let totalMsgs = 0;
    let totalAdded = 0;

    for (const s of take) {
      const sid = String(s?.id ?? "");
      if (!sid) continue;

      const msgs = await getSessionMessages(sid);
      totalMsgs += msgs.length;

      // Convert each OpenCode "message" to an indexable doc string (text + tool stuff stringified)
      const docs: string[] = [];
      const ids: string[] = [];
      const metas: Record<string, any>[] = [];

      for (let i = 0; i < msgs.length; i++) {
        const oc = msgs[i];
        const role = (oc?.info?.role ?? oc?.info?.type ?? "assistant").toString();
        const text = JSON.stringify(oc?.parts ?? []);
        const doc = `session=${sid}\nindex=${i}\nrole=${role}\n\n${text}`;

        docs.push(doc);
        ids.push(`${sid}:${i}`);
        metas.push({
          session_id: sid,
          message_index: i,
          role,
          // keep some session-level metadata if present
          title: s?.title ?? null,
          project: s?.project ?? null
        });
      }

      // Batch embed to reduce overhead
      const embeddings = await embedTexts(docs);

      await addToCollection({
        collectionName: cfg.chromaCollectionSessions,
        ids,
        documents: docs,
        metadatas: metas,
        embeddings
      });

      totalAdded += ids.length;
    }

    const result = { indexed_sessions: take.length, total_msgs: totalMsgs, total_added: totalAdded };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// ---------- Tools: notes + path state (matches your tool plan) ----------
server.registerTool(
  "take_note",
  {
    description: "Store a note (title/body) in the notes Chroma collection for later semantic retrieval.",
    inputSchema: {
      title: z.string().min(1),
      body: z.string().min(1)
    }
  },
  async ({ title, body }) => {
    const id = `note:${Date.now()}:${Math.random().toString(16).slice(2)}`;
    const doc = `${title}\n\n${body}`;
    const [emb] = await embedTexts([doc]);

    await addToCollection({
      collectionName: cfg.chromaCollectionNotes,
      ids: [id],
      documents: [doc],
      metadatas: [{ title, created_at: new Date().toISOString() }],
      embeddings: [emb]
    });

    // also keep a lightweight index in leveldb
    await db.put(`note_title:${id}`, title);

    return { content: [{ type: "text", text: JSON.stringify({ ok: true, id }, null, 2) }] };
  }
);

server.registerTool(
  "list_notes",
  {
    description: "List stored note ids and titles.",
    inputSchema: {}
  },
  async () => {
    const notes: { id: string; title: string }[] = [];
    for await (const [k, v] of db.iterator({ gte: "note_title:", lt: "note_title;" })) {
      const id = k.replace("note_title:", "");
      notes.push({ id, title: v });
    }
    return { content: [{ type: "text", text: JSON.stringify({ notes }, null, 2) }] };
  }
);

server.registerTool(
  "search_notes",
  {
    description: "Semantic search over stored notes.",
    inputSchema: {
      query: z.string().min(1),
      metadata_filter: z.record(z.any()).optional(),
      result_limit: z.number().int().min(1).max(200).default(10),
      threshold: z.number().min(0).max(10).default(1.0)
    }
  },
  async ({ query, metadata_filter, result_limit, threshold }) => {
    const [qEmb] = await embedTexts([query]);
    const hits = await queryCollection({
      collectionName: cfg.chromaCollectionNotes,
      queryEmbedding: qEmb,
      nResults: result_limit,
      where: metadata_filter
    });

    const filtered = hits.filter((h) => (h.distance ?? 999) <= threshold);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              query,
              threshold,
              hit_count: filtered.length,
              hits: filtered.map((h) => ({
                id: h.id,
                distance: h.distance,
                metadata: h.metadata,
                excerpt: (h.document ?? "").slice(0, 500)
              }))
            },
            null,
            2
          )
        }
      ]
    };
  }
);

server.registerTool(
  "record_path",
  {
    description: "Remember a path (set semantics). Returns true if it was new.",
    inputSchema: {
      path: z.string().min(1)
    }
  },
  async ({ path }) => {
    const key = `path_seen:${path}`;
    const existed = await db.get(key).then(() => true).catch(() => false);
    if (!existed) await db.put(key, "1");
    return { content: [{ type: "text", text: JSON.stringify({ path, is_new: !existed }, null, 2) }] };
  }
);

server.registerTool(
  "list_recorded_paths",
  {
    description: "List all recorded paths.",
    inputSchema: {}
  },
  async () => {
    const paths: string[] = [];
    for await (const [k] of db.iterator({ gte: "path_seen:", lt: "path_seen;" })) {
      paths.push(k.replace("path_seen:", ""));
    }
    return { content: [{ type: "text", text: JSON.stringify({ paths }, null, 2) }] };
  }
);

server.registerTool(
  "get_file_description",
  {
    description: "Get the accumulated description string for a file path.",
    inputSchema: {
      path: z.string().min(1)
    }
  },
  async ({ path }) => {
    const key = `file_desc:${path}`;
    const desc = await db.get(key).catch(() => "");
    return { content: [{ type: "text", text: JSON.stringify({ path, description: desc }, null, 2) }] };
  }
);

server.registerTool(
  "describe_file",
  {
    description: "Append text to a file path’s description (accumulator).",
    inputSchema: {
      path: z.string().min(1),
      text: z.string().min(1)
    }
  },
  async ({ path, text }) => {
    const key = `file_desc:${path}`;
    const prev = await db.get(key).catch(() => "");
    const next = prev ? `${prev}\n\n${text}` : text;
    await db.put(key, next);
    return { content: [{ type: "text", text: JSON.stringify({ path, ok: true, length: next.length }, null, 2) }] };
  }
);

// ---------- Start ----------
async function main() {
  log("starting…");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("connected");
}

main().catch((e) => {
  console.error("[reconstitute-mcp][fatal]", e);
  process.exit(1);
});
```

---

# Run it

```bash
cd reconstitute-mcp
npm install
npm run build
./build/index.js
```

Environment variables you’ll almost certainly set:

```bash
export OPENCODE_BASE_URL="http://localhost:4096"
export CHROMA_URL="http://chroma-remote:8000"
export OLLAMA_API_BASE="http://localhost:11434/api"
export OLLAMA_EMBED_MODEL="qwen3-embedding:8b"
export OLLAMA_EMBED_NUM_CTX="32768"
```

---

# MCP host config snippet (example)

If your host expects an MCP `command`/`args` stdio server entry (like common MCP host configs), it’s typically of the form shown in MCP docs ([Model Context Protocol][1]):

```json
{
  "mcpServers": {
    "reconstitute": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/reconstitute-mcp/build/index.js"],
      "env": {
        "OPENCODE_BASE_URL": "http://localhost:4096",
        "CHROMA_URL": "http://localhost:8000",
        "OLLAMA_API_BASE": "http://localhost:11434/api",
        "OLLAMA_EMBED_MODEL": "qwen3-embedding:8b",
        "OLLAMA_EMBED_NUM_CTX": "32768"
      }
    }
  }
}
```

---

# What you get (tool surface)

* `index_sessions(limit_sessions)`
* `search_sessions(query, metadata_filter?, result_limit?, threshold?, context_window?)` → returns:

  * `hits[]` with metadata and distance
  * `ollama_messages[]` you can pass directly into an Ollama `/api/chat` call as `messages`
  * `discovered_paths[]` extracted from those messages
* `reconstitute_session(session_id, from_index?, to_index?)` → returns `ollama_messages[]`
* `take_note(title, body)` / `list_notes()` / `search_notes(query, ...)`
* `record_path(path)` / `list_recorded_paths()`
* `get_file_description(path)` / `describe_file(path, text)`

---

## Next step (if you want the full `reconstitute orgs/octave-commons/cephalon-clj` loop)

If you want, I can extend this same MCP server with one more tool:

* `reconstitute(root_path, questions[], max_iters, threshold, result_limit)`

…that runs your **fixed-point expansion loop** (discover paths → ask questions per path → append `describe_file`) and finally emits a “virtual recovered tree” (or writes markdown files).

[1]: https://modelcontextprotocol.io/docs/develop/build-server "Build an MCP server - Model Context Protocol"
[2]: https://opencode.ai/docs/sdk/ "SDK | OpenCode"
[3]: https://docs.ollama.com/api/embed?utm_source=chatgpt.com "Generate embeddings"
[4]: https://docs.ollama.com/capabilities/tool-calling "Tool calling - Ollama"
[5]: https://github.com/orgs/chroma-core/packages/npm/package/chromadb?utm_source=chatgpt.com "Package chromadb"
