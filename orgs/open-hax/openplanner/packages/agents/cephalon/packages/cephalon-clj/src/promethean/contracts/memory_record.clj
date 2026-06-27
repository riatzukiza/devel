(ns promethean.contracts.memory-record
  (:require [clojure.string :as str]
            [promethean.util.ids :as ids])
  (:import [java.time Instant]))

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

(defn- instant->millis [v]
  (cond
    (instance? Instant v) (.toEpochMilli ^Instant v)
    (number? v) v
    (and (string? v) (not (str/blank? v)))
    (try
      (.toEpochMilli (Instant/parse v))
      (catch Throwable _
        (try
          (Long/parseLong v)
          (catch Throwable _ nil))))
    :else nil))

(defn- boolean-value [v]
  (when (boolean? v) v))

(defn- vector-of-numbers [v]
  (when (sequential? v)
    (->> v (filter number?) vec)))

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
  (let [meta' (or (:meta m)
                  (value-for m [:memory/meta "memory/meta"]))]
    (when (map? meta') meta')))

(defn- normalize-content [m]
  (let [content' (or (value-for m [:memory/content "memory/content" :content "content"])
                     (:content m))
        content-map (when (map? content') content')
        text (or (string-value (value-for content-map [:text "text"]))
                 (string-value (value-for m [:memory/text "memory/text"]))
                 (string-value (:content m))
                 (when (string? content') content')
                 "")]
    (clean-map
      {:text text
       :normalizedText (or (string-value (value-for content-map [:normalizedText "normalizedText" :normalized-text "normalized-text"]))
                           (string-value (value-for m [:normalizedText "normalizedText"])))
       :snippets (when (sequential? (value-for content-map [:snippets "snippets"]))
                   (->> (value-for content-map [:snippets "snippets"]) (filter string?) vec))})))

(defn- normalize-source [m]
  (let [source' (value-for m [:memory/source "memory/source" :source "source"])
        source-map (when (map? source') source')
        meta' (local-meta m)]
    (clean-map
      {:type (normalize-source-type (or (value-for source-map [:type "type"])
                                        (value-for meta' [:source "source"])))
       :guildId (or (string-value (value-for source-map [:guildId "guildId" :guild-id "guild-id"]))
                    (string-value (value-for meta' [:discord/guild-id "discord/guild-id"])))
       :channelId (or (string-value (value-for source-map [:channelId "channelId" :channel-id "channel-id"]))
                      (string-value (value-for meta' [:discord/channel-id "discord/channel-id"])))
       :authorId (or (string-value (value-for source-map [:authorId "authorId" :author-id "author-id"]))
                     (string-value (value-for meta' [:discord/author-id "discord/author-id"])))
       :authorIsBot (or (boolean-value (value-for source-map [:authorIsBot "authorIsBot" :author-is-bot "author-is-bot"]))
                        (boolean-value (value-for meta' [:discord/author-bot "discord/author-bot"])))})))

(defn- normalize-retrieval [m]
  (let [retrieval' (value-for m [:memory/retrieval "memory/retrieval" :retrieval "retrieval"])
        retrieval-map (when (map? retrieval') retrieval')
        lifecycle' (or (:lifecycle m)
                       (value-for m [:memory/lifecycle "memory/lifecycle"]))
        lifecycle-map (when (map? lifecycle') lifecycle')]
    (merge default-retrieval
           (clean-map
             {:pinned (or (boolean-value (value-for retrieval-map [:pinned "pinned"]))
                          (boolean-value (value-for lifecycle-map [:pinned "pinned"])))
              :lockedByAdmin (boolean-value (value-for retrieval-map [:lockedByAdmin "lockedByAdmin" :locked-by-admin "locked-by-admin"]))
              :lockedBySystem (boolean-value (value-for retrieval-map [:lockedBySystem "lockedBySystem" :locked-by-system "locked-by-system"]))
              :weightKind (instant->millis (value-for retrieval-map [:weightKind "weightKind" :weight-kind "weight-kind"]))
              :weightSource (instant->millis (value-for retrieval-map [:weightSource "weightSource" :weight-source "weight-source"]))}))))

(defn- normalize-usage [m]
  (let [usage' (value-for m [:memory/usage "memory/usage" :usage "usage"])
        usage-map (when (map? usage') usage')]
    (merge default-usage
           (clean-map
             {:includedCountTotal (or (instant->millis (value-for usage-map [:includedCountTotal "includedCountTotal" :included-count-total "included-count-total"]))
                                      (instant->millis (value-for usage-map [:included-total "included-total"])))
              :includedCountDecay (or (instant->millis (value-for usage-map [:includedCountDecay "includedCountDecay" :included-count-decay "included-count-decay"]))
                                      (instant->millis (value-for usage-map [:included-decay "included-decay"])))
              :lastIncludedAt (instant->millis (value-for usage-map [:lastIncludedAt "lastIncludedAt" :last-included-at "last-included-at"]))}))))

(defn- normalize-embedding [m]
  (let [embedding' (value-for m [:memory/embedding "memory/embedding" :embedding "embedding"])
        embedding-map (when (map? embedding') embedding')]
    (merge default-embedding
           (clean-map
             {:status (or (token->string (value-for embedding-map [:status "status"])) "none")
              :model (string-value (value-for embedding-map [:model "model"]))
              :vectorId (string-value (value-for embedding-map [:vectorId "vectorId" :vector-id "vector-id"]))
              :dims (instant->millis (value-for embedding-map [:dims "dims"]))
              :embeddedAt (instant->millis (value-for embedding-map [:embeddedAt "embeddedAt" :embedded-at "embedded-at"]))
              :vector (vector-of-numbers (value-for embedding-map [:vector "vector"]))}))))

(defn- normalize-lifecycle [m]
  (let [lifecycle' (or (:lifecycle m)
                       (value-for m [:memory/lifecycle "memory/lifecycle"]))
        lifecycle-map (when (map? lifecycle') lifecycle')]
    (merge default-lifecycle
           (clean-map
             {:deleted (boolean-value (value-for lifecycle-map [:deleted "deleted"]))
              :deletedAt (instant->millis (value-for lifecycle-map [:deletedAt "deletedAt" :deleted-at "deleted-at"]))
              :replacedBySummaryId (or (string-value (value-for lifecycle-map [:replacedBySummaryId "replacedBySummaryId" :replaced-by-summary-id "replaced-by-summary-id"]))
                                      (string-value (value-for lifecycle-map [:replacedBy "replacedBy" :replaced-by "replaced-by"])))}))))

(defn- normalize-hashes [m content-text]
  (let [hashes' (value-for m [:memory/hashes "memory/hashes" :hashes "hashes"])
        hashes-map (when (map? hashes') hashes')]
    (clean-map
      {:contentHash (or (string-value (value-for hashes-map [:contentHash "contentHash" :content-hash "content-hash"]))
                        (ids/sha256-hex content-text))
       :normalizedHash (or (string-value (value-for hashes-map [:normalizedHash "normalizedHash" :normalized-hash "normalized-hash"]))
                           (string-value (value-for m [:memory/key "memory/key"])))})))

(defn boundary-memory-record?
  [value]
  (and (map? value)
       (string? (value-for value [:id "id"]))
       (number? (value-for value [:timestamp "timestamp"]))
       (map? (value-for value [:content "content"]))
       (map? (value-for value [:source "source"])) ))

(defn to-boundary-memory-record
  ([m] (to-boundary-memory-record m {}))
  ([m {:keys [cephalon-id session-id schema-version]}]
   (let [meta' (local-meta m)
         content (normalize-content m)]
     (clean-map
      {:id (or (string-value (value-for m [:id "id" :memory/id "memory/id"]))
               (ids/uuid))
       :timestamp (or (instant->millis (or (value-for m [:timestamp "timestamp" :memory/timestamp "memory/timestamp" :memory/created-at "memory/created-at"]) (:memory/created-at m)))
                      (System/currentTimeMillis))
       :cephalonId (or (string-value (value-for m [:cephalonId "cephalonId" :memory/cephalon-id "memory/cephalon-id"]))
                       cephalon-id
                       "unknown")
       :sessionId (or (string-value (value-for m [:sessionId "sessionId" :memory/session-id "memory/session-id"]))
                      (string-value (value-for meta' [:session/id "session/id"]))
                      session-id
                      "unknown")
       :eventId (or (string-value (value-for m [:eventId "eventId" :memory/event-id "memory/event-id"]))
                    (string-value (value-for meta' [:event/id "event/id"])))
       :role (normalize-role (or (value-for m [:role "role" :memory/role "memory/role"]) "user"))
       :kind (normalize-kind (or (value-for m [:kind "kind" :memory/kind "memory/kind"]) (:memory/kind m)))
       :content content
       :source (normalize-source m)
       :retrieval (normalize-retrieval m)
       :usage (normalize-usage m)
       :embedding (normalize-embedding m)
       :lifecycle (normalize-lifecycle m)
       :hashes (normalize-hashes m (:text content))
       :schemaVersion (or (instant->millis (value-for m [:schemaVersion "schemaVersion" :memory/schema-version "memory/schema-version"]))
                          schema-version
                          +schema-version+)}))))

(defn from-boundary-memory-record
  [record]
  (let [normalized (if (boundary-memory-record? record)
                     record
                     (to-boundary-memory-record record))
        timestamp (or (instant->millis (:timestamp normalized)) (System/currentTimeMillis))]
    {:memory/id (:id normalized)
     :memory/timestamp timestamp
     :memory/created-at (Instant/ofEpochMilli timestamp)
     :memory/session-id (:sessionId normalized)
     :memory/event-id (:eventId normalized)
     :memory/cephalon-id (:cephalonId normalized)
     :memory/role (:role normalized)
     :memory/kind (keyword (:kind normalized))
     :memory/content (:content normalized)
     :memory/source (:source normalized)
     :role (:role normalized)
     :content (get-in normalized [:content :text])
     :meta (clean-map {:source (get-in normalized [:source :type])
                       :session/id (:sessionId normalized)
                       :event/id (:eventId normalized)
                       :discord/guild-id (get-in normalized [:source :guildId])
                       :discord/channel-id (get-in normalized [:source :channelId])
                       :discord/author-id (get-in normalized [:source :authorId])
                       :discord/author-bot (get-in normalized [:source :authorIsBot])})
     :memory/retrieval (:retrieval normalized)
     :memory/usage (:usage normalized)
     :memory/embedding (:embedding normalized)
     :memory/lifecycle (:lifecycle normalized)
     :memory/hashes (:hashes normalized)
     :memory/schema-version (:schemaVersion normalized)}))

(defn normalize-boundary-memory-record
  ([value] (normalize-boundary-memory-record value {}))
  ([value opts]
   (to-boundary-memory-record value opts)))