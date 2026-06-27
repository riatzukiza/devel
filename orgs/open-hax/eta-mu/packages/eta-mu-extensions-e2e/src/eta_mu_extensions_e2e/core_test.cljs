(ns eta-mu-extensions-e2e.core-test
  (:require [cljs.test :refer [deftest is testing]]
            [eta-mu.extensions.contract-runtime-v2.core :as core]))

;; ── Fixtures ────────────────────────────────────────────────────────────────

(def block-policy
  {:contract/kind  :policy
   :contract/id    "deny-shell"
   :policy/match   {:tool/name "shell"}
   :policy/action  :block
   :policy/reason  "No shell."})

(def notify-fulfillment
  {:contract/kind       :fulfillment
   :contract/id         "notify-write"
   :fulfillment/match   {:tool/name "write_file"}
   :fulfillment/mode    :notify
   :fulfillment/message "tool={tool/name} dry={dry-run} error={tool/error?}"
   :fulfillment/level   :info})

(def error-fulfillment
  {:contract/kind       :fulfillment
   :contract/id         "notify-error"
   :fulfillment/match   {:tool/error? true}
   :fulfillment/mode    :notify
   :fulfillment/message "error path for {tool/name}"
   :fulfillment/level   :error})

;; ── Policy gate E2E ─────────────────────────────────────────────────────────

(deftest block-contract-e2e
  (testing "shell call is blocked"
    (let [result (core/evaluate-policies
                   [block-policy]
                   {:tool/name "shell" :tool/params {:cmd "rm -rf /"}})]
      (is (= :block (:action result)))
      (is (= "No shell." (:reason result))))))

(deftest allow-unlisted-tool-e2e
  (testing "unmatched tool is allowed through"
    (let [result (core/evaluate-policies
                   [block-policy]
                   {:tool/name "read_file"})]
      (is (= :allow (:action result))))))

;; ── Fulfillment E2E ──────────────────────────────────────────────────────────

(deftest notify-fulfillment-e2e
  (testing "write_file fires notify with interpolated message"
    (let [tool-result {:tool/name   "write_file"
                       :tool/params {:dry-run false}
                       :tool/error  nil}
          actions (core/evaluate-fulfillments [notify-fulfillment] tool-result)
          entry   (first actions)]
      (is (= 1 (count actions)))
      (is (= :notify (:mode entry)))
      ;; {dry-run} resolves to false, {tool/name} to write_file
      ;; {tool/error?} — not a param, resolves via top-level (boolean nil) = false
      (is (= "tool=write_file dry=false error={tool/error?}" (:message entry))))))

(deftest error-fulfillment-e2e
  (testing "tool/error truthy fires error fulfillment"
    (let [tool-result {:tool/name  "read_file"
                       :tool/error "ENOENT"}
          actions (core/evaluate-fulfillments [error-fulfillment] tool-result)]
      (is (= 1 (count actions)))
      (is (= "error path for read_file" (:message (first actions))))))
  (testing "tool/error false does NOT fire"
    (let [tool-result {:tool/name  "read_file"
                       :tool/error false}
          actions (core/evaluate-fulfillments [error-fulfillment] tool-result)]
      (is (empty? actions)))))

;; ── Scriptable mock-server shape (smoke test) ───────────────────────────────

(deftest mock-openai-script-e2e
  (testing "scripted-response advances step per call"
    (let [script [{:type :tool-call :tool-name "write_file" :arguments {:path "/tmp/x"}}
                  {:type :message   :content "all done"}]
          state0 {:step 0 :script script}
          resp0  (cond
                   (= :tool-call (:type (nth script 0)))
                   {:finish-reason "tool_calls"
                    :tool-name (get-in script [0 :tool-name])}
                   :else {:finish-reason "stop"})
          state1 {:step 1 :script script}
          resp1  (cond
                   (= :message (:type (nth script 1)))
                   {:finish-reason "stop"
                    :content (get-in script [1 :content])}
                   :else {:finish-reason "tool_calls"})]
      (is (= "tool_calls" (:finish-reason resp0)))
      (is (= "write_file" (:tool-name resp0)))
      (is (= "stop" (:finish-reason resp1)))
      (is (= "all done" (:content resp1))))))
