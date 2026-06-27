(ns promethean.memory.types
  "Memory type definitions based on cephalon-mvp-spec.md")

;; ============================================================================
;; Role Types
;; ============================================================================

(def role-user "user")
(def role-assistant "assistant")
(def role-system "system")
(def role-developer "developer")
(def role-tool "tool")

;; ============================================================================
;; Memory Kinds
;; ============================================================================

(def kind-message "message")
(def kind-tool-call "tool_call")
(def kind-tool-result "tool_result")
(def kind-think "think")
(def kind-image "image")
(def kind-summary "summary")
(def kind-admin "admin")
(def kind-aggregate "aggregate")
(def kind-system "system")
(def kind-developer "developer")

;; ============================================================================
;; Source Types
;; ============================================================================

(def source-type-discord "discord")
(def source-type-cli "cli")
(def source-type-timer "timer")
(def source-type-system "system")
(def source-type-admin "admin")
(def source-type-sensor "sensor")

;; ============================================================================
;; Memory Record Constructor
;; ============================================================================

(defn make-memory
  "Create a memory record (canonical schema from spec)"
  [{:keys [id timestamp cephalon-id session-id event-id role kind content
           source cluster retrieval usage embedding lifecycle hashes]}]
  (let [id (or id (str (random-uuid)))
        timestamp (or timestamp (.now js/Date))
        schema-version 1]
    {:memory/id id
     :memory/timestamp timestamp
     :memory/cephalon-id cephalon-id
     :memory/session-id session-id
     :memory/event-id event-id
     :memory/role role
     :memory/kind kind
     :memory/content content
     :memory/source source
     :memory/cluster cluster
     :memory/retrieval (merge {:pinned false
                               :locked-by-admin false
                               :locked-by-system false
                               :weight-kind 1.0
                               :weight-source 1.0}
                              retrieval)
     :memory/usage (merge {:included-count-total 0
                           :included-count-decay 0.0
                           :last-included-at 0}
                          usage)
     :memory/embedding (merge {:status "none"
                               :model nil
                               :vector-id nil
                               :dims 0
                               :embedded-at 0}
                              embedding)
     :memory/lifecycle (merge {:deleted false
                               :deleted-at 0
                               :replaced-by-summary-id nil}
                              lifecycle)
     :memory/hashes (or hashes {})
     :memory/schema-version schema-version}))

;; ============================================================================
;; Memory Content
;; ============================================================================

(defn make-content
  "Create memory content"
  [text & {:keys [normalized-text snippets]}]
  {:text text
   :normalized-text normalized-text
   :snippets (vec snippets)})

;; ============================================================================
;; Memory Source
;; ============================================================================

(defn make-source
  "Create memory source"
  [type & {:keys [guild-id channel-id author-id author-is-bot]}]
  {:type type
   :guild-id guild-id
   :channel-id channel-id
   :author-id author-id
   :author-is-bot author-is-bot})

;; ============================================================================
;; Memory Cluster
;; ============================================================================

(defn make-cluster
  "Create memory cluster info"
  [& {:keys [cluster-id thread-id spam-family-id]}]
  {:cluster-id cluster-id
   :thread-id thread-id
   :spam-family-id spam-family-id})

;; ============================================================================
;; Memory Retrieval
;; ============================================================================

(defn make-retrieval
  "Create retrieval metadata"
  [& {:keys [pinned locked-by-admin locked-by-system weight-kind weight-source]
      :or {pinned false locked-by-admin false locked-by-system false
           weight-kind 1.0 weight-source 1.0}}]
  {:pinned pinned
   :locked-by-admin locked-by-admin
   :locked-by-system locked-by-system
   :weight-kind weight-kind
   :weight-source weight-source})

;; ============================================================================
;; Memory Usage
;; ============================================================================

(defn make-usage
  "Create usage tracking metadata"
  [& {:keys [included-count-total included-count-decay last-included-at]
      :or {included-count-total 0
           included-count-decay 0.0
           last-included-at 0}}]
  {:included-count-total included-count-total
   :included-count-decay included-count-decay
   :last-included-at last-included-at})

;; ============================================================================
;; Memory Embedding
;; ============================================================================

(defn make-embedding
  "Create embedding metadata"
  [& {:keys [status model vector-id dims embedded-at vector]
      :or {status "none"}}]
  {:status status
   :model model
   :vector-id vector-id
   :dims dims
   :embedded-at embedded-at
   :vector vector})

;; ============================================================================
;; Memory Lifecycle
;; ============================================================================

(defn make-lifecycle
  "Create lifecycle metadata"
  [& {:keys [deleted deleted-at replaced-by-summary-id]
      :or {deleted false}}]
  {:deleted deleted
   :deleted-at deleted-at
   :replaced-by-summary-id replaced-by-summary-id})

;; ============================================================================
;; Access Tracking (from spec section 3.1)
;; ============================================================================

(defn update-access-decay
  "Update included-count-decay with exponential decay: decay * e^(-Δt/τ) + 1"
  [usage now-ms & {:keys [tau-days] :or {tau-days 21}}]
  (let [last-included-at (:last-included-at usage)
        delta (- now-ms last-included-at)
        tau (* tau-days 24 60 60 1000) ; convert days to ms
        new-decay (+ (* (:included-count-decay usage) (Math/exp (- (/ delta tau))))
                     1.0)]
    (assoc usage
           :included-count-total (inc (:included-count-total usage))
           :included-count-decay new-decay
           :last-included-at now-ms)))
