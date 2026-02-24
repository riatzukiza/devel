(ns my.opencode.entry
  (:require [clojure.string :as str]
            ["@opencode-ai/plugin" :as plugin]
            ["@promethean-os/openplanner-cljs-client" :as openplanner]
            ["@promethean-os/opencode-cljs-client" :as opencode]))

(defn- fallback-schema-type []
  #js {:describe (fn [_] (fallback-schema-type))
       :optional (fn [] (fallback-schema-type))})

(def ^:private plugin-tool
  (or (some-> plugin (aget "tool"))
      (some-> plugin (aget "default") (aget "tool"))
      (fn [definition] definition)))

(def ^:private plugin-schema
  (or (some-> plugin-tool (aget "schema"))
      #js {:string (fn [] (fallback-schema-type))
           :number (fn [] (fallback-schema-type))}))

(defn- str-present? [value]
  (and (string? value) (not (str/blank? value))))

(defn- json-str [value]
  (.stringify js/JSON value nil 2))

(defn- parse-json [value fallback]
  (if (str-present? value)
    (.parse js/JSON value)
    fallback))

(defn- resolve-fn [ctx key fallback]
  (or (some-> ctx (aget key)) fallback))

(defn- message-event? [event]
  (let [t (some-> event (aget "type"))]
    (or (= t "message.updated") (= t "message.removed"))))

(defn- event-session-id [event]
  (or (some-> event (aget "properties") (aget "info") (aget "sessionID"))
      (some-> event (aget "properties") (aget "part") (aget "sessionID"))))

(defn- event-message-id [event]
  (or (some-> event (aget "properties") (aget "info") (aget "id"))
      (some-> event (aget "properties") (aget "part") (aget "messageID"))))

(defn- event-created-at-ms [event]
  (or (some-> event (aget "properties") (aget "info") (aget "time") (aget "created"))
      (.now js/Date)))

(defn- z-str [description]
  (-> ((aget plugin-schema "string"))
      (.describe description)))

(defn- z-str-opt [description]
  (-> ((aget plugin-schema "string"))
      (.describe description)
      (.optional)))

(defn- z-num-opt [description]
  (-> ((aget plugin-schema "number"))
      (.describe description)
      (.optional)))

(defn- planner-tools [planner-client]
  (let [tools #js {}
        add-tool! (fn [name definition]
                    (aset tools name (plugin-tool definition)))]
    (add-tool!
     "openplanner/health"
     #js {:description "GET /v1/health"
          :args #js {}
          :execute (fn [_args _ctx]
                     (-> (.health planner-client)
                         (.then json-str)))})

    (add-tool!
     "openplanner/sessions/list"
     #js {:description "GET /v1/sessions"
          :args #js {}
          :execute (fn [_args _ctx]
                     (-> (.listSessions planner-client)
                         (.then json-str)))})

    (add-tool!
     "openplanner/sessions/get"
     #js {:description "GET /v1/sessions/:sessionId"
          :args #js {:sessionId (z-str "Session id")}
          :execute (fn [args _ctx]
                     (-> (.getSession planner-client (aget args "sessionId"))
                         (.then json-str)))})

    (add-tool!
     "openplanner/events/index"
     #js {:description "POST /v1/events"
          :args #js {:eventsJson (z-str "JSON array of openplanner.event.v1 envelopes")}
          :execute (fn [args _ctx]
                     (let [raw (parse-json (aget args "eventsJson") #js [])
                           events (if (array? raw)
                                    raw
                                    (or (some-> raw (aget "events")) #js []))]
                       (-> (.indexEvents planner-client events)
                           (.then json-str))))})

    (add-tool!
     "openplanner/search/fts"
     #js {:description "POST /v1/search/fts"
          :args #js {:query (z-str "FTS query")
                     :limit (z-num-opt "Result limit")
                     :source (z-str-opt "source filter")
                     :kind (z-str-opt "kind filter")
                     :project (z-str-opt "project filter")
                     :session (z-str-opt "session filter")}
          :execute (fn [args _ctx]
                     (let [payload #js {:q (aget args "query")}
                           limit (aget args "limit")
                           source (aget args "source")
                           kind (aget args "kind")
                           project (aget args "project")
                           session (aget args "session")]
                       (when (number? limit) (aset payload "limit" limit))
                       (when (str-present? source) (aset payload "source" source))
                       (when (str-present? kind) (aset payload "kind" kind))
                       (when (str-present? project) (aset payload "project" project))
                       (when (str-present? session) (aset payload "session" session))
                       (-> (.searchFts planner-client payload)
                           (.then json-str))))})

    (add-tool!
     "openplanner/search/vector"
     #js {:description "POST /v1/search/vector"
          :args #js {:query (z-str "Vector query")
                     :k (z-num-opt "Top-k")
                     :whereJson (z-str-opt "Optional Chroma where JSON")}
          :execute (fn [args _ctx]
                     (let [payload #js {:q (aget args "query")}
                           k (aget args "k")
                           where-json (aget args "whereJson")]
                       (when (number? k) (aset payload "k" k))
                       (when (str-present? where-json)
                         (aset payload "where" (parse-json where-json #js {})))
                       (-> (.searchVector planner-client payload)
                           (.then json-str))))})

    (add-tool!
     "openplanner/jobs/list"
     #js {:description "GET /v1/jobs"
          :args #js {}
          :execute (fn [_args _ctx]
                     (-> (.listJobs planner-client)
                         (.then json-str)))})

    (add-tool!
     "openplanner/jobs/get"
     #js {:description "GET /v1/jobs/:jobId"
          :args #js {:jobId (z-str "Job id")}
          :execute (fn [args _ctx]
                     (-> (.getJob planner-client (aget args "jobId"))
                         (.then json-str)))})

    (add-tool!
     "openplanner/jobs/import/chatgpt"
     #js {:description "POST /v1/jobs/import/chatgpt"
          :args #js {:payloadJson (z-str-opt "Job payload JSON")}
          :execute (fn [args _ctx]
                     (let [payload (parse-json (aget args "payloadJson") #js {})]
                       (-> (.createChatgptImportJob planner-client payload)
                           (.then json-str))))})

    (add-tool!
     "openplanner/jobs/import/opencode"
     #js {:description "POST /v1/jobs/import/opencode"
          :args #js {:payloadJson (z-str-opt "Job payload JSON")}
          :execute (fn [args _ctx]
                     (let [payload (parse-json (aget args "payloadJson") #js {})]
                       (-> (.createOpencodeImportJob planner-client payload)
                           (.then json-str))))})

    (add-tool!
     "openplanner/jobs/compile/pack"
     #js {:description "POST /v1/jobs/compile/pack"
          :args #js {:payloadJson (z-str-opt "Job payload JSON")}
          :execute (fn [args _ctx]
                     (let [payload (parse-json (aget args "payloadJson") #js {})]
                       (-> (.createCompilePackJob planner-client payload)
                           (.then json-str))))})

    (add-tool!
     "openplanner/blobs/get"
     #js {:description "GET /v1/blobs/:sha256"
          :args #js {:sha256 (z-str "Blob sha256")}
          :execute (fn [args _ctx]
                     (let [sha256 (aget args "sha256")]
                       (-> (.getBlob planner-client sha256)
                           (.then (fn [buffer]
                                    (let [bytes (js/Uint8Array. buffer)
                                          base64 (.toString (.from js/Buffer bytes) "base64")]
                                      (json-str #js {:sha256 sha256
                                                     :size (.-length bytes)
                                                     :base64 base64})))))))})

    (add-tool!
     "openplanner/blobs/upload"
     #js {:description "POST /v1/blobs (from base64)"
          :args #js {:base64 (z-str "Base64 payload")
                     :mime (z-str-opt "MIME type")
                     :name (z-str-opt "File name")}
          :execute (fn [args _ctx]
                     (let [base64 (aget args "base64")
                           mime (or (aget args "mime") "application/octet-stream")
                           name (or (aget args "name") "blob.bin")
                           bytes (.from js/Buffer base64 "base64")
                           blob (js/Blob. #js [bytes] #js {:type mime})]
                       (-> (.uploadBlob planner-client blob mime name)
                           (.then json-str))))})

    tools))

(defn- build-opencode-client [ctx]
  (let [opts #js {}
        server-url (some-> ctx .-serverUrl str)]
    (when (str-present? server-url)
      (aset opts "baseUrl" server-url))
    ((resolve-fn ctx "createOpencodeClient" (.-createOpencodeClient opencode)) opts)))

(defn- handle-message-event [ctx planner-client opencode-client seen event]
  (let [session-id (event-session-id event)
        message-id (event-message-id event)
        created-at (event-created-at-ms event)]
    (if (or (not (str-present? session-id))
            (not (str-present? message-id)))
      (js/Promise.resolve nil)
      (let [dedupe-key (str session-id ":" message-id ":" created-at)]
        (if (contains? @seen dedupe-key)
          (js/Promise.resolve nil)
          (do
            (swap! seen conj dedupe-key)
            (-> (.getMessage opencode-client session-id message-id)
                (.then
                 (fn [snapshot]
                    (let [parts ((resolve-fn ctx "opencodeMessageToOllamaParts" (.-opencodeMessageToOllamaParts opencode)) snapshot)
                          text ((resolve-fn ctx "flattenForEmbedding" (.-flattenForEmbedding opencode)) parts)
                          paths ((resolve-fn ctx "extractPathsLoose" (.-extractPathsLoose opencode)) text)
                          role (or (some-> snapshot (aget "info") (aget "role")) "assistant")]
                      (-> ((resolve-fn ctx "createOpenPlannerEvent" (.-createOpenPlannerEvent openplanner))
                           #js {:session-id session-id
                                :message-id message-id
                                :message-index 0
                               :text text
                               :created-at created-at
                               :role role
                               :paths paths})
                         (.then (fn [envelope]
                                  (.indexEvents planner-client #js [envelope])))))))
                (.catch (fn [_err] nil)))))))))

(defn build-plugin [ctx]
  (let [planner-client ((resolve-fn ctx "createOpenPlannerClient" (.-createOpenPlannerClient openplanner)) #js {})
        opencode-client (build-opencode-client ctx)
        seen (atom #{})]
    (js/Promise.resolve
     #js {:tool (planner-tools planner-client)
           :event (fn [payload]
                    (let [event (some-> payload (aget "event"))]
                      (if (and event (message-event? event))
                        (handle-message-event ctx planner-client opencode-client seen event)
                        (js/Promise.resolve nil))))})))

(def ^:export OpenPlannerToolsPlugin build-plugin)
