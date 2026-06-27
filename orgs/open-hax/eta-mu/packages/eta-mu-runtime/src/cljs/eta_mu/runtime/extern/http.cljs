(ns eta-mu.runtime.extern.http
  (:require [clojure.string :as str]
            [eta-mu.runtime.extern.js :as extern-js]
            [eta-mu.runtime.extern.json :as json]
            [eta-mu.runtime.law.boundary :as boundary-law]
            [eta-mu.runtime.law.core :as law]))

(defn- method-name
  [method]
  (-> (or method :get) name str/upper-case))

(defn request->fetch-init
  "Convert a CLJS HTTP request map into an opaque JS fetch init object.
   The raw object must not leave extern/infra code except as an opaque handle."
  [request]
  (let [request (law/validate! boundary-law/http-request-schema request "http request")
        headers (merge (when (:json request)
                         {"content-type" "application/json"})
                       (:headers request))
        body (cond
               (contains? request :json) (json/stringify (:json request))
               (contains? request :body) (:body request)
               :else nil)
        init (cond-> {:method (method-name (:method request))
                      :headers headers}
               body (assoc :body body)
               (:signal request) (assoc :signal (:signal request)))]
    (extern-js/clj->value init)))

(defn response-map
  [status headers body]
  {:status status
   :headers headers
   :body body})
