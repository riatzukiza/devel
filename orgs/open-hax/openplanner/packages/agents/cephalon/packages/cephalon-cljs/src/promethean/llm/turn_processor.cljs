(ns promethean.llm.turn-processor
  "Turn processing pipeline for CLJS runtime.
   
   Implements:
   - Context assembly (memory + graph + recent events)
   - LLM call with tool definitions
   - Tool call parsing and execution
   - Result emission to event bus"
  (:require
    [promethean.debug.log :as log]
    [promethean.llm.openai :as openai]
    [promethean.tools.executor :as tools]
    [promethean.memory.store :as mem]
    [promethean.eidolon.nexus-index :as nexus]))

;; ============================================================================
;; Token Budgets (from MVP spec)
;; ============================================================================

(def token-budgets
  {:system+developer 0.06  ; 6%
   :persistent 0.08       ; 8%
   :recent 0.18           ; 18%
   :related 0.42          ; 42% (min 1.6× recent)
   :safety 0.03})         ; 3%

;; ============================================================================
;; Context Assembly
;; ============================================================================

(defn- memory->message [mem]
  {:role (case (:memory/role mem)
           :user "user"
           :assistant "assistant"
           :system "system"
           :tool "user"
           "user")
   :content (get-in mem [:memory/content :text] "")})

(defn- build-context-messages
  "Assemble messages in order from MVP spec."
  [session event {:keys [memory-store nexus-index]} opts]
  (let [session-id (:session/id session)
        max-tokens (:max-tokens opts 4096)
        related-budget (int (* max-tokens (:related token-budgets)))
        recent-budget (int (* max-tokens (:recent token-budgets)))]
    (concat
      ;; 1. System (hard-locked)
      [{:role "system"
        :content (or (:session/system-prompt session) "You are a helpful assistant.")}]
      
      ;; 2. Developer (contract)
      (when-let [dev-prompt (:session/developer-prompt session)]
        [{:role "developer"
          :content dev-prompt}])
      
      ;; 3. Session personality
      (when-let [persona (:session/persona session)]
        [{:role "system"
          :content persona}])
      
      ;; 4. Persistent (pinned memories)
      ;; TODO: Implement pinned memory retrieval
      
      ;; 5. Related (retrieved, scored)
      (let [query-text (get-in event [:event/payload :content] "")
            seed-keys (or (:memory/nexus-keys event) [])
            neighbors (nexus/neighbors nexus-index seed-keys)
            neighbor-ids (take 10 (keys (sort-by val > neighbors)))
            related (keep #(mem/get-memory memory-store %) neighbor-ids)]
        (map memory->message related))
      
      ;; 6. Recent (last N events)
      (let [recent (:session/recent session)]
        (map memory->message (take-last 20 recent)))
      
      ;; 7. Current input
      [{:role "user"
        :content (get-in event [:event/payload :content] "")}])))

;; ============================================================================
;; Tool Call Parsing
;; ============================================================================

(defn- parse-tool-call [text]
  "Extract tool call from LLM output (handles markdown and JSON formats)."
  (let [;; Try JSON block first
        json-match (.match text #"(?s)```json\s*([\s\S]*?)```")]
    (if json-match
      (try
        (let [parsed (js/JSON.parse (nth json-match 1))]
          {:name (.-name parsed)
           :args (js->clj (.-arguments parsed) :keywordize-keys false)})
        (catch js/Error _
          nil))
      ;; Try inline tool pattern
      (let [tool-match (.match text #"tool:\s*(\w+)\s*\n?\s*(\{[\s\S]*\})?")]
        (if tool-match
          {:name (nth tool-match 1)
           :args (try
                   (js->clj (js/JSON.parse (or (nth tool-match 2) "{}")) :keywordize-keys false)
                   (catch js/Error _ {}))}
          nil)))))

(defn- extract-tool-calls [response-text]
  "Extract all tool calls from response."
  (let [;; OpenAI-style tool_calls
        tool-calls-regex #"(?s)<tool_call[^>]*>([\s\S]*?)</tool_call?>"
        matches (.match response-text tool-calls-regex)]
    (if matches
      (keep parse-tool-call matches)
      ;; Fall back to single tool call pattern
      (when-let [tc (parse-tool-call response-text)]
        [tc]))))

;; ============================================================================
;; Turn Processor
;; ============================================================================

(defrecord TurnProcessor [llm-client tool-executor memory-store event-bus config])

(defn make-turn-processor
  "Create a turn processor."
  [llm-client tool-executor memory-store event-bus config]
  (map->TurnProcessor
    {:llm-client llm-client
     :tool-executor tool-executor
     :memory-store memory-store
     :event-bus event-bus
     :config config}))

(defn process-turn
  "Process a turn for the given session and event."
  [processor session event]
  (let [{:keys [llm-client tool-executor memory-store event-bus config]} processor
        session-id (:session/id session)
        model (or (:session/model session) (:model config "gpt-4o-mini"))
        max-tokens (or (:session/max-tokens session) 4096)]
    
    ;; 1. Assemble context
    (log/info "TurnProcessor assembling context" {:session session-id})
    (let [messages (build-context-messages session event processor {:max-tokens max-tokens})
          tools (tools/get-definitions tool-executor session-id)]
      
      ;; 2. Call LLM
      (log/info "TurnProcessor calling LLM" {:session session-id :model model :message-count (count messages)})
      (-> (openai/chat! llm-client
                        {:model model
                         :messages messages
                         :tools tools
                         :max-tokens max-tokens})
          (.then
            (fn [response]
              (let [response-text (get-in response [:choices 0 :message :content])]
                ;; 3. Check for tool calls
                (let [tool-calls (extract-tool-calls response-text)]
                  (if (seq tool-calls)
                    ;; Execute tools
                    (-> (js/Promise.all
                          (mapv
                            (fn [tc]
                              (tools/execute tool-executor
                                            (:name tc)
                                            (:args tc)
                                            session-id))
                            tool-calls))
                        (.then
                          (fn [results]
                            ;; 4. Emit tool results
                            (doseq [[tc result] (map vector tool-calls results)]
                              (when event-bus
                                ;; TODO: Emit to event bus
                                (log/info "Tool result"
                                          {:session session-id
                                           :tool (:name tc)
                                           :result (str result)})))
                            {:status :completed
                             :tool-calls tool-calls
                             :results results})))
                    ;; No tool calls - emit response
                    (do
                      (when event-bus
                        ;; TODO: Emit response to event bus
                        (log/info "TurnProcessor response"
                                  {:session session-id :response response-text}))
                      {:status :completed
                       :response response-text}))))))
          (.catch
            (fn [err]
              (log/error "TurnProcessor failed"
                         {:session session-id :error (str err)})
              {:status :error
               :error (str err)}))))))
