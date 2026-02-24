## Write-ahead log (WAL) so indexing survives crashes *mid-batch* without re-embedding

This upgrade makes the indexer **durable at the batch level**:

* Before upserting a batch to Chroma, we **persist a WAL record** in LevelDB containing:

  * ids, documents, metadatas
  * embeddings (stored compactly as base64-encoded float32)
  * `cursor_after` (so we can advance the session cursor during recovery)
* On startup and every tick, the indexer **replays WAL**:

  * re-upserts batches (idempotent via Chroma upsert)
  * advances the session cursor to `max(cursor, cursor_after)`
  * deletes the WAL record

If the process dies:

* **after embedding but before upsert** → WAL replays, no lost compute
* **after upsert but before deleting WAL** → WAL replays upsert again (safe), then deletes

---

# New env vars

```bash
# WAL
INDEX_WAL_ENABLED=true
INDEX_WAL_RECOVER_LIMIT=25
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

  // session-list refresh
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

  // WAL
  walEnabled: boolean;
  walRecoverLimit: number;
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
    chromaCollectionSessions: process.env.CHROMA_COLLECTION_SESSIONS ?? "opencode_sessions",
    chromaCollectionNotes: process.env.CHROMA_COLLECTION_NOTES ?? "reconstitute_notes",

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
    indexBackoffMaxMs: num(process.env.INDEX_BACKOFF_MAX_MS, 120000),

    walEnabled: bool(process.env.INDEX_WAL_ENABLED, true),
    walRecoverLimit: num(process.env.INDEX_WAL_RECOVER_LIMIT, 25)
  };
}
```

---

# Full file replacement: `src/lib/indexer.ts` (adds WAL + recovery + status)

```ts
import type { Db } from "./level.js";
import { getConfig } from "./config.js";
import { embedTexts } from "./ollama.js";
import { upsertToCollection } from "./chroma.js";
import { listSessions, getSessionMessages } from "./opencode.js";
import { log, warn, err } from "./log.js";

type SessionState = {
  cursor: number;

  // session meta tracking
  lastUpdateKey: number;
  lastCheckedAt: number;
  lastSeenCount?: number;

  // backoff
  failCount: number;
  nextAttemptAt: number;
  lastError?: string;

  // observability
  lastIndexedAt: number;
};

type InflightLease = {
  session_id: string;
  leasedUntil: number;
  claimedAt: number;
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

  // WAL
  walReplayedBatches: number;
  walReplayedDocs: number;

  lastError?: string;

  sessionListFetchedAt: number | null;
  sessionListCount: number | null;
};

type WalEmbedding = {
  dim: number;
  data_b64: string; // base64 float32
};

type WalRecord = {
  version: 1;
  created_at: number;

  session_id: string;
  batch_start_index: number; // message_index of first doc
  batch_count: number;
  cursor_after: number;

  ids: string[];
  documents: string[];
  metadatas: Record<string, any>[];
  embeddings: WalEmbedding[];
};

function kSession(sid: string) {
  return `idx:session:${sid}`;
}
function kStats() {
  return `idx:stats`;
}

function kActiveTs(ts: number, sid: string) {
  return `idx:active_ts:${padTs(ts)}:${sid}`;
}
function kActiveSid(sid: string) {
  return `idx:active_sid:${sid}`;
}

function kInflight(sid: string) {
  return `idx:inflight:${sid}`;
}

// WAL keys sorted by time for bounded recovery scanning:
// idx:wal:<paddedTs>:<sid>:<batchStart>
function kWal(ts: number, sid: string, batchStart: number) {
  return `idx:wal:${padTs(ts)}:${sid}:${String(batchStart).padStart(10, "0")}`;
}

function padTs(ts: number): string {
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

/* -------------------------
   Embedding (de)serialization
-------------------------- */

function encodeEmbedding(vec: number[]): WalEmbedding {
  const f32 = new Float32Array(vec.length);
  for (let i = 0; i < vec.length; i++) f32[i] = vec[i] ?? 0;
  const buf = Buffer.from(f32.buffer);
  return { dim: vec.length, data_b64: buf.toString("base64") };
}

function decodeEmbedding(e: WalEmbedding): number[] {
  const buf = Buffer.from(e.data_b64, "base64");
  // Ensure we read exactly dim float32 values
  const f32 = new Float32Array(buf.buffer, buf.byteOffset, Math.min(e.dim, Math.floor(buf.byteLength / 4)));
  const out: number[] = new Array(f32.length);
  for (let i = 0; i < f32.length; i++) out[i] = f32[i] as number;
  return out;
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

      walReplayedBatches: 0,
      walReplayedDocs: 0,

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

  /* -------------------------
     WAL helpers
  -------------------------- */

  async walStatus(limit = 200): Promise<{ wal_count: number; sample_keys: string[] }> {
    let count = 0;
    const keys: string[] = [];
    for await (const [k] of this.db.iterator({ gte: "idx:wal:", lt: "idx:wal;", limit })) {
      count++;
      if (keys.length < 10) keys.push(String(k));
    }
    return { wal_count: count, sample_keys: keys };
  }

  async walRecover(limit?: number): Promise<{ replayed_batches: number; replayed_docs: number }> {
    const cfg = getConfig();
    const lim = Math.max(1, Math.floor(limit ?? cfg.walRecoverLimit));
    if (!cfg.walEnabled) return { replayed_batches: 0, replayed_docs: 0 };

    let replayedBatches = 0;
    let replayedDocs = 0;

    for await (const [k, v] of this.db.iterator({ gte: "idx:wal:", lt: "idx:wal;", limit: lim })) {
      const key = String(k);

      let rec: WalRecord | null = null;
      try {
        rec = JSON.parse(String(v)) as WalRecord;
      } catch {
        // corrupt WAL -> delete
        await this.db.del(key).catch(() => {});
        continue;
      }
      if (!rec || rec.version !== 1) {
        await this.db.del(key).catch(() => {});
        continue;
      }

      try {
        const embeddings = rec.embeddings.map(decodeEmbedding);

        await upsertToCollection({
          collectionName: cfg.chromaCollectionSessions,
          ids: rec.ids,
          documents: rec.documents,
          metadatas: rec.metadatas,
          embeddings
        });

        // advance cursor if needed
        const st = await this.getSessionState(rec.session_id);
        if ((st.cursor ?? 0) < rec.cursor_after) {
          st.cursor = rec.cursor_after;
          st.lastIndexedAt = Date.now();
          await this.setSessionState(rec.session_id, st);
        }

        // WAL consumed
        await this.db.del(key);

        replayedBatches++;
        replayedDocs += rec.batch_count;

        this.stats.walReplayedBatches += 1;
        this.stats.walReplayedDocs += rec.batch_count;

        log(`wal replay ok key=${key} sid=${rec.session_id} docs=${rec.batch_count} cursor_after=${rec.cursor_after}`);
      } catch (e: any) {
        // keep WAL for next attempt
        const msg = String(e?.message ?? e ?? "unknown error");
        warn(`wal replay failed key=${key} err=${msg}`);
      }
    }

    await this.saveStats();
    return { replayed_batches: replayedBatches, replayed_docs: replayedDocs };
  }

  /* -------------------------
     Queue / inflight
  -------------------------- */

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
    if (oldTsKey) await this.db.del(oldTsKey).catch(() => {});

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

    for await (const [k, v] of this.db.iterator({
      gte: "idx:inflight:",
      lt: "idx:inflight;",
      limit: cfg.indexInflightSweepLimit
    })) {
      let lease: InflightLease | null = null;
      try {
        lease = JSON.parse(String(v)) as InflightLease;
      } catch {
        await this.db.del(String(k)).catch(() => {});
        continue;
      }
      if (!lease) continue;

      if (lease.leasedUntil <= now) {
        const sid = lease.session_id;
        await this.db.del(String(k)).catch(() => {});
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
    const ordered = sessions.slice().sort((a, b) => sessionUpdateKey(b) - sessionUpdateKey(a));

    this.sessionCache = { fetchedAt: now, sessions: ordered };
    this.stats.sessionListFetchedAt = now;
    this.stats.sessionListCount = ordered.length;

    return ordered;
  }

  private async observeSessionsAndEnqueue(sessions: any[]): Promise<void> {
    const cfg = getConfig();
    const now = Date.now();

    let slowBudget = Math.max(0, cfg.indexSlowScanBatch);
    const scan = sessions.slice(0, Math.max(1, cfg.indexRefreshScanLimit));

    for (const s of scan) {
      const sid = String(s?.id ?? "");
      if (!sid) continue;

      const updateKey = sessionUpdateKey(s);
      const st = await this.getSessionState(sid);

      const changed = updateKey > (st.lastUpdateKey ?? 0);

      if (changed) {
        st.lastUpdateKey = updateKey;
        await this.enqueueActive(sid);
      } else if (slowBudget > 0) {
        if (now - (st.lastCheckedAt ?? 0) > cfg.indexSlowScanIntervalMs) {
          await this.enqueueActive(sid);
          slowBudget--;
        }
      }

      await this.setSessionState(sid, st);
    }
  }

  private async claimNextSessions(maxSessions: number): Promise<string[]> {
    const now = Date.now();
    const wanted = Math.max(1, Math.floor(maxSessions));

    const picked: string[] = [];

    for await (const [k] of this.db.iterator({
      gte: "idx:active_ts:",
      lt: "idx:active_ts;",
      reverse: true
    })) {
      if (picked.length >= wanted) break;

      const segs = String(k).split(":");
      const sid = segs[3]; // idx, active_ts, <ts>, <sid>
      if (!sid) continue;

      const inflight = await this.getInflight(sid);
      if (inflight && inflight.leasedUntil > now) continue;

      const st = await this.getSessionState(sid);
      if (st.nextAttemptAt && now < st.nextAttemptAt) continue;

      await this.claimInflight(sid, "active");

      await this.db.del(String(k)).catch(() => {});
      const sidPtrKey = kActiveSid(sid);
      const ptr = await this.db.get(sidPtrKey).catch(() => null as any);
      if (ptr === String(k)) await this.db.del(sidPtrKey).catch(() => {});

      picked.push(sid);
    }

    return picked;
  }

  /* -------------------------
     Core session processing (WAL added)
  -------------------------- */

  private async processSession(sessionId: string): Promise<{ indexed: number }> {
    const cfg = getConfig();
    const now = Date.now();
    const st = await this.getSessionState(sessionId);

    const msgs = await getSessionMessages(sessionId);
    st.lastSeenCount = msgs.length;

    const cursor = Math.max(0, st.cursor ?? 0);
    if (msgs.length <= cursor) {
      st.lastCheckedAt = now;
      st.failCount = 0;
      st.nextAttemptAt = 0;
      st.lastError = undefined;
      await this.setSessionState(sessionId, st);
      return { indexed: 0 };
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

    const batchSize = Math.max(1, Math.floor(cfg.indexBatchSize));
    let indexed = 0;

    for (let off = 0; off < docs.length; off += batchSize) {
      const bDocs = docs.slice(off, off + batchSize);
      const bIds = ids.slice(off, off + batchSize);
      const bMetas = metas.slice(off, off + batchSize);

      // 1) compute embeddings
      const embs = await embedTexts(bDocs);

      // 2) write WAL before upsert (so a crash here keeps the work)
      let walKey: string | null = null;
      if (cfg.walEnabled) {
        const batchStart = startIndex + off;
        walKey = kWal(Date.now(), sessionId, batchStart);

        const rec: WalRecord = {
          version: 1,
          created_at: Date.now(),
          session_id: sessionId,
          batch_start_index: batchStart,
          batch_count: bDocs.length,
          cursor_after: batchStart + bDocs.length,
          ids: bIds,
          documents: bDocs,
          metadatas: bMetas,
          embeddings: embs.map(encodeEmbedding)
        };

        await this.db.put(walKey, JSON.stringify(rec));
      }

      // 3) upsert to Chroma (idempotent)
      await upsertToCollection({
        collectionName: cfg.chromaCollectionSessions,
        ids: bIds,
        documents: bDocs,
        metadatas: bMetas,
        embeddings: embs
      });

      // 4) delete WAL after successful upsert
      if (walKey) await this.db.del(walKey).catch(() => {});

      // 5) advance cursor durably
      indexed += bDocs.length;
      st.cursor = startIndex + off + bDocs.length;
      st.lastIndexedAt = Date.now();
      await this.setSessionState(sessionId, st);
    }

    st.lastCheckedAt = now;
    st.failCount = 0;
    st.nextAttemptAt = 0;
    st.lastError = undefined;
    await this.setSessionState(sessionId, st);

    // if still more messages beyond what we processed, re-enqueue
    if (msgs.length > st.cursor) await this.enqueueActive(sessionId);

    return { indexed };
  }

  /* -------------------------
     Public helpers
  -------------------------- */

  async enqueueSession(sessionId: string): Promise<void> {
    await this.enqueueActive(sessionId);
  }

  /* -------------------------
     Tick loop (WAL recovery first)
  -------------------------- */

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
      // 0) WAL recovery first: finish any batches that were embedded but not committed
      await this.walRecover(cfg.walRecoverLimit);

      // 1) reclaim expired inflight leases
      const swept = await this.sweepInflight();
      if (swept > 0) log(`reclaimed expired inflight leases: ${swept}`);

      // 2) observe sessions + enqueue changed/slow-scan
      const sessions = await this.refreshSessionList();
      await this.observeSessionsAndEnqueue(sessions);

      // 3) claim and process active sessions
      const maxPerTick = Math.max(1, Math.floor(maxSessions ?? cfg.indexMaxSessionsPerTick));
      const toProcess = await this.claimNextSessions(maxPerTick);

      for (const sid of toProcess) {
        const inflight = await this.getInflight(sid);
        if (!inflight) await this.claimInflight(sid, "active");

        try {
          const st = await this.getSessionState(sid);
          const now = Date.now();

          if (st.nextAttemptAt && now < st.nextAttemptAt) {
            // extend lease to nextAttemptAt
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

          // keep inflight lease until backoff expires so it gets re-queued later
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
}
```

---

# Optional: expose WAL tools via MCP

If you want to inspect WAL backlog / trigger recovery manually, add these to `src/index.ts` next to your other indexer tools:

```ts
server.registerTool(
  "indexer_wal_status",
  { description: "Returns count of WAL entries and a small sample of keys.", inputSchema: { limit: z.number().int().min(1).max(500).optional() } },
  async ({ limit }) => {
    const st = await indexer.walStatus(limit ?? 200);
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, ...st }, null, 2) }] };
  }
);

server.registerTool(
  "indexer_wal_recover",
  { description: "Attempt to replay up to N WAL batches now.", inputSchema: { limit: z.number().int().min(1).max(500).optional() } },
  async ({ limit }) => {
    const r = await indexer.walRecover(limit);
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, ...r }, null, 2) }] };
  }
);
```

---

## What you get now

* **No re-embedding** if the process is killed after embeddings are computed.
* **Safe idempotent replays** (Chroma upsert).
* **Durable cursor advancement** aligned with committed batches.
* WAL backlog can be monitored and drained.

---

## Next “continue” upgrade (recommended)

If you say continue again, I’ll add a **deduplicated embedding cache** (TTL + hash key) so even *without* WAL you avoid recomputing embeddings when:

* the same message gets reindexed due to cursor resets
* WAL grows and you want to store only “embedding refs” instead of raw vectors
* multiple collections reuse the same embeddings (sessions + notes + future code index)
