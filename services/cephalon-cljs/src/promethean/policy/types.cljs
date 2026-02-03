(ns promethean.policy.types
  "Policy type definitions based on cephalon-mvp-spec.md")

;; ============================================================================
;; Model Config
;; ============================================================================

(defn make-model-config
  [name max-context-tokens & {:keys [tool-call-strict?] :or {tool-call-strict? true}}]
  {:name name
   :max-context-tokens max-context-tokens
   :tool-call-strict? tool-call-strict?})

;; ============================================================================
;; Context Budgets
;; ============================================================================

(defn make-context-budgets
  [system-dev-pct persistent-pct recent-pct related-pct]
  {:system-dev-pct system-dev-pct
   :persistent-pct persistent-pct
   :recent-pct recent-pct
   :related-pct related-pct})

(defn make-context-invariants
  [related-gte-recent-mult dedupe-within-context]
  {:related-gte-recent-mult related-gte-recent-mult
   :dedupe-within-context dedupe-within-context})

;; ============================================================================
;; Normalization Policy
;; ============================================================================

(defn make-normalize-policy
  [volatile-rewrites strip-tracking-params]
  {:volatile-rewrites volatile-rewrites
   :strip-tracking-params strip-tracking-params})

;; ============================================================================
;; Dedupe Policy
;; ============================================================================

(defn make-dedupe-policy
  [exact-ttl-seconds near-window-seconds simhash-hamming-threshold aggregate-bot-dupes]
  {:exact-ttl-seconds exact-ttl-seconds
   :near-window-seconds near-window-seconds
   :simhash-hamming-threshold simhash-hamming-threshold
   :aggregate-bot-dupes aggregate-bot-dupes})

;; ============================================================================
;; Channel Policy
;; ============================================================================

(defn make-channel-policy
  [name embed-raw-bot-messages embed-aggregates]
  {:name name
   :embed-raw-bot-messages embed-raw-bot-messages
   :embed-aggregates embed-aggregates})

;; ============================================================================
;; Access Policy
;; ============================================================================

(defn make-access-policy
  [tau-days threshold]
  {:tau-days tau-days
   :threshold threshold})

;; ============================================================================
;; Grouping Policy
;; ============================================================================

(defn make-grouping-policy
  [by max-source-count max-source-tokens]
  {:by by
   :max-source-count max-source-count
   :max-source-tokens max-source-tokens})

;; ============================================================================
;; Summary Policy
;; ============================================================================

(defn make-summary-policy
  [format max-bullets max-patterns index-summary]
  {:format format
   :max-bullets max-bullets
   :max-patterns max-patterns
   :index-summary index-summary})

;; ============================================================================
;; Locks Policy
;; ============================================================================

(defn make-locks-policy
  [never-delete-kinds never-delete-tags]
  {:never-delete-kinds never-delete-kinds
   :never-delete-tags never-delete-tags})

;; ============================================================================
;; Compaction Policy
;; ============================================================================

(defn make-compaction-policy
  [interval-minutes age-min-days access grouping summary locks]
  {:interval-minutes interval-minutes
   :age-min-days age-min-days
   :access access
   :grouping grouping
   :summary summary
   :locks locks})

;; ============================================================================
;; Janitor Policy
;; ============================================================================

(defn make-janitor-policy
  [enabled report-channel-id report-interval-minutes max-actions-per-hour propose-suppress-rules]
  {:enabled enabled
   :report-channel-id report-channel-id
   :report-interval-minutes report-interval-minutes
   :max-actions-per-hour max-actions-per-hour
   :propose-suppress-rules propose-suppress-rules})

;; ============================================================================
;; Full Cephalon Policy
;; ============================================================================

(defn make-cephalon-policy
  [models context normalize dedupe channels compaction spam janitor]
  {:models models
   :context context
   :normalize normalize
   :dedupe dedupe
   :channels channels
   :compaction compaction
   :spam spam
   :janitor janitor})

;; ============================================================================
;; Default Policies (from spec section 8)
;; ============================================================================

(def default-model-config
  (make-model-config "qwen3-vl-2b" 262144))

(def default-context-budgets
  (make-context-budgets 0.06 0.08 0.18 0.42))

(def default-context-invariants
  (make-context-invariants 1.6 true))

(def default-normalize-policy
  (make-normalize-policy
    [[#"\b\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?\b" "<ts>"]
     [#"\b\d{1,2}:\d{2}(:\d{2})?\s?(AM|PM)?\b" "<time>"]
     [#"\b\d{15,}\b" "<id>"]
     [#"\b[0-9a-f]{7,}\b" "<hex>"]]
    true))

(def default-dedupe-policy
  (make-dedupe-policy 3600 600 6 true))

(def default-access-policy
  (make-access-policy 21 0.8))

(def default-grouping-policy
  (make-grouping-policy [:channel-id :day] 200 60000))

(def default-summary-policy
  (make-summary-policy :json_v1 25 10 true))

(def default-locks-policy
  (make-locks-policy
    #{:system :developer :admin :summary :aggregate}
    #{:pinned :critical}))

(def default-compaction-policy
  (make-compaction-policy
    360
    14
    default-access-policy
    default-grouping-policy
    default-summary-policy
    default-locks-policy))

(def default-janitor-policy
  (make-janitor-policy true "450688080542695436" 60 20 true))

;; ============================================================================
;; Channel Configurations (from spec section 6.2)
;; ============================================================================

(def forced-channels
  {:bots "343299242963763200"
   :duck-bots "450688080542695436"
   :general "343179912196128792"
   :memes "367156652140658699"})

(def default-channel-policies
  {"343299242963763200" (make-channel-policy "bots" false true)
   "450688080542695436" (make-channel-policy "duck-bots" true true)
   "343179912196128792" (make-channel-policy "general" false true)
   "367156652140658699" (make-channel-policy "memes" false true)})

;; ============================================================================
;; Full Default Policy (from spec section 7)
;; ============================================================================

(def default-policy
  (make-cephalon-policy
    {:actor default-model-config
     :fallbacks []}
    {:budgets default-context-budgets
     :invariants default-context-invariants}
    default-normalize-policy
    default-dedupe-policy
    default-channel-policies
    default-compaction-policy
    {:dedupe default-dedupe-policy
     :channels default-channel-policies}
    default-janitor-policy))
