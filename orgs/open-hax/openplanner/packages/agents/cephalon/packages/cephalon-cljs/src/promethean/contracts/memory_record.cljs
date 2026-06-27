(ns promethean.contracts.memory-record
  (:require [clojure.string :as str]
            [promethean.memory.types :as memt]))

(def ^:const +schema-version+ 1)

(def ^:private default-retrieval
  {:pinned false
   :lockedByAdmin false
   :lockedBySystem false
   :weightKind 1.0
   :weightSource 1.0})

(def ^:private default-usage
  {:includedCountTotal 0
   :includedCountDecay 0.0
   :lastIncludedAt 0})

(def ^:private default-embedding
  {:status "none"})

(def ^:private default-lifecycle
  {:deleted false})

(defn- clean-map [m]
  (into {} (remove (comp nil? val)) m))

(defn- value-for [m keys]
  (some (fn [k]
          (when (and (map? m) (contains? m k))
            (get m k)))
        keys))

(defn- string-value [v]
  (when (and (string? v) (not (str/blank? v))) v))

(defn- number-value [v]
  (cond
    (number? v) v
    (and (string? v) (not (str/blank? v)))
    (let [n (js/Number v)]
      (when-not (js/isNaN n) n))
    :else nil))

(defn- boolean-value [v]
  (when (boolean? v) v))

(defn- vector-of-strings [v]
  (when (sequential? v)
    (->> v (filter string?) vec)))

(defn- token->string [v]
  (let [raw (cond
              (keyword? v) (name v)
              (string? v) v
              :else nil)]
    (when raw
      (let [trimmed (-> raw
                        (str/replace #"^:" "")
                        str/trim
                        str/lower-case)]
        (if (str/includes? trimmed "/")
          (last (str/split trimmed #"/"))
          trimmed)))))

(defn- normalize-role [v]
  (let [token (token->string v)]
    (if (#{"user" "assistant" "system" "developer" "tool"} token)
      token
      "user")))

(defn- normalize-kind [v]
  (let [token (some-> (token->string v) (str/replace #"-" "_"))]
    (case token
      "event" "message"
      "tool_call" "tool_call"
      "tool_result" "tool_result"
      "message" "message"
      "think" "think"
      "image" "image"
      "summary" "summary"
      "admin" "admin"
      "aggregate" "aggregate"
      "system" "system"
      "developer" "developer"
      "message")))

(defn- normalize-source-type [v]
  (let [token (token->string v)]
    (if (#{"discord" "irc" "cli" "timer" "system" "admin" "sensor"} token)
      token
      "system")))

(defn- local-meta [m]
  (let [meta' (value-for m [:memory/meta "memory/meta" :meta "meta"])]
    (when (map? meta') meta')))

(defn- normalize-content [m]
  (let [content' (value-for m [:memory/content "memory/content" :content "content"])
        content-map (when (map? content') content')
        text (or (string-value (value-for content-map [:text "text"]))
                 (string-value (value-for m [:memory/text "memory/text" :text "text"]))
                 (when (string? content') content')
                 "")]
    (clean-map
      {:text text
       :normalizedText (or (string-value (value-for content-map [:normalized-text "normalized-text" :normalizedText "normalizedText"]))
                           (string-value (value-for m [:normalizedText "normalizedText" :normalized-text "normalized-text"])))
       :snippets (or (vector-of-strings (value-for content-map [:snippets "snippets"]))
                     (vector-of-strings (value-for m [:snippets "snippets"])))})))

(defn- normalize-source [m]
  (let [source' (value-for m [:memory/source "memory/source" :source "source"])
        source-map (when (map? source') source')
        meta' (local-meta m)]
    (clean-map
      {:type (normalize-source-type (or (value-for source-map [:type "type"])
                                        (value-for meta' [:source "source"])))
       :guildId (or (string-value (value-for source-map [:guild-id "guild-id" :guildId "guildId"]))
                    (string-value (value-for meta' [:discord/guild-id "discord/guild-id"])))
       :channelId (or (string-value (value-for source-map [:channel-id "channel-id" :channelId "channelId"]))
                      (string-value (value-for meta' [:discord/channel-id "discord/channel-id"])))
       :authorId (or (string-value (value-for source-map [:author-id "author-id" :authorId "authorId"]))
                     (string-value (value-for meta' [:discord/author-id "discord/author-id"])))
       :authorIsBot (or (boolean-value (value-for source-map [:author-is-bot "author-is-bot" :authorIsBot "authorIsBot"]))
                        (boolean-value (value-for meta' [:discord/author-bot "discord/author-bot"])))})))

(defn- normalize-cluster [m]
  (let [cluster' (value-for m [:memory/cluster "memory/cluster" :cluster "cluster"])
        cluster-map (when (map? cluster') cluster')
        normalized (clean-map
                     {:clusterId (string-value (value-for cluster-map [:cluster-id "cluster-id" :clusterId "clusterId"]))
                      :threadId (string-value (value-for cluster-map [:thread-id "thread-id" :threadId "threadId"]))
                      :spamFamilyId (string-value (value-for cluster-map [:spam-family-id "spam-family-id" :spamFamilyId "spamFamilyId"]))
                      :parentMemoryId (string-value (value-for cluster-map [:parent-memory-id "parent-memory-id" :parentMemoryId "parentMemoryId"]))
                      :sourceMessageId (string-value (value-for cluster-map [:source-message-id "source-message-id" :sourceMessageId "sourceMessageId"]))})]
    (when (seq normalized) normalized)))

(defn- normalize-retrieval [m]
  (let [retrieval' (value-for m [:memory/retrieval "memory/retrieval" :retrieval "retrieval"])
        retrieval-map (when (map? retrieval') retrieval')
        lifecycle' (value-for m [:memory/lifecycle "memory/lifecycle" :lifecycle "lifecycle"])
        lifecycle-map (when (map? lifecycle') lifecycle')]
    (merge default-retrieval
           (clean-map
             {:pinned (or (boolean-value (value-for retrieval-map [:pinned "pinned"]))
                          (boolean-value (value-for lifecycle-map [:pinned "pinned"])))
              :lockedByAdmin (boolean-value (value-for retrieval-map [:locked-by-admin "locked-by-admin" :lockedByAdmin "lockedByAdmin"]))
              :lockedBySystem (boolean-value (value-for retrieval-map [:locked-by-system "locked-by-system" :lockedBySystem "lockedBySystem"]))
              :weightKind (number-value (value-for retrieval-map [:weight-kind "weight-kind" :weightKind "weightKind"]))
              :weightSource (number-value (value-for retrieval-map [:weight-source "weight-source" :weightSource "weightSource"]))}))))

(defn- normalize-usage [m]
  (let [usage' (value-for m [:memory/usage "memory/usage" :usage "usage"])
        usage-map (when (map? usage') usage')]
    (merge default-usage
           (clean-map
             {:includedCountTotal (or (number-value (value-for usage-map [:included-count-total "included-count-total" :includedCountTotal "includedCountTotal"]))
                                      (number-value (value-for usage-map [:included-total "included-total"])))
              :includedCountDecay (or (number-value (value-for usage-map [:included-count-decay "included-count-decay" :includedCountDecay "includedCountDecay"]))
                                      (number-value (value-for usage-map [:included-decay "included-decay"])))
              :lastIncludedAt (number-value (value-for usage-map [:last-included-at "last-included-at" :lastIncludedAt "lastIncludedAt"]))}))))

(defn- normalize-embedding [m]
  (let [embedding' (value-for m [:memory/embedding "memory/embedding" :embedding "embedding"])
        embedding-map (when (map? embedding') embedding')]
    (merge
      default-embedding
      (clean-map
        {:status (or (token->string (value-for embedding-map [:status "status"])) "none")
         :model (string-value (value-for embedding-map [:model "model"]))
         :vectorId (string-value (value-for embedding-map [:vector-id "vector-id" :vectorId "vectorId"]))
         :dims (number-value (value-for embedding-map [:dims "dims"]))
         :embeddedAt (number-value (value-for embedding-map [:embedded-at "embedded-at" :embeddedAt "embeddedAt"]))
         :vector (when (sequential? (value-for embedding-map [:vector "vector"]))
                   (->> (value-for embedding-map [:vector "vector"])
                        (filter number?)
                        vec))}))))(defn- normalize-lifecycle [m]
  (let [lifecycle' (value-for m [:memory/lifecycle "memory/lifecycle" :lifecycle "lifecycle"])
        lifecycle-map (when (map? lifecycle') lifecycle')]
    (merge default-lifecycle
           (clean-map
             {:deleted (boolean-value (value-for lifecycle-map [:deleted "deleted"]))
              :deletedAt (number-value (value-for lifecycle-map [:deleted-at "deleted-at" :deletedAt "deletedAt"]))
              :replacedBySummaryId (or (string-value (value-for lifecycle-map [:replaced-by-summary-id "replaced-by-summary-id" :replacedBySummaryId "replacedBySummaryId"]))
                                      (string-value (value-for lifecycle-map [:replaced-by "replaced-by" :replacedBy "replacedBy"])))}))))

(defn- normalize-hashes [m]
  (let [hashes' (value-for m [:memory/hashes "memory/hashes" :hashes "hashes"])
        hashes-map (when (map? hashes') hashes')
        normalized (clean-map
                     {:contentHash (string-value (value-for hashes-map [:content-hash "content-hash" :contentHash "contentHash"]))
                      :normalizedHash (or (string-value (value-for hashes-map [:normalized-hash "normalized-hash" :normalizedHash "normalizedHash"]))
                                          (string-value (value-for m [:memory/dedupe-key "memory/dedupe-key"])) )})]
    normalized))

(defn boundary-memory-record?
  [value]
  (and (map? value)
       (string? (value-for value [:id "id"]))
       (number? (value-for value [:timestamp "timestamp"]))
       (map? (value-for value [:content "content"]))
       (map? (value-for value [:source "source"]))))

(defn to-boundary-memory-record
  ([m] (to-boundary-memory-record m {}))
  ([m {:keys [cephalon-id session-id schema-version]}]
   (let [meta' (local-meta m)
         content (normalize-content m)]
     (clean-map
       {:id (or (string-value (value-for m [:id "id" :memory/id "memory/id"]))
                (str (random-uuid)))
        :timestamp (or (number-value (value-for m [:timestamp "timestamp" :memory/timestamp "memory/timestamp" :memory/ts "memory/ts"]))
                       (.now js/Date))
        :cephalonId (or (string-value (value-for m [:cephalonId "cephalonId" :memory/cephalon-id "memory/cephalon-id"]))
                        cephalon-id
                        "unknown")
        :sessionId (or (string-value (value-for m [:sessionId "sessionId" :memory/session-id "memory/session-id"]))
                       (string-value (value-for meta' [:session/id "session/id"]))
                       session-id
                       "unknown")
        :eventId (or (string-value (value-for m [:eventId "eventId" :memory/event-id "memory/event-id"]))
                     (string-value (value-for meta' [:event/id "event/id"])))
        :role (normalize-role (or (value-for m [:role "role" :memory/role "memory/role"]) memt/role-user))
        :kind (normalize-kind (or (value-for m [:kind "kind" :memory/kind "memory/kind"]) memt/kind-message))
        :content content
        :source (normalize-source m)
        :cluster (normalize-cluster m)
        :retrieval (normalize-retrieval m)
        :usage (normalize-usage m)
        :embedding (normalize-embedding m)
        :lifecycle (normalize-lifecycle m)
        :hashes (normalize-hashes m)
        :schemaVersion (or (number-value (value-for m [:schemaVersion "schemaVersion" :memory/schema-version "memory/schema-version"]))
                           schema-version
                           +schema-version+)}))))

(defn from-boundary-memory-record
  [record]
  (let [normalized (if (boundary-memory-record? record)
                     record
                     (to-boundary-memory-record record))]
    (memt/make-memory
      {:id (:id normalized)
       :timestamp (:timestamp normalized)
       :cephalon-id (:cephalonId normalized)
       :session-id (:sessionId normalized)
       :event-id (:eventId normalized)
       :role (:role normalized)
       :kind (:kind normalized)
       :content {:text (get-in normalized [:content :text])
                 :normalized-text (get-in normalized [:content :normalizedText])
                 :snippets (vec (or (get-in normalized [:content :snippets]) []))}
       :source {:type (get-in normalized [:source :type])
                :guild-id (get-in normalized [:source :guildId])
                :channel-id (get-in normalized [:source :channelId])
                :author-id (get-in normalized [:source :authorId])
                :author-is-bot (get-in normalized [:source :authorIsBot])}
       :cluster (when-let [cluster (:cluster normalized)]
                  {:cluster-id (:clusterId cluster)
                   :thread-id (:threadId cluster)
                   :spam-family-id (:spamFamilyId cluster)})
       :retrieval {:pinned (get-in normalized [:retrieval :pinned])
                   :locked-by-admin (get-in normalized [:retrieval :lockedByAdmin])
                   :locked-by-system (get-in normalized [:retrieval :lockedBySystem])
                   :weight-kind (get-in normalized [:retrieval :weightKind])
                   :weight-source (get-in normalized [:retrieval :weightSource])}
       :usage {:included-count-total (get-in normalized [:usage :includedCountTotal])
               :included-count-decay (get-in normalized [:usage :includedCountDecay])
               :last-included-at (get-in normalized [:usage :lastIncludedAt])}
       :embedding {:status (get-in normalized [:embedding :status])
                   :model (get-in normalized [:embedding :model])
                   :vector-id (get-in normalized [:embedding :vectorId])
                   :dims (get-in normalized [:embedding :dims])
                   :embedded-at (get-in normalized [:embedding :embeddedAt])
                   :vector (get-in normalized [:embedding :vector])}
       :lifecycle {:deleted (get-in normalized [:lifecycle :deleted])
                   :deleted-at (get-in normalized [:lifecycle :deletedAt])
                   :replaced-by-summary-id (get-in normalized [:lifecycle :replacedBySummaryId])}
       :hashes (or (:hashes normalized) {})})))

(defn normalize-boundary-memory-record
  ([value] (normalize-boundary-memory-record value {}))
  ([value opts]
   (if (boundary-memory-record? value)
     (to-boundary-memory-record value opts)
     (to-boundary-memory-record value opts))))
