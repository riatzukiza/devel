# Queuing, Streaming & Throughput

## HIGH

### 1. Actor Mailbox — No Queue Depth or Backpressure

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/actor_mailbox.cljs`

The actor mailbox persists entries directly to PostgreSQL with no in-memory queue depth limit:

```cljs
(defn retry-eligible! [...]
  ...
  max-attempts* (positive-int max-attempts 5 100)
  limit* (positive-int limit 25 200)
  ...
  "UPDATE actor_mailbox_entries ... attempts = m.attempts + 1 ...")
```

- `list-entries!` caps query result at `500` rows
- No cap on inserts — if producers outpace consumers, the table grows indefinitely
- Retry logic has no delay/backpressure between retries
- No overflow handling (drop, block, or dead-letter) if DB is slow or down
- `database-enabled?` simply returns `{:durable? false}` without requiring caller handling

**Impact:** A burst of events (e.g., Discord gateway firehose, cron triggers) can create thousands of mailbox entries. Retries without backoff hammer the database. If the DB is slow, the system enters a retry storm.

**Recommended Fix:**
1. Add a max queue depth (e.g., 10,000 entries) with rejection
2. Add exponential backoff between retries (min 1s, max 60s)
3. Implement a dead-letter table for entries exceeding max attempts
4. Add a circuit breaker that stops inserting when DB is unhealthy

```cljs
(def MAX_MAILBOX_SIZE 10000)
(def MAX_RETRY_DELAY_MS 60000)

(defn insert-entry! [pool entry]
  (-> (query-one! pool "SELECT COUNT(*) as count FROM actor_mailbox_entries WHERE status = 'pending'")
      (.then (fn [result]
               (when (>= (:count result) MAX_MAILBOX_SIZE)
                 (throw (ex-info "Mailbox full" {:max MAX_MAILBOX_SIZE})))
               (insert-one! pool ...)))))

(defn calculate-retry-delay [attempts]
  (min MAX_RETRY_DELAY_MS (* 1000 (Math/pow 2 attempts))))
```

---

### 2. Event Processing — Synchronous Fan-Out, No Batching

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/event_agents.cljs`  
**Lines:** 1139-1157

```cljs
(-> (js/Promise.all
     (clj->js
      (mapv (fn [job]
              (let [started-at (record-job-run-start! job) ...]
                ...))
            matching-jobs)))
```

`dispatch-event!` matches events against all jobs synchronously and fires `run-job!` for every match. No batching, no worker pool, no queue.

**Impact:** If many jobs match a single event (e.g., a broad keyword in a busy channel), all matching jobs launch simultaneously. Each job spawns an agent run, overwhelming the local process, Redis, and downstream model APIs.

**Deduplication (partial mitigation):**
```cljs
;; Sliding-window sweep: cap dispatched-event-ids* at 500 entries
(let [sweep-interval-ms (* 10 60 1000)
      sweep-fn (fn []
                 (swap! dispatched-event-ids*
                        (fn [ids]
                          (if (> (count ids) 500)
                            (set (take-last 500 (vec ids)))
                            ids))))]
```

This proves the developers recognized the dedup set would leak — but the job dispatch itself remains unbounded.

**Recommended Fix:** Implement a worker pool with concurrency limits:

```cljs
(def MAX_CONCURRENT_AGENT_RUNS 5)
(def agent-run-queue (atom []))
(def active-runs* (atom 0))

(defn enqueue-agent-run! [job]
  (swap! agent-run-queue conj job)
  (process-queue!))

(defn process-queue! []
  (when (and (seq @agent-run-queue)
             (< @active-runs* MAX_CONCURRENT_AGENT_RUNS))
    (let [job (first @agent-run-queue)]
      (swap! agent-run-queue subvec 1)
      (swap! active-runs* inc)
      (-> (run-job! job)
          (.finally (fn []
                      (swap! active-runs* dec)
                      (process-queue!)))))))
```

---

### 3. Ingestion JVM — Unbounded Executor Queue

**File:** `packages/agents/knoxx/ingestion/src/kms_ingestion/jobs/control.clj`  
**File:** `packages/agents/knoxx/ingestion/src/kms_ingestion/jobs/worker.clj`

```clj
(defn init-executor! []
  (reset! executor (Executors/newFixedThreadPool 4)))

(defn submit-task! [f]
  (when @executor
    (.submit ^ExecutorService @executor f)))
```

- Hardcoded 4-thread fixed thread pool
- `submit-task!` enqueues onto the executor without rejection handling
- If the 4 threads are saturated, new jobs accumulate in the executor's unbounded `LinkedBlockingQueue`, consuming heap

**Impact:** During document ingestion bursts (e.g., bulk upload, large file translation), the queue grows without bound until heap exhaustion (JVM OOM).

**Recommended Fix:** Use a bounded queue with rejection policy:

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
      (log/error "Task rejected: queue full")
      ;; Return error to caller or retry later
      )))
```

Also expose `executor-queue-size` as a health-check metric:

```clj
(defn queue-depth []
  (when-let [executor @executor*]
    (.size (.getQueue ^ThreadPoolExecutor executor))))
```

---

## MEDIUM

### 4. WebSocket Broadcast — No Backpressure

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/realtime.cljs`  
**Lines:** 87-93, 99-120

```cljs
(defn broadcast-ws!
  [channel payload]
  (doseq [[client-id client] @ws-clients*]
    (try
      (safe-ws-send! (aget client "socket") (ws-envelope channel payload))
      (catch :default _
        (swap! ws-clients* dissoc client-id)))))
```

- `ws-clients*` is a plain atom holding all connected sockets — **no connection limit**
- `broadcast-ws!` loops over every client and calls `.send` without checking socket buffer state
- If a client is slow, messages are dropped only if `readyState != 1`
- No queue depth limit, rate limiting, or slow-client isolation

**Impact:** A single slow consumer can delay broadcasts to all other clients. Memory-safe (clients evicted on error), but no QoS for slow consumers.

**Recommended Fix:** Add per-client send queues with max depth:

```cljs
(def MAX_WS_QUEUE_DEPTH 100)

(defn safe-ws-send! [socket message]
  (when (= 1 (.-readyState socket))
    (try
      (.send socket message)
      true
      (catch js/Error _
        false))))

(defn broadcast-ws! [channel payload]
  (let [message (ws-envelope channel payload)]
    (doseq [[client-id client] @ws-clients*]
      (let [socket (aget client "socket")
            queue (or (aget client "send-queue") #js [])]
        (if (> (.-length queue) MAX_WS_QUEUE_DEPTH)
          (do (log/warn "WS client queue overflow, dropping" client-id)
              (swap! ws-clients* dissoc client-id)
              (.close socket))
          (when-not (safe-ws-send! socket message)
            (.push queue message)
            (aset client "send-queue" queue)))))))
```

---

### 5. Rate Limiting and Throttling — Ingestion Only

**File:** `packages/agents/knoxx/ingestion/src/kms_ingestion/jobs/control.clj`

CPU-based ingestion throttle exists with EMA smoothing:
```clj
(defn control-delay-ms [cpu-cores max-load-per-core]
  (let [ratio (if (pos? target) (/ cpu-cores target) 0)]
    (cond
      (< ratio 0.25) 8
      ...
      :else 2000)))
```

OpenPlanner backpressure uses exponential backoff:
```clj
delay-ms (min 60000 (* 1000 (bit-shift-left 1 (min 5 (dec next-streak)))))
```

**Problem:** No global rate limiter exists for:
- Agent runs (Node.js backend)
- Discord sends
- HTTP outbound calls
- MCP tool invocations

**Impact:** A burst of concurrent agent turns can overwhelm downstream APIs (OpenAI, Anthropic, OpenPlanner), triggering rate limits and cascading failures.

**Recommended Fix:** Implement a token bucket rate limiter:

```cljs
(ns knoxx.backend.rate-limiter)

(defn create-token-bucket
  [{:keys [capacity refill-rate]}]
  (let [tokens* (atom capacity)
        last-refill* (atom (js/Date.now))]
    {:acquire (fn [n timeout-ms]
                (let [now (js/Date.now)
                      elapsed (- now @last-refill*)]
                  (swap! tokens* min capacity (+ @tokens* (* elapsed refill-rate)))
                  (reset! last-refill* now)
                  (if (>= @tokens* n)
                    (do (swap! tokens* - n)
                        (js/Promise.resolve true))
                    (js/Promise. (fn [resolve _]
                                   (js/setTimeout #(resolve false) timeout-ms))))))}))

;; Usage
(def model-api-limiter (create-token-bucket {:capacity 10 :refill-rate 0.5})) ; 10 burst, 30/min
```

---

### 6. Queue Overflow Handling — Ad-Hoc Caps

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/event_agents.cljs`  
**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/tools/twitch.cljs`

Most buffers are capped, but caps are ad-hoc and not unified:

| Buffer | Cap | Mechanism |
|--------|-----|-----------|
| `chat-buffer` (Twitch) | 100 messages | Per-channel |
| `recent-events*` | 30 events | `take-last` |
| `dispatched-event-ids*` | 500 IDs | Sweep every 10 min |
| Redis lists | None | Unbounded `lpush` |

**Impact:** Redis lists (`lpush`, `lrange`) in `redis_client.cljs` have no length enforcement. Under sustained load, Redis memory grows until eviction or OOM.

**Recommended Fix:** Add `LTRIM` after every `LPUSH`:

```cljs
(defn push-with-limit! [client key value max-len]
  (-> (.lPush client key value)
      (.then (fn [] (.lTrim client key 0 (dec max-len))))))
```

---

### 7. Discord Gateway Event Throughput

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/discord_gateway.cljs`

Uses native `discord.js` Client with `GatewayIntentBits` and `Partials`. No custom message buffer or queue.

Message listeners stored in a `js/Set`; every incoming message iterates all listeners synchronously:
```cljs
(defn- notify-message! [listeners log message]
  (.forEach @listeners
            (fn [listener]
              (try
                (listener mapped message)
                (catch js/Error error ...)))))
```

**Impact:** If many listeners are registered (e.g., one per active conversation), message dispatch becomes O(n) per message. A busy guild can generate 100+ messages/second, causing event loop saturation.

**Voice listener buffering:**
- PCM chunks accumulated per-user in atoms (`pcm-buffers`, `streams`, `decoders`)
- If `on-end-speaking` never fires (buggy state), buffers grow unbounded
- `split-message` splits outbound text into `<=2000` char chunks and sends sequentially, but no rate limit between chunks

**Recommended Fix:**
1. Add listener deduplication (don't register duplicate listeners for the same conversation)
2. Add a max listener count per guild
3. Add rate limiting between Discord message chunks (max 5 messages/second)

---

### 8. HTTP Server Request Handling

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/http_server.cljs`  
**Lines:** 12-15

```cljs
(Fastify #js {:logger true
              :bodyLimit (* 50 1024 1024)
              :requestTimeout 600000
              :connectionTimeout 600000
              :forceCloseConnections true})
```

- 50 MiB body limit
- 10-minute request and connection timeouts
- No `maxConnections`, `keepAliveTimeout`, or connection pool limit
- Multipart limits files to 50MB and 10 files per upload

**Ingestion server** (`server.clj`) uses Jetty with `ring.adapter.jetty` and no explicit thread pool or connection limit:
```clj
(jetty/run-jetty #'wrapped-app {:port port :join? true})
```

**Impact:** Long timeouts are generous to the point of being dangerous. Missing connection limits expose the server to slowloris attacks and connection exhaustion.

**Recommended Fix:**

Node.js Fastify:
```cljs
(Fastify #js {:logger true
              :bodyLimit (* 10 1024 1024)
              :requestTimeout 60000
              :connectionTimeout 60000
              :keepAliveTimeout 30000
              :maxRequestsPerSocket 100
              :forceCloseConnections true})
```

Clojure Jetty:
```clj
(jetty/run-jetty #'wrapped-app
                 {:port port
                  :join? true
                  :max-threads 50
                  :min-threads 10
                  :max-queued-requests 1000})
```

---

### 9. WebSocket Message Routing and Fan-Out

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/realtime.cljs`

Routing is session/conversation-scoped, never global:
```cljs
(defn broadcast-ws-session! [session-id channel payload]
  ...
  matches? (cond
             (not (str/blank? payload-conversation-id))
             (= payload-conversation-id client-conversation-id)
             ...
             :else false))
```

**Positive:** Routing isolation is correct — clients only receive messages for their conversation.

**Stats broadcast:** Every 5000ms via `js/setInterval`. Interval is not cleaned up if `ws-clients*` empties, though `ensure-ws-stats-loop!` guards against duplicate intervals.

**Minor concern:** The stats loop continues broadcasting even with zero clients, wasting CPU.

**Recommended Fix:** Pause stats loop when no clients connected:

```cljs
(defn maybe-start-stats-loop! []
  (when (and (seq @ws-clients*)
             (not @stats-loop-running?*))
    (start-stats-loop!)))

(defn maybe-stop-stats-loop! []
  (when (and (empty? @ws-clients*)
             @stats-loop-running?*)
    (stop-stats-loop!)))
```

---

## LOW

### 10. Throughput Metrics and Benchmarks

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/realtime.cljs`

System stats collected every 5s include:
- `cpu_percent`, `memory_percent`
- `active_clients` (WebSocket count)
- `active_runs` (agent run count)
- GPU stats via `nvidia-smi`

**Missing:**
- No Prometheus metrics
- No p95/p99 latency histograms
- No queue depth metrics
- No throughput benchmarks
- No SLI/SLO instrumentation

**Impact:** Operational blind spots. Cannot detect degradation until users complain.

**Recommended Fix:** Add a metrics namespace exporting:
- `agent_runs_total` (counter)
- `agent_run_duration_seconds` (histogram)
- `agent_runs_active` (gauge)
- `mailbox_queue_depth` (gauge)
- `ws_clients_connected` (gauge)
- `ws_broadcast_duration_seconds` (histogram)
- `pg_pool_active_connections` (gauge)
- `pg_pool_waiting_clients` (gauge)
- `event_dispatch_total` (counter)
- `event_dispatch_errors_total` (counter)

Wire into Prometheus or existing stats broadcast.

---

## Throughput Summary Matrix

| Component | Queue Type | Bounded? | Backpressure? | Concurrency Limit | Risk |
|-----------|-----------|----------|---------------|-------------------|------|
| Actor mailbox | PostgreSQL | No (inserts) | No | No retry delay | HIGH |
| Event dispatch | In-memory | No | No | No (Promise.all) | HIGH |
| Ingestion executor | LinkedBlockingQueue | No | No | 4 threads | HIGH |
| WS broadcast | Synchronous loop | No | No | N/A (single-threaded) | MEDIUM |
| Discord gateway | Native (discord.js) | No | No | No custom queue | MEDIUM |
| HTTP server | Fastify/Jetty | Partial | No | Default limits | MEDIUM |
| Redis lists | Redis | No | No | N/A | MEDIUM |
| Agent runs | In-memory | No | No (idle-only drop) | No | HIGH |

---

## Architecture Risk: Dual-Runtime Split

The system runs two distinct runtimes with inconsistent resilience:

| Aspect | CLJS/Node.js Backend | Clojure/JVM Ingestion |
|--------|---------------------|----------------------|
| Thread model | Single event loop | 4-thread fixed pool |
| Backpressure | None | CPU-based throttle |
| Queue bounds | None | Unbounded (LinkedBlockingQueue) |
| Timeouts | None (300s default) | Configurable |
| Circuit breaker | None | Partial (exponential backoff) |

**Impact:** Load crossing from the backend into ingestion (translation worker, event-agent runs) sees a sharp boundary in backpressure handling. A burst of agent runs that triggers document indexing can overwhelm the ingestion service, which has no mechanism to shed load.

**Recommended Fix:** Add a load-shedding layer at the backend→ingestion boundary:
1. Check ingestion queue depth before submitting jobs
2. Return 503 "Service Unavailable" when ingestion is overloaded
3. Implement a retry-with-backoff in the backend caller
