(ns promethean.context.assembler
  "Context assembler for [persistent, recent, related] memory assembly"
  (:require [promethean.memory.types :as mem]
            [promethean.policy.types :as policy]))

;; ============================================================================
;; Tokenizer (simple heuristic)
;; ============================================================================

(defn estimate-tokens
  "Estimate token count from text (heuristic: ~4 chars per token)"
  [text]
  (Math/ceil (/ (count text) 4)))

(defn estimate-messages
  "Estimate tokens for a list of messages"
  [messages]
  (reduce (fn [total msg]
            (+ total 4 (estimate-tokens (:content msg))))
          0
          messages))

;; ============================================================================
;; Budget Computation (from spec section 2.1)
;; ============================================================================

(defn compute-budgets
  [window-tokens budgets-pct invariants]
  (let [sys (Math/floor (* window-tokens (:system-dev-pct budgets-pct)))
        persistent (Math/floor (* window-tokens (:persistent-pct budgets-pct)))
        recent (Math/floor (* window-tokens (:recent-pct budgets-pct)))
        related (Math/floor (* window-tokens (:related-pct budgets-pct)))
        min-related (Math/floor (* recent (:related-gte-recent-mult invariants)))
        related (max related min-related)
        safety (max 1024 (Math/floor (* window-tokens 0.03)))]
    {:sys sys
     :persistent persistent
     :recent recent
     :related related
     :safety safety}))

;; ============================================================================
;; Deduplication (from spec section 3.1)
;; ============================================================================

(defn dedupe-context-items
  [items]
  (let [seen-ids #{}
        seen-content #{}
        result []]
    (reduce (fn [[seen-ids seen-content result] item]
              (if (contains? seen-ids (:id item))
                [seen-ids seen-content result]
                (let [content-key (:content-hash item)
                      seen-ids' (conj seen-ids (:id item))]
                  (if (and content-key (contains? seen-content content-key))
                    [seen-ids' seen-content result]
                    [seen-ids' (conj seen-content content-key) (conj result item)]))))
            [seen-ids seen-content result]
            items)))

;; ============================================================================
;; Cosine Similarity
;; ============================================================================

(defn- cosine-similarity
  [a b]
  (if (or (empty? a) (empty? b) (not= (count a) (count b)))
    0
    (let [dot (reduce + (map * a b))
          norm-a (Math/sqrt (reduce + (map * a a)))
          norm-b (Math/sqrt (reduce + (map * b b)))]
      (if (or (zero? norm-a) (zero? norm-b))
        0
        (/ dot (* norm-a norm-b))))))

;; ============================================================================
;; Scoring (from spec section 3)
;; ============================================================================

(defn score-memory
  [memory query-embedding alpha tau-days kind-weights]
  (let [similarity (if-let [vec (:vector (:embedding memory))]
                     (cosine-similarity query-embedding vec)
                     0)
        age-hours (/ (- (.now js/Date) (:timestamp memory)) 3600000)
        recency-boost (+ 1 (* alpha (Math/exp (/ (- age-hours) (* tau-days 24)))))
        kind-weight (get kind-weights (:kind memory) 1.0)
        source-weight (case (:type (:source memory))
                        "admin" 1.2
                        "system" 1.1
                        1.0)
        score (* similarity recency-boost kind-weight source-weight)]
    {:memory memory
     :score score
     :similarity similarity
     :recency-boost recency-boost}))

;; ============================================================================
;; Fit by Tokens
;; ============================================================================

(defn fit-by-tokens
  [items budget tokenizer]
  (reduce (fn [result item]
            (let [tokens (estimate-tokens (get-in item [:memory :content :text]  ""))]
              (if (> (+ (reduce + (map :estimated-tokens result)) tokens) budget)
                (reduced result)
                (conj result (assoc item :estimated-tokens tokens)))))
          []
          items))

;; ============================================================================
;; Build Headers (from spec section 1.3)
;; ============================================================================

(defn build-headers
  [session cephalon-id current-event policy]
  (let [channel-context (when current-event
                          (str "\nCurrent channel ID: " (get-in current-event [:payload :channel-id] "")))
        system-msg (str "You are " cephalon-id ", a Cephalon - an always-running mind with persistent memory."
                       " You have access to tools that you can call to interact with the world."
                       channel-context)
        developer-msg "Cephalon contract: Use tools when asked or when you need to retrieve/send information."]
    [{:role "system" :content system-msg}
     {:role "developer" :content developer-msg}]))

;; ============================================================================
;; Main Assembly Function
;; ============================================================================

(defn assemble-context
  "Assemble [persistent, recent, related] into context"
  [{:keys [window-tokens policy session current-event memory-store retrieve-related]}]
  (let [budgets (compute-budgets window-tokens
                                  (get-in policy [:context :budgets])
                                  (get-in policy [:context :invariants]))
        headers (build-headers session (:name session) current-event policy)
        header-tokens (estimate-messages headers)
        
        ;; Build messages
        messages (concat headers)]
    {:messages messages
     :total-tokens (estimate-messages messages)
     :context-id (str (random-uuid))
     :budgets budgets}))
