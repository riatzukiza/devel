(ns test-ui
  (:require [clojure.test :refer [deftest is testing]]
            [opencode-unified.ui :as ui]
            [opencode-unified.opencode :as opencode]
            [reagent.core :as r]))

(deftest test-chat-scrolling
  (testing "scroll-chat-to-bottom!"
    (let [mock-node #js {:scrollTop 0 :scrollHeight 100}]
      (reset! ui/chat-scroll-node mock-node)
      (ui/scroll-chat-to-bottom!)
      (is (= 100 (.-scrollTop mock-node))))))

(deftest test-chat-draft
  (testing "send-chat-draft! sends message"
    (reset! ui/chat-draft "hello world")
    (let [sent-msg (atom nil)]
      (with-redefs [opencode/send-session-message (fn [msg] (reset! sent-msg msg))]
        (#'ui/send-chat-draft!)
        (is (= "hello world" @sent-msg))
        (is (= "" @ui/chat-draft)))))

  (testing "send-chat-draft! ignores empty"
    (reset! ui/chat-draft "   ")
    (let [sent-msg (atom nil)]
      (with-redefs [opencode/send-session-message (fn [msg] (reset! sent-msg msg))]
        (#'ui/send-chat-draft!)
        (is (nil? @sent-msg))))))

(deftest test-chat-stream-panel
  (testing "renders messages"
    (let [messages [{:id "1" :role :user :text "hi"}
                    {:id "2" :role :assistant :text "hello"}]
          op-state (r/atom {:chat-stream messages :connected? true})]
      (with-redefs [opencode/get-opencode-state (fn [] op-state)]
        (let [component (ui/chat-stream-panel)
              rendered (component)]
          (is (some? rendered)))))))
