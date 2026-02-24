## Event-ish durable indexing: active-queue + inflight leases + slow-scan

Here’s the upgrade you asked for: the indexer becomes **“mostly event-driven”** without needing OpenCode push events:

* **Session list refresh** (cheap): detect which sessions changed via `updatedAt/lastMessageAt` → enqueue those sessions
* **Durable active queue** (LevelDB): “sessions likely to have new messages”
* **Inflight leases** (LevelDB): claim sessions for indexing; if the process dies, leases expire and the session is re-queued
* **Slow-scan** (bounded): occasionally enqueue sessions that haven’t been checked in a while (catches missed updates/new sessions)
* **Incremental cursor** per session: only index new messages

This lets you run the MCP server under PM2/systemd and have indexing **keep up while you work**.

---

# New env vars

```bash
# enable background indexing at boot
RECONSTITUTE_AUTO_INDEX=true

# refresh listSessions() every N ms (detect changed sessions)
INDEX_SESSION_LIST_REFRESH_MS=3000

# index tick interval
INDEX_POLL_MS=2000

# batch sizes and fairness
INDEX_BATCH_SIZE=32
INDEX_MAX_SESSIONS_PER_TICK=10
INDEX_MAX_NEW_MESSAGES_PER_SESSION=200

# slow scan (enqueue a few old/unseen sessions)
INDEX_SLOW_SCAN_INTERVAL_MS=120000
INDEX_SLOW_SCAN_BATCH=3
INDEX_REFRESH_SCAN_LIMIT=200

# fault tolerance: inflight leases + backoff
INDEX_LEASE_MS=300000
INDEX_INFLIGHT_SWEEP_LIMIT=200
INDEX_BACKOFF_BASE_MS=2000
INDEX_BACKOFF_MAX_MS=120000
```

---

# Full file replacement: `src/lib/config.ts`

```ts
import os from "node:os";
import path from "node:path";

export type Config = {
  opencodeBaseUrl: string;

  chromaUrl: string;
  chromaCollectionSessions: string;
  chromaCollectionNotes: string;

  ollamaApiBase: string;
  ollamaEmbedModel: string;
  ollamaEmbedNumCtx: number;
  ollamaEmbedTruncate: boolean;

  dbPath: string;
  cacheTtlSeconds: number;

  // background indexing
  autoIndex: boolean;
  indexPollMs: number;

  // session-list refresh (detect updates cheaply)
  indexSessionListRefreshMs: number;
  indexRefreshScanLimit: number;

  // work limits
  indexBatchSize: number;
  indexMaxSessionsPerTick: number;
  indexMaxNewMessagesPerSession: number;

  // slow scan
  indexSlowScanIntervalMs: number;
  indexSlowScanBatch: number;

  // fault tolerance
  indexLeaseMs: number;
  indexInflightSweepLimit: number;
  indexBackoffBaseMs: number;
  indexBackoffMaxMs: number;
};

function bool(v: string | undefined, d: boolean): boolean {
  if (v == null) return d;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y";
}

function num(v: string | undefined, d: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export function getConfig(): Config {
  const home = os.homedir();
  const root = process.env.RECONSTITUTE_HOME ?? path.join(home, ".reconstitute");

  return {
    opencodeBaseUrl: process.env.OPENCODE_BASE_URL ?? "http://localhost:4096",

    chromaUrl: process.env.CHROMA_URL ?? "http://localhost:8000",
    chromaCollectionSessions:
      process.env.CHROMA_COLLECTION_SESSIONS ?? "opencode_sessions",
    chromaCollectionNotes:
      process.env.CHROMA_COLLECTION_NOTES ?? "reconstitute_notes",

    ollamaApiBase: process.env.OLLAMA_API_BASE ?? "http://localhost:11434/api",
    ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL ?? "qwen3-embedding:8b",
    ollamaEmbedNumCtx: num(process.env.OLLAMA_EMBED_NUM_CTX, 32768),
    ollamaEmbedTruncate: bool(process.env.OLLAMA_EMBED_TRUNCATE, true),

    dbPath: process.env.RECONSTITUTE_DB_PATH ?? path.join(root, "leveldb"),
    cacheTtlSeconds: num(process.env.RECONSTITUTE_CACHE_TTL, 3600),

    autoIndex: bool(process.env.RECONSTITUTE_AUTO_INDEX, false),
    indexPollMs: num(process.env.INDEX_POLL_MS, 2000),

    indexSessionListRefreshMs: num(process.env.INDEX_SESSION_LIST_REFRESH_MS, 3000),
    indexRefreshScanLimit: num(process.env.INDEX_REFRESH_SCAN_LIMIT, 200),

    indexBatchSize: num(process.env.INDEX_BATCH_SIZE, 32),
    indexMaxSessionsPerTick: num(process.env.INDEX_MAX_SESSIONS_PER_TICK, 10),
    indexMaxNewMessagesPerSession: num(process.env.INDEX_MAX_NEW_MESSAGES_PER_SESSION, 200),

    indexSlowScanIntervalMs: num(process.env.INDEX_SLOW_SCAN_INTERVAL_MS, 120000),
    indexSlowScanBatch: num(process.env.INDEX_SLOW_SCAN_BATCH, 3),

    indexLeaseMs: num(process.env.INDEX_LEASE_MS, 300000),
    indexInflightSweepLimit: num(process.env.INDEX_INFLIGHT_SWEEP_LIMIT, 200),
    indexBackoffBaseMs: num(process.env.INDEX_BACKOFF_BASE_MS, 2000),
    indexBackoffMaxMs: num(process.env.INDEX_BACKOFF_MAX_MS, 120000)
  };
}
```

---

# Full file replacement: `src/lib/indexer.ts`

```ts
import type { Db } from "./level.js";
import { getConfig } from "./config.js";
import { embedTexts } from "./ollama.js";
import { upsertToCollection } from "./chroma.js";
import { listSessions, getSessionMessages } from "./opencode.js";
import { log, warn, err } from "./log.js";

type SessionState = {
  cursor: number; // next message_index to process

  // session meta tracking (cheap change detection)
  lastUpdateKey: number; // derived from updatedAt/lastMessageAt/etc
  lastCheckedAt: number; // last time we actually fetched messages
  lastSeenCount?: number;

  // backoff
  failCount: number;
  nextAttemptAt: number; // epoch ms
  lastError?: string;

  // debugging / observability
  lastIndexedAt: number; // epoch ms
};

type InflightLease = {
  session_id: string;
  leasedUntil: number; // epoch ms
  claimedAt: number; // epoch ms
  reason: "active" | "slow_scan" | "changed" | "manual";
};

type IndexerStats = {
  running: boolean;
  pollMs: number;

  lastTickAt: number | null;
  lastTickDurationMs: number | null;
  lastTickSessions: number;
  lastTickMessages: number;

  totalTickSessions: number;
  totalTickMessages: number;

  lastError?: string;

  // internal cache info
  sessionListFetchedAt: number | null;
  sessionListCount: number | null;
};

function kSession(sid: string) {
  return `idx:session:${sid}`;
}
function kStats() {
  return `idx:stats`;
}

// Queue:
// - idx:active_ts:<paddedTs>:<sid> => "1" (sorted by time via key)
// - idx:active_sid:<sid> => active_ts key (so we can replace old entry)
function kActiveTs(ts: number, sid: string) {
  return `idx:active_ts:${padTs(ts)}:${sid}`;
}
function kActiveSid(sid: string) {
  return `idx:active_sid:${sid}`;
}

// Inflight (lease/claim):
// - idx:inflight:<sid> => JSON(InflightLease)
function kInflight(sid: string) {
  return `idx:inflight:${sid}`;
}

function padTs(ts: number): string {
  // 13 digits for ms epoch
  return String(ts).padStart(13, "0");
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

function sessionUpdateKey(session: any): number {
  const fields = [session?.updatedAt, session?.lastMessageAt, session?.modifiedAt, session?.createdAt].filter(Boolean);
  for (const f of fields) {
    const t = Date.parse(String(f));
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

function backoffMs(failCount: number, base: number, max: number): number {
  if (failCount <= 0) return 0;
  const pow = Math.min(16, failCount);
  const ms = base * Math.pow(2, pow - 1);
  return Math.min(max, ms);
}

export class BackgroundIndexer {
  private db: Db;
  private timer: NodeJS.Timeout | null = null;
  private busy = false;

  private stats: IndexerStats;
  private sessionCache: { fetchedAt: number; sessions: any[] } | null = null;

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

      totalTickSessions: 0,
      totalTickMessages: 0,

      sessionListFetchedAt: null,
      sessionListCount: null
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

    // immediate tick
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
    await this.db.del(kInflight(sessionId)).catch(() => {});
    await this.db.del(kActiveSid(sessionId)).catch(() => {});
  }

  async status(): Promise<IndexerStats> {
    await this.loadStats();
    return this.stats;
  }

  private async getSessionState(sessionId: string): Promise<SessionState> {
    const st = await getJson<SessionState>(this.db, kSession(sessionId));
    return (
      st ?? {
        cursor: 0,
        lastUpdateKey: 0,
        lastCheckedAt: 0,
        failCount: 0,
        nextAttemptAt: 0,
        lastIndexedAt: 0
      }
    );
  }

  private async setSessionState(sessionId: string, st: SessionState): Promise<void> {
    await putJson(this.db, kSession(sessionId), st);
  }

  private async enqueueActive(sessionId: string): Promise<void> {
    const now = Date.now();
    const sidKey = kActiveSid(sessionId);

    const oldTsKey = await this.db.get(sidKey).catch(() => null as any);
    if (oldTsKey) {
      // remove old timestamp entry
      await this.db.del(oldTsKey).catch(() => {});
    }

    const tsKey = kActiveTs(now, sessionId);
    await this.db.put(tsKey, "1");
    await this.db.put(sidKey, tsKey);
  }

  private async claimInflight(sessionId: string, reason: InflightLease["reason"]): Promise<void> {
    const cfg = getConfig();
    const now = Date.now();
    const lease: InflightLease = {
      session_id: sessionId,
      claimedAt: now,
      leasedUntil: now + cfg.indexLeaseMs,
      reason
    };
    await putJson(this.db, kInflight(sessionId), lease);
  }

  private async clearInflight(sessionId: string): Promise<void> {
    await this.db.del(kInflight(sessionId)).catch(() => {});
  }

  private async getInflight(sessionId: string): Promise<InflightLease | null> {
    return await getJson<InflightLease>(this.db, kInflight(sessionId));
  }

  private async sweepInflight(): Promise<number> {
    const cfg = getConfig();
    const now = Date.now();
    let swept = 0;

    // iterate inflight keys, reclaim expired leases
    for await (const [k, v] of this.db.iterator({
      gte: "idx:inflight:",
      lt: "idx:inflight;",
      limit: cfg.indexInflightSweepLimit
    })) {
      let lease: InflightLease | null = null;
      try {
        lease = JSON.parse(String(v)) as InflightLease;
      } catch {
        // corrupt inflight record: delete it
        await this.db.del(k).catch(() => {});
        continue;
      }

      if (!lease) continue;

      if (lease.leasedUntil <= now) {
        const sid = lease.session_id;
        await this.db.del(k).catch(() => {});
        await this.enqueueActive(sid);
        swept++;
      }
    }

    return swept;
  }

  private async refreshSessionList(): Promise<any[]> {
    const cfg = getConfig();
    const now = Date.now();

    if (this.sessionCache && now - this.sessionCache.fetchedAt < cfg.indexSessionListRefreshMs) {
      return this.sessionCache.sessions;
    }

    const sessions = await listSessions();

    // sort “most recently updated” first
    const ordered = sessions.slice().sort((a, b) => sessionUpdateKey(b) - sessionUpdateKey(a));

    this.sessionCache = { fetchedAt: now, sessions: ordered };
    this.stats.sessionListFetchedAt = now;
    this.stats.sessionListCount = ordered.length;

    return ordered;
  }

  private async observeSessionsAndEnqueue(sessions: any[]): Promise<{ enqueuedChanged: number; enqueuedSlow: number; scanned: number }> {
    const cfg = getConfig();
    const now = Date.now();

    let enqueuedChanged = 0;
    let enqueuedSlow = 0;

    const scan = sessions.slice(0, Math.max(1, cfg.indexRefreshScanLimit));
    let slowBudget = Math.max(0, cfg.indexSlowScanBatch);

    for (const s of scan) {
      const sid = String(s?.id ?? "");
      if (!sid) continue;

      const updateKey = sessionUpdateKey(s);
      const st = await this.getSessionState(sid);

      // new session (no updateKey seen) or changed session
      const changed = updateKey > (st.lastUpdateKey ?? 0);

      if (changed) {
        st.lastUpdateKey = updateKey;
        // If it’s changed, enqueue for immediate indexing
        await this.enqueueActive(sid);
        enqueuedChanged++;
      } else if (slowBudget > 0) {
        // slow scan: enqueue sessions that haven't been checked recently
        if (now - (st.lastCheckedAt ?? 0) > cfg.indexSlowScanIntervalMs) {
          await this.enqueueActive(sid);
          enqueuedSlow++;
          slowBudget--;
        }
      }

      await this.setSessionState(sid, st);
    }

    return { enqueuedChanged, enqueuedSlow, scanned: scan.length };
  }

  private async claimNextSessions(maxSessions: number): Promise<string[]> {
    const cfg = getConfig();
    const now = Date.now();
    const wanted = Math.max(1, Math.floor(maxSessions));

    const picked: string[] = [];

    // walk newest active entries first
    for await (const [k] of this.db.iterator({
      gte: "idx:active_ts:",
      lt: "idx:active_ts;",
      reverse: true
    })) {
      if (picked.length >= wanted) break;

      // key format: idx:active_ts:<ts>:<sid>
      const parts = String(k).split(":");
      const sid = parts.slice(3).join(":").split(":").join(":"); // defensive; but sid won't include ':'
      const sessionId = String(k).split(":").slice(3).join(":"); // too defensive; correct below

      // safer parse:
      // idx:active_ts | <ts> | <sid> (split by ':', but sid might include ':' unlikely; we assume no ':')
      const segs = String(k).split(":");
      const sid2 = segs[3]; // idx, active_ts, <ts>, <sid>
      const sidFinal = sid2;

      if (!sidFinal) continue;

      // skip if currently inflight (lease not expired)
      const inflight = await this.getInflight(sidFinal);
      if (inflight && inflight.leasedUntil > now) continue;

      // skip if session is in backoff window
      const st = await this.getSessionState(sidFinal);
      if (st.nextAttemptAt && now < st.nextAttemptAt) continue;

      // claim: create inflight lease and remove active queue entry
      await this.claimInflight(sidFinal, "active");

      // remove active_ts key and sid pointer (only if it points to this key)
      await this.db.del(k).catch(() => {});
      const sidPtrKey = kActiveSid(sidFinal);
      const ptr = await this.db.get(sidPtrKey).catch(() => null as any);
      if (ptr === k) {
        await this.db.del(sidPtrKey).catch(() => {});
      }

      picked.push(sidFinal);
    }

    // If not enough sessions were in the active queue, we just return fewer.
    return picked;
  }

  private async processSession(sessionId: string): Promise<{ indexed: number; hadNew: boolean }> {
    const cfg = getConfig();
    const now = Date.now();
    const st = await this.getSessionState(sessionId);

    // fetch messages; only index the new tail
    const msgs = await getSessionMessages(sessionId);
    st.lastSeenCount = msgs.length;

    const cursor = Math.max(0, st.cursor ?? 0);
    if (msgs.length <= cursor) {
      st.lastCheckedAt = now;
      st.failCount = 0;
      st.nextAttemptAt = 0;
      st.lastError = undefined;
      await this.setSessionState(sessionId, st);
      return { indexed: 0, hadNew: false };
    }

    const maxNew = Math.max(1, cfg.indexMaxNewMessagesPerSession);
    const slice = msgs.slice(cursor, Math.min(msgs.length, cursor + maxNew));
    const startIndex = cursor;

    const docs: string[] = [];
    const ids: string[] = [];
    const metas: Record<string, any>[] = [];

    for (let i = 0; i < slice.length; i++) {
      const msgIndex = startIndex + i;
      const m = slice[i];
      const role = String(m?.info?.role ?? m?.info?.type ?? "assistant");
      const createdAt = m?.info?.createdAt ?? m?.info?.time ?? null;

      const partsJson = JSON.stringify(m?.parts ?? []);
      const doc = `session_id=${sessionId}\nmessage_index=${msgIndex}\nrole=${role}\ncreated_at=${createdAt ?? ""}\n\n${partsJson}`;

      docs.push(doc);
      ids.push(`${sessionId}:${msgIndex}`);
      metas.push({
        session_id: sessionId,
        message_index: msgIndex,
        role,
        created_at: createdAt ?? null
      });
    }

    // embed + upsert in durable batches
    const batchSize = Math.max(1, Math.floor(cfg.indexBatchSize));
    let indexed = 0;

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

      indexed += bDocs.length;

      // advance cursor only after successful write
      st.cursor = startIndex + off + bDocs.length;
      st.lastIndexedAt = Date.now();
      await this.setSessionState(sessionId, st);
    }

    st.lastCheckedAt = now;
    st.failCount = 0;
    st.nextAttemptAt = 0;
    st.lastError = undefined;
    await this.setSessionState(sessionId, st);

    // if there are still more messages beyond the chunk we processed, re-enqueue
    if (msgs.length > st.cursor) {
      await this.enqueueActive(sessionId);
    }

    return { indexed, hadNew: true };
  }

  async tick(maxSessions?: number): Promise<IndexerStats> {
    if (this.busy) return this.stats;
    this.busy = true;

    const cfg = getConfig();
    const start = Date.now();
    this.stats.lastTickAt = start;
    this.stats.lastTickSessions = 0;
    this.stats.lastTickMessages = 0;
    this.stats.lastError = undefined;

    try {
      // 1) reclaim expired inflight sessions (crash-safe)
      const swept = await this.sweepInflight();
      if (swept > 0) log(`reclaimed expired inflight leases: ${swept}`);

      // 2) refresh session list (cheap) and enqueue changed/unseen/slow-scan sessions
      const sessions = await this.refreshSessionList();
      const obs = await this.observeSessionsAndEnqueue(sessions);
      // keep logs low-noise; comment out if too chatty
      // log(`observe: scanned=${obs.scanned} enqChanged=${obs.enqueuedChanged} enqSlow=${obs.enqueuedSlow}`);

      // 3) claim from active queue
      const maxPerTick = Math.max(1, Math.floor(maxSessions ?? cfg.indexMaxSessionsPerTick));
      const toProcess = await this.claimNextSessions(maxPerTick);

      for (const sid of toProcess) {
        // confirm lease exists; if missing, create (shouldn't happen)
        const inflight = await this.getInflight(sid);
        if (!inflight) await this.claimInflight(sid, "active");

        try {
          const st = await this.getSessionState(sid);
          const now = Date.now();

          // backoff guard (should already be filtered, but keep safe)
          if (st.nextAttemptAt && now < st.nextAttemptAt) {
            // extend lease to nextAttemptAt so it gets reclaimed then
            const bo = st.nextAttemptAt - now;
            await putJson(this.db, kInflight(sid), {
              session_id: sid,
              claimedAt: now,
              leasedUntil: st.nextAttemptAt,
              reason: "active"
            } satisfies InflightLease);
            continue;
          }

          const res = await this.processSession(sid);

          this.stats.lastTickSessions += 1;
          this.stats.lastTickMessages += res.indexed;
          this.stats.totalTickSessions += 1;
          this.stats.totalTickMessages += res.indexed;

          await this.clearInflight(sid);

          log(`tick indexed sid=${sid} newDocs=${res.indexed}`);
        } catch (e: any) {
          const msg = String(e?.message ?? e ?? "unknown error");
          const st = await this.getSessionState(sid);
          st.failCount = (st.failCount ?? 0) + 1;
          st.lastError = msg;

          const bo = backoffMs(st.failCount, cfg.indexBackoffBaseMs, cfg.indexBackoffMaxMs);
          st.nextAttemptAt = Date.now() + bo;
          await this.setSessionState(sid, st);

          // keep inflight lease until backoff expires; then sweepInflight re-queues it
          const now = Date.now();
          const lease: InflightLease = {
            session_id: sid,
            claimedAt: now,
            leasedUntil: st.nextAttemptAt,
            reason: "active"
          };
          await putJson(this.db, kInflight(sid), lease);

          warn(`session failed sid=${sid} failCount=${st.failCount} backoffMs=${bo} err=${msg}`);
        }
      }
    } catch (e: any) {
      this.stats.lastError = String(e?.message ?? e ?? "unknown error");
      err("tick fatal:", this.stats.lastError);
    } finally {
      this.stats.lastTickDurationMs = Date.now() - start;
      await this.saveStats();
      this.busy = false;
    }

    return this.stats;
  }

  // Manual push: useful if your shell command wants to “hint” a session
  async enqueueSession(sessionId: string): Promise<void> {
    await this.enqueueActive(sessionId);
  }
}
```

> Notes:
>
> * **Crash safety:** claimed sessions remain in `idx:inflight:*`. On restart, `sweepInflight()` re-queues anything whose lease expired.
> * **Backoff safety:** on failure we set the inflight lease to expire at `nextAttemptAt`, so the session is re-queued after backoff even if no further updates happen.

---

# Full file replacement: `src/index.ts` (adds one MCP tool to hint sessions)

This keeps your earlier tools (search/reconstitute/etc.) and adds `indexer_enqueue_session`.

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
  version: "0.3.0"
});

/* ---------------------------
   Search + reconstitution
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
      "Fetch a full OpenCode session and convert it into Ollama /api/chat compatible messages[].",
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
   Indexer controls
---------------------------- */

server.registerTool(
  "indexer_start",
  {
    description: "Start the durable background indexer.",
    inputSchema: { poll_ms: z.number().int().min(250).max(600000).optional() }
  },
  async ({ poll_ms }) => {
    await indexer.start(poll_ms);
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, status: await indexer.status() }, null, 2) }] };
  }
);

server.registerTool(
  "indexer_stop",
  {
    description: "Stop the background indexer.",
    inputSchema: {}
  },
  async () => {
    await indexer.stop();
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, status: await indexer.status() }, null, 2) }] };
  }
);

server.registerTool(
  "indexer_status",
  {
    description: "Get background indexer status and recent tick stats.",
    inputSchema: {}
  },
  async () => {
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, status: await indexer.status() }, null, 2) }] };
  }
);

server.registerTool(
  "indexer_tick",
  {
    description: "Run a single indexing tick.",
    inputSchema: { max_sessions: z.number().int().min(1).max(1000).optional() }
  },
  async ({ max_sessions }) => {
    const st = await indexer.tick(max_sessions);
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, status: st }, null, 2) }] };
  }
);

server.registerTool(
  "indexer_enqueue_session",
  {
    description: "Hint the indexer that a particular session should be indexed soon.",
    inputSchema: { session_id: z.string().min(1) }
  },
  async ({ session_id }) => {
    await indexer.enqueueSession(session_id);
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, session_id }, null, 2) }] };
  }
);

/* ---------------------------
   One-shot full index (still useful)
---------------------------- */

server.registerTool(
  "index_sessions",
  {
    description:
      "Index many sessions in one shot. Restart-safe (stable ids + Chroma upsert).",
    inputSchema: { limit_sessions: z.number().int().min(1).max(100000).default(100000) }
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
        metas.push({ session_id: sid, message_index: i, role });
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

    return {
      content: [{ type: "text", text: JSON.stringify({ indexed_sessions: take.length, total_msgs: totalMsgs, total_upserted: totalUpserted }, null, 2) }]
    };
  }
);

/* ---------------------------
   Start
---------------------------- */

async function main() {
  log("starting…");
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

# Why this behaves the way you want

### “Sessions are getting indexed as they are running”

* The indexer detects session changes via `listSessions()` metadata (cheap).
* Changed sessions get queued immediately.
* Per-session cursor ensures we only embed/index the new tail.

### “Stop/start without losing progress”

* Cursor, backoff, inflight leases, and queue pointers are all persisted in LevelDB.
* Restart resumes automatically.

### “Kept running in the background while work is happening”

Run the MCP server under PM2 (example):

```bash
pm2 start --name reconstitute-mcp -- node /abs/path/reconstitute-mcp/build/index.js
pm2 logs reconstitute-mcp
```

---

# Next “continue” upgrade (recommended)

If you say continue again, I’ll add **write-ahead journaling for batches** so even if you crash *mid-batch*, you don’t redo embedding work:

* `idx:wal:<sid>:<msgIndex>` stores the embedding vector (or a hash + serialized float array)
* after successful upsert, WAL entries are deleted

That makes indexing cheaper under intermittent failures, especially if Ollama embedding is the bottleneck.
