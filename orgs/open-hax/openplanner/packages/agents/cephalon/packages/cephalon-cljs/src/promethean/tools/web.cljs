(ns promethean.tools.web
  "Web tools for CLJS runtime."
  (:require-macros [promethean.tools.def-tool :refer [def-tool]]))

(def-tool web-fetch
  {:description "Fetch content from a URL."
   :inputSchema {:type "object"
                 :properties {:url {:type "string"
                                    :description "URL to fetch"}
                             :timeout_ms {:type "integer"
                                          :description "Request timeout in milliseconds"
                                          :default 30000}}
                 :required ["url"]}}
  (fn [_ctx args]
    (let [url (get args "url")
          timeout-ms (or (get args "timeout_ms") 30000)]
      (-> (js/fetch url #js {:method "GET"
                             :headers #js {"User-Agent" "Cephalon/1.0"}})
          (.then
            (fn [response]
              (if (.-ok response)
                (-> (.text response)
                    (.then
                      (fn [text]
                        {:result {:url url
                                  :status (.-status response)
                                  :content text
                                  :content-type (-> response .-headers (.get "content-type"))}})))
                {:error (str "HTTP " (.-status response) ": " (.-statusText response))
                 :url url})))
          (.catch
            (fn [err]
              {:error (str err) :url url}))))))

(def-tool web-search
  {:description "Search the web for information."
   :inputSchema {:type "object"
                 :properties {:query {:type "string"
                                      :description "Search query"}
                             :limit {:type "integer"
                                     :description "Max results"
                                     :default 5}}
                 :required ["query"]}}
  (fn [_ctx args]
    (let [query (get args "query")
          limit (or (get args "limit") 5)]
      ;; TODO: Integrate with actual search API (DuckDuckGo, etc.)
      ;; For now, return a placeholder
      (js/Promise.resolve
        {:result {:query query
                  :results []
                  :note "Search integration pending - use web.fetch for known URLs"}}))))

(def-tool github-search
  {:description "Search GitHub for code, repositories, or issues."
   :inputSchema {:type "object"
                 :properties {:query {:type "string"
                                      :description "Search query"}
                             :type {:type "string"
                                    :description "Type: repositories, code, issues"
                                    :enum ["repositories" "code" "issues"]
                                    :default "code"}
                             :limit {:type "integer"
                                     :description "Max results"
                                     :default 5}}
                 :required ["query"]}}
  (fn [_ctx args]
    (let [query (get args "query")
          search-type (or (get args "type") "code")
          limit (or (get args "limit") 5)
          github-token (.-GITHUB_TOKEN js/process.env)]
      (if (seq github-token)
        (-> (js/fetch (str "https://api.github.com/search/" search-type
                           "?q=" (js/encodeURIComponent query)
                           "&per_page=" limit)
                      #js {:method "GET"
                           :headers #js {"Authorization" (str "token " github-token)
                                         "Accept" "application/vnd.github.v3+json"
                                         "User-Agent" "Cephalon/1.0"}})
            (.then
              (fn [response]
                (-> (.json response)
                    (.then
                      (fn [data]
                        {:result {:query query
                                  :type search-type
                                  :items (js->clj (.-items data) :keywordize-keys true)}}))))
              (fn [err]
                {:error (str err) :query query})))
        (js/Promise.resolve {:error "GITHUB_TOKEN not set"})))))
