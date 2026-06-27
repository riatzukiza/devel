(ns test-openplanner
  (:require [clojure.test :refer [deftest is testing async]]
            [opencode-unified.openplanner :as openplanner]
            [opencode-unified.session-titles :as session-titles]))

(deftest test-runtime-config
  (testing "defaults"
    (let [orig-window (when (exists? js/window) js/window)]
      (set! js/window #js {})
      (try
        (let [config (openplanner/runtime-config)]
          (is (= "http://localhost:8788/api/openplanner" (:endpoint config)))
          (is (nil? (:api-key config))))
        (finally
          (set! js/window orig-window)))))

  (testing "from window config"
    (let [orig-window (when (exists? js/window) js/window)]
      (set! js/window #js {:__WORKBENCH_BACKENDS__ #js {:openplannerUrl "http://test-api"
                                                        :openplannerApiKey "secret"}})
      (try
        (let [config (openplanner/runtime-config)]
          (is (= "http://test-api" (:endpoint config)))
          (is (= "secret" (:api-key config))))
        (finally
          (set! js/window orig-window))))))

(defn mock-fetch [response-data]
  (fn [url options]
    (js/Promise.resolve
     #js {:ok true
          :json (fn [] (js/Promise.resolve (clj->js response-data)))})))

(deftest test-load-sessions-activity
  (testing "fetches and merges titles"
    (async done
      (let [orig-fetch js/fetch
            mock-response {:rows [{:last_ts 1600000000000 :session "test-session-1" :event_count 5}]}]
        
        (set! js/fetch (mock-fetch mock-response))
        
        ;; Note: session-titles/list-opencode-sessions uses the mocks/opencode_sdk.js
        ;; which provides "test-session-1" -> "First Test Session"
        (-> (openplanner/load-sessions-activity)
            (.then (fn [results]
                     (is (= 1 (count results)))
                     (let [item (first results)]
                       (is (= "First Test Session" (:title item)))
                       (is (= "test-session-1" (:session-id item)))
                       (is (= "5 events" (:snippet item))))
                     (set! js/fetch orig-fetch)
                     (done)))
            (.catch (fn [err]
                      (is (nil? err))
                      (set! js/fetch orig-fetch)
                      (done))))))))

(deftest test-search-activity
  (testing "search query"
    (async done
      (let [orig-fetch js/fetch
            mock-response {:rows [{:ts 1600000000000 
                                   :message "found it" 
                                   :kind "test"
                                   :source "search"}]}]
        
        (set! js/fetch (mock-fetch mock-response))
        
        (-> (openplanner/search-activity "test-query")
            (.then (fn [results]
                     (is (= 1 (count results)))
                     (let [item (first results)]
                       (is (= "found it" (:title item)))
                       (is (= "test" (:kind item))))
                     (set! js/fetch orig-fetch)
                     (done)))
            (.catch (fn [err]
                      (is (nil? err))
                      (set! js/fetch orig-fetch)
                      (done))))))))
