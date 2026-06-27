# Async I/O & Event Loop Health

## CRITICAL

### 1. Shell Command Injection via `child_process.exec`

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/event_agents.cljs`  
**Lines:** 520-533

```cljs
(-> (exec_async
     (str "curl -sL -H " (pr-str (str "Authorization: Bot " token))
          " -o " (pr-str local-path) " " (pr-str url))
     #js {:timeout 10000})
```

`exec_async` wraps `child_process.exec` (not `execFile`), which spawns a shell. The `url` parameter comes from Discord attachment metadata and is interpolated into the command string. `pr-str` quotes the string but does not sanitize shell metacharacters.

**Attack Vector:** A malicious attachment URL like `https://example.com/file.svg; rm -rf /` would execute the injected command.

**Recommended Fix:** Replace with `execFile` and pass arguments as an array:

```cljs
(-> (exec-file-async
     "curl"
     #js ["-sL"
          "-H" (str "Authorization: Bot " token)
          "-o" local-path
          url]
     #js {:timeout 10000})
```

Or better, use Node's native `https` module or `node-fetch` to download without spawning a subprocess.

---

### 2. Unbounded PCM Audio Buffer Growth in Voice Listener

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/discord_gateway.cljs`  
**Lines:** 631-686

```cljs
pcm-buffers (atom {})
;; ...
(.on decoder "data"
     (fn [pcm-chunk]
       (when-let [buf (get @pcm-buffers uid)]
         (.push buf pcm-chunk))))
```

There is **no maximum buffer size or duration cap**. If a user transmits continuous audio (e.g., a bot streaming music or a stuck PTT key), the PCM chunks accumulate in the atom until the silence debounce fires or memory is exhausted.

**Recommended Fix:** Add a max-bytes cap and flush/drop when exceeded:

```cljs
(def MAX_PCM_BUFFER_BYTES (* 1024 1024)) ; 1MB cap

(.on decoder "data"
     (fn [pcm-chunk]
       (when-let [buf (get @pcm-buffers uid)]
         (if (> (+ (.-length buf) (.-length pcm-chunk)) MAX_PCM_BUFFER_BYTES)
           (do (log/warn "PCM buffer overflow for user" uid)
               (reset! pcm-buffers (dissoc @pcm-buffers uid))
               (.push buf nil)) ; signal end
           (.push buf pcm-chunk)))))
```

---

## HIGH

### 3. Synchronous File I/O in Async Execution Paths

Multiple files use `readFileSync`, `writeFileSync`, and `existsSync` in paths that execute during async operations (agent turns, HTTP requests):

| File | Lines | Functions | Pattern |
|------|-------|-----------|---------|
| `contracts/loader.cljs` | 234 | Contract loading | `readFileSync` |
| `policy/edn_adapter.cljs` | 87, 129 | Policy read/write | `readFileSync`, `writeFileSync` |
| `tools/policies.cljs` | 19 | Policy file read | `readFileSync` |
| `tools/session_mycology.cljs` | 77, 151-152, 185 | Session notes read/write | `readFileSync`, `writeFileSync`, `existsSync` |
| `node/fs.cljs` | 24 | FS utility | `readFileSync` |
| `triggers/trigger_runner.cljs` | 24 | Trigger file read | `readFileSync` |

**Impact:** These sync calls block the event loop. Contract and policy paths are on the hot path of agent turn execution. Under concurrent load, stacked sync reads introduce latency spikes and prevent the event loop from servicing I/O.

**Recommended Fix:** Replace with `node:fs/promises`:

```cljs
(:require ["node:fs/promises" :as fs-promises])

(-> (.readFile fs-promises path "utf-8")
    (.then (fn [content] ...))
    (.catch (fn [err] (log/error "Read failed" err))))
```

Priority order: `contracts/loader.cljs` and `policy/edn_adapter.cljs` first (hottest paths).

---

### 4. Missing HTTP Request Timeouts

All `js/fetch` calls across the backend lack `AbortController` or timeout wrappers:

| File | Lines | Purpose | Default Timeout |
|------|-------|---------|----------------|
| `http.cljs` | 92-104 | Generic HTTP client | 300s (Node default) |
| `discord_io.cljs` | 20-26 | Discord API calls | 300s |
| `event_agents.cljs` | 129-136 | OpenPlanner/webhook calls | 300s |
| `mcp_bridge.cljs` | 97-110 | MCP server calls | 300s |

**Impact:** Any upstream slowness (Discord API, OpenPlanner, MCP servers) leaves fetch promises dangling indefinitely. The Node.js default fetch timeout is 300 seconds — far too long for agent-turn hot paths and can exhaust connection pools.

**Recommended Fix:** Create a timeout wrapper:

```cljs
(defn fetch-with-timeout
  [url opts timeout-ms]
  (let [controller (js/AbortController.)
        timeout-id (js/setTimeout #(.abort controller) timeout-ms)]
    (-> (js/fetch url (js/Object.assign #js {:signal (.-signal controller)} opts))
        (.finally (fn [] (js/clearTimeout timeout-id))))))

;; Usage
(fetch-with-timeout url opts 30000) ; 30s for API calls
```

Recommended timeouts:
- API calls (Discord, OpenPlanner): 30s
- Health checks: 5s
- MCP tool calls: 60s (tools may be slow)
- File downloads: 120s

---

### 5. Unbounded Concurrent Promise.all Fan-Out

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/event_agents.cljs`  
**Lines:** 1139-1157

```cljs
(-> (js/Promise.all
     (clj->js
      (mapv (fn [job] ...)
            matching-jobs)))
```

If many jobs match a single event (e.g., a broad keyword in a busy channel), all matching jobs launch simultaneously. There is no concurrency limiter. Each job spawns an agent run, which can overwhelm the local process, Redis, and downstream model APIs.

**Recommended Fix:** Implement a concurrency limiter:

```cljs
;; Using p-queue or similar
(def MAX_CONCURRENT_JOBS 5)

(defn dispatch-jobs-limited!
  [jobs]
  (let [queue (js/Promise.allSettled
               (mapv (fn [batch]
                       (js/Promise.all
                        (clj->js (mapv run-job! batch))))
                     (partition-all MAX_CONCURRENT_JOBS jobs)))]
    ...))
```

---

### 6. Stream Error Handling Omission in Media Routes

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/routes/workspace_media.cljs`  
**Lines:** 111-119

```cljs
(let [stream (.createReadStream node-fs absolute #js {:start start :end end})]
  (.code reply 206)
  (.send reply stream))
```

`createReadStream` can emit `'error'` events (file truncated between stat and open, permission changes, disk I/O errors). Fastify's `.send()` will not automatically catch these, and an unhandled `'error'` event on a Node stream will **crash the process**.

**Also affected:** `routes/studio.cljs` (line 159)

**Recommended Fix:**

```cljs
(let [stream (.createReadStream node-fs absolute #js {:start start :end end})]
  (.on stream "error"
       (fn [err]
         (log/error "Media stream error" err)
         (.code reply 500)
         (.send reply #js {:error "Stream failed"})))
  (.code reply 206)
  (.send reply stream))
```

---

## MEDIUM

### 7. Event Listener Leak on Discord Client Reconnect

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/discord_gateway.cljs`  
**Lines:** 292-296, 307-332

```cljs
(.on next-client (.-ClientReady Events) (partial handle-client-ready log-info))
```

On token change or restart, `gw-start` calls `this-stop` which calls `.destroy` on the old client. However, `.destroy` does not remove all Node.js `EventEmitter` listeners. The old client object retains references to closures (`notify-message`, `notify-reaction`, etc.) until garbage collection.

**Recommended Fix:** Explicitly remove listeners before destroy:

```cljs
(defn cleanup-discord-client! [client]
  (.removeAllListeners client)
  (.destroy client))
```

---

### 8. Unbounded Temporary Atom Growth in Guild Channel Listing

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/discord_gateway.cljs`  
**Lines:** 395-408

```cljs
(let [promises (atom #js [])]
  (doseq [[_id guild] (.. active-client -guilds -cache)]
    (swap! promises (fn [ps] (.concat ps #js [...]))))
  (.then (js/Promise.all @promises)
         (fn [results]
           (let [flat (atom #js [])]
             (doseq [r results]
               (swap! flat (fn [f] (.concat f r))))
             @flat))))
```

For bots in many guilds, this creates large intermediate arrays with no size ceiling. Called on every `listChannels` API request.

**Recommended Fix:** Use `reduce` or `mapcat` instead of nested atoms:

```cljs
(-> (js/Promise.all
     (clj->js
      (for [[_id guild] (.. active-client -guilds -cache)]
        (fetch-channels-for-guild guild))))
    (.then (fn [results]
             (into [] (mapcat identity) results))))
```

---

### 9. Accumulating setTimeout Timers in Session Eviction

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/session_store.cljs`  
**Lines:** 255-260

```cljs
(js/setTimeout
 #(do
    (swap! session-cache* dissoc session-id)
    (remove-session! redis-client session-id conversation-id))
 60000)
```

Every non-sticky session completion registers a 60-second timer. Under high throughput, these timers accumulate in the event loop timer queue.

**Recommended Fix:** Use a single periodic sweep instead of per-session timers:

```cljs
(defn start-session-cleanup-loop! []
  (js/setInterval
   #(let [now (js/Date.now)
          stale (for [[id entry] @session-cache*
                      :when (and (not (:sticky? entry))
                                 (> (- now (:last-accessed entry)) 60000))]
                  id)]
      (doseq [id stale]
        (swap! session-cache* dissoc id)
        (remove-session! redis-client id conversation-id)))
   30000)) ; Run every 30s
```

---

### 10. No Backpressure on WS Broadcast Loops

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/realtime.cljs`  
**Lines:** 87-93, 99-120

```cljs
(doseq [[client-id client] @ws-clients*]
  (try
    (safe-ws-send! (aget client "socket") (ws-envelope channel payload))
    (catch :default _
      (swap! ws-clients* dissoc client-id))))
```

`doseq` over all WebSocket clients is synchronous. If one client has a slow network and the OS TCP send buffer fills, the `.send` call can block the event loop briefly. There is no queue depth limit, rate limiting, or slow-client isolation.

**Recommended Fix:** Add per-client send queues and skip slow clients:

```cljs
(defn broadcast-ws! [channel payload]
  (doseq [[client-id client] @ws-clients*]
    (let [socket (aget client "socket")]
      (when (= 1 (.-readyState socket))
        (try
          (.send socket (ws-envelope channel payload))
          (catch js/Error _
            (swap! ws-clients* dissoc client-id)))))))
```

Consider using a library like `ws` with built-in backpressure, or implement a per-client message queue with a max depth.

---

### 11. Deeply Nested Promise Chains

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/agents/stream.cljs`  
**Lines:** 938-960

```cljs
(-> (build-agent-run-payload config job event)
    (.then (fn [raw-body]
             (-> (materialize-content-parts! ...)
                 (.then (fn [materialized-parts]
                          (let [body ...]
                            (-> (agents-runner/spawn-direct! ...)
                                (.then ...)
                                (.catch ...))))))))
```

5+ levels of promise nesting make error propagation and debugging difficult. Unhandled rejections in inner `.catch` blocks can be swallowed.

**Recommended Fix:** Flatten with `p/let` (if using promesa) or extract intermediate functions:

```cljs
(defn- build-and-materialize! [config job event]
  (-> (build-agent-run-payload config job event)
      (.then (fn [raw-body]
               (materialize-content-parts! ... raw-body)))))

(defn- spawn-agent-run! [config job materialized-parts]
  (let [body ...]
    (agents-runner/spawn-direct! ... body)))

(-> (build-and-materialize! config job event)
    (.then (partial spawn-agent-run! config job))
    (.then handle-success)
    (.catch handle-error))
```

---

## LOW

### 12. Large Body Limit Without Streaming Multipart Handling

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/http_server.cljs`  
**Lines:** 12-15

```cljs
(Fastify #js {:logger true
              :bodyLimit (* 50 1024 1024)
              :requestTimeout 600000
              :connectionTimeout 600000
              :forceCloseConnections true})
```

50 MiB body limit and 10-minute request timeouts are generous. While explicit, they increase vulnerability to slowloris and memory exhaustion from maliciously large JSON payloads.

**Recommended Fix:** Reduce timeouts for production:

```cljs
(Fastify #js {:logger true
              :bodyLimit (* 10 1024 1024)       ; 10 MB
              :requestTimeout 60000              ; 1 minute
              :connectionTimeout 60000           ; 1 minute
              :keepAliveTimeout 30000            ; 30 seconds
              :maxRequestsPerSocket 100          ; Limit connection reuse
              :forceCloseConnections true})
```

### 13. Readable Stream Push Without Drain Check in Voice Playback

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/discord_gateway.cljs`  
**Lines:** 569-575

```cljs
(let [stream (new Readable #js {:read (fn [])})]
  (.push stream audio-buffer)
  (.push stream nil)
  ;; ...
  (.play player resource))
```

The custom Readable pushes a buffer without checking the return value of `.push()`. For very large buffers, this ignores backpressure signals from the `AudioPlayer`.

**Recommended Fix:** Check return value and pause/respect backpressure:

```cljs
(let [stream (new Readable #js {:read (fn [])})]
  (when (.push stream audio-buffer)
    (.push stream nil)))
```

---

## Async I/O Summary Matrix

| Pattern | Risk | Affected Files | Priority |
|---------|------|----------------|----------|
| Shell injection | RCE | `event_agents.cljs` | CRITICAL |
| Unbounded PCM buffers | OOM | `discord_gateway.cljs` | CRITICAL |
| Sync file I/O | Event loop blocking | `contracts/loader.cljs`, `policy/edn_adapter.cljs`, `tools/session_mycology.cljs` | HIGH |
| Missing fetch timeouts | Resource leaks | `http.cljs`, `discord_io.cljs`, `event_agents.cljs`, `mcp_bridge.cljs` | HIGH |
| Unbounded Promise.all | Thundering herd | `event_agents.cljs`, `discord_gateway.cljs` | HIGH |
| Stream error handling | Process crashes | `workspace_media.cljs`, `studio.cljs` | HIGH |
| Discord listener leaks | Memory growth | `discord_gateway.cljs` | MEDIUM |
| Nested promises | Debug difficulty | `agents/stream.cljs` | MEDIUM |
| WS backpressure | Latency spikes | `realtime.cljs` | MEDIUM |
| Generous HTTP limits | DoS vector | `http_server.cljs` | LOW |
