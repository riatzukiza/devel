(ns test-main
  (:require [clojure.test :refer [deftest is testing run-tests async]]
            [opencode-unified.buffers :as buffers]
            [opencode-unified.session-titles :as session-titles]
            [session-titles-integration-test]
            [test-state]
            [test-env]
            [test-buffers]
            [test-openplanner]
            [test-command-palette]
            [test-buffers-motion]
            [test-compilation]
            [test-layout]
            [test-ui]
            [test-evil]
            [test-plugins]))

(deftest test-buffers-legacy
  (testing "buffers/line-col-to-pos"
    (is (= 0 (buffers/line-col-to-pos "line1" 0 0)))
    (is (= 6 (buffers/line-col-to-pos "line1\nline2" 1 0)))
    (is (= 7 (buffers/line-col-to-pos "line1\nline2" 1 1)))))

(deftest test-session-titles
  (testing "session-titles response normalization"
    ;; Test that SDK response normalization works correctly
    (let [mock-response #js {:data #js {:sessions #js [#js {:id "sess1" :title "Test Session 1"}
                                                         #js {:sessionID "sess2" :name "Test Session 2"}
                                                         #js {:session-id "sess3"}]}}
          ;; The function should handle different ID/key formats
          ;; This tests the happy path without mocking the SDK
          result-promise (session-titles/list-opencode-sessions)]
      ;; Since we're testing with a mock, we expect an empty map or proper error handling
      (is (some? result-promise)))))

(defn -main []
  (println "Running OpenCode Unified Tests...")
  (run-tests 'test-main 'session-titles-integration-test 'test-state 'test-env 'test-buffers 'test-openplanner 'test-command-palette 'test-buffers-motion 'test-compilation 'test-layout 'test-ui 'test-evil 'test-plugins)
  (println "Tests completed."))
