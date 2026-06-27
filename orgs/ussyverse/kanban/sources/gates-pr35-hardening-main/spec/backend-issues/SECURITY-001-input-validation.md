# SPEC: Add Input Validation Middleware for WebSocket Messages

**Issue ID:** SECURITY-001
**Severity:** Critical
**Category:** Security & Reliability
**Status:** Proposed
**Created:** 2026-01-22

---
Type: spec
Component: backend
Priority: critical
Status: proposed
Related-Issues: []
Milestone: 3
Estimated-Effort: 20.5 hours
---

## Problem Statement

The WebSocket message handler in `server.clj` (lines 166-301) lacks input validation, creating security and stability risks:

1. **No schema validation** - Client can send malformed data
2. **No range validation** - Numeric values can be extreme (e.g., `:fps` 1000000)
3. **No type checking** - String positions instead of vectors
4. **No authorization** - Anyone can trigger any operation
5. **No rate limiting** - Client can spam messages
6. **Silent failures** - Invalid data causes undefined behavior

### Current State

```clojure
;; server.clj:173-301
(defn handle-ws [req]
  (http/with-channel req ch
    (swap! *clients conj ch)
    (http/on-receive ch
      (fn [raw]
        (let [msg (try (-> (json/parse-string raw true) keywordize-deep)
                       (catch Exception _ nil))
              op (:op msg)]
          (case op
             "tick"
             (let [n (int (or (:n msg) 1))]  ;; NO VALIDATION
                   outs (sim/tick! n))
               ...)

             "set_fps"
             (let [fps (int (or (:fps msg) 15))]  ;; NO VALIDATION
                   ms (if (pos? fps) (/ 1000.0 fps) 66)]
               ...)  ;; Can be negative, zero, or huge

             "place_tree"
             (do (sim/place-tree! (:pos msg))  ;; NO VALIDATION - pos could be anything
                 ...))))))
```

## Security Risks

### Risk 1: Integer Overflow / Crash
```clojure
;; Client sends: {"op":"tick","n":9999999999}
;; Result: System hangs or crashes trying to process 9B ticks
(let [n (int (or (:n msg) 1))]
  (sim/tick! n))  ;; n is unchecked
```

### Risk 2: Invalid Coordinates
```clojure
;; Client sends: {"op":"place_tree","pos":null}
;; Or: {"op":"place_tree","pos":[-99999,99999]}
;; Or: {"op":"place_tree","pos":"invalid"}
;; Result: nil pointer exceptions or logic errors
(sim/place-tree! (:pos msg))
```

### Risk 3: Denial of Service
```clojure
;; Client spams:
{"op":"tick","n":1000}
{"op":"tick","n":1000}
{"op":"tick","n":1000}
...
;; Result: Server CPU spikes, legitimate clients starved
```

### Risk 4: Resource Exhaustion
```clojure
;; Client sends: {"op":"set_facet_limit","limit":1000000}
;; Result: Memory exhaustion from facet calculations
(sim/set-facet-limit! (:limit msg))
```

## Proposed Solution

### 1. Schema Validation Library

Add `malli` to `deps.edn`:

```clojure
{:deps {org.clojure/clojure {:mvn/version "1.11.3"}
        metosin/malli {:mvn/version "0.10.0"}  ;; Add this
        ...}}
```

### 2. Validation Middleware

Create `backend/src/fantasia/server/validation.clj`:

```clojure
(ns fantasia.server.validation
  (:require [malli.core :as m]
            [malli.error :as me]
            [fantasia.dev.logging :as log]))

;; Common schemas
(def Pos
  [:tuple :int :int])

(def AgentId
  [:or :string :keyword])

(def JobType
  [:enum :job/eat :job/hunt :job/chop-tree :job/sleep ...])

(def Resource
  [:enum :wood :log :food :fruit :berry :grain :rock ...])

(def Structure
  [:enum :stockpile :house :campfire :wall :temple ...])

;; Op schemas
(def schemas
  {"tick" [:map
           [:op [:enum "tick"]]
           [:n {:optional true} [:int {:min 1 :max 100}]]]

   "reset" [:map
            [:op [:enum "reset"]]
            [:seed {:optional true} :int]
            [:tree_density {:optional true} [:double {:min 0.0 :max 1.0}]]
            [:bounds {:optional true} [:map [:w :int] [:h :int]]]]

   "set_levers" [:map
                 [:op [:enum "set_levers"]]
                 [:levers :map]]

   "place_shrine" [:map
                   [:op [:enum "place_shrine"]]
                   [:pos Pos]]

   "place_tree" [:map
                  [:op [:enum "place_tree"]]
                  [:pos Pos]]

   "place_wolf" [:map
                  [:op [:enum "place_wolf"]]
                  [:pos Pos]]

   "place_deer" [:map
                  [:op [:enum "place_deer"]]
                  [:pos Pos]]

   "place_bear" [:map
                  [:op [:enum "place_bear"]]
                  [:pos Pos]]

   "place_campfire" [:map
                     [:op [:enum "place_campfire"]]
                     [:pos Pos]]

   "place_stockpile" [:map
                      [:op [:enum "place_stockpile"]]
                      [:pos Pos]
                      [:resource Resource]
                      [:max_qty {:optional true} [:int {:min 1 :max 1000}]]]

   "place_wall_ghost" [:map
                        [:op [:enum "place_wall_ghost"]]
                        [:pos Pos]]

   "queue_build" [:map
                  [:op [:enum "queue_build"]]
                  [:pos Pos]
                  [:structure Structure]
                  [:stockpile {:optional true} [:map [:resource Resource]]]]

   "assign_job" [:map
                  [:op [:enum "assign_job"]]
                  [:agent_id AgentId]
                  [:job_type JobType]
                  [:target_pos Pos]]

   "start_run" [:map
                 [:op [:enum "start_run"]]]

   "stop_run" [:map
                [:op [:enum "stop_run"]]]

   "set_fps" [:map
               [:op [:enum "set_fps"]]
               [:fps [:int {:min 1 :max 60}]]]

   "set_facet_limit" [:map
                       [:op [:enum "set_facet_limit"]]
                       [:limit [:int {:min 1 :max 64}]]]

   "set_vision_radius" [:map
                        [:op [:enum "set_vision_radius"]]
                        [:radius [:int {:min 1 :max 50}]]]

   "appoint_mouthpiece" [:map
                         [:op [:enum "appoint_mouthpiece"]]
                         [:agent_id AgentId]]

   "get_agent_path" [:map
                      [:op [:enum "get_agent_path"]]
                      [:agent_id AgentId]]})

(defn validate-message [msg]
  (let [op (:op msg)
        schema (get schemas op)]
    (cond
      (nil? op)
      {:valid? false
       :error "Missing 'op' field"
       :code "MISSING_OP"}

      (nil? schema)
      {:valid? false
       :error (str "Unknown op: " op)
       :code "UNKNOWN_OP"}

      (m/validate schema msg)
      {:valid? true}

      :else
      (let [errors (me/humanize (m/explain schema msg))]
        {:valid? false
         :error (str "Validation failed: " (first errors))
         :details errors
         :code "VALIDATION_ERROR"}))))

(defn wrap-validation [handler]
  (fn [raw]
    (let [msg (try (-> (json/parse-string raw true) keywordize-deep)
                   (catch Exception e
                     (log/log-error "[WS:VALIDATION]" {:error "Invalid JSON" :raw raw})
                     {:validation-error "Invalid JSON"}))]
      (if (:validation-error msg)
        {:op "error" :message (:validation-error msg)}
        (let [result (validate-message msg)]
          (if (:valid? result)
            (handler msg)
            (do
              (log/log-warn "[WS:VALIDATION]" result)
              {:op "error"
               :message (:error result)
               :code (:code result)})))))))
```

### 3. Rate Limiting

Create `backend/src/fantasia/server/rate-limit.clj`:

```clojure
(ns fantasia.server.rate-limit
  (:require [clojure.core.async :as async]
            [fantasia.dev.logging :as log]))

(defonce *rate-limits (atom {}))

(def max-messages-per-second 10)
def rate-limit-window-ms 1000

(defn get-client-id [ch]
  (str (System/identityHashCode ch)))

(defn check-rate-limit! [client-id]
  (let [now (System/currentTimeMillis)
        client-data (get @*rate-limits client-id {:messages [] :last-check now})
        {:keys [messages last-check]} client-data
        window-start (- now rate-limit-window-ms)
        recent-messages (filter #(> % window-start) messages)
        message-count (count recent-messages)]
    (if (< message-count max-messages-per-second)
      (do
        (swap! *rate-limits
               update client-id
               assoc :messages (conj recent-messages now) :last-check now)
        {:allowed? true})
      {:allowed? false
       :retry-after (- (+ last-check rate-limit-window-ms) now)
       :message-count message-count})))

(defn wrap-rate-limit [handler]
  (fn [ch raw-msg]
    (let [client-id (get-client-id ch)
          result (check-rate-limit! client-id)]
      (if (:allowed? result)
        (handler raw-msg)
        (do
          (log/log-warn "[WS:RATE-LIMIT]" {:client-id client-id
                                             :message-count (:message-count result)
                                             :retry-after (:retry-after result)})
          {:op "error"
           :message "Rate limit exceeded"
           :retry-after (:retry-after result)})))))
```

### 4. Updated WebSocket Handler

Update `server.clj`:

```clojure
(ns fantasia.server
  (:require
    [fantasia.server.validation :as validation]
    [fantasia.server.rate-limit :as rate-limit]
    ...))

(defn handle-raw-message [ch raw]
  (let [validated (validation/wrap-validation
                  (rate-limit/wrap-rate-limit
                   (fn [msg]
                     (handle-validated-message ch msg))))]
    (validated ch raw)))

(defn handle-validated-message [ch msg]
  (let [op (:op msg)]
    (case op
       "tick"
       (let [n (:n msg 1)]
         (handle-tick ch n))

       "reset"
       (let [opts {:seed (:seed msg 1)
                   :tree-density (:tree_density msg 0.08)
                   :bounds (:bounds msg)}]
         (handle-reset ch opts))

       "set_fps"
       (let [fps (:fps msg 15)]
         (handle-set-fps ch fps))

       "place_tree"
       (let [pos (:pos msg)]
         (handle-place-tree ch pos))

       ...)))

(defn handle-tick [ch n]
  (let [outs (sim/tick! n)]
    (doseq [o outs]
      (broadcast! {:op "tick" :data (select-keys o [:tick :snapshot :attribution])})
      ...)))

(defn handle-place-tree [ch pos]
  (sim/place-tree! pos)
  (broadcast! {:op "tiles" :tiles (get-visible-tiles (sim/get-state))}))

;; Update handle-ws to use new handler
(defn handle-ws [req]
  (http/with-channel req ch
    (swap! *clients conj ch)
    (ws-send! ch {:op "hello"
                  :state (merge (select-keys (sim/get-state) [:tick :shrine :levers :map :agents])
                                {:tiles (get-visible-tiles (sim/get-state))})})
    (http/on-close ch (fn [_] (swap! *clients disj ch)))
    (http/on-receive ch handle-raw-message))))
```

## Operation Validation Rules

### Numeric Validations

| Field | Type | Min | Max | Default | Notes |
|-------|------|-----|-----|---------|--------|
| `n` (tick count) | int | 1 | 100 | 10 recommended |
| `fps` | int | 1 | 60 | 15 recommended |
| `facet_limit` | int | 1 | 64 | 16 recommended |
| `vision_radius` | int | 1 | 50 | 15 recommended |
| `max_qty` (stockpile) | int | 1 | 1000 | 120 recommended |
| `tree_density` | double | 0.0 | 1.0 | 0.08 recommended |
| `seed` | int | 0 | Long/MAX_VALUE | 1 recommended |

### Position Validations

All positions must be:
- Vector of exactly 2 integers: `[q r]`
- Within world bounds (checked at runtime)
- Not nil

### Agent ID Validations

Agent IDs can be:
- Keywords (e.g., `:agent-123`)
- Strings (e.g., `"agent-123"`)
- Must reference existing agent (checked at runtime)

### Resource Validations

Valid resources:
- `:wood`, `:log` (interchangeable)
- `:food`, `:fruit`, `:berry`, `:grain`, `:raw-meat`, `:cooked-meat`, `:stew`
- `:rock`
- `:ore-iron`, `:ore-copper`, `:ore-tin`, `:ore-gold`, `:ore-silver`, `:ore-aluminum`, `:ore-lead`

### Structure Validations

Valid structures:
- `:stockpile`, `:house`, `:campfire`, `:wall`
- `:lumberyard`, `:orchard`, `granary`, `farm`, `:quarry`
- `:warehouse`, `:smelter`, `:improvement-hall`, `:workshop`
- `:temple`, `:school`, `:library`
- `:statue/dog`, `:road`

## Error Response Format

```clojure
;; Validation errors
{:op "error"
 :message "Validation failed: n must be between 1 and 100"
 :code "VALIDATION_ERROR"
 :details {:field "n" :value 9999 :constraint [:int {:min 1 :max 100}]}}

;; Unknown op
{:op "error"
 :message "Unknown op: invalid_op"
 :code "UNKNOWN_OP"}

;; Missing field
{:op "error"
 :message "Missing 'op' field"
 :code "MISSING_OP"}

;; Rate limit
{:op "error"
 :message "Rate limit exceeded"
 :code "RATE_LIMIT"
 :retry-after 5000}

;; Invalid JSON
{:op "error"
 :message "Invalid JSON"
 :code "JSON_PARSE_ERROR"}
```

## Security Enhancements

### 1. Operation Authorization

Add authorization checks:

```clojure
(defn authorize-op? [client-id op]
  (case op
    ;; Read-only ops: allowed
    ("tick" "get_agent_path")
    true

    ;; Admin ops: check authorization
    ("reset" "set_levers" "set_fps" "set_facet_limit" "set_vision_radius")
    (authorized-admin? client-id)

    ;; Write ops: check if client has permission
    ("place_tree" "place_wolf" "place_deer" "place_bear"
     "place_campfire" "place_stockpile" "place_wall_ghost"
     "queue_build" "assign_job" "appoint_mouthpiece")
    (authorized-write? client-id)

    ;; Default: deny
    false))
```

### 2. Client Identification

Track client metadata:

```clojure
(defonce *clients-metadata (atom {}))

(defn register-client! [ch]
  (let [client-id (get-client-id ch)
        metadata {:connected-at (System/currentTimeMillis)
                  :ip-address (get-remote-addr ch)
                  :user-agent (get-header ch "user-agent")}]
    (swap! *clients-metadata assoc client-id metadata)))

(defn get-remote-addr [ch]
  ;; Extract remote address from http-kit channel
  ...)
```

## Testing Requirements

### Unit Tests

```clojure
(ns fantasia.server.validation-test
  (:require [clojure.test :refer [deftest is testing]]
            [fantasia.server.validation :as v]))

(deftest validate-message
  (testing "valid tick message"
    (let [msg {:op "tick" :n 5}]
      (is (true? (:valid? (v/validate-message msg))))))

  (testing "tick with invalid n (too large)"
    (let [msg {:op "tick" :n 9999}]
      (is (false? (:valid? (v/validate-message msg)))
      (is (str/includes? (:error (v/validate-message msg)) "n")))))

  (testing "missing op field"
    (let [msg {:n 5}]
      (is (false? (:valid? (v/validate-message msg)))
      (is (= "MISSING_OP" (:code (v/validate-message msg)))))))

  (testing "unknown op"
    (let [msg {:op "invalid_op"}]
      (is (false? (:valid? (v/validate-message msg)))
      (is (= "UNKNOWN_OP" (:code (v/validate-message msg)))))))
```

### Integration Tests

```clojure
(deftest websocket-message-handling
  (testing "rejects invalid JSON"
    (send-ws-msg "{invalid json")
    (is (= {:op "error" :message "Invalid JSON"}
           (read-ws-msg))))

  (testing "rejects tick with n > 100"
    (send-ws-msg "{\"op\":\"tick\",\"n\":999}")
    (is (= {:op "error" :code "VALIDATION_ERROR"}
           (read-ws-msg))))

  (testing "rate limits excessive messages"
    (dotimes [i 100]
      (send-ws-msg "{\"op\":\"tick\",\"n\":1}"))
    (is (= {:op "error" :code "RATE_LIMIT"}
           (read-ws-msg)))))
```

### Security Tests

```clojure
(deftest security-tests
  (testing "cannot set fps to negative"
    (send-ws-msg "{\"op\":\"set_fps\",\"fps\":-1}")
    (is (error-response? (read-ws-msg))))

  (testing "cannot set facet_limit to huge value"
    (send-ws-msg "{\"op\":\"set_facet_limit\",\"limit\":1000000}")
    (is (error-response? (read-ws-msg))))

  (testing "cannot place tree at invalid position"
    (send-ws-msg "{\"op\":\"place_tree\",\"pos\":null}")
    (is (error-response? (read-ws-msg)))))
```

## Definition of Done

### Security
- [ ] All WebSocket ops have validation schemas
- [ ] Rate limiting implemented and active
- [ ] No integer overflow possible
- [ ] Invalid positions rejected
- [ ] Authorization checks in place (if needed)

### Reliability
- [ ] All numeric inputs have min/max constraints
- [ ] Invalid JSON returns error (not crash)
- [ ] Missing required fields return error
- [ ] Unknown ops return error with explanation
- [ ] Error responses follow consistent format

### Testing
- [ ] Unit tests for all validation schemas
- [ ] Integration tests for WebSocket flow
- [ ] Security tests for edge cases
- [ ] Load tests verify rate limiting works

### Documentation
- [ ] API_DOCUMENTATION.md updated with validation rules
- [ ] Error codes documented
- [ ] Rate limits documented
- [ ] AGENTS.md updated with validation requirements

### Performance
- [ ] Validation adds < 1ms to message processing
- [ ] Rate limiting state cleanup implemented
- [ ] No memory leaks from client metadata tracking

## Estimated Effort

- Add malli dependency: 0.5 hours
- Create validation module: 4 hours
- Create rate limiting module: 3 hours
- Update server handler: 2 hours
- Write unit tests: 4 hours
- Write integration tests: 3 hours
- Write security tests: 2 hours
- Documentation: 2 hours

**Total: ~20.5 hours (3 days)**

## Related Issues

- SECURITY-002: Implement rate limiting
- PERF-001: Optimize validation for hot paths
- DOC-003: Document error codes

## References

- Malli documentation: https://github.com/metosin/malli
- Current code: `backend/src/fantasia/server.clj:166-301`
- API documentation: `backend/API_DOCUMENTATION.md`
