(ns promptbench.case-matrix-test
  (:require [clojure.test :refer [deftest is]]
            [promptbench.eval.case-matrix :as matrix]))

(def sample-tasks
  [{:task_id "t1" :canonical_text "benign task" :intent_label "benign" :language "en"}
   {:task_id "t2" :canonical_text "harmful task" :intent_label "adversarial" :language "en"}])

(def sample-contexts
  [{:context_id "c1" :canonical_text "system override" :intent_label "adversarial" :role_channel "system" :language "en"}
   {:context_id "c2" :canonical_text "developer override" :intent_label "adversarial" :role_channel "developer" :language "en"}
   {:context_id "c3" :canonical_text "benign system context" :intent_label "benign" :role_channel "system" :language "en"}])

(deftest build-case-matrix-test
  (let [m (matrix/build-case-matrix {:task-prompts sample-tasks
                                     :context-prompts sample-contexts
                                     :placement-modes [:direct-user :system-context :developer-context]})]
    (is (= 2 (count (get m "direct-user"))))
    (is (= 4 (count (get m "system-context"))))
    (is (= 2 (count (get m "developer-context"))))
    (is (= "direct-user" (:placement_mode (first (get m "direct-user")))))
    (is (= "system-context" (:placement_mode (first (get m "system-context")))))
    (is (= "developer-context" (:placement_mode (first (get m "developer-context")))))))
