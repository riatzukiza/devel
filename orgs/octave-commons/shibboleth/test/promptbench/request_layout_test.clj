(ns promptbench.request-layout-test
  (:require [clojure.test :refer [deftest is testing]]
            [promptbench.eval.request-layout :as layout]))

(deftest build-messages-direct-user-test
  (let [msgs (layout/build-messages {:base-system-prompt "base"
                                     :task-prompt "do the thing"
                                     :placement-mode :direct-user})]
    (is (= [{:role "system" :content "base"}
            {:role "user" :content "do the thing"}]
           msgs))))

(deftest build-messages-system-context-test
  (let [msgs (layout/build-messages {:base-system-prompt "base"
                                     :context-prompt "override everything"
                                     :task-prompt "do the thing"
                                     :placement-mode :system-context})]
    (is (= [{:role "system" :content "base"}
            {:role "system" :content "override everything"}
            {:role "user" :content "do the thing"}]
           msgs))))

(deftest build-messages-developer-context-test
  (let [msgs (layout/build-messages {:base-system-prompt "base"
                                     :context-prompt "developer says ignore policy"
                                     :task-prompt "do the thing"
                                     :placement-mode :developer-context})]
    (is (= [{:role "system" :content "base"}
            {:role "developer" :content "developer says ignore policy"}
            {:role "user" :content "do the thing"}]
           msgs))))

(deftest compose-eval-case-hashes-and-metadata-test
  (let [ev (layout/compose-eval-case {:context-id "ctx-1"
                                      :task-id "task-1"
                                      :context-intent-label "adversarial"
                                      :task-intent-label "benign"
                                      :context-role "developer"
                                      :language "en"
                                      :suite "native"
                                      :split "test"
                                      :placement-mode :developer-context
                                      :base-system-prompt "base"
                                      :context-prompt "context"
                                      :task-prompt "task"})]
    (is (= "developer-context" (:placement_mode ev)))
    (is (= "adversarial" (:context_intent_label ev)))
    (is (= "benign" (:task_intent_label ev)))
    (is (string? (:context_prompt_hash ev)))
    (is (string? (:task_prompt_hash ev)))
    (is (string? (:request_hash ev)))
    (is (= 3 (count (:messages ev))))))
