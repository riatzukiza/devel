## Durable + fault-tolerant background indexing for the MCP server

This upgrades the MCP server so indexing can:

* **run continuously** in the background (polling OpenCode)
* be **stopped/started** without losing progress (cursor state persisted in LevelDB)
* be **fault tolerant** (per-session backoff + idempotent Chroma upserts)
* index **incrementally** (only new messages since last cursor)
* expose **control + status tools** over MCP

### What changes

* New `BackgroundIndexer` that polls OpenCode sessions and upserts new message docs into Chroma.
* Per-session durable cursor stored in LevelDB: `idx:session:<id>` (JSON).
* New MCP tools:

  * `indexer_start(poll_ms?)`
  * `indexer_stop()`
  * `indexer_status()`
  * `indexer_tick(max_sessions?)` (one-shot work cycle)
  * `indexer_reset_session(session_id)` (rare recovery)
* Chroma write uses **upsert** (idempotent), safe for restarts.

---

## New env vars

Add these (or set defaults):

```bash
# background indexing
RECONSTITUTE_AUTO_INDEX=true
INDEX_POLL_MS=5000
INDEX_BATCH_SIZE=32
INDEX_MAX_SESSIONS_PER_TICK=10
INDEX_BACKOFF_BASE_MS=2000
INDEX_BACKOFF_MAX_MS=120000
```

---

## Full file replacements / additions

### 1) `package.json` (adds `chromadb` dependency)

```json
{
  "name": "reconstitute-mcp",
  "version": "0.2.0",
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
    "chromadb": "^2.2.0",
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

---

### 2) `src/lib/config.ts` (adds indexer config)

```ts
import os from "node:os";
import path from "node:path";

export type Config = {
  opencodeBaseUrl: string;

  chromaUrl: string;
  chromaCollectionSessions: string;
  chromaCollectionNotes: string;

  ollamaApiBase: string; // http://localhost:11434/api
  ollamaEmbedModel: string; // qwen3-embedding:8b
  ollamaEmbedNumCtx: number; // 32768
  ollamaEmbedTruncate: boolean;

  dbPath: string; // leveldb root
  cacheTtlSeconds: number;

  // background indexing
  autoIndex: boolean;
  indexPollMs: number;
  indexBatchSize: number;
  indexMaxSessionsPerTick: number;
  indexBackoffBaseMs: number;
  indexBackoffMaxMs: number;
};

function bool(v: string | undefined, d: boolean): boolean {
  if (v == null) return d;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y";
}

export function getConfig(): Config {
  const home = os.homedir();
  const root = process.env.RECONSTITUTE_HOME ?? path.join(home, ".reconstitute");

  return {
    opencodeBaseUrl: process.env.OPENCODE_BASE_URL ?? "http://localhost:4096",

    chromaUrl: process.env.CHROMA_URL ?? "http://localhost:8000",
    chromaCollectionSessions: process.env.CHROMA_COLLECTION_SESSIONS ?? "opencode_sessions",
    chromaCollectionNotes: process.env.CHROMA_COLLECTION_NOTES ?? "reconstitute_notes",

    ollamaApiBase: process.env.OLLAMA_API_BASE ?? "http://localhost:11434/api",
    ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL ?? "qwen3-embedding:8b",
    ollamaEmbedNumCtx: Number(process.env.OLLAMA_EMBED_NUM_CTX ?? 32768),
    ollamaEmbedTruncate: bool(process.env.OLLAMA_EMBED_TRUNCATE, true),

    dbPath: process.env.RECONSTITUTE_DB_PATH ?? path.join(root, "leveldb"),
    cacheTtlSeconds: Number(process.env.RECONSTITUTE_CACHE_TTL ?? 3600),

    autoIndex: bool(process.env.RECONSTITUTE_AUTO_INDEX, false),
    indexPollMs: Number(process.env.INDEX_POLL_MS ?? 5000),
    indexBatchSize: Number(process.env.INDEX_BATCH_SIZE ?? 32),
    indexMaxSessionsPerTick: Number(process.env.INDEX_MAX_SESSIONS_PER_TICK ?? 10),
    indexBackoffBaseMs: Number(process.env.INDEX_BACKOFF_BASE_MS ?? 2000),
    indexBackoffMaxMs: Number(process.env.INDEX_BACKOFF_MAX_MS ?? 120000)
  };
}
```

---

### 3) `src/lib/chroma.ts` (adds `upsertToCollection`)

```ts
import { getConfig } from "./config.js";
import { err } from "./log.js";

type ChromaCollection = any;
type ChromaClient = any;

async function loadChroma(): Promise<{ ChromaClient: any }> {
  const mod: any = await import("chromadb");
  const ChromaClientCtor = mod.ChromaClient ?? mod.default?.ChromaClient ?? mod.default;
  if (!ChromaClientCtor) throw new Error("Failed to resolve ChromaClient from chromadb module");
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
  return new ChromaClient({ path: cfg.chromaUrl });
}

export async function getOrCreateCollection(name: string): Promise<ChromaCollection> {
  const client = await getChromaClient();
  try {
    return await client.getCollection({ name });
  } catch {
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

export async function upsertToCollection(opts: {
  collectionName: string;
  ids: string[];
  documents: string[];
  metadatas: Record<string, any>[];
  embeddings: number[][];
}): Promise<void> {
  const col = await getOrCreateCollection(opts.collectionName);

  // Prefer upsert, fallback to add (older client builds)
  try {
    if (typeof col.upsert === "function") {
      await col.upsert({
        ids: opts.ids,
        documents: opts.documents,
        metadatas: opts.metadatas,
        embeddings: opts.embeddings
      });
      return;
    }
  } catch (e) {
    err("Chroma upsert failed, will try add:", e);
  }

  // add will fail if IDs exist; we try add only as a fallback path
  await col.add({
    ids: opts.ids,
    documents: opts.documents,
    metadatas: opts.metadatas,
    embeddings: opts.embeddings
  });
}
```

---

### 4) `src/lib/indexer.ts` (NEW: durable background indexer)

```ts
import type { Db } from "./level.js";
import { getConfig } from "./config.js";
import { embedTexts } from "./ollama.js";
import { upsertToCollection } from "./chroma.js";
import { listSessions, getSessionMessages } from "./opencode.js";
import { log, warn, err } from "./log.js";

type SessionState = {
  cursor: number; // next message_index to process
  failCount: number;
  nextAttemptAt: number; // epoch ms
  lastIndexedAt: number; // epoch ms
  lastError?: string;
  lastSeenCount?: number;
};

type IndexerStats = {
  running: boolean;
  pollMs: number;
  lastTickAt: number | null;
  lastTickDurationMs: number | null;
  lastTickSessions: number;
  lastTickMessages: number;
  totalSessions: number;
  totalMessages: number;
  lastError?: string;
};

function kSession(sid: string) {
  return `idx:session:${sid}`;
}
function kStats() {
  return `idx:stats`;
}

async function getJson<T>(db: Db, key: string): Promise<T | null> {
  try {
    const raw = await db.get(key);
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function putJson<T>(db: Db, key: string, value: T): Promise<void> {
  await db.put(key, JSON.stringify(value));
}

function sortKey(session: any): number {
  const candidates = [
    session?.updatedAt,
    session?.lastMessageAt,
    session?.modifiedAt,
    session?.createdAt
  ].filter(Boolean);

  for (const c of candidates) {
    const t = Date.parse(String(c));
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

function backoffMs(failCount: number, base: number, max: number): number {
  // 0 -> 0ms (no backoff)
  if (failCount <= 0) return 0;
  const pow = Math.min(16, failCount); // clamp exponent
  const ms = base * Math.pow(2, pow - 1);
  return Math.min(max, ms);
}

export class BackgroundIndexer {
  private db: Db;
  private timer: NodeJS.Timeout | null = null;
  private busy = false;

  private stats: IndexerStats;

  constructor(db: Db) {
    this.db = db;
    const cfg = getConfig();
    this.stats = {
      running: false,
      pollMs: cfg.indexPollMs,
      lastTickAt: null,
      lastTickDurationMs: null,
      lastTickSessions: 0,
      lastTickMessages: 0,
      totalSessions: 0,
      totalMessages: 0
    };
  }

  async loadStats(): Promise<IndexerStats> {
    const saved = await getJson<IndexerStats>(this.db, kStats());
    if (saved) this.stats = { ...this.stats, ...saved };
    return this.stats;
  }

  async saveStats(): Promise<void> {
    await putJson(this.db, kStats(), this.stats);
  }

  isRunning(): boolean {
    return this.timer != null;
  }

  async start(pollMs?: number): Promise<void> {
    if (this.timer) return;
    await this.loadStats();

    const cfg = getConfig();
    const ms = pollMs ?? this.stats.pollMs ?? cfg.indexPollMs;
    this.stats.pollMs = ms;
    this.stats.running = true;
    await this.saveStats();

    // fire once immediately
    void this.tick(cfg.indexMaxSessionsPerTick).catch((e) => err("index tick error:", e));

    this.timer = setInterval(() => {
      void this.tick(cfg.indexMaxSessionsPerTick).catch((e) => err("index tick error:", e));
    }, ms);

    log(`indexer started pollMs=${ms}`);
  }

  async stop(): Promise<void> {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;

    this.stats.running = false;
    await this.saveStats();

    log("indexer stopped");
  }

  async resetSession(sessionId: string): Promise<void> {
    await this.db.del(kSession(sessionId)).catch(() => {});
  }

  async getSessionState(sessionId: string): Promise<SessionState> {
    const cfg = getConfig();
    const st = await getJson<SessionState>(this.db, kSession(sessionId));
    return (
      st ?? {
        cursor: 0,
        failCount: 0,
        nextAttemptAt: 0,
        lastIndexedAt: 0,
        lastSeenCount: undefined
      }
    );
  }

  async setSessionState(sessionId: string, st: SessionState): Promise<void> {
    await putJson(this.db, kSession(sessionId), st);
  }

  async status(): Promise<IndexerStats> {
    await this.loadStats();
    return this.stats;
  }

  async tick(maxSessions?: number): Promise<IndexerStats> {
    if (this.busy) return this.stats;
    this.busy = true;

    const cfg = getConfig();
    const maxPerTick = Math.max(1, Math.floor(maxSessions ?? cfg.indexMaxSessionsPerTick));
    const start = Date.now();

    this.stats.lastTickAt = start;
    this.stats.lastTickSessions = 0;
    this.stats.lastTickMessages = 0;
    this.stats.lastError = undefined;

    try {
      const sessions = await listSessions();
      // process “most recently updated” first (best effort)
      const ordered = sessions
        .slice()
        .sort((a, b) => sortKey(b) - sortKey(a))
        .slice(0, maxPerTick);

      for (const s of ordered) {
        const sid = String(s?.id ?? "");
        if (!sid) continue;

        const st = await this.getSessionState(sid);
        const now = Date.now();
        if (st.nextAttemptAt && now < st.nextAttemptAt) continue;

        try {
          const msgs = await getSessionMessages(sid);
          const total = msgs.length;

          st.lastSeenCount = total;
          if (total <= st.cursor) {
            // nothing new
            st.failCount = 0;
            st.nextAttemptAt = 0;
            await this.setSessionState(sid, st);
            continue;
          }

          const slice = msgs.slice(st.cursor);
          const startIndex = st.cursor;
          const endIndex = total - 1;

          // build docs
          const docs: string[] = [];
          const ids: string[] = [];
          const metas: Record<string, any>[] = [];

          for (let i = 0; i < slice.length; i++) {
            const msgIndex = startIndex + i;
            const m = slice[i];
            const role = String(m?.info?.role ?? m?.info?.type ?? "assistant");
            const createdAt = m?.info?.createdAt ?? m?.info?.time ?? null;

            // index doc includes parts; this is what your reconstitute loop will retrieve
            const partsJson = JSON.stringify(m?.parts ?? []);
            const doc = `session_id=${sid}\nmessage_index=${msgIndex}\nrole=${role}\ncreated_at=${createdAt ?? ""}\n\n${partsJson}`;

            docs.push(doc);
            ids.push(`${sid}:${msgIndex}`);
            metas.push({
              session_id: sid,
              message_index: msgIndex,
              role,
              created_at: createdAt ?? null,
              session_title: s?.title ?? s?.name ?? null,
              project: s?.project ?? null
            });
          }

          // embed+upsert in durable batches; advance cursor after each successful batch
          const batchSize = Math.max(1, Math.floor(cfg.indexBatchSize));
          for (let off = 0; off < docs.length; off += batchSize) {
            const bDocs = docs.slice(off, off + batchSize);
            const bIds = ids.slice(off, off + batchSize);
            const bMetas = metas.slice(off, off + batchSize);

            const embeddings = await embedTexts(bDocs);

            await upsertToCollection({
              collectionName: cfg.chromaCollectionSessions,
              ids: bIds,
              documents: bDocs,
              metadatas: bMetas,
              embeddings
            });

            // advance cursor after successful write
            st.cursor = startIndex + off + bDocs.length;
            st.lastIndexedAt = Date.now();
            st.failCount = 0;
            st.nextAttemptAt = 0;
            st.lastError = undefined;
            await this.setSessionState(sid, st);

            this.stats.lastTickMessages += bDocs.length;
            this.stats.totalMessages += bDocs.length;
          }

          this.stats.lastTickSessions += 1;
          this.stats.totalSessions += 1;

          log(`indexed session=${sid} new_msgs=${slice.length} range=[${startIndex}..${endIndex}] cursor=${st.cursor}`);
        } catch (e: any) {
          const msg = String(e?.message ?? e ?? "unknown error");
          st.failCount = (st.failCount ?? 0) + 1;
          st.lastError = msg;

          const bo = backoffMs(st.failCount, cfg.indexBackoffBaseMs, cfg.indexBackoffMaxMs);
          st.nextAttemptAt = Date.now() + bo;

          await this.setSessionState(sid, st);

          warn(`index session failed sid=${sid} failCount=${st.failCount} backoffMs=${bo} err=${msg}`);
        }
      }
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? "unknown error");
      this.stats.lastError = msg;
      err("index tick fatal:", msg);
    } finally {
      const dur = Date.now() - start;
      this.stats.lastTickDurationMs = dur;
      await this.saveStats();
      this.busy = false;
    }

    return this.stats;
  }
}
```

---

### 5) `src/index.ts` (wire in background indexer + MCP tools)

This is a full replacement of the server entrypoint. It keeps your existing tools and adds the indexer controls.

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { getConfig } from "./lib/config.js";
import { openDb } from "./lib/level.js";
import { ttlGet, ttlSet, cacheKey } from "./lib/ttl.js";
import { embedTexts } from "./lib/ollama.js";
import { queryCollection, upsertToCollection } from "./lib/chroma.js";
import { getSessionMessages, listSessions } from "./lib/opencode.js";
import { openCodeToOllamaMessages } from "./lib/convert.js";
import { extractPaths } from "./lib/paths.js";
import { log } from "./lib/log.js";
import { BackgroundIndexer } from "./lib/indexer.js";

const cfg = getConfig();
const db = openDb();
const indexer = new BackgroundIndexer(db);

const server = new McpServer({
  name: "reconstitute",
  version: "0.2.0"
});

/* ---------------------------
   Search + reconstitution tools
---------------------------- */

server.registerTool(
  "search_sessions",
  {
    description:
      "Semantic search over indexed OpenCode sessions in Chroma. Returns hits plus an Ollama /api/chat compatible messages[] context.",
    inputSchema: {
      query: z.string().min(1),
      metadata_filter: z.record(z.any()).optional(),
      result_limit: z.number().int().min(1).max(200).default(25),
      threshold: z.number().min(0).max(10).default(1.0),
      context_window: z.number().int().min(0).max(50).default(6)
    }
  },
  async (input) => {
    const { query, metadata_filter, result_limit, threshold, context_window } = input;

    const ck = "search_sessions:" + cacheKey({ query, metadata_filter, result_limit, threshold, context_window });
    const cached = await ttlGet<any>(db, ck);
    if (cached) return { content: [{ type: "text", text: JSON.stringify(cached, null, 2) }] };

    const [qEmb] = await embedTexts([query]);
    const hits = await queryCollection({
      collectionName: cfg.chromaCollectionSessions,
      queryEmbedding: qEmb,
      nResults: result_limit,
      where: metadata_filter
    });

    const filtered = hits.filter((h) => (h.distance ?? 999) <= threshold);

    // Expand around hit message indices by fetching messages from OpenCode
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

    // Merge ranges per session
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
    if (cached) return { content: [{ type: "text", text: JSON.stringify(cached, null, 2) }] };

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

/* ---------------------------
   Durable background indexer controls (NEW)
---------------------------- */

server.registerTool(
  "indexer_start",
  {
    description:
      "Start the durable background indexer. It will poll OpenCode and index new messages into Chroma incrementally.",
    inputSchema: {
      poll_ms: z.number().int().min(250).max(600000).optional()
    }
  },
  async ({ poll_ms }) => {
    await indexer.start(poll_ms);
    const st = await indexer.status();
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, status: st }, null, 2) }] };
  }
);

server.registerTool(
  "indexer_stop",
  {
    description: "Stop the background indexer (state remains in LevelDB; safe to resume).",
    inputSchema: {}
  },
  async () => {
    await indexer.stop();
    const st = await indexer.status();
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, status: st }, null, 2) }] };
  }
);

server.registerTool(
  "indexer_status",
  {
    description: "Get background indexer status and recent tick stats.",
    inputSchema: {}
  },
  async () => {
    const st = await indexer.status();
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, status: st }, null, 2) }] };
  }
);

server.registerTool(
  "indexer_tick",
  {
    description:
      "Run a single indexing tick (useful for cron-like manual control). Durable and idempotent.",
    inputSchema: {
      max_sessions: z.number().int().min(1).max(1000).optional()
    }
  },
  async ({ max_sessions }) => {
    const st = await indexer.tick(max_sessions);
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, status: st }, null, 2) }] };
  }
);

server.registerTool(
  "indexer_reset_session",
  {
    description:
      "Reset durable cursor for a specific session (forces reindex from message_index=0 on next tick).",
    inputSchema: {
      session_id: z.string().min(1)
    }
  },
  async ({ session_id }) => {
    await indexer.resetSession(session_id);
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, session_id }, null, 2) }] };
  }
);

/* ---------------------------
   One-shot full index (kept for convenience)
   This now uses upsert so it is restart-safe.
---------------------------- */

server.registerTool(
  "index_sessions",
  {
    description:
      "Index many OpenCode sessions in one shot. Safe to run repeatedly (ids are stable; uses Chroma upsert).",
    inputSchema: {
      limit_sessions: z.number().int().min(1).max(100000).default(100000)
    }
  },
  async ({ limit_sessions }) => {
    const sessions = await listSessions();
    const take = sessions.slice(0, limit_sessions);

    let totalMsgs = 0;
    let totalUpserted = 0;

    for (const s of take) {
      const sid = String(s?.id ?? "");
      if (!sid) continue;

      const msgs = await getSessionMessages(sid);
      totalMsgs += msgs.length;

      const docs: string[] = [];
      const ids: string[] = [];
      const metas: Record<string, any>[] = [];

      for (let i = 0; i < msgs.length; i++) {
        const oc = msgs[i];
        const role = (oc?.info?.role ?? oc?.info?.type ?? "assistant").toString();
        const partsJson = JSON.stringify(oc?.parts ?? []);
        const doc = `session_id=${sid}\nmessage_index=${i}\nrole=${role}\n\n${partsJson}`;

        docs.push(doc);
        ids.push(`${sid}:${i}`);
        metas.push({
          session_id: sid,
          message_index: i,
          role,
          session_title: s?.title ?? s?.name ?? null,
          project: s?.project ?? null
        });
      }

      const embeddings = await embedTexts(docs);

      await upsertToCollection({
        collectionName: cfg.chromaCollectionSessions,
        ids,
        documents: docs,
        metadatas: metas,
        embeddings
      });

      totalUpserted += ids.length;
    }

    const result = { indexed_sessions: take.length, total_msgs: totalMsgs, total_upserted: totalUpserted };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

/* ---------------------------
   Start MCP server
---------------------------- */

async function main() {
  log("starting…");

  // Load persisted stats and optionally auto-start background indexing
  await indexer.loadStats();
  if (cfg.autoIndex) {
    await indexer.start(cfg.indexPollMs);
  }

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

## How this achieves “durable + fault tolerant”

### Durability

* Each session has a persisted cursor:

  * `cursor` = next `message_index` to process
* Cursor advances **only after successful Chroma upsert** for a batch.
* On restart, the indexer resumes from the stored cursor.

### Fault tolerance

* Per-session failure increments `failCount` and schedules a `nextAttemptAt` using exponential backoff.
* Other sessions continue indexing even if one is failing.
* Upserts are idempotent; reprocessing a batch after a crash is safe.

### Background operation

* `RECONSTITUTE_AUTO_INDEX=true` starts the loop at server boot.
* Or call `indexer_start` from your host/agent.
* Indexing runs on an interval and avoids overlapping ticks (`busy` guard).

---

## Recommended operational pattern

* Run MCP server continuously.
* Set `RECONSTITUTE_AUTO_INDEX=true`.
* Keep poll interval modest:

  * `INDEX_POLL_MS=2000..10000`
* If OpenCode has lots of sessions, cap per tick:

  * `INDEX_MAX_SESSIONS_PER_TICK=5..25`

