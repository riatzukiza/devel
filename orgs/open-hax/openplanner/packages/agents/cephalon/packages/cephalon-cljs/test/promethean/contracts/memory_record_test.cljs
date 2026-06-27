(ns promethean.contracts.memory-record-test
  (:require [cljs.test :refer-macros [deftest is testing]]
            [promethean.contracts.memory-record :as mem]))

(def sample-ts 1706899200000)

(deftest cljs-canonical-memory->boundary-record
  (testing "Namespaced canonical CLJS memories normalize into boundary records"
    (let [record (mem/to-boundary-memory-record
                   {:memory/id "m1"
                    :memory/timestamp sample-ts
                    :memory/cephalon-id "duck"
                    :memory/session-id "main"
                    :memory/role "assistant"
                    :memory/kind "message"
                    :memory/content {:text "quack" :normalized-text "quack"}
                    :memory/source {:type "discord" :channel-id "chan-1" :author-id "user-1"}
                    :memory/retrieval {:pinned true :weight-kind 1.2 :weight-source 1.0}
                    :memory/usage {:included-count-total 2 :included-count-decay 1.5}
                    :memory/embedding {:status "none"}
                    :memory/lifecycle {:deleted false}
                    :memory/schema-version 1})]
      (is (= "m1" (:id record)))
      (is (= "duck" (:cephalonId record)))
      (is (= "quack" (get-in record [:content :text])))
      (is (true? (get-in record [:retrieval :pinned]))))))

(deftest cljs-legacy-memory->boundary-record
  (testing "Older CLJS memory model maps normalize into boundary records"
    (let [record (mem/to-boundary-memory-record
                   {:memory/id "legacy-1"
                    :memory/ts sample-ts
                    :memory/kind :event
                    :memory/role :user
                    :memory/text "legacy text"
                    :memory/meta {:source :discord
                                  :session/id "main"
                                  :discord/channel-id "chan-1"
                                  :discord/author-id "user-1"}
                    :memory/lifecycle {:pinned true :replaced-by "sum-1"}
                    :memory/usage {:included-total 3 :included-decay 1.2}
                    :memory/dedupe-key "dedupe-1"}
                   {:cephalon-id "duck"})]
      (is (= "message" (:kind record)))
      (is (= "main" (:sessionId record)))
      (is (= "discord" (get-in record [:source :type])))
      (is (true? (get-in record [:retrieval :pinned])))
      (is (= "sum-1" (get-in record [:lifecycle :replacedBySummaryId]))))))

(deftest cljs-boundary-record->canonical-memory
  (testing "Boundary records convert back into canonical CLJS memory maps"
    (let [memory (mem/from-boundary-memory-record
                   {:id "m2"
                    :timestamp sample-ts
                    :cephalonId "duck"
                    :sessionId "main"
                    :eventId "evt-1"
                    :role "tool"
                    :kind "tool_result"
                    :content {:text "Result: ok" :normalizedText "tool:web.fetch"}
                    :source {:type "discord" :channelId "chan-1" :authorId "user-1"}
                    :retrieval {:pinned false :lockedByAdmin false :lockedBySystem false :weightKind 0.5 :weightSource 1.0}
                    :usage {:includedCountTotal 1 :includedCountDecay 1.0 :lastIncludedAt sample-ts}
                    :embedding {:status "none"}
                    :lifecycle {:deleted false}
                    :hashes {:contentHash "abc"}
                    :schemaVersion 1})]
      (is (= "m2" (:memory/id memory)))
      (is (= sample-ts (:memory/timestamp memory)))
      (is (= "tool_result" (:memory/kind memory)))
      (is (= "Result: ok" (get-in memory [:memory/content :text]))))))