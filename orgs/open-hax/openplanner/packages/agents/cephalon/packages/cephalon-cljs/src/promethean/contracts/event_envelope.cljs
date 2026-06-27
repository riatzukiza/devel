(ns promethean.contracts.event-envelope
  (:require [clojure.string :as str]))

(def ^:const +schema-version+ 1)

(def ^:private internal->boundary-type-map
  {:discord.message/new "discord.message.created"
   :discord.message/edited "discord.message.edited"
   :discord.message/deleted "discord.message.deleted"
   :tool/called "tool.call"
   :tool/result "tool.result"
   :llm/response "llm.assistant.message"
   :timer/tick "system.tick"
   :admin/command "admin.command"
   :memory/created "memory.created"})

(def ^:private boundary->internal-type-map
  {"discord.message.created" :discord.message/new
   "discord.message.edited" :discord.message/edited
   "discord.message.deleted" :discord.message/deleted
   "tool.call" :tool/called
   "tool.result" :tool/result
   "llm.assistant.message" :llm/response
   "system.tick" :timer/tick
   "admin.command" :admin/command
   "memory.created" :memory/created})

(defn- clean-map [m]
  (into {} (remove (comp nil? val)) m))

(defn- value-for [m keys]
  (some (fn [k]
          (when (and (map? m) (contains? m k))
            (get m k)))
        keys))

(defn- keywordish->string [v]
  (cond
    (keyword? v) (name v)
    (string? v) v
    :else nil))

(defn- infer-surface [type]
  (some-> type (str/split #"\.") first))

(defn internal-type->boundary [event-type]
  (or (get internal->boundary-type-map event-type)
      (when (keyword? event-type)
        (let [ns-part (namespace event-type)
              name-part (name event-type)]
          (when (and ns-part name-part)
            (str ns-part "." name-part))))))

(defn boundary-type->internal [event-type]
  (or (get boundary->internal-type-map event-type)
      (when (string? event-type)
        (let [idx (.lastIndexOf event-type ".")]
          (if (neg? idx)
            (keyword event-type)
            (keyword (subs event-type 0 idx) (subs event-type (inc idx))))))))

(defn- payload->trace [payload]
  (let [trace (clean-map
                {:correlationId (value-for payload [:correlationId "correlationId" :correlation-id "correlation-id"])
                 :causationId (value-for payload [:causationId "causationId" :causation-id "causation-id"])
                 :scheduleId (value-for payload [:scheduleId "scheduleId" :schedule-id "schedule-id"])
                 :callId (value-for payload [:callId "callId" :call-id "call-id"])} )]
    (when (seq trace) trace)))

(defn- source->boundary [source package-name runtime-id event-type]
  (let [surface (or (keywordish->string (value-for source [:kind "kind" :surface "surface"]))
                    (infer-surface event-type))
        normalized (clean-map {:package package-name
                               :runtime runtime-id
                               :surface surface})]
    (when (seq normalized) normalized)))

(defn boundary-envelope?
  [value]
  (and (map? value)
       (string? (value-for value [:id "id"]))
       (string? (value-for value [:type "type"]))
       (number? (value-for value [:timestamp "timestamp"])) ))

(defn to-boundary-envelope
  ([evt] (to-boundary-envelope evt {}))
  ([evt {:keys [cephalon-id runtime-id package-name trace]
         :or {package-name "cephalon-cljs"}}]
   (let [event-type (internal-type->boundary (:event/type evt))
         payload (:event/payload evt)
         normalized-trace (clean-map (merge (or (payload->trace payload) {}) (or trace {})))]
     (clean-map
       {:schemaVersion +schema-version+
        :id (or (:event/id evt) (str (random-uuid)))
        :type event-type
        :timestamp (or (:event/ts evt) (.now js/Date))
        :sessionId (:event/session-id evt)
        :cephalonId cephalon-id
        :payload payload
        :trace (when (seq normalized-trace) normalized-trace)
        :source (source->boundary (:event/source evt) package-name runtime-id event-type)}))))

(defn from-boundary-envelope
  [envelope]
  (let [source (value-for envelope [:source "source"])]
    (clean-map
      {:event/id (value-for envelope [:id "id"])
       :event/ts (value-for envelope [:timestamp "timestamp"])
       :event/type (boundary-type->internal (value-for envelope [:type "type"]))
       :event/session-id (value-for envelope [:sessionId "sessionId"])
       :event/payload (or (value-for envelope [:payload "payload"]) {})
       :event/source (when (map? source)
                       (clean-map {:kind (some-> (value-for source [:surface "surface"]) keyword)
                                   :package (value-for source [:package "package"])
                                   :runtime (value-for source [:runtime "runtime"])}))})))

(defn normalize-boundary-envelope
  ([value] (normalize-boundary-envelope value {}))
  ([value opts]
   (if (boundary-envelope? value)
     (let [payload (or (value-for value [:payload "payload"]) {})
           source (or (value-for value [:source "source"]) {})
           trace (clean-map (merge (or (payload->trace payload) {})
                                   (or (value-for value [:trace "trace"]) {})
                                   (or (:trace opts) {})))]
       (clean-map
         {:schemaVersion (or (value-for value [:schemaVersion "schemaVersion"]) +schema-version+)
          :id (value-for value [:id "id"])
          :type (value-for value [:type "type"])
          :timestamp (value-for value [:timestamp "timestamp"])
          :sessionId (or (value-for value [:sessionId "sessionId"])
                         (value-for payload [:sessionId "sessionId" :session-id "session-id"]))
          :cephalonId (or (value-for value [:cephalonId "cephalonId"]) (:cephalon-id opts))
          :payload payload
          :trace (when (seq trace) trace)
          :source (let [normalized-source (clean-map (merge source
                                                            {:package (or (value-for source [:package "package"]) (:package-name opts))
                                                             :runtime (or (value-for source [:runtime "runtime"]) (:runtime-id opts))}))]
                    (when (seq normalized-source) normalized-source))}))
     (to-boundary-envelope value opts))))