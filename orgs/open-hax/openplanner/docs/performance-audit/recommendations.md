# Prioritized Recommendations

## Immediate (This Week)

### 1. Configure PostgreSQL Connection Pool

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy_db.cljs`  
**Priority:** CRITICAL  
**Effort:** 30 minutes

```cljs
(let [pool (new (.-Pool pg)
                (clj->js {:connectionString conn-str
                          :max 20
                          :idleTimeoutMillis 30000
                          :connectionTimeoutMillis 5000
                          :allowExitOnIdle true}))]
  (.on pool "error" (fn [err _client]
                      (log/error "Unexpected PG pool error" err)))
  pool)
```

Also add health check in `bootstrap.cljs`:
```cljs
(-> (.query pool "SELECT 1")
    (.then (fn [] (start-http-server!)))
    (.catch (fn [err]
              (log/error "Database connection failed, exiting" err)
              (js/process.exit 1))))
```

---

### 2. Fix Graceful Shutdown to Close PostgreSQL Pool

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/graceful_shutdown.cljs`  
**Priority:** CRITICAL  
**Effort:** 15 minutes

Add pool cleanup before process exit:
```cljs
(.then (fn [_]
         (-> (js/Promise.all
              [(when-let [client (redis/get-client)]
                 (redis/quit client))
               (when-let [pool (policy-db/get-pool)]
                 (.end pool))])
              (.then (fn []
                       (log/info "Graceful shutdown complete")
                       (js/process.exit 0))))))
```

---

### 3. Replace Shell-Based Attachment Download

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/event_agents.cljs`  
**Priority:** CRITICAL (Security)  
**Effort:** 1 hour

Replace `exec_async` with `node-fetch` or `https`:
```cljs
(:require ["node:https" :as https])

(defn download-attachment! [url token local-path]
  (js/Promise.
   (fn [resolve reject]
     (let [file-stream (.createWriteStream fs local-path)
           req (.get https url
                    #js {:headers #js {"Authorization" (str "Bot " token)}}
                    (fn [res]
                      (.pipe res file-stream)
                      (.on file-stream "finish" resolve)
                      (.on file-stream "error" reject)))]
       (.on req "error" reject)
       (.setTimeout req 10000 (fn [] (.abort req) (reject (ex-info "Timeout" {}))))))))
```

---

### 4. Cap PCM Audio Buffers

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/discord_gateway.cljs`  
**Priority:** CRITICAL  
**Effort:** 30 minutes

```cljs
(def MAX_PCM_BUFFER_BYTES (* 2 1024 1024)) ; 2MB cap (~20s of audio)

(.on decoder "data"
     (fn [pcm-chunk]
       (when-let [buf (get @pcm-buffers uid)]
         (if (> (+ (.-length buf) (.-length pcm-chunk)) MAX_PCM_BUFFER_BYTES)
           (do (log/warn "PCM buffer overflow, dropping audio for" uid)
               (swap! pcm-buffers dissoc uid)
               (.push buf nil))
           (.push buf pcm-chunk)))))
```

---

### 5. Add HTTP Timeouts to All Fetch Calls

**Files:** `http.cljs`, `discord_io.cljs`, `event_agents.cljs`, `mcp_bridge.cljs`  
**Priority:** HIGH  
**Effort:** 1 hour

Create a shared timeout wrapper in `http.cljs`:
```cljs
(defn fetch-with-timeout
  [url opts timeout-ms]
  (let [controller (js/AbortController.)
        timeout-id (js/setTimeout #(.abort controller) timeout-ms)]
    (-> (js/fetch url (js/Object.assign #js {:signal (.-signal controller)} opts))
        (.finally (fn [] (js/clearTimeout timeout-id))))))
```

Timeouts:
- API calls: 30s
- Health checks: 5s
- MCP tool calls: 60s
- File downloads: 120s

---

## Short-Term (Next 2 Weeks)

### 6. Implement Database Transactions

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy_db.cljs`  
**Priority:** CRITICAL  
**Effort:** 4 hours

Add `with-transaction!` helper and wrap these functions:
- `factory-create-user`
- `factory-create-role`
- `ensure-bootstrap-user!`
- `set-membership-roles!`
- `set-role-permissions!`

```cljs
(defn with-transaction!
  [pool f]
  (-> (.connect pool)
      (.then (fn [client]
               (-> (.query client "BEGIN")
                   (.then (fn [] (f client)))
                   (.then (fn [result]
                            (-> (.query client "COMMIT")
                                (.then (fn [] (.release client true))
                                       result))))
                   (.catch (fn [err]
                             (-> (.query client "ROLLBACK")
                                 (.then (fn [] (.release client false))
                                        (fn [] (throw err)))))))))))
```

---

### 7. Fix N+1 Query Patterns

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy_db.cljs`  
**Priority:** HIGH  
**Effort:** 3 hours

Replace these with batched queries:
- `resolve-role-ids`: Use `ANY($1::text[])`
- `ensure-bootstrap-allowlist-users!`: Batch role lookups, batch membership_role inserts
- `ensure-tool-definitions!`: Single `INSERT ... VALUES ... ON CONFLICT`
- `ensure-permission-records!`: Single `INSERT ... VALUES ... ON CONFLICT`
- `set-role-permissions!`: `DELETE` + `INSERT ... SELECT unnest(...)`
- `set-role-tool-policies!`: Same pattern
- `set-membership-tool-policies!`: Same pattern
- `set-membership-roles!`: Same pattern

Example batch insert:
```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT $1::uuid, unnest($2::uuid[])
ON CONFLICT DO NOTHING
```

---

### 8. Add Missing Database Indexes

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy_db.cljs`  
**Priority:** HIGH  
**Effort:** 1 hour

Add these indexes to the schema:
```sql
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_org_id ON memberships(org_id);
CREATE INDEX idx_memberships_actor_id ON memberships(actor_id);
CREATE INDEX idx_data_lakes_org_id ON data_lakes(org_id);
CREATE INDEX idx_roles_org_id ON roles(org_id);
CREATE INDEX idx_audit_events_org_created ON audit_events(org_id, created_at);
CREATE INDEX idx_audit_events_action_resource ON audit_events(action, resource_kind, created_at);
```

---

### 9. Replace Sync File I/O in Async Paths

**Files:** `contracts/loader.cljs`, `policy/edn_adapter.cljs`, `tools/session_mycology.cljs`  
**Priority:** HIGH  
**Effort:** 2 hours

Replace `readFileSync`/`writeFileSync` with `node:fs/promises` equivalents.

---

### 10. Add Concurrency Limiting to Event Dispatch

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/event_agents.cljs`  
**Priority:** HIGH  
**Effort:** 2 hours

Implement a semaphore or use `p-queue`:
```cljs
(:require ["p-queue" :default PQueue])

(def job-queue (new PQueue #js {:concurrency 5}))

(defn dispatch-event! [event jobs]
  (-> (js/Promise.allSettled
       (clj->js
        (mapv (fn [job]
                (.add job-queue (fn [] (run-job! job))))
              matching-jobs)))
      ...))
```

---

### 11. Fix Memory Leak Registries

**Files:** `agent_runtime.cljs`, `session_store.cljs`, `discord_gateway.cljs`, `routes/mcp.cljs`  
**Priority:** HIGH  
**Effort:** 4 hours

For each registry, add:
1. Max size limit with LRU eviction
2. TTL-based sweep
3. `finally`-guaranteed cleanup on error paths

Example for `agent-sessions*`:
```cljs
(def MAX_AGENT_SESSIONS 500)
(def SESSION_INACTIVE_TTL_MS (* 4 60 60 1000))

(defn ensure-agent-session! [...]
  (when (> (count @agent-sessions*) MAX_AGENT_SESSIONS)
    (let [oldest (apply min-key (comp :last-accessed val) @agent-sessions*)]
      (swap! agent-sessions* dissoc (key oldest))))
  (swap! agent-sessions* assoc conversation-id
         {:session next-session
          :last-accessed (js/Date.now)}))

;; Run sweep every 5 minutes
(js/setInterval
 #(let [cutoff (- (js/Date.now) SESSION_INACTIVE_TTL_MS)]
    (swap! agent-sessions*
           (fn [sessions]
             (into {} (filter (fn [[_ v]]
                                (> (:last-accessed v) cutoff))
                              sessions)))))
 300000)
```

---

### 12. Clean Up Temporary Files

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/event_agents.cljs`  
**Priority:** HIGH  
**Effort:** 30 minutes

Use `tmp` library with auto-cleanup:
```cljs
(:require ["tmp" :as tmp])

(let [tmp-obj (tmp/fileSync #js {:prefix "knoxx-"})
      local-path (.-name tmp-obj)]
  (-> (download-attachment! url local-path)
      (.then (fn [] (sanitize-svg-file! local-path)))
      (.finally (fn [] (.removeCallback tmp-obj)))))
```

---

### 13. Fix Discord Client Listener Leaks

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/discord_gateway.cljs`  
**Priority:** MEDIUM  
**Effort:** 1 hour

Store listener references and remove them before destroy:
```cljs
(defn build-discord-client [...]
  (let [client (new discord/Client ...)
        listeners [[(.-ClientReady Events) handle-ready]
                   [(.-MessageCreate Events) handle-message]
                   [(.-Error Events) handle-error]]]
    (doseq [[event handler] listeners]
      (.on client event handler))
    (aset client "__knoxx_listeners__" listeners)
    client))

(defn gw-stop [client]
  (when-let [listeners (aget client "__knoxx_listeners__")]
    (doseq [[event handler] listeners]
      (.removeListener client event handler)))
  (.destroy client))
```

---

### 14. Add WebSocket Heartbeat and Idle Timeout

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/realtime.cljs`  
**Priority:** MEDIUM  
**Effort:** 1 hour

```cljs
(def WS_HEARTBEAT_INTERVAL_MS 30000)
(def WS_IDLE_TIMEOUT_MS 60000)

(defn attach-heartbeat! [client-id socket]
  (let [last-pong (atom (js/Date.now))]
    (.on socket "pong" #(reset! last-pong (js/Date.now)))
    (js/setInterval
     #(when (> (- (js/Date.now) @last-pong) WS_IDLE_TIMEOUT_MS)
        (log/warn "WS client idle timeout" client-id)
        (.terminate socket)
        (swap! ws-clients* dissoc client-id))
     WS_HEARTBEAT_INTERVAL_MS)))
```

---

### 15. Bound Ingestion Executor Queue

**File:** `packages/agents/knoxx/ingestion/src/kms_ingestion/jobs/control.clj`  
**Priority:** HIGH  
**Effort:** 1 hour

```clj
(defn init-executor! []
  (let [queue (ArrayBlockingQueue. 1000)
        executor (ThreadPoolExecutor.
                   4 8 60 TimeUnit/SECONDS
                   queue
                   (ThreadPoolExecutor$AbortPolicy.))]
    (reset! executor* executor)))

(defn submit-task! [f]
  (try
    (.submit ^ExecutorService @executor* f)
    (catch RejectedExecutionException e
      (log/error "Task rejected: queue full"))))
```

---

## Medium-Term (Next Month)

### 16. Extract Schema into Versioned Migrations

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy_db.cljs`  
**Priority:** MEDIUM  
**Effort:** 8 hours

Follow the existing `openplanner-migration-tools` pattern:
1. Create numbered migration files
2. Add `schema_migrations` tracking table
3. Remove `ensure-schema!` from startup
4. Stop running backfill UPDATEs on every boot

---

### 17. Rewrite `factory-list-orgs` Query

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/policy_db.cljs`  
**Priority:** MEDIUM  
**Effort:** 2 hours

Replace cross-join `COUNT DISTINCT` with correlated subqueries:
```sql
SELECT o.*,
  (SELECT COUNT(*) FROM memberships m WHERE m.org_id = o.id) AS member_count,
  (SELECT COUNT(*) FROM roles r WHERE r.org_id = o.id) AS role_count,
  (SELECT COUNT(*) FROM data_lakes d WHERE d.org_id = o.id) AS data_lake_count
FROM orgs o
ORDER BY o.is_primary DESC, o.name ASC
```

---

### 18. Replace Global Agent Context Atom

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/agent_context.cljs`  
**Priority:** MEDIUM  
**Effort:** 4 hours

Replace `current-context*` with `AsyncLocalStorage` (Node.js >= 16):
```cljs
(:require ["node:async_hooks" :refer [AsyncLocalStorage]])

(def context-storage (new AsyncLocalStorage))

(defn with-context! [context f]
  (.run context-storage context f))

(defn get-context []
  (.getStore context-storage))
```

This eliminates the risk of cross-session contamination during async tool interleaving.

---

### 19. Add Unified Metrics and Observability

**New file:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/metrics.cljs`  
**Priority:** MEDIUM  
**Effort:** 8 hours

Export these metrics:
```cljs
(def metrics
  {:agent_runs_total (atom 0)
   :agent_run_duration_ms (atom [])
   :agent_runs_active (atom 0)
   :mailbox_queue_depth (atom 0)
   :ws_clients_connected (atom 0)
   :ws_broadcast_duration_ms (atom [])
   :pg_pool_active (atom 0)
   :pg_pool_waiting (atom 0)
   :event_dispatch_total (atom 0)
   :event_dispatch_errors (atom 0)})
```

Add a `/metrics` endpoint for Prometheus scraping, or extend the existing stats broadcast.

---

### 20. Implement Rate Limiting for Agent Runs

**New file:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/rate_limiter.cljs`  
**Priority:** MEDIUM  
**Effort:** 4 hours

Token bucket rate limiter for downstream API calls:
```cljs
(defn create-token-bucket [{:keys [capacity refill-rate]}]
  ...)

(def model-api-limiter (create-token-bucket {:capacity 10 :refill-rate 0.5}))
(def discord-limiter (create-token-bucket {:capacity 5 :refill-rate 2}))
```

---

### 21. Stream OpenPlanner Events in Chunks

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/openplanner_memory.cljs`  
**Priority:** MEDIUM  
**Effort:** 2 hours

```cljs
(defn index-events-in-chunks! [events chunk-size]
  (let [chunks (partition-all chunk-size events)]
    (reduce (fn [promise chunk]
              (-> promise
                  (.then (fn [] (post-events! chunk)))
                  (.catch (fn [err]
                            (log/error "Chunk upload failed" err)
                            (throw err)))))
            (js/Promise.resolve nil)
            chunks)))
```

---

### 22. Reduce HTTP Server Timeouts

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/http_server.cljs`  
**Priority:** LOW  
**Effort:** 15 minutes

```cljs
(Fastify #js {:logger true
              :bodyLimit (* 10 1024 1024)
              :requestTimeout 60000
              :connectionTimeout 60000
              :keepAliveTimeout 30000
              :maxRequestsPerSocket 100
              :forceCloseConnections true})
```

---

### 23. Add Circuit Breaker for Downstream APIs

**New file:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/circuit_breaker.cljs`  
**Priority:** MEDIUM  
**Effort:** 4 hours

Implement a circuit breaker for OpenPlanner, Discord, and model APIs:
```cljs
(defn create-circuit-breaker
  [{:keys [failure-threshold timeout-ms]}]
  ...)

(def openplanner-breaker
  (create-circuit-breaker {:failure-threshold 5 :timeout-ms 60000}))
```

---

## Summary Timeline

| Week | Items | Effort | Risk Reduction |
|------|-------|--------|----------------|
| 1 | Pool config, shutdown fix, shell injection fix, PCM cap, fetch timeouts | 4 hours | CRITICAL |
| 2-3 | Transactions, N+1 fixes, indexes, sync I/O, event dispatch limits, memory sweeps | 16 hours | HIGH |
| 4 | Temp file cleanup, Discord listeners, WS heartbeat, ingestion bounds | 6 hours | HIGH |
| Month 2 | Migrations, query rewrites, AsyncLocalStorage, metrics, rate limiting | 26 hours | MEDIUM |

**Total estimated effort:** ~52 hours (1.3 developer-weeks)

**Recommended team assignment:**
- One senior backend engineer for database and transaction work (items 1, 2, 6, 7, 8, 16, 17)
- One full-stack engineer for async I/O and memory safety (items 3, 4, 5, 9, 10, 11, 12, 13, 14, 18)
- One infrastructure engineer for metrics, rate limiting, and circuit breakers (items 15, 19, 20, 21, 22, 23)

---

## Testing Recommendations

Before deploying fixes, verify with:

1. **Load testing:** Use `autocannon` or `k6` to simulate 100+ concurrent agent runs
2. **Memory profiling:** Run `node --inspect` and capture heap snapshots before/after load tests
3. **Database monitoring:** Enable `log_min_duration_statement = 100` in PostgreSQL to catch slow queries
4. **Connection monitoring:** Watch `pg_stat_activity` during load tests to verify pool behavior
5. **Chaos testing:** Kill Postgres/Redis during active sessions to verify graceful degradation
6. **Security testing:** Attempt shell injection via Discord attachment URLs (should fail with fix #3)

---

## Rollback Plan

All fixes are additive or config changes. Rollback strategy:
1. Keep old `pg.Pool` config commented out in source
2. Feature-flag transaction wrapping (can disable per-function)
3. Keep `exec_async` fallback commented out (not recommended, but available)
4. All new limits (max sessions, PCM buffer) use constants that can be increased via env vars

**Monitoring during rollout:**
- Watch for connection pool exhaustion (increase `max` if needed)
- Monitor agent run latency (may increase slightly with concurrency limits)
- Watch for transaction deadlocks (rare, but possible with high contention)
- Monitor error rates from Discord API (may change with timeout behavior)
