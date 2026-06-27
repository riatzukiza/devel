(ns opencode-unified.workspace
  (:require [clojure.string :as str]))

(defn runtime-config []
  (let [cfg (or (some-> js/window (aget "__WORKBENCH_BACKENDS__") (js->clj :keywordize-keys true)) {})
        endpoint (or (:workspace-url cfg)
                     (:workspaceUrl cfg)
                     "http://localhost:8788/api/workspace")
        api-key (or (:workspace-api-key cfg)
                    (:workspaceApiKey cfg))]
    {:endpoint endpoint
     :api-key api-key}))

(defn- encode [value]
  (js/encodeURIComponent (or value "")))

(defn request-json
  ([method route] (request-json method route nil))
  ([method route payload]
   (let [{:keys [endpoint api-key]} (runtime-config)
         headers (cond-> {"Content-Type" "application/json"}
                   (some? api-key) (assoc "Authorization" (str "Bearer " api-key)))
         body (when (some? payload) (js/JSON.stringify (clj->js payload)))]
     (-> (js/fetch (str endpoint route)
                   (clj->js {:method method
                             :headers headers
                             :body body}))
         (.then (fn [response]
                  (if (.-ok response)
                    (.text response)
                    (-> (.text response)
                        (.then (fn [txt]
                                 (throw
                                  (js/Error.
                                   (str "Workspace request failed ("
                                        (.-status response)
                                        "): "
                                        txt)))))))))
         (.then (fn [text]
                  (if (str/blank? text)
                    {}
                    (js->clj (js/JSON.parse text) :keywordize-keys true))))))))

(defn workspace-meta []
  (request-json "GET" "/meta"))

(defn list-directory
  ([] (list-directory "."))
  ([relative-path]
   (request-json "GET" (str "/list?path=" (encode relative-path) "&limit=250"))))

(defn read-file [relative-path]
  (request-json "GET" (str "/file?path=" (encode relative-path))))

(defn write-file [relative-path content]
  (request-json "PUT" "/file" {:path relative-path
                                  :content content}))
