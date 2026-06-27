(ns promethean.openplanner.client-test
  (:require [cljs.test :as t :refer [deftest is async run-tests]]
            [promethean.openplanner.client :as client]))

(defmethod t/report [:cljs.test/default :summary] [m]
  (println "\nRan" (:test m) "tests containing" (+ (:pass m) (:fail m) (:error m)) "assertions.")
  (println (:fail m) "failures," (:error m) "errors.")
  (when (pos? (+ (:fail m) (:error m)))
    (.exit js/process 1)))

(defn- ok-json [data]
  #js {:ok true
       :status 200
       :json (fn [] (js/Promise.resolve (clj->js data)))})

(defn- opts->map [opts]
  (js->clj opts :keywordize-keys true))

(deftest default-config-test
  (let [cfg (client/default-config #js {})]
    (is (string? (.-endpoint cfg)))
    (is (some? (.-fetch cfg)))))

(deftest api-method-path-and-auth-headers
  (let [calls (atom [])
        fetcher (fn [url opts]
                  (swap! calls conj {:url url :opts (opts->map opts)})
                  (js/Promise.resolve (ok-json {:ok true :rows [{:id "1" :snippet "x"}]})))
        c-with-key (client/create-openplanner-client #js {:endpoint "http://x/api/openplanner"
                                                          :apiKey "k"
                                                          :fetch fetcher})
        c-no-key (client/create-openplanner-client #js {:endpoint "http://x/api/openplanner"
                                                        :fetch fetcher})]
    (.searchFts c-with-key #js {:q "hello" :limit 3})
    (.health c-no-key)
    (let [search-call (first @calls)
          health-call (second @calls)]
      (is (= "http://x/api/openplanner/v1/search/fts" (:url search-call)))
      (is (= "POST" (get-in search-call [:opts :method])))
      (is (= "Bearer k" (get-in search-call [:opts :headers :Authorization])))
      (is (= "application/json" (get-in search-call [:opts :headers :Content-Type])))
      (is (= {:q "hello" :limit 3}
             (js->clj (.parse js/JSON (get-in search-call [:opts :body])) :keywordize-keys true)))
      (is (= "http://x/api/openplanner/v1/health" (:url health-call)))
      (is (= "GET" (get-in health-call [:opts :method])))
      (is (nil? (get-in health-call [:opts :headers :Authorization]))))))

(deftest event-shape-test
  (async done
    (-> (client/create-openplanner-event {:session-id "s1"
                                          :message-id "m1"
                                          :message-index 2
                                          :text "hi"
                                          :created-at 1700000000000
                                          :role "assistant"
                                          :session-title "T"
                                          :paths ["a/b.cljs"]})
        (.then (fn [event]
                 (let [e (js->clj event :keywordize-keys true)]
                   (is (= "openplanner.event.v1" (:schema e)))
                   (is (= "s1" (get-in e [:source_ref :session])))
                   (is (= "m1" (get-in e [:source_ref :message])))
                   (is (= "assistant" (get-in e [:meta :role])))
                    (is (= "a/b.cljs" (get-in e [:meta :paths]))))
                  (done)))
        (.catch (fn [err]
                  (is false (str "event shape failed: " err))
                  (done))))))

(deftest client-endpoints-route-to-correct-methods
  (let [calls (atom [])
        fetcher (fn [url opts]
                  (swap! calls conj {:url url :opts (opts->map opts)})
                  (js/Promise.resolve (ok-json {:ok true})))
        c (client/create-openplanner-client #js {:endpoint "http://x/api/openplanner"
                                                 :fetch fetcher})]
    (.listSessions c)
    (.getSession c "s-1")
    (.indexEvents c #js [#js {:id "e1"}])
    (.searchVector c #js {:q "vector"})
    (.listJobs c)
    (.getJob c "j-1")
    (.createChatgptImportJob c #js {:path "chat.json"})
    (.createOpencodeImportJob c #js {:repo "org/repo"})
    (.createCompilePackJob c #js {:sessionId "s-1"})
    (let [routes (map (fn [call]
                        [(get-in call [:opts :method]) (:url call)])
                      @calls)]
      (is (= [["GET" "http://x/api/openplanner/v1/sessions"]
              ["GET" "http://x/api/openplanner/v1/sessions/s-1"]
              ["POST" "http://x/api/openplanner/v1/events"]
              ["POST" "http://x/api/openplanner/v1/search/vector"]
              ["GET" "http://x/api/openplanner/v1/jobs"]
              ["GET" "http://x/api/openplanner/v1/jobs/j-1"]
              ["POST" "http://x/api/openplanner/v1/jobs/import/chatgpt"]
              ["POST" "http://x/api/openplanner/v1/jobs/import/opencode"]
              ["POST" "http://x/api/openplanner/v1/jobs/compile/pack"]]
             routes))
      (is (= {:events [{:id "e1"}]}
             (js->clj (.parse js/JSON (get-in (nth @calls 2) [:opts :body])) :keywordize-keys true))))))

(deftest request-no-content-and-error-body-propagation
  (async done
    (let [calls (atom [])
          fetcher (fn [url opts]
                    (swap! calls conj {:url url :opts (opts->map opts)})
                    (cond
                      (not= -1 (.indexOf url "/v1/jobs"))
                      (js/Promise.resolve #js {:ok true
                                               :status 204
                                               :json (fn [] (js/Promise.resolve #js {}))})

                      :else
                      (js/Promise.resolve #js {:ok false
                                               :status 500
                                               :text (fn [] (js/Promise.resolve "boom"))})))
          c (client/create-openplanner-client #js {:endpoint "http://x/api/openplanner"
                                                   :fetch fetcher})]
      (-> (.listJobs c)
          (.then (fn [result]
                   (is (nil? result))
                   (.searchVector c #js {:q "x"})))
          (.then (fn [_]
                   (is false "expected searchVector to throw")))
          (.catch (fn [err]
                    (is (not= -1 (.indexOf (.-message err) "OpenPlanner request failed (500): boom")))
                    (is (not= -1 (.indexOf (.-message err) "500")))))
          (.then (fn []
                   (is (= 2 (count @calls)))
                   (is (= "GET" (get-in (first @calls) [:opts :method])))
                   (is (= "POST" (get-in (second @calls) [:opts :method])))
                   (done)))))))

(deftest blob-get-upload-success-and-failure
  (async done
    (let [calls (atom [])
          body-capture (atom nil)
          phase (atom :ok)
          fetcher (fn [url opts]
                    (swap! calls conj {:url url :opts (opts->map opts)})
                    (let [is-get-blob (not= -1 (.indexOf url "/v1/blobs/sha"))]
                      (cond
                        (= :ok @phase)
                        (if is-get-blob
                          (js/Promise.resolve #js {:ok true
                                                   :status 200
                                                   :arrayBuffer (fn [] (js/Promise.resolve (.-buffer (js/Uint8Array. #js [1 2 3]))))})
                          (do
                            (reset! body-capture (aget opts "body"))
                            (js/Promise.resolve (ok-json {:sha256 "abc" :size 3}))))

                        is-get-blob
                        (js/Promise.resolve #js {:ok false
                                                 :status 404
                                                 :text (fn [] (js/Promise.resolve "missing blob"))})

                        :else
                        (js/Promise.resolve #js {:ok false
                                                 :status 415
                                                 :text (fn [] (js/Promise.resolve "unsupported mime"))}))))
          c (client/create-openplanner-client #js {:endpoint "http://x/api/openplanner"
                                                   :apiKey "k"
                                                   :fetch fetcher})
          blob (js/Blob. #js ["abc"] #js {:type "text/plain"})]
      (-> (.uploadBlob c blob "text/plain" "a.txt")
          (.then (fn [resp]
                   (let [r (js->clj resp :keywordize-keys true)]
                     (is (= "abc" (:sha256 r)))
                     (is (= 3 (:size r)))
                     (.getBlob c "sha"))))
          (.then (fn [buf]
                   (is (= 3 (.-byteLength buf)))
                   (is (instance? js/FormData @body-capture))
                   (let [upload-call (first @calls)
                         get-call (second @calls)]
                     (is (= "POST" (get-in upload-call [:opts :method])))
                     (is (= "GET" (get-in get-call [:opts :method])))
                     (is (= "Bearer k" (get-in upload-call [:opts :headers :Authorization])))
                     (is (= "text/plain" (get-in upload-call [:opts :headers :x-blob-mime])))
                     (is (= "Bearer k" (get-in get-call [:opts :headers :Authorization]))))
                   (reset! phase :fail)
                   (.uploadBlob c blob "application/octet-stream" "b.bin")))
          (.then (fn [_]
                   (is false "expected uploadBlob failure in fail phase")))
          (.catch (fn [upload-err]
                    (is (not= -1 (.indexOf (.-message upload-err) "OpenPlanner blob upload failed (415): unsupported mime")))
                    (.getBlob c "sha")))
          (.then (fn [_]
                   (is false "expected getBlob failure in fail phase")))
          (.catch (fn [read-err]
                    (is (not= -1 (.indexOf (.-message read-err) "OpenPlanner blob read failed (404): missing blob")))
                    (done)))))))

(defn -main []
  (run-tests 'promethean.openplanner.client-test))
