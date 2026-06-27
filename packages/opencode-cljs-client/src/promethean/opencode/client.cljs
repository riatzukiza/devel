(ns promethean.opencode.client
  (:require [clojure.string :as str]))

(def ^:private default-opencode-base-url "http://127.0.0.1:4096")

(defn- trim-slash [s]
  (str/replace (or s "") #"/+$" ""))

(defn- env [k]
  (let [proc (some-> js/globalThis (aget "process"))
        env-obj (when proc (aget proc "env"))
        v (when env-obj (aget env-obj k))]
    (when (and v (not= v "")) v)))

(defn- default-config [opts]
  (let [base-url (or (aget opts "baseUrl")
                     (env "OPENCODE_BASE_URL")
                     default-opencode-base-url)
        api-key (or (aget opts "apiKey")
                    (env "OPENCODE_API_KEY"))
        fetcher (or (aget opts "fetch") js/fetch)]
    #js {:baseUrl (trim-slash base-url)
         :apiKey api-key
         :fetch fetcher}))

(defn- unwrap-data [value]
  (cond
    (nil? value) nil
    (and (object? value) (some? (aget value "data"))) (recur (aget value "data"))
    :else value))

(defn- request-json [cfg method path payload]
  (let [headers #js {"content-type" "application/json"}
        body (when (some? payload) (.stringify js/JSON (clj->js payload)))]
    (when (aget cfg "apiKey")
      (aset headers "authorization" (str "Bearer " (aget cfg "apiKey"))))
    (-> ((aget cfg "fetch")
         (str (aget cfg "baseUrl") path)
         (cond-> #js {:method method
                      :headers headers}
             body (doto (aset "body" body))))
         (.then (fn [response]
                  (if (.-ok response)
                    (if (= 204 (.-status response))
                      nil
                      (-> (.text response)
                          (.then (fn [txt]
                                   (if (= 0 (.-length txt))
                                     nil
                                     (.parse js/JSON txt))))))
                    (-> (.text response)
                        (.then (fn [txt]
                                 (throw (js/Error. (str "OpenCode request failed (" (.-status response) "): " txt)))))))))
         (.then unwrap-data))))

(defn create-opencode-client
  ([] (create-opencode-client #js {}))
  ([opts]
   (let [cfg (default-config opts)]
     #js {:config cfg
          :listSessions
          (fn []
            (request-json cfg "GET" "/session" nil))
          :getSession
          (fn [session-id]
            (request-json cfg "GET" (str "/session/" session-id) nil))
          :listSessionStatus
          (fn []
            (request-json cfg "GET" "/session/status" nil))
          :listMessages
          (fn [session-id]
            (request-json cfg "GET" (str "/session/" session-id "/message") nil))
          :getMessage
          (fn [session-id message-id]
            (request-json cfg "GET" (str "/session/" session-id "/message/" message-id) nil))
          :sendMessage
          (fn [session-id payload]
            (request-json cfg "POST" (str "/session/" session-id "/message") payload))
           :promptAsync
           (fn [session-id payload]
             (request-json cfg "POST" (str "/session/" session-id "/prompt_async") payload))
           :lspStatus
           (fn []
             (request-json cfg "GET" "/lsp" nil))
           :lspDiagnostics
           (fn []
             (request-json cfg "GET" "/lsp/diagnostics" nil))})))

(defn- normalize-role [value]
  (cond
    (= value "user") "user"
    (= value "system") "system"
    :else "assistant"))

(defn opencode-message-to-ollama-parts [entry]
  (let [entry* (if (map? entry) entry (js->clj entry :keywordize-keys true))
        info (:info entry*)
        parts (or (:parts entry*) [])
        role (normalize-role (or (:role info) (:type info) "assistant"))
        text-chunks (atom [])
        tool-calls (atom [])
        tool-results (atom [])]
    (doseq [p parts]
      (let [part-type (:type p)
            part-text (:text p)
            tool-name (or (:tool_name p)
                          (:name p)
                          (get-in p [:tool :name])
                          (get-in p [:function :name]))
            tool-args (or (:arguments p)
                          (:args p)
                          (:input p)
                          (get-in p [:tool :input])
                          (get-in p [:function :arguments]))
            tool-out (or (:output p)
                         (:result p)
                         (:content p)
                         (get-in p [:tool :output]))]
        (cond
          (and (= part-type "text") (string? part-text))
          (swap! text-chunks conj part-text)

          (and tool-name (map? tool-args))
          (do
            (swap! tool-calls conj {:name (str tool-name) :args tool-args})
            (when (some? tool-out)
              (swap! tool-results conj {:name (str tool-name)
                                        :output (if (string? tool-out)
                                                  tool-out
                                                  (.stringify js/JSON (clj->js tool-out)))})))

          :else
          (swap! text-chunks conj (str "[opencode_part:" part-type "] " (.stringify js/JSON (clj->js p)))))))
    (let [content (->> @text-chunks (str/join "\n") str/trim)
          result (if (seq @tool-calls)
                   (vec
                    (concat
                     [{:role "assistant"
                       :content (when (seq content) content)
                       :tool_calls (vec (map-indexed
                                         (fn [idx tc]
                                           {:type "function"
                                            :function {:index idx
                                                       :name (:name tc)
                                                       :arguments (:args tc)}})
                                         @tool-calls))}]
                     (map (fn [tr]
                            {:role "tool"
                             :tool_name (:name tr)
                             :content (:output tr)})
                          @tool-results)))
                   [{:role role :content content}])]
      (clj->js result))))

(defn flatten-for-embedding [ollama-msgs]
  (let [msgs (if (array? ollama-msgs)
               (js->clj ollama-msgs :keywordize-keys true)
               ollama-msgs)]
    (->> msgs
       (map (fn [m]
              (let [role (:role m)]
                (cond
                  (= role "tool")
                  (str "[tool:" (:tool_name m) "] " (:content m))

                  (and (= role "assistant") (seq (:tool_calls m)))
                  (->> (:tool_calls m)
                       (map (fn [tc]
                              (str "[tool_call:"
                                   (get-in tc [:function :name])
                                   "] "
                                   (.stringify js/JSON (clj->js (get-in tc [:function :arguments]))))))
                       (str/join "\n"))

                  :else
                  (str "[" role "] " (or (:content m) ""))))))
       (str/join "\n"))))

(def ^:private path-re
  (js/RegExp. "(^|[\\s\"'`(])((?:\\.{0,2}\\/)?(?:[A-Za-z0-9_.-]+\\/)+[A-Za-z0-9_.-]+)(?=$|[\\s\"'`),.:;])" "g"))

(defn extract-paths-loose [text]
  (let [source (or text "")
        out (atom #{})]
    (set! (.-lastIndex path-re) 0)
    (loop [m (.exec path-re source)]
      (if (nil? m)
        (clj->js (vec @out))
        (do
          (swap! out conj (aget m 2))
          (recur (.exec path-re source)))))))
