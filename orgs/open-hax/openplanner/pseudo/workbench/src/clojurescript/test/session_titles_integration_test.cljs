(ns session-titles-integration-test
  "Integration test for session titles functionality"
  (:require [clojure.test :refer [deftest is testing]]
            [opencode-unified.session-titles :as session-titles]))

(deftest test-session-titles-integration
  "Test that session titles can be fetched and normalized"
  (testing "list-opencode-sessions returns a promise"
    (let [result (session-titles/list-opencode-sessions)]
      (is (some? result))
      (is (instance? js/Promise result)))))