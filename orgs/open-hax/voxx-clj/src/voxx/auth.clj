(ns voxx.auth
  "API key extraction and authorization for the Voxx voice gateway."
  (:require [clojure.string :as str]))

(defn extract-api-key
  "Extract the API key from a Ring request map.
   Checks Authorization header, X-API-Key, and query param token."
  [request]
  (let [headers (:headers request)
        query   (:query-params request)
        ;; Try Authorization: Bearer <key>
        auth-header (str/trim (or (get headers "authorization") ""))
        bearer-key (when (.startsWith ^String (str/lower-case auth-header) "bearer ")
                     (str/trim (subs auth-header 7)))
        ;; Try X-API-Key, API-Key, XI-API-Key headers
        header-key (first (filter #(not (str/blank? %))
                                  (map #(str/trim (or (get headers %) ""))
                                       ["x-api-key" "api-key" "xi-api-key"])))
        ;; Try ?token= query param
        query-key  (str/trim (or (get query "token") ""))]
    (or bearer-key header-key query-key "")))

(defn authorized?
  "Check if a Ring request is authorized.
   If no API key is configured, all requests are authorized."
  [request settings]
  (if (str/blank? (:api-key settings))
    true
    (= (extract-api-key request) (:api-key settings))))
