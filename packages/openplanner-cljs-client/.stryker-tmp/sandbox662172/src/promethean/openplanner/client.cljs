(ns promethean.openplanner.client
  (:require [clojure.string :as str]))

(defn- now-iso [] (.toISOString (js/Date.)))

(defn- sha256-hex [text]
  (let [crypto (or (some-> js/globalThis (aget "crypto"))
                   (js/Error. "crypto unavailable"))]
    (-> (.digest (.-subtle crypto) "SHA-256" (.encode (js/TextEncoder.) text))
        (.then (fn [buf]
                 (->> (array-seq (js/Uint8Array. buf))
                      (map (fn [n]
                             (let [h (.toString n 16)]
                               (if (= 1 (.-length h)) (str "0" h) h))))
                      (apply str)))))))

(defn- trim-slash [s]
  (str/replace (or s "") #"/+$" ""))

(defn- env [k]
  (let [proc (some-> js/globalThis (aget "process"))
        env-obj (when proc (aget proc "env"))
        v (when env-obj (aget env-obj k))]
    (when (and v (not= v "")) v)))

(defn default-config
  ([] (default-config #js {}))
  ([opts]
   (let [endpoint (or (aget opts "endpoint")
                      (env "OPENPLANNER_API_BASE_URL")
                      (some-> (env "OPENPLANNER_URL") trim-slash)
                      "http://127.0.0.1:8788/api/openplanner")
         api-key (or (aget opts "apiKey")
                     (env "OPENPLANNER_API_KEY"))
         fetcher (or (aget opts "fetch") js/fetch)]
     #js {:endpoint (trim-slash endpoint)
           :apiKey api-key
           :fetch fetcher})))

(defn- json-headers [api-key]
  (let [headers #js {"Content-Type" "application/json"}]
    (when api-key
      (aset headers "Authorization" (str "Bearer " api-key)))
    headers))

(defn- request
  [cfg method path payload]
  (let [url (str (aget cfg "endpoint") path)
        headers (json-headers (aget cfg "apiKey"))
        body (when (some? payload) (.stringify js/JSON (clj->js payload)))]
    (-> ((aget cfg "fetch")
         url
         (cond-> #js {:method method
                      :headers headers}
           body (doto (aset "body" body))))
        (.then (fn [response]
                 (if (.-ok response)
                   (if (= 204 (.-status response))
                     nil
                     (.json response))
                   (-> (.text response)
                       (.then (fn [txt]
                                (throw (js/Error. (str "OpenPlanner request failed (" (.-status response) "): " txt)))))))))
        (.then (fn [data]
                  (if (some? data)
                    data
                    nil))))))

(defn create-openplanner-event
  [input]
  (let [m (if (map? input) input (js->clj input :keywordize-keys true))
        session-id (or (:session-id m) (:session_id m) (:sessionId m))
        message-id (or (:message-id m) (:message_id m) (:messageId m))
        message-index (or (:message-index m) (:message_index m) (:messageIndex m) 0)
        text (:text m)
        created-at (or (:created-at m) (:created_at m) (:createdAt m))
        role (or (:role m) "assistant")
        session-title (or (:session-title m) (:session_title m) (:sessionTitle m))
        paths (:paths m)]
    (-> (sha256-hex (str session-id ":" message-id ":" message-index))
      (.then (fn [id]
               (clj->js
                {:schema "openplanner.event.v1"
                 :id id
                 :ts (if created-at (.toISOString (js/Date. created-at)) (now-iso))
                 :source "opencode-sessions"
                 :kind "message"
                 :source_ref {:session session-id
                              :message message-id}
                 :text (or text "")
                 :meta (cond-> {:message_id message-id
                                :message_index message-index
                                :role role
                                :session_title session-title}
                         (seq paths) (assoc :paths (str/join "|" paths)))}))))))

(defn- upload-blob [cfg file mime name]
  (let [fd (js/FormData.)
        headers #js {}]
    (.append fd "file" file (or name "blob.bin"))
    (when (aget cfg "apiKey")
      (aset headers "Authorization" (str "Bearer " (aget cfg "apiKey"))))
    (when mime
      (aset headers "x-blob-mime" mime))
    (-> ((aget cfg "fetch")
         (str (aget cfg "endpoint") "/v1/blobs")
         #js {:method "POST"
              :headers headers
              :body fd})
        (.then (fn [response]
                 (if (.-ok response)
                   (.json response)
                   (-> (.text response)
                       (.then (fn [txt]
                                (throw (js/Error. (str "OpenPlanner blob upload failed (" (.-status response) "): " txt)))))))))
        (.then (fn [data] data)))))

(defn create-openplanner-client
  ([] (create-openplanner-client #js {}))
  ([opts]
   (let [cfg (default-config opts)]
     #js {:config cfg
          :health (fn [] (request cfg "GET" "/v1/health" nil))
          :listSessions (fn [] (request cfg "GET" "/v1/sessions" nil))
          :getSession (fn [session-id] (request cfg "GET" (str "/v1/sessions/" session-id) nil))
          :indexEvents (fn [events] (request cfg "POST" "/v1/events" {:events events}))
          :searchFts (fn [payload] (request cfg "POST" "/v1/search/fts" payload))
          :searchVector (fn [payload] (request cfg "POST" "/v1/search/vector" payload))
          :listJobs (fn [] (request cfg "GET" "/v1/jobs" nil))
          :getJob (fn [job-id] (request cfg "GET" (str "/v1/jobs/" job-id) nil))
          :createChatgptImportJob (fn [payload] (request cfg "POST" "/v1/jobs/import/chatgpt" payload))
          :createOpencodeImportJob (fn [payload] (request cfg "POST" "/v1/jobs/import/opencode" payload))
          :createCompilePackJob (fn [payload] (request cfg "POST" "/v1/jobs/compile/pack" payload))
           :getBlob (fn [sha256]
                      (-> ((aget cfg "fetch")
                           (str (aget cfg "endpoint") "/v1/blobs/" sha256)
                           #js {:method "GET"
                                :headers (let [headers #js {}]
                                           (when (aget cfg "apiKey")
                                             (aset headers "Authorization" (str "Bearer " (aget cfg "apiKey"))))
                                           headers)})
                         (.then (fn [response]
                                  (if (.-ok response)
                                    (.arrayBuffer response)
                                    (-> (.text response)
                                        (.then (fn [txt]
                                                 (throw (js/Error. (str "OpenPlanner blob read failed (" (.-status response) "): " txt)))))))))))
          :uploadBlob (fn [file mime name] (upload-blob cfg file mime name))})))
