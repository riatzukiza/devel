(ns promethean.openplanner.client
  (:require ["@promethean-os/openplanner-cljs-client" :as openplanner]))

(def ^:private default-openplanner-url "http://127.0.0.1:8788/api/openplanner")

(defn- env [k]
  (let [proc (when (exists? js/process) js/process)
        env-obj (when proc (.-env proc))
        v (when env-obj (aget env-obj k))]
    (when (and v (not= v "")) v)))

(defn config-from-env []
  {:url (or (env "OPENPLANNER_URL") default-openplanner-url)
   :api-key (env "OPENPLANNER_API_KEY")})

(defn post-events!
  [{:keys [url api-key]} events]
  (let [opts #js {}
        _ (when (and url (not= url "")) (aset opts "endpoint" url))
        _ (when (and api-key (not= api-key "")) (aset opts "apiKey" api-key))
        client ((.-createOpenPlannerClient openplanner) opts)]
    (.indexEvents client (clj->js events))))
