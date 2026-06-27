# Memory Management & Leaks

## CRITICAL

### 1. `agent-sessions*` — Unbounded Agent Session Registry

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/agent_runtime.cljs`  
**Lines:** 23, 782-829, 835-848

```cljs
(defonce agent-sessions* (atom {}))
;; ...
(swap! agent-sessions* assoc conversation-id {:session next-session ...})
```

Every call to `ensure-agent-session!` assoc's a new entry keyed by `conversation-id`. `remove-agent-session!` exists and is called in `finalize-turn-success!` and `finalize-turn-failure!`, but any abnormal termination, unhandled promise rejection, or process crash leaves the entry permanently.

**Impact:** Each entry holds a full `AgentSession` object with message history, tool registries, and SDK state. Under sustained load (many unique conversations, event agents, cron jobs), this map grows without bound until process OOM.

**Evidence of cleanup attempt (insufficient):**
```cljs
(defn remove-agent-session!
  [conversation-id]
  (swap! agent-sessions* dissoc conversation-id))
```

This is only called on the happy path. Any exception in the turn pipeline skips it.

**Recommended Fix:**
1. Add a `MAX_AGENT_SESSIONS` constant (default 500)
2. Implement LRU eviction
3. Add a periodic sweep that removes entries inactive > 4 hours
4. Wrap `remove-agent-session!` in `finally` blocks

```cljs
(def MAX_AGENT_SESSIONS 500)
(def SESSION_INACTIVE_TTL_MS (* 4 60 60 1000))

(defn- evict-oldest-session! []
  (when (> (count @agent-sessions*) MAX_AGENT_SESSIONS)
    (let [oldest (apply min-key (comp :last-accessed val) @agent-sessions*)]
      (swap! agent-sessions* dissoc (key oldest)))))

(defn ensure-agent-session! [...]
  (evict-oldest-session!)
  (swap! agent-sessions* assoc conversation-id
         {:session next-session
          :last-accessed (js/Date.now)
          ...}))

(defn start-session-sweep! []
  (js/setInterval
   #(let [cutoff (- (js/Date.now) SESSION_INACTIVE_TTL_MS)]
      (swap! agent-sessions*
             (fn [sessions]
               (into {} (filter (fn [[_ v]]
                                  (> (:last-accessed v) cutoff))
                                sessions)))))
   300000)) ; Every 5 minutes
```

---

### 2. `session-cache*` — Sticky Sessions Never Evicted

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/session_store.cljs`  
**Lines:** 60, 251-261

```cljs
(let [sticky? (str/includes? (str session-id) "-sticky")]
  (if sticky?
    nil
    (js/setTimeout #(swap! session-cache* dissoc session-id) 60000)))
```

`session-cache*` caches sessions in memory. Non-sticky sessions are evicted after 60 seconds, but **sticky sessions are preserved indefinitely**. In event-agent workloads with many sticky sessions, this atom grows without bound.

**Recommended Fix:** Apply a longer TTL even to sticky sessions:

```cljs
(def STICKY_SESSION_TTL_MS (* 24 60 60 1000)) ; 24 hours

(let [sticky? (str/includes? (str session-id) "-sticky")
      ttl (if sticky? STICKY_SESSION_TTL_MS 60000)]
  (js/setTimeout #(swap! session-cache* dissoc session-id) ttl))
```

Or implement a size-based LRU cap on `session-cache*`.

---

### 3. `actor-managers*` — Unbounded Discord Gateway Manager Instances

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/discord_gateway.cljs`  
**Lines:** 847, 899-907, 917-941

```cljs
(defonce ^:private actor-managers* (atom {}))
;; ...
(doseq [[actor-id manager] @actor-managers*]
  (when-not (contains? active-actor-ids actor-id)
    (try (.stop manager) (catch js/Error _))
    (swap! actor-managers* dissoc actor-id)))
```

Each manager holds a heavy discord.js Client with large internal caches (guild cache, channel cache, message cache). If `.stop` throws an exception, the `dissoc` is skipped and the entry leaks.

**Recommended Fix:** Use `finally` to ensure cleanup:

```cljs
(doseq [[actor-id manager] @actor-managers*]
  (when-not (contains? active-actor-ids actor-id)
    (try
      (.stop manager)
      (catch js/Error e
        (log/error "Failed to stop actor manager" actor-id e))
      (finally
        (swap! actor-managers* dissoc actor-id)))))
```

Also add a max-actor limit and TTL sweep.

---

### 4. `mcp-sessions*` — Unbounded MCP Session Storage

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/routes/mcp.cljs`  
**Lines:** 19, 606-634

```cljs
(defonce ^:private mcp-sessions* (atom {}))
```

There is no `dissoc` path visible in the route handlers — sessions are retrieved but never removed. Each transport holds an HTTP server reference and Zod schema objects.

**Recommended Fix:**
1. Add a DELETE handler that properly cleans up:

```cljs
(defn cleanup-mcp-session! [session-id]
  (when-let [session (get @mcp-sessions* session-id)]
    (when-let [transport (get session "transport")]
      (try (.close transport) (catch js/Error _)))
    (swap! mcp-sessions* dissoc session-id)))
```

2. Add TTL-based sweep for expired sessions (check JWT `exp` claim)

---

## HIGH

### 5. `conversation-access*` — Unbounded Conversation Access Cache

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/agents/turn.cljs`  
**Line:** 34

```cljs
(defonce conversation-access* (atom {}))
```

Maps conversation-ids to access snapshots. Entries are added via `remember-conversation-access!` but never removed.

**Recommended Fix:** Add TTL sweep or size cap:

```cljs
(def MAX_CONVERSATION_ACCESS 1000)
(def CONVERSATION_ACCESS_TTL_MS (* 2 60 60 1000))

(defn remember-conversation-access! [conversation-id access]
  (swap! conversation-access* assoc conversation-id
         {:access access
          :timestamp (js/Date.now)}))
```

---

### 6. `database-state*` — Unbounded Database Profile Storage

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/document_state.cljs`  
**Lines:** 10, 70-96

```cljs
(defonce database-state* (atom {:profiles {} :records {}}))
```

`ensure-database-state!` adds new profiles/records for each org/auth-context. The `:history` vectors inside records are capped at 50, but the top-level maps grow with each unique database ID.

**Recommended Fix:** Add TTL/size caps:

```cljs
(def MAX_DATABASE_PROFILES 100)
(def MAX_DATABASE_RECORDS 500)

(defn ensure-database-state! [...]
  (swap! database-state*
         (fn [state]
           (let [profiles (cond-> (:profiles state)
                           (> (count %) MAX_DATABASE_PROFILES)
                           (dissoc (first (keys %))))]
             ...))))
```

---

### 7. `servers*` in MCP Bridge — No Disconnect or Cleanup

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/mcp_bridge.cljs`  
**Lines:** 13, 138-154, 165-179

```cljs
(defonce servers* (atom {}))
```

Holds connected MCP server configs and HTTP client functions. `initialize!` can be called repeatedly but never clears old entries. No `disconnect-server!` or `remove-server!` function exists.

**Recommended Fix:** Add cleanup:

```cljs
(defn disconnect-server! [server-id]
  (when-let [server (get @servers* server-id)]
    (when-let [client (:http-client server)]
      (try (.close client) (catch js/Error _)))
    (swap! servers* dissoc server-id)))

(defn initialize! [...]
  ;; Clean up stale servers before reconnecting
  (doseq [old-id (keys @servers*)]
    (when-not (some #(= (:id %) old-id) new-server-configs)
      (disconnect-server! old-id)))
  ...)
```

---

### 8. Temporary File Leak — `/tmp/` Attachments Never Deleted

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/event_agents.cljs`  
**Lines:** 513-540

```cljs
(let [local-path (str "/tmp/" filename)]
  ;; curl downloads to local-path, then sanitize-svg-file! reads it.
  ;; No cleanup code follows.
```

**Impact:** Over time the `/tmp` directory fills with attachment downloads. On systems with limited `/tmp` size (tmpfs), this can exhaust disk space and crash the process.

**Recommended Fix:** Delete files after use or use a temp library:

```cljs
(:require ["tmp" :as tmp])

(let [tmp-obj (tmp/fileSync #js {:prefix "knoxx-" :postfix (str "." ext)})
      local-path (.-name tmp-obj)]
  (-> (download-attachment! url local-path)
      (.then (fn [] (sanitize-svg-file! local-path)))
      (.finally (fn [] (.removeCallback tmp-obj)))))
```

Or with manual cleanup:

```cljs
(.finally (fn []
            (fs/unlink local-path
                       (fn [err]
                         (when err
                           (log/warn "Failed to clean up temp file" local-path err))))))
```

---

### 9. Discord.js Event Listener Leak

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/discord_gateway.cljs`  
**Lines:** 292-296

`build-discord-client` attaches handlers with `.on` for `ClientReady`, `MessageCreate`, `MessageReactionAdd`, `Error`, and `VoiceStateUpdate`. `gw-stop` calls `.destroy` but does not call `.removeListener` for each handler.

**Recommended Fix:**

```cljs
(defn build-discord-client [...]
  (let [client (new discord/Client ...)
        listeners [(.-ClientReady Events) handle-client-ready
                   (.-MessageCreate Events) handle-message
                   (.-MessageReactionAdd Events) handle-reaction
                   (.-Error Events) handle-error
                   (.-VoiceStateUpdate Events) handle-voice-state]]
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

### 10. WebSocket Client Leak on Unclean Disconnect

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/realtime.cljs`  
**Lines:** 11, 89-93, 101-120

`ws-clients*` entries are only removed when `.send` throws an exception. If a client disconnects without sending a close frame or error event, the entry persists.

**Recommended Fix:** Add heartbeat/idle timeout:

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

### 11. `active-turns*` — Unbounded Turn Control Registry

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/turn_control.cljs`  
**Lines:** 11, 22-25

```cljs
(defonce active-turns* (atom {}))

(defn register-active-turn!
  [conversation-id entry]
  (swap! active-turns* assoc (str conversation-id) entry))
```

Registers active turns by conversation-id. `unregister-active-turn!` is called on normal completion, but crashes or unhandled rejections skip this.

**Recommended Fix:** Wrap in `finally`:

```cljs
(defn send-agent-turn! [...]
  (let [turn-id (register-active-turn! conversation-id {...})]
    (-> (execute-turn! ...)
        (.then (fn [result]
                 (unregister-active-turn! conversation-id)
                 result))
        (.catch (fn [err]
                  (unregister-active-turn! conversation-id)
                  (throw err))))))
```

Better yet, use a `try/finally` or promise `.finally`:

```cljs
(-> (execute-turn! ...)
    (.finally (fn [] (unregister-active-turn! conversation-id))))
```

---

### 12. Large Transient Data Structures During OpenPlanner Event Indexing

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/openplanner_memory.cljs`  
**Lines:** 555-567, 596-750

```cljs
(let [all-events (concat base-events graph-events tool-events media-events)]
  ...)
```

For a run with many tool receipts, this creates a vector of thousands of maps, each holding large `:text` strings. The entire structure is held in memory until the HTTP POST completes.

**Recommended Fix:** Stream events in chunks:

```cljs
(defn index-events-in-chunks! [events chunk-size]
  (let [chunks (partition-all chunk-size events)]
    (-> (js/Promise.resolve nil)
        (.then (fn next-chunk []
                 (when-let [chunk (first chunks)]
                   (-> (post-events! chunk)
                       (.then #(next-chunk)))))))))

;; Usage: stream 100 events at a time
(index-events-in-chunks! all-events 100)
```

---

## MEDIUM

### 13. Closure Captures in Tool Wrappers Preventing GC

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/agent_runtime.cljs`  
**Lines:** 398-423

`wrap-tool-execute-with-agent-context!` creates closures over `context` and `previous`. These closures are attached to JS tool objects. When sessions are rebuilt, old tool objects should be GC'd, but if any external reference retains them, the closures and their captured `agent-spec` maps are leaked.

**Recommended Fix:** Use `WeakRef` for tool object references, or explicitly null out old tool objects when rebuilding sessions:

```cljs
(defn rebuild-session! [conversation-id ...]
  (when-let [old-session (get-in @agent-sessions* [conversation-id :session])]
    ;; Clear old tool references to allow GC
    (doseq [tool (aget old-session "tools")]
      (aset tool "execute" nil))
    (remove-agent-session! conversation-id))
  ...)
```

### 14. `run-state/retrieval-stats*` — Bounded but Retains 100 Samples

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/run_state.cljs`  
**Lines:** 16-20, 324-340

Capped at 100 samples via `take-last 100`. This is acceptable but means the atom always holds 100 numbers for the process lifetime.

**Status:** ACCEPTABLE — no action needed.

---

### 15. Large String Concatenation in Session Rehydration

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/agent_runtime.cljs`  
**Lines:** 226-237

`merge-restored-session-messages` compares message histories using `subvec` in a loop, creating intermediate vectors. For long conversations this is O(n²) in vector allocation.

**Recommended Fix:** Use hash-based comparison or track a message checksum:

```cljs
(defn- message-fingerprint [messages]
  (hash (mapv :id messages)))

(defn merge-restored-session-messages [restored current]
  (if (= (message-fingerprint restored) (message-fingerprint current))
    current
    (vec (concat restored (drop (count restored) current)))))
```

---

### 16. `extension-runtime/extensions*` and `command-handlers*` — Unbounded but Low Volume

**File:** `packages/agents/knoxx/backend/src/cljs/knoxx/backend/extension_runtime.cljs`  
**Lines:** 33-34

No size limits, but currently only load built-in extensions. Risk increases if dynamic extension loading is added later.

**Status:** MONITOR — no immediate action needed.

---

## Memory Leak Severity Matrix

| Registry/File | Type | Cleanup Path | Bounded? | Severity |
|--------------|------|-------------|----------|----------|
| `agent-sessions*` | Agent session objects | Happy path only | No | CRITICAL |
| `session-cache*` | Session data | 60s timer (non-sticky only) | No | CRITICAL |
| `actor-managers*` | Discord.js clients | Exception-skips cleanup | No | CRITICAL |
| `mcp-sessions*` | MCP transports | None | No | CRITICAL |
| `conversation-access*` | Access snapshots | None | No | HIGH |
| `database-state*` | DB profiles/records | None | Partial (history capped) | HIGH |
| `servers*` (MCP) | HTTP clients | None | No | HIGH |
| `/tmp/` files | Downloaded attachments | None | N/A | HIGH |
| Discord listeners | EventEmitter listeners | `.destroy` only | No | HIGH |
| `ws-clients*` | WebSocket objects | On send error only | No | HIGH |
| `active-turns*` | Turn metadata | Happy path only | No | HIGH |
| `openplanner_memory` | Event vectors | After POST | No | HIGH |
| Tool closures | Captured context | On session rebuild | No | MEDIUM |
| `retrieval-stats*` | Numbers | N/A | Yes (100) | LOW |
| `extensions*` | Extension fns | N/A | No | LOW |

---

## Positive Findings (Correctly Bounded)

The following patterns demonstrate correct memory management and should be used as templates:

| Registry | File | Cap | Mechanism |
|----------|------|-----|-----------|
| `runs*` | `run_state.cljs` | 200 | `MAX_RUNS` with stale eviction |
| `run-order*` | `run_state.cljs` | 200 | `MAX_RUNS` with stale eviction |
| `recent-events*` | `event_agents.cljs` | 30 | `take-last` |
| `dispatched-event-ids*` | `event_agents.cljs` | 500 | Sweep every 10 minutes |
| `lounge-messages*` | `lounge.cljs` | 100 | `take-last` |
| `session-titles*` | `session_store.cljs` | 512 | `SESSION_TITLES_CACHE_MAX` |
| `temp-memory/local-store*` | `temp_memory.cljs` | 256 | TTL sweep |
| `chat-buffer` (Twitch) | `twitch.cljs` | 100 | Per-channel cap |

These bounded patterns prove the codebase can handle memory limits correctly. The remaining leaks represent gaps in a systematic audit.

---

## Recommended Memory Safety Architecture

To prevent future leaks, implement a unified registry pattern:

```cljs
(ns knoxx.backend.registry)

(defn create-registry
  "Create a bounded, TTL-aware registry"
  [{:keys [max-size ttl-ms sweep-interval-ms]
    :or {max-size 500
         ttl-ms (* 4 60 60 1000)
         sweep-interval-ms 300000}}]
  (let [state* (atom {})]
    ;; Start sweep loop
    (js/setInterval
     #(swap! state*
             (fn [state]
               (let [cutoff (- (js/Date.now) ttl-ms)]
                 (into {} (filter (fn [[_ v]]
                                    (> (or (:timestamp v) 0) cutoff))
                                  state)))))
     sweep-interval-ms)
    {:get (fn [k] (get-in @state* [k :value]))
     :put (fn [k v]
            (swap! state* assoc k {:value v :timestamp (js/Date.now)})
            (when (> (count @state*) max-size)
              (let [oldest (apply min-key (comp :timestamp val) @state*)]
                (swap! state* dissoc (key oldest)))))
     :remove (fn [k] (swap! state* dissoc k))
     :clear (fn [] (reset! state* {}))}))
```

Replace `agent-sessions*`, `session-cache*`, `conversation-access*`, and `database-state*` with instances of this pattern.
