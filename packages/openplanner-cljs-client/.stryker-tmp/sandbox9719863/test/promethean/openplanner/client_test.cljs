(ns promethean.openplanner.client-test
  (:require [cljs.test :refer [deftest is async run-tests]]
            [promethean.openplanner.client :as client]))

(defn- ok-json [data]
  #js {:ok true
       :status 200
       :json (fn [] (js/Promise.resolve (clj->js data))
               )})

(deftest default-config-test
  (let [cfg (client/default-config #js {})]
    (is (string? (.-endpoint cfg)))
    (is (some? (.-fetch cfg)))))

(deftest search-fts-test
  (async done
    (let [calls (atom [])
          fetcher (fn [url opts]
                    (swap! calls conj {:url url :opts (js->clj opts)})
                    (js/Promise.resolve (ok-json {:ok true :rows [{:id "1" :snippet "x"}]})))
          c (client/create-openplanner-client #js {:endpoint "http://x/api/openplanner"
                                                   :apiKey "k"
                                                   :fetch fetcher})]
      (-> (.searchFts c #js {:q "hello" :limit 3})
          (.then (fn [result]
                   (let [r (js->clj result :keywordize-keys true)
                         call (first @calls)]
                     (is (= true (:ok r)))
                     (is (= 1 (count @calls)))
                     (is (= "http://x/api/openplanner/v1/search/fts" (:url call)))
                      (is (= "Bearer k" (get-in call [:opts "headers" "Authorization"]))))))
          (.then (fn [_] (done)))
          (.catch (fn [err]
                    (is false (str "search fts failed: " err))
                    (done)))))))

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
                   (is (= "a/b.cljs" (get-in e [:meta :paths]))))))
        (.then (fn [_] (done)))
        (.catch (fn [err]
                  (is false (str "event shape failed: " err))
                  (done))))))

(deftest no-content-and-error-paths
  (async done
    (let [calls (atom [])
          fetcher (fn [url opts]
                    (swap! calls conj {:url url :opts (js->clj opts)})
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
                    (is (not= -1 (.indexOf (.-message err) "OpenPlanner request failed (500): boom")))))
          (.then (fn [_]
                   (is (= 2 (count @calls)))
                   (done)))))))

(deftest blob-upload-and-read
  (async done
    (let [calls (atom [])
          body-capture (atom nil)
          fetcher (fn [url opts]
                    (swap! calls conj {:url url :opts opts})
                    (cond
                      (not= -1 (.indexOf url "/v1/blobs/sha"))
                      (js/Promise.resolve #js {:ok true
                                               :status 200
                                               :arrayBuffer (fn [] (js/Promise.resolve (.-buffer (js/Uint8Array. #js [1 2 3]))))})

                      :else
                      (do
                        (reset! body-capture (aget opts "body"))
                        (js/Promise.resolve (ok-json {:sha256 "abc" :size 3})))) )
          c (client/create-openplanner-client #js {:endpoint "http://x/api/openplanner"
                                                   :apiKey "k"
                                                   :fetch fetcher})
          blob (js/Blob. #js ["abc"] #js {:type "text/plain"})]
      (-> (.uploadBlob c blob "text/plain" "a.txt")
          (.then (fn [resp]
                   (let [r (js->clj resp :keywordize-keys true)]
                     (is (= "abc" (:sha256 r)))
                     (.getBlob c "sha"))))
           (.then (fn [buf]
                    (is (= 3 (.-byteLength buf)))
                    (is (some? @body-capture))))
          (.then (fn [_] (done)))
          (.catch (fn [err]
                    (is false (str "blob tests failed: " err))
                    (done)))))))

(defn -main []
  (let [{:keys [fail error]} (run-tests 'promethean.openplanner.client-test)]
    (when (pos? (+ fail error))
      (.exit js/process 1))))
