(ns eta-mu.extensions.websearch-open-hax
  "Web search via Open Hax proxy service.

  Migrated from: ~/.ημ/agent/extensions/websearch-open-hax.ts"
  (:require-macros [eta-mu.core :as em])
  (:require [clojure.string :as str]
            ["node:fs/promises" :as fs]
            ["node:os" :as os]
            ["node:path" :as path]))

(def DEFAULT-PROXY-URL "http://127.0.0.1:8789")
(def DEFAULT-MODEL "openai/gpt-5.3-codex")
(def DEFAULT-MAX-BYTES 524288)
(def DEFAULT-MAX-LINES 2000)

(defn proxy-url []
  (or (aget js/process.env "OPEN_HAX_OPENAI_PROXY_URL")
      (aget js/process.env "OPEN_HAX_PROXY_URL")
      DEFAULT-PROXY-URL))

(defn proxy-token []
  (or (aget js/process.env "OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN")
      (aget js/process.env "OPEN_HAX_PROXY_AUTH_TOKEN")
      (aget js/process.env "PROXY_AUTH_TOKEN")
      (aget js/process.env "PROXX_AUTH_TOKEN")
      )
  )

(defn format-size [bytes]
  (cond
    (< bytes 1024) (str bytes " B")
    (< bytes 1048576) (str (.toFixed (/ bytes 1024) 1) " KB")
    :else (str (.toFixed (/ bytes 1048576) 2) " MB")))

(defn write-temp [text]
  (let [dir (path/join (os/tmpdir) "pi-websearch")]
    (-> (fs/mkdir dir #js {:recursive true})
        (.then (fn []
                 (let [file (path/join dir (str "websearch-" (js/Date.now) ".md"))]
                   (-> (fs/writeFile file text "utf-8")
                       (.then (fn [] file)))))))))

(defn format-sources [sources]
  (when (and (array? sources) (pos? (alength sources)))
    (str "\n\nSources:\n"
         (->> (js/Array.from sources)
              (filter #(and % (string? (aget % "url"))))
              (map #(if-let [title (aget % "title")]
                      (str "- [" title "](" (aget % "url") ")")
                      (str "- " (aget % "url"))))
              (str/join "\n")))))

(defn truncate-head [text max-bytes max-lines]
  (let [lines (.split text "\n")
        total-lines (alength lines)
        total-bytes (.-length (js/Buffer.from text "utf-8"))]
    (if (and (<= total-bytes max-bytes) (<= total-lines max-lines))
      {:content text
       :truncated false
       :total-lines total-lines
       :output-lines total-lines
       :total-bytes total-bytes
       :output-bytes total-bytes}
      (let [output-lines (min max-lines total-lines)
            sliced (.slice lines (- total-lines output-lines))
            content (.join sliced "\n")]
        (if (<= (.-length (js/Buffer.from content "utf-8")) max-bytes)
          {:content content
           :truncated true
           :total-lines total-lines
           :output-lines output-lines
           :total-bytes total-bytes
           :output-bytes (.-length (js/Buffer.from content "utf-8"))}
          (let [buf (js/Buffer.from content "utf-8")
                sliced-buf (.slice buf (- (.-length buf) max-bytes))]
            {:content (.toString sliced-buf "utf-8")
             :truncated true
             :total-lines total-lines
             :output-lines output-lines
             :total-bytes total-bytes
             :output-bytes max-bytes}))))))

(defn handle-success [json endpoint model]
  (let [text (if (string? (aget json "output")) (aget json "output") "")
        sources (if (array? (aget json "sources")) (aget json "sources") #js [])
        response-id (aget json "responseId")
        backend (or (aget json "backend") "openai")
        combined (str text (or (format-sources sources) ""))
        trunc (truncate-head combined DEFAULT-MAX-BYTES DEFAULT-MAX-LINES)]
    (if-not (:truncated trunc)
      #js {:content #js [#js {:type "text" :text (:content trunc)}]
           :details #js {:backend backend
                         :endpoint endpoint
                         :model model
                         :responseId response-id
                         :sourcesCount (alength sources)
                         :truncated false}}
      (-> (write-temp combined)
          (.then (fn [output-path]
                   (let [trunc-msg (str "\n\n[Output truncated: " (:output-lines trunc) " of " (:total-lines trunc)
                                        " lines (" (format-size (:output-bytes trunc)) " of " (format-size (:total-bytes trunc))
                                        "). Full output saved to: " output-path "]")]
                     #js {:content #js [#js {:type "text" :text (str (:content trunc) trunc-msg)}]
                          :details #js {:backend backend
                                        :endpoint endpoint
                                        :model model
                                        :responseId response-id
                                        :sourcesCount (alength sources)
                                        :truncated true
                                        :outputPath output-path}})))))))

(em/defextension websearch-open-hax
  :name "websearch-open-hax"
  :description "Search the web via Open Hax proxy (OAuth-backed)"

  (em/tool "websearch"
    :label "Web Search (Open Hax)"
    :description "Search the web via services/open-hax-openai-proxy using stored OpenAI OAuth logins (no OPENAI_API_KEY needed)."
    :parameters {:query {:type "string" :description "Web search query"}
                 :numResults {:type "integer" :minimum 1 :maximum 20 :description "How many results to return (default: 8)" :optional true}
                 :searchContextSize {:type "string" :enum ["low" "medium" "high"] :description "Search context size (default: medium)" :optional true}
                 :allowedDomains {:type "array" :items {:type "string"} :description "Optional allow-list of domains" :optional true}
                 :model {:type "string" :description "Model ID to use" :optional true}}
    :execute (fn [_tcid params signal onUpdate ctx]
               (let [token (proxy-token)]
                 (if-not token
                   (js/Promise.reject (js/Error. "Missing auth token for Open Hax proxy. Set OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN (or PROXY_AUTH_TOKEN)."))
                   (let [endpoint (str (.replace (proxy-url) #"/+$" "") "/api/tools/websearch")
                         model (or (aget params "model")
                                   (aget js/process.env "OPEN_HAX_WEBSEARCH_MODEL")
                                   DEFAULT-MODEL)]
                     (when onUpdate
                       (onUpdate #js {:content #js [#js {:type "text" :text (str "Calling Open Hax websearch... (" endpoint ")")}]
                                      :details #js {:status "starting" :endpoint endpoint :model model}}))
                     (-> (js/fetch endpoint
                                   #js {:method "POST"
                                        :headers #js {"Authorization" (str "Bearer " token)
                                                      "Content-Type" "application/json"}
                                        :body (js/JSON.stringify #js {:query (aget params "query")
                                                                      :numResults (aget params "numResults")
                                                                      :searchContextSize (aget params "searchContextSize")
                                                                      :allowedDomains (aget params "allowedDomains")
                                                                      :model model})
                                        :signal signal})
                         (.then (fn [resp]
                                  (-> (.text resp)
                                      (.then (fn [raw]
                                               (let [json (try
                                                            (js/JSON.parse raw)
                                                            (catch :default _ nil))]
                                                 (cond
                                                   (not json)
                                                   (js/Promise.reject
                                                     (js/Error. (str "Open Hax websearch returned non-JSON: " (subs raw 0 2000))))

                                                   (not (.-ok resp))
                                                   (js/Promise.reject
                                                     (js/Error. (str "Open Hax websearch error (" (.-status resp) " " (.-statusText resp) "): " (subs raw 0 2000))))

                                                   :else
                                                   (handle-success json endpoint model)))))))))))))))
