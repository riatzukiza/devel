(ns promethean.openplanner.client)

(def ^:private default-openplanner-url "http://127.0.0.1:7777")

(defn- trim-trailing-slash [s]
  (.replace s #"/+$" ""))

(defn- env [k]
  (let [proc (when (exists? js/process) js/process)
        env-obj (when proc (.-env proc))
        v (when env-obj (aget env-obj k))]
    (when (and v (not= v "")) v)))

(defn config-from-env []
  {:url (or (env "OPENPLANNER_URL") default-openplanner-url)
   :api-key (env "OPENPLANNER_API_KEY")})

(defn- build-headers [api-key]
  (let [headers #js {"Content-Type" "application/json"}]
    (when (and api-key (not= api-key ""))
      (aset headers "Authorization" (str "Bearer " api-key)))
    headers))

(defn- ->error [status body]
  (js/Error. (str "OpenPlanner request failed: " status " " body)))

(defn post-events!
  [{:keys [url api-key]} events]
  (let [base-url (trim-trailing-slash (or url default-openplanner-url))
        req-url (str base-url "/v1/events")
        payload (clj->js {:events events})]
    (-> (js/fetch req-url
                  #js {:method "POST"
                       :headers (build-headers api-key)
                       :body (js/JSON.stringify payload)})
        (.then
          (fn [response]
            (if (.-ok response)
              response
              (-> (.text response)
                  (.then (fn [body]
                           (js/Promise.reject (->error (.-status response) body)))))))))))
