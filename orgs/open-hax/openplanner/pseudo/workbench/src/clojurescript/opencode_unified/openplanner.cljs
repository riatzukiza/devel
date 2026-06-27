(ns opencode-unified.openplanner
  (:require [clojure.string :as str]
            [typed.clojure :as t]
            ["@promethean-os/openplanner-cljs-client" :as openplanner]
            [opencode-unified.session-titles :as session-titles]))

(declare now-ms
         parse-ts
         relative-time
         classify-event-type
         runtime-config
         request-json
         load-sessions-activity
         search-activity
         search-vector
         create-chatgpt-import-job
         fetch-job)

(t/ann now-ms [-> t/Num])
(t/ann parse-ts [t/Any -> t/Num])
(t/ann relative-time [t/Num -> t/Str])
(t/ann classify-event-type [t/Any t/Any t/Any -> t/Keyword])
(t/ann runtime-config [-> (t/HMap :mandatory {:endpoint t/Str} :optional {:api-key (t/U t/Nil t/Str)})])
(t/ann request-json (t/IFn [t/Str t/Str -> t/Any]
                         [t/Str t/Str t/Any -> t/Any]))
(t/ann load-sessions-activity [-> t/Any])
(t/ann search-activity [t/Str -> t/Any])
(t/ann search-vector [t/Str t/Any -> t/Any])
(t/ann create-chatgpt-import-job [t/Str -> t/Any])
(t/ann fetch-job [t/Str -> t/Any])

(defn- now-ms [] (.now js/Date))

(defn- parse-ts [value]
  (cond
    (number? value) value
    (string? value) (let [parsed (.parse js/Date value)]
                      (if (js/isNaN parsed) (now-ms) parsed))
    :else (now-ms)))

(defn- relative-time [timestamp]
  (let [delta-ms (max 0 (- (now-ms) timestamp))
        delta-sec (js/Math.floor (/ delta-ms 1000))
        delta-min (js/Math.floor (/ delta-sec 60))
        delta-hour (js/Math.floor (/ delta-min 60))
        delta-day (js/Math.floor (/ delta-hour 24))]
    (cond
      (< delta-min 1) "just now"
      (< delta-min 60) (str delta-min " min" (when (not= delta-min 1) "s") " ago")
      (< delta-hour 24) (str delta-hour " hour" (when (not= delta-hour 1) "s") " ago")
      :else (str delta-day " day" (when (not= delta-day 1) "s") " ago"))))

(defn- classify-event-type [kind title snippet]
  (let [haystack (str/lower-case (str kind " " title " " snippet))]
    (if (or (str/includes? haystack "error")
            (str/includes? haystack "fail")
            (str/includes? haystack "exception"))
      :error
      :info)))

(defn runtime-config []
  (let [cfg (or (some-> js/window (aget "__WORKBENCH_BACKENDS__") (js->clj :keywordize-keys true)) {})
        endpoint (or (:openplanner-url cfg)
                     (:openplannerUrl cfg)
                     "http://localhost:8788/api/openplanner")
        api-key (or (:openplanner-api-key cfg)
                    (:openplannerApiKey cfg))]
    {:endpoint endpoint
     :api-key api-key}))

(defonce client-cache (atom nil))

(defn- planner-factory []
  (or (some-> openplanner (aget "createOpenPlannerClient"))
      (some-> openplanner (aget "default") (aget "createOpenPlannerClient"))))

(defn- ensure-client []
  (let [{:keys [endpoint api-key]} (runtime-config)
        cached @client-cache
        create-client (planner-factory)]
    (when-not create-client
      (throw (js/Error. "OpenPlanner client factory missing from @promethean-os/openplanner-cljs-client")))
    (if (and cached
             (= endpoint (:endpoint cached))
             (= api-key (:api-key cached)))
      (:client cached)
      (let [opts #js {:endpoint endpoint}
            _ (when api-key (aset opts "apiKey" api-key))
            client (create-client opts)]
        (reset! client-cache {:endpoint endpoint :api-key api-key :client client})
        client))))

(defn request-json
  ([method path] (request-json method path nil))
  ([method path payload]
   (let [client (ensure-client)
         response-promise
         (cond
           (and (= method "GET") (= path "/v1/sessions"))
           (.listSessions client)

           (and (= method "POST") (= path "/v1/search/fts"))
           (.searchFts client (clj->js payload))

           (and (= method "POST") (= path "/v1/search/vector"))
           (.searchVector client (clj->js payload))

           (and (= method "POST") (= path "/v1/jobs/import/chatgpt"))
           (.createChatgptImportJob client (clj->js payload))

           (and (= method "GET") (str/starts-with? path "/v1/jobs/"))
           (.getJob client (subs path 9))

           :else
           (js/Promise.reject
            (js/Error. (str "Unsupported OpenPlanner call in workbench client: " method " " path))))]
     (-> response-promise
         (.then #(js->clj % :keywordize-keys true))))))

(defn load-sessions-activity []
  (-> (request-json "GET" "/v1/sessions")
      (.then (fn [result]
               (let [rows (:rows result)]
                 ;; Fetch real session titles from OpenCode SDK
                 (-> (session-titles/list-opencode-sessions)
                     (.then (fn [title-map]
                              (vec
                               (map-indexed
                                (fn [idx row]
                                  (let [ts (parse-ts (:last_ts row))
                                        session-name (or (:session row) "unspecified")
                                        ;; Use OpenCode title if available, fallback to OpenPlanner data
                                        opencode-title (get title-map session-name)
                                        session-title (or opencode-title
                                                         (:title row)
                                                         (:session_title row)
                                                         (:sessionTitle row)
                                                         (:name row)
                                                         "OpenCode Session")
                                        project-name (or (:project row) "default")
                                        event-count (or (:event_count row) 0)]
                                    {:id (str "session-" session-name "-" idx)
                                     :type :info
                                     :title session-title
                                     :session-title session-title
                                     :session-id session-name
                                     :snippet (str event-count " events")
                                     :source :openplanner
                                     :kind "session.summary"
                                     :project project-name
                                     :session session-name
                                     :time (relative-time ts)
                                     :timestamp ts}))
                                rows))))))))))

(defn search-activity [query]
  (-> (request-json "POST" "/v1/search/fts" {:q query :limit 60})
      (.then (fn [result]
               (let [rows (:rows result)]
                 (vec
                  (map-indexed
                   (fn [idx row]
                     (let [ts (parse-ts (:ts row))
                           title (or (:message row) (:snippet row) "Search result")
                           snippet (or (:snippet row) "")
                           kind (or (:kind row) "")]
                       {:id (str "event-" (or (:id row) idx))
                        :type (classify-event-type kind title snippet)
                        :title title
                        :source (or (:source row) "openplanner")
                        :kind kind
                        :project (:project row)
                        :session (:session row)
                        :snippet snippet
                        :time (relative-time ts)
                        :timestamp ts}))
                    rows)))))))

(defn search-vector [query & [k]]
  (-> (request-json "POST" "/v1/search/vector" {:q query :k (or k 20)})
      (.then (fn [result]
               (let [chroma-result (:result result)
                     ids (first (:ids chroma-result))
                     metadatas (first (:metadatas chroma-result))
                     documents (first (:documents chroma-result))
                     distances (first (:distances chroma-result))]
                 (vec
                  (map-indexed
                   (fn [idx id]
                     (let [metadata (get metadatas idx)
                           ts (parse-ts (or (:ts metadata) (:timestamp metadata)))
                           kind (or (:kind metadata) "vector.result")
                           content (or (get documents idx) "")
                           title (or (:title metadata)
                                     (first (str/split-lines content))
                                     "Semantic result")]
                       {:id (str "vector-" id)
                        :type (classify-event-type kind title content)
                        :title title
                        :source (or (:source metadata) "vector-search")
                        :kind kind
                        :project (:project metadata)
                        :session (:session metadata)
                        :snippet content
                        :text content
                        :distance (get distances idx)
                        :metadata metadata
                        :time (relative-time ts)
                        :timestamp ts}))
                   ids)))))))

(defn create-chatgpt-import-job [file-path]
  (request-json "POST" "/v1/jobs/import/chatgpt" {:filePath file-path}))

(defn fetch-job [job-id]
  (request-json "GET" (str "/v1/jobs/" job-id)))
