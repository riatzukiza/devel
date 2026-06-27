(ns opencode-unified.session-titles
  "Fetch session titles from OpenCode through the canonical CLJS client"
  (:require ["@promethean-os/opencode-cljs-client" :as opencode]))

(defn- backend-config []
  (if (exists? js/window)
    (or (some-> js/window (aget "__WORKBENCH_BACKENDS__") (js->clj :keywordize-keys true)) {})
    {}))

(defn- configured-api-endpoint []
  (let [cfg (backend-config)]
    (or (:opencode-url cfg)
        (:opencodeUrl cfg)
        "http://localhost:8788/api/opencode")))

(defn- configured-api-key []
  (let [cfg (backend-config)]
    (or (:opencode-api-key cfg)
        (:opencodeApiKey cfg)
        (:openplanner-api-key cfg)
        (:openplannerApiKey cfg))))

(defn- make-client []
  (let [opts #js {:baseUrl (configured-api-endpoint)}
        api-key (configured-api-key)
        create-client (or (some-> opencode (aget "createOpencodeClient"))
                          (some-> opencode (aget "default") (aget "createOpencodeClient")))]
    (when-not create-client
      (throw (js/Error. "OpenCode client factory missing from @promethean-os/opencode-cljs-client")))
    (when api-key
      (aset opts "apiKey" api-key))
    (create-client opts)))

(defonce client-ref (atom nil))

(defn- ensure-client []
  (or @client-ref
      (let [c (make-client)]
        (reset! client-ref c)
        c)))

(defn list-opencode-sessions []
  "List all OpenCode sessions and return a map of session-id -> title"
  (let [client (ensure-client)]
    (-> (.listSessions client)
        (.then (fn [result]
                 (let [sessions (js->clj result :keywordize-keys true)
                       rows (cond
                              (vector? sessions) sessions
                              (map? sessions) (or (:sessions sessions) (:rows sessions) (:data sessions) [])
                              :else [])]
                   (into {}
                         (map (fn [s]
                                [(or (:id s) (:sessionID s) (:session-id s))
                                 (or (:title s) (:name s) "Untitled Session")])
                              rows)))))
        (.catch (fn [error]
                  (println "Error fetching OpenCode sessions:" (or (.-message error) (str error)))
                  {})))))
