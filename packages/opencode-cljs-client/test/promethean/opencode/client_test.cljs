(ns promethean.opencode.client-test
  (:require [cljs.test :as t :refer [deftest is async run-tests]]
            [promethean.opencode.client :as client]))

(defmethod t/report [:cljs.test/default :summary] [m]
  (println "\nRan" (:test m) "tests containing" (+ (:pass m) (:fail m) (:error m)) "assertions.")
  (println (:fail m) "failures," (:error m) "errors.")
  (when (pos? (+ (:fail m) (:error m)))
    (.exit js/process 1)))

(defn- ok-json [data]
  #js {:ok true
       :status 200
       :text (fn [] (js/Promise.resolve (.stringify js/JSON (clj->js data))))
       :json (fn [] (js/Promise.resolve (clj->js data)))} )

(defn- with-process-env [env-map f]
  (let [env-obj (some-> js/globalThis (aget "process") (aget "env"))
        original-base (when env-obj (aget env-obj "OPENCODE_BASE_URL"))
        original-key (when env-obj (aget env-obj "OPENCODE_API_KEY"))]
    (when env-obj
      (aset env-obj "OPENCODE_BASE_URL" (get env-map "OPENCODE_BASE_URL"))
      (aset env-obj "OPENCODE_API_KEY" (get env-map "OPENCODE_API_KEY")))
    (-> (f)
        (.finally (fn []
                    (when env-obj
                      (aset env-obj "OPENCODE_BASE_URL" original-base)
                      (aset env-obj "OPENCODE_API_KEY" original-key)))))))

(deftest default-config-priority-and-trimming-test
  (async done
    (let [calls (atom [])
          fetcher (fn [url opts]
                    (swap! calls conj {:url url :opts opts})
                    (js/Promise.resolve (ok-json {:data []})))
          c (client/create-opencode-client #js {:baseUrl "http://api/"
                                                :apiKey "opt-key"
                                                :fetch fetcher})]
      (.then (.listSessions c)
             (fn [_]
               (let [cfg (.-config c)
                     first-call (first @calls)
                     headers (some-> first-call :opts (aget "headers"))]
                 (is (= "http://api" (aget cfg "baseUrl")))
                 (is (= "opt-key" (aget cfg "apiKey")))
                 (is (= fetcher (aget cfg "fetch")))
                 (is (= "http://api/session" (:url first-call)))
                 (is (= "application/json" (aget headers "content-type")))
                 (is (= "Bearer opt-key" (aget headers "authorization"))))
               (done))
             (fn [err]
               (is false (str "default config priority failed: " err))
               (done))))))

(deftest default-config-env-priority-test
  (async done
    (let [p (with-process-env {"OPENCODE_BASE_URL" "http://env-api///"
                               "OPENCODE_API_KEY" "env-key"}
              (fn []
                (let [calls (atom [])
                      fetcher (fn [url opts]
                                (swap! calls conj {:url url :opts opts})
                                (js/Promise.resolve (ok-json {:data []})))
                      c (client/create-opencode-client #js {:fetch fetcher})]
                  (-> (.listSessions c)
                      (.then (fn [_]
                               (let [cfg (.-config c)
                                     call (first @calls)
                                     headers (some-> call :opts (aget "headers"))]
                                 (is (= "http://env-api" (aget cfg "baseUrl")))
                                 (is (= "env-key" (aget cfg "apiKey")))
                                 (is (= "http://env-api/session" (:url call)))
                                 (is (= "Bearer env-key" (aget headers "authorization"))))))))))]
      (.then p
             (fn [_] (done))
             (fn [err]
               (is false (str "default config env priority failed: " err))
               (done))))))

(deftest default-config-fallback-test
  (async done
    (let [p (with-process-env {"OPENCODE_BASE_URL" ""
                               "OPENCODE_API_KEY" ""}
              (fn []
                (let [calls (atom [])
                      fetcher (fn [url opts]
                                (swap! calls conj {:url url :opts opts})
                                (js/Promise.resolve (ok-json {:data []})))
                      c (client/create-opencode-client #js {:fetch fetcher})]
                  (-> (.listSessions c)
                      (.then (fn [_]
                               (let [cfg (.-config c)
                                     call (first @calls)
                                     headers (some-> call :opts (aget "headers"))]
                                 (is (= "http://127.0.0.1:4096" (aget cfg "baseUrl")))
                                 (is (nil? (aget cfg "apiKey")))
                                 (is (= "http://127.0.0.1:4096/session" (:url call)))
                                 (is (= "application/json" (aget headers "content-type")))
                                 (is (nil? (aget headers "authorization"))))))))))]
      (.then p
             (fn [_] (done))
             (fn [err]
               (is false (str "default config fallback failed: " err))
               (done))))))

(deftest create-client-request-test
  (async done
    (let [calls (atom [])
          fetcher (fn [url opts]
                    (swap! calls conj {:url url :opts opts})
                    (js/Promise.resolve (ok-json {:data [{:id "s1" :title "Session"}]})))
          c (client/create-opencode-client #js {:baseUrl "http://api"
                                                :apiKey "k"
                                                :fetch fetcher})]
      (-> (.listSessions c)
          (.then (fn [sessions]
                   (let [call (first @calls)
                         headers (aget (:opts call) "headers")
                         header (when headers (aget headers "authorization"))]
                     (is (= 1 (count sessions)))
                     (is (= "http://api/session" (:url call)))
                     (is (= "Bearer k" header)))))
          (.then (fn [_] (done)))
          (.catch (fn [err]
                    (is false (str "list sessions failed: " err))
                    (done)))))))

(deftest message-normalization-test
  (let [entry {:info {:role "assistant"}
               :parts [{:type "text" :text "hello"}
                       {:type "tool-call"
                        :tool_name "grep"
                        :arguments {:pattern "foo"}
                        :output "ok"}]}
        parts (client/opencode-message-to-ollama-parts entry)
        text (client/flatten-for-embedding parts)]
    (is (= 2 (count parts)))
    (is (string? text))
    (is (not= -1 (.indexOf text "tool_call:grep")))))

(deftest extract-paths-test
  (let [paths (client/extract-paths-loose "edit src/main.ts and packages/reconstituter/src/opencode-sessions.ts please")]
    (is (>= (count paths) 2))))

(deftest request-error-and-unwrap-test
  (async done
    (let [fetcher (fn [_url _opts]
                    (js/Promise.resolve #js {:ok false
                                             :status 401
                                             :text (fn [] (js/Promise.resolve "nope"))}))
          c (client/create-opencode-client #js {:baseUrl "http://api"
                                                :fetch fetcher})]
      (-> (.getSession c "s1")
          (.then (fn [_]
                   (is false "expected getSession to fail")))
          (.catch (fn [err]
                    (is (not= -1 (.indexOf (.-message err) "OpenCode request failed (401): nope")))))
           (.then (fn [_] (done)))))))

(deftest endpoint-routing-and-payload-shape-test
  (async done
    (let [calls (atom [])
          fetcher (fn [url opts]
                    (swap! calls conj {:url url :opts opts})
                    (cond
                      (= "http://api/session" url)
                      (js/Promise.resolve (ok-json {:data [{:id "s1"}]}))

                      (= "http://api/session/s1" url)
                      (js/Promise.resolve (ok-json {:data {:data {:id "s1"}}}))

                      (= "http://api/session/status" url)
                      (js/Promise.resolve (ok-json {:data {:ses-1 {:type "idle"}}}))

                      (= "http://api/session/s1/message" url)
                      (if (= "GET" (aget opts "method"))
                        (js/Promise.resolve (ok-json {:data [{:id "m1"}]}))
                        (js/Promise.resolve (ok-json {:data {:id "m2"}})))

                      (= "http://api/session/s1/message/m1" url)
                      (js/Promise.resolve (ok-json {:data {:id "m1" :text "hello"}}))

                       (= "http://api/session/s1/prompt_async" url)
                       (js/Promise.resolve #js {:ok true :status 204 :text (fn [] (js/Promise.resolve ""))})

                       (= "http://api/lsp" url)
                       (js/Promise.resolve (ok-json {:data [{:id "typescript" :status "connected"}]}))

                       (= "http://api/lsp/diagnostics" url)
                       (js/Promise.resolve (ok-json {:data {"src/app.ts" [{:message "x" :severity 1 :range {:start {:line 0 :character 0}}}]}}))

                       :else
                       (js/Promise.resolve (ok-json {:data {:ok true}}))))
          c (client/create-opencode-client #js {:baseUrl "http://api"
                                                :apiKey "k"
                                                :fetch fetcher})
          payload #js {:parts #js [#js {:type "text" :text "ping"}]}]
      (-> (.listSessions c)
          (.then (fn [sessions]
                   (is (= 1 (count sessions)))
                   (.getSession c "s1")))
          (.then (fn [session]
                   (is (= "s1" (get (js->clj session :keywordize-keys true) :id)))
                   (.listSessionStatus c)))
          (.then (fn [status]
                   (is (= "idle" (get-in (js->clj status :keywordize-keys true) [:ses-1 :type])))
                   (.listMessages c "s1")))
          (.then (fn [messages]
                   (is (= 1 (count messages)))
                   (.getMessage c "s1" "m1")))
          (.then (fn [message]
                   (is (= "hello" (get (js->clj message :keywordize-keys true) :text)))
                   (.sendMessage c "s1" payload)))
           (.then (fn [result]
                    (is (= "m2" (get (js->clj result :keywordize-keys true) :id)))
                    (.promptAsync c "s1" payload)))
          (.then (fn [_]
                   (.lspStatus c)))
          (.then (fn [status]
                   (is (= "connected" (:status (first (js->clj status :keywordize-keys true)))))
                   (.lspDiagnostics c)))
          (.then (fn [diagnostics]
                   (is (= "x" (get-in (js->clj diagnostics)
                                       ["src/app.ts" 0 "message"])))))
          (.then (fn [_]
                   (let [routes (map :url @calls)
                          methods (map (fn [call] (aget (:opts call) "method")) @calls)
                          headers (map (fn [call] (some-> (:opts call) (aget "headers"))) @calls)
                          send-body (some-> (nth @calls 5) :opts (aget "body") (js/JSON.parse) (js->clj :keywordize-keys true))]
                     (is (= ["http://api/session"
                             "http://api/session/s1"
                             "http://api/session/status"
                             "http://api/session/s1/message"
                             "http://api/session/s1/message/m1"
                             "http://api/session/s1/message"
                             "http://api/session/s1/prompt_async"
                             "http://api/lsp"
                             "http://api/lsp/diagnostics"]
                            routes))
                     (is (= ["GET" "GET" "GET" "GET" "GET" "POST" "POST" "GET" "GET"] methods))
                     (is (= {:parts [{:type "text" :text "ping"}]} send-body))
                     (is (= 9 (count headers)))
                     (doseq [h headers]
                       (is (= "application/json" (aget h "content-type")))
                       (is (= "Bearer k" (aget h "authorization")))))))
          (.then (fn [_] (done)))
          (.catch (fn [err]
                    (is false (str "endpoint routing failed: " err))
                    (done)))))))

(deftest session-status-and-send-test
  (async done
    (let [calls (atom [])
          fetcher (fn [url opts]
                    (swap! calls conj {:url url :opts opts})
                    (cond
                      (= "http://api/session/status" url)
                      (js/Promise.resolve (ok-json {:data {:ses-1 {:type "idle"}}}))

                      (= "http://api/session/ses-1/prompt_async" url)
                      (js/Promise.resolve #js {:ok true :status 204 :text (fn [] (js/Promise.resolve ""))})

                      :else
                      (js/Promise.resolve (ok-json {:data {:ok true}}))))
          c (client/create-opencode-client #js {:baseUrl "http://api"
                                                :apiKey "k"
                                                :fetch fetcher})]
      (-> (.listSessionStatus c)
          (.then (fn [status]
                   (is (= "idle" (get-in (js->clj status :keywordize-keys true) [:ses-1 :type])))))
          (.then (fn [_]
                   (.promptAsync c "ses-1" #js {:parts #js [#js {:type "text" :text "ping"}]})))
          (.then (fn [_]
                   (let [status-call (first @calls)
                         prompt-call (second @calls)
                         prompt-opts (js->clj (:opts prompt-call) :keywordize-keys true)]
                     (is (= "http://api/session/status" (:url status-call)))
                     (is (= "POST" (:method prompt-opts)))
                     (is (= "http://api/session/ses-1/prompt_async" (:url prompt-call))))))
          (.then (fn [_] (done)))
          (.catch (fn [err]
                    (is false (str "status/send failed: " err))
                    (done)))))))

(deftest message-normalization-fallbacks
  (let [entry {:info {:type "assistant"}
               :parts [{:type "tool-call"
                        :function {:name "grep" :arguments {:pattern "x"}}
                        :content {:ok true}}
                       {:type "mystery" :value 1}]}
        parts (js->clj (client/opencode-message-to-ollama-parts entry) :keywordize-keys true)
        flattened (client/flatten-for-embedding parts)]
    (is (= "assistant" (:role (first parts))))
    (is (= "tool" (:role (second parts))))
    (is (not= -1 (.indexOf flattened "tool_call:grep")))
    (is (not= -1 (.indexOf flattened "[tool:grep]")))))

(deftest role-normalization-test
  (let [user-entry {:info {:role "user"}
                    :parts [{:type "text" :text "hello"}]}
        system-entry {:info {:role "system"}
                      :parts [{:type "text" :text "rules"}]}
        unknown-entry {:info {:role "something-else"}
                       :parts [{:type "text" :text "fallback"}]}
        user-msg (first (js->clj (client/opencode-message-to-ollama-parts user-entry) :keywordize-keys true))
        system-msg (first (js->clj (client/opencode-message-to-ollama-parts system-entry) :keywordize-keys true))
        unknown-msg (first (js->clj (client/opencode-message-to-ollama-parts unknown-entry) :keywordize-keys true))]
    (is (= "user" (:role user-msg)))
    (is (= "system" (:role system-msg)))
    (is (= "assistant" (:role unknown-msg)))
    (is (= "[user] hello"
           (client/flatten-for-embedding [user-msg])))))

(defn -main []
  (run-tests 'promethean.opencode.client-test))
