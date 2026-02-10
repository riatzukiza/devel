(ns my.opencode.entry-test
  (:require [cljs.test :as t :refer [deftest is async run-tests]]
            [clojure.string :as str]
            [my.opencode.entry :as entry]))

(let [base-report t/report]
  (set! t/report
        (fn [m]
          (base-report m)
          (when (= :summary (:type m))
            (when (pos? (+ (:fail m 0) (:error m 0)))
              (.exit js/process 1))))))

(defn- base-planner []
  #js {:health (fn [] (js/Promise.resolve #js {:ok true}))
       :listSessions (fn [] (js/Promise.resolve #js []))
       :getSession (fn [_] (js/Promise.resolve #js {}))
       :indexEvents (fn [_] (js/Promise.resolve #js {:indexed 1}))
       :searchFts (fn [_] (js/Promise.resolve #js {:rows #js []}))
       :searchVector (fn [_] (js/Promise.resolve #js {:rows #js []}))
       :listJobs (fn [] (js/Promise.resolve #js []))
       :getJob (fn [_] (js/Promise.resolve #js {}))
       :createChatgptImportJob (fn [_] (js/Promise.resolve #js {:ok true}))
       :createOpencodeImportJob (fn [_] (js/Promise.resolve #js {:ok true}))
       :createCompilePackJob (fn [_] (js/Promise.resolve #js {:ok true}))
       :getBlob (fn [_] (js/Promise.resolve (.-buffer (js/Uint8Array. #js [97 98 99]))))
       :uploadBlob (fn [_ _ _] (js/Promise.resolve #js {:sha256 "sha"}))})

(deftest plugin-exposes-openplanner-tools
  (async done
    (let [planner (base-planner)
          op-client #js {:getMessage (fn [_ _] (js/Promise.resolve #js {}))}
          ctx #js {:createOpenPlannerClient (fn [_] planner)
                   :createOpencodeClient (fn [_] op-client)
                   :serverUrl "http://127.0.0.1:4096"}]
      (-> (entry/OpenPlannerToolsPlugin ctx)
          (.then (fn [plugin]
                   (let [tools (aget plugin "tool")]
                     (is (fn? (aget plugin "event")))
                     (is (some? (aget tools "openplanner/health")))
                     (is (some? (aget tools "openplanner/sessions/list")))
                     (is (some? (aget tools "openplanner/sessions/get")))
                     (is (some? (aget tools "openplanner/events/index")))
                     (is (some? (aget tools "openplanner/search/fts")))
                     (is (some? (aget tools "openplanner/search/vector")))
                     (is (some? (aget tools "openplanner/jobs/list")))
                     (is (some? (aget tools "openplanner/jobs/get")))
                     (is (some? (aget tools "openplanner/jobs/import/chatgpt")))
                     (is (some? (aget tools "openplanner/jobs/import/opencode")))
                     (is (some? (aget tools "openplanner/jobs/compile/pack")))
                     (is (some? (aget tools "openplanner/blobs/get")))
                     (is (some? (aget tools "openplanner/blobs/upload"))))))
          (.then (fn [_] (done)))
          (.catch (fn [err]
                    (is false (str "plugin creation failed: " err))
                    (done)))))))

(deftest tools-call-openplanner-client
  (async done
    (let [calls (atom [])
          planner #js {:health (fn [] (swap! calls conj {:method :health}) (js/Promise.resolve #js {:ok true}))
                       :listSessions (fn [] (swap! calls conj {:method :listSessions}) (js/Promise.resolve #js []))
                       :getSession (fn [session-id] (swap! calls conj {:method :getSession :session-id session-id}) (js/Promise.resolve #js {:id session-id}))
                       :indexEvents (fn [events] (swap! calls conj {:method :indexEvents :events (js->clj events)}) (js/Promise.resolve #js {:indexed (.-length events)}))
                       :searchFts (fn [payload] (swap! calls conj {:method :searchFts :payload (js->clj payload :keywordize-keys true)}) (js/Promise.resolve #js {:rows #js []}))
                       :searchVector (fn [payload] (swap! calls conj {:method :searchVector :payload (js->clj payload :keywordize-keys true)}) (js/Promise.resolve #js {:rows #js []}))
                       :listJobs (fn [] (swap! calls conj {:method :listJobs}) (js/Promise.resolve #js []))
                       :getJob (fn [job-id] (swap! calls conj {:method :getJob :job-id job-id}) (js/Promise.resolve #js {:id job-id}))
                       :createChatgptImportJob (fn [payload] (swap! calls conj {:method :chatgpt :payload (js->clj payload :keywordize-keys true)}) (js/Promise.resolve #js {:ok true}))
                       :createOpencodeImportJob (fn [payload] (swap! calls conj {:method :opencode :payload (js->clj payload :keywordize-keys true)}) (js/Promise.resolve #js {:ok true}))
                       :createCompilePackJob (fn [payload] (swap! calls conj {:method :compile :payload (js->clj payload :keywordize-keys true)}) (js/Promise.resolve #js {:ok true}))
                       :getBlob (fn [sha] (swap! calls conj {:method :getBlob :sha sha}) (js/Promise.resolve (.-buffer (js/Uint8Array. #js [97 98 99]))))
                       :uploadBlob (fn [_blob mime name] (swap! calls conj {:method :uploadBlob :mime mime :name name}) (js/Promise.resolve #js {:sha256 "sha" :name name}))}
          op-client #js {:getMessage (fn [_ _] (js/Promise.resolve #js {}))}
          ctx #js {:createOpenPlannerClient (fn [_] planner)
                   :createOpencodeClient (fn [_] op-client)
                   :serverUrl "http://127.0.0.1:4096"}]
      (-> (entry/OpenPlannerToolsPlugin ctx)
          (.then (fn [plugin]
                   (let [tool (aget plugin "tool")
                         run-tool (fn [name args]
                                    (.execute (aget tool name) args #js {}))]
                     (js/Promise.all
                      #js [(run-tool "openplanner/health" #js {})
                           (run-tool "openplanner/sessions/list" #js {})
                           (run-tool "openplanner/sessions/get" #js {:sessionId "s-1"})
                           (run-tool "openplanner/events/index" #js {:eventsJson "[{\"id\":\"e1\"}]"})
                           (run-tool "openplanner/search/fts" #js {:query "hello" :limit 3 :source "src" :kind "k" :project "p" :session "s"})
                           (run-tool "openplanner/search/vector" #js {:query "vec" :k 2 :whereJson "{\"a\":1}"})
                           (run-tool "openplanner/jobs/list" #js {})
                           (run-tool "openplanner/jobs/get" #js {:jobId "job-1"})
                           (run-tool "openplanner/jobs/import/chatgpt" #js {:payloadJson "{\"k\":1}"})
                           (run-tool "openplanner/jobs/import/opencode" #js {:payloadJson "{\"k\":2}"})
                           (run-tool "openplanner/jobs/compile/pack" #js {:payloadJson "{\"k\":3}"})
                           (run-tool "openplanner/blobs/get" #js {:sha256 "blob-1"})
                           (run-tool "openplanner/blobs/upload" #js {:base64 "YWJj" :mime "text/plain" :name "x.txt"})]))))
          (.then (fn [results]
                   (let [parsed (map (fn [s] (js->clj (.parse js/JSON s) :keywordize-keys true))
                                      (array-seq results))
                         fts-call (first (filter #(= :searchFts (:method %)) @calls))
                         vec-call (first (filter #(= :searchVector (:method %)) @calls))]
                     (is (= 13 (count parsed)))
                     (is (= :health (:method (first @calls))))
                     (is (= "s-1" (:session-id (first (filter #(= :getSession (:method %)) @calls)))))
                     (is (= "hello" (get-in fts-call [:payload :q])))
                     (is (= "src" (get-in fts-call [:payload :source])))
                     (is (= "vec" (get-in vec-call [:payload :q])))
                     (is (= 2 (get-in vec-call [:payload :k])))
                     (is (= "x.txt" (:name (first (filter #(= :uploadBlob (:method %)) @calls)))))
                     (is (= "blob-1" (:sha (first (filter #(= :getBlob (:method %)) @calls)))))
                     (is (str/includes? (:base64 (nth parsed 11)) "YWJj")))))
          (.then (fn [_] (done)))
           (.catch (fn [err]
                     (is false (str "tool execution failed: " err))
                     (done)))))))

(deftest tools-handle-optional-and-default-args
  (async done
    (let [calls (atom [])
          planner #js {:searchFts (fn [payload]
                                    (swap! calls conj {:method :searchFts :payload (js->clj payload :keywordize-keys true)})
                                    (js/Promise.resolve #js {:rows #js []}))
                       :searchVector (fn [payload]
                                       (swap! calls conj {:method :searchVector :payload (js->clj payload :keywordize-keys true)})
                                       (js/Promise.resolve #js {:rows #js []}))
                       :uploadBlob (fn [_blob mime name]
                                     (swap! calls conj {:method :uploadBlob :mime mime :name name})
                                     (js/Promise.resolve #js {:ok true}))
                       :health (fn [] (js/Promise.resolve #js {:ok true}))
                       :listSessions (fn [] (js/Promise.resolve #js []))
                       :getSession (fn [_] (js/Promise.resolve #js {}))
                       :indexEvents (fn [_] (js/Promise.resolve #js {:indexed 1}))
                       :listJobs (fn [] (js/Promise.resolve #js []))
                       :getJob (fn [_] (js/Promise.resolve #js {}))
                       :createChatgptImportJob (fn [_] (js/Promise.resolve #js {:ok true}))
                       :createOpencodeImportJob (fn [_] (js/Promise.resolve #js {:ok true}))
                       :createCompilePackJob (fn [_] (js/Promise.resolve #js {:ok true}))
                       :getBlob (fn [_] (js/Promise.resolve (.-buffer (js/Uint8Array. #js [97 98 99]))))}
          op-client #js {:getMessage (fn [_ _] (js/Promise.resolve #js {}))}
          ctx #js {:createOpenPlannerClient (fn [_] planner)
                   :createOpencodeClient (fn [_] op-client)}]
      (-> (entry/OpenPlannerToolsPlugin ctx)
          (.then (fn [plugin]
                   (let [tool (aget plugin "tool")
                         run-tool (fn [name args]
                                    (.execute (aget tool name) args #js {}))]
                     (js/Promise.all
                      #js [(run-tool "openplanner/search/fts" #js {:query "hello"})
                           (run-tool "openplanner/search/vector" #js {:query "vec"})
                           (run-tool "openplanner/blobs/upload" #js {:base64 "YWJj"})]))))
          (.then (fn [_]
                   (let [fts-payload (:payload (first (filter #(= :searchFts (:method %)) @calls)))
                         vec-payload (:payload (first (filter #(= :searchVector (:method %)) @calls)))
                         upload-call (first (filter #(= :uploadBlob (:method %)) @calls))]
                     (is (= {:q "hello"} fts-payload))
                     (is (= {:q "vec"} vec-payload))
                     (is (= "application/octet-stream" (:mime upload-call)))
                     (is (= "blob.bin" (:name upload-call))))))
          (.then (fn [_] (done)))
          (.catch (fn [err]
                    (is false (str "optional/default arg handling failed: " err))
                    (done)))))))

(deftest event-handler-indexes-and-dedupes
  (async done
    (let [indexed (atom [])
          opencode-opts (atom nil)
          planner #js {:indexEvents (fn [events]
                                      (swap! indexed conj (js->clj (aget events 0) :keywordize-keys true))
                                      (js/Promise.resolve #js {:indexed 1}))}
          op-client #js {:getMessage (fn [_ _]
                                       (js/Promise.resolve #js {:info #js {:role "assistant"}
                                                                :parts #js [#js {:type "text" :text "hello"}]}))}]
      (-> (entry/OpenPlannerToolsPlugin
           #js {:createOpenPlannerClient (fn [_] planner)
                :createOpencodeClient (fn [opts]
                                        (reset! opencode-opts (js->clj opts :keywordize-keys true))
                                        op-client)
                :createOpenPlannerEvent (fn [payload]
                                          (js/Promise.resolve #js {:id "evt-1"
                                                                   :text (aget payload "text")
                                                                   :source_ref #js {:session (aget payload "session-id")
                                                                                    :message (aget payload "message-id")}}))
                :opencodeMessageToOllamaParts (fn [_] #js [#js {:role "assistant" :content "hello"}])
                :flattenForEmbedding (fn [_] "hello")
                :extractPathsLoose (fn [_] #js ["src/a.cljs"])
                :serverUrl "http://localhost:4096"})
          (.then (fn [plugin]
                   (let [event-fn (aget plugin "event")
                         payload #js {:event #js {:type "message.updated"
                                                  :properties #js {:info #js {:sessionID "s1"
                                                                              :id "m1"
                                                                              :time #js {:created 1700000000000}}}}}
                         payload2 #js {:event #js {:type "message.removed"
                                                   :properties #js {:part #js {:sessionID "s1"
                                                                                :messageID "m2"}}}}
                         payload3 #js {:event #js {:type "session.started"}}]
                     (-> (event-fn payload)
                         (.then (fn [_] (event-fn payload)))
                         (.then (fn [_] (event-fn payload2)))
                         (.then (fn [_] (event-fn payload3)))))))
          (.then (fn [_]
                   (is (= 2 (count @indexed)))
                   (is (= "s1" (get-in (first @indexed) [:source_ref :session])))
                   (is (= "m1" (get-in (first @indexed) [:source_ref :message])))
                   (is (= "hello" (:text (first @indexed))))
                   (is (= "http://localhost:4096" (:baseUrl @opencode-opts)))))
          (.then (fn [_] (done)))
          (.catch (fn [err]
                    (is false (str "event handler failed: " err))
                    (done)))))))

(deftest event-handler-absorbs-opencode-errors
  (async done
    (let [planner #js {:indexEvents (fn [_] (js/Promise.resolve #js {:indexed 1}))}
          op-client #js {:getMessage (fn [_ _] (js/Promise.reject (js/Error. "fetch failed")))}
          ctx #js {:createOpenPlannerClient (fn [_] planner)
                   :createOpencodeClient (fn [_] op-client)}]
      (-> (entry/OpenPlannerToolsPlugin ctx)
          (.then (fn [plugin]
                   ((aget plugin "event")
                    #js {:event #js {:type "message.updated"
                                     :properties #js {:info #js {:sessionID "s1"
                                                                 :id "m1"
                                                                 :time #js {:created 1700000000000}}}}})))
          (.then (fn [result]
                   (is (nil? result))))
          (.then (fn [_] (done)))
          (.catch (fn [err]
                    (is false (str "error absorption failed: " err))
                    (done)))))))

(defn -main []
  (run-tests 'my.opencode.entry-test))
