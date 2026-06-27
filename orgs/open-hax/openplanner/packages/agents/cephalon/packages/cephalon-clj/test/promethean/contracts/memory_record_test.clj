(ns promethean.contracts.memory-record-test
  (:require [clojure.test :as t]
            [promethean.contracts.memory-record :as mem])
  (:import [java.time Instant]))

(def sample-ts 1706899200000)

(t/deftest clj-local-memory->boundary-record
  (let [record (mem/to-boundary-memory-record
                 {:memory/id "m1"
                  :memory/created-at (Instant/ofEpochMilli sample-ts)
                  :memory/kind :event
                  :role "user"
                  :content "legacy text"
                  :meta {:source :discord
                         :session/id "main"
                         :discord/channel-id "chan-1"
                         :discord/author-id "user-1"}
                  :lifecycle {:pinned true :replaced-by "sum-1"}
                  :usage {:included-total 3 :included-decay 1.25}}
                 {:cephalon-id "duck"})]
    (t/is (= "m1" (:id record)))
    (t/is (= sample-ts (:timestamp record)))
    (t/is (= "message" (:kind record)))
    (t/is (= "discord" (get-in record [:source :type])))
    (t/is (true? (get-in record [:retrieval :pinned])))))

(t/deftest clj-boundary-record->local-memory
  (let [memory (mem/from-boundary-memory-record
                 {:id "m2"
                  :timestamp sample-ts
                  :cephalonId "duck"
                  :sessionId "main"
                  :eventId "evt-1"
                  :role "assistant"
                  :kind "message"
                  :content {:text "quack" :normalizedText "quack"}
                  :source {:type "discord" :channelId "chan-1" :authorId "user-1"}
                  :retrieval {:pinned false :lockedByAdmin false :lockedBySystem false :weightKind 1.0 :weightSource 1.0}
                  :usage {:includedCountTotal 1 :includedCountDecay 1.0 :lastIncludedAt sample-ts}
                  :embedding {:status "none"}
                  :lifecycle {:deleted false}
                  :hashes {:contentHash "abc"}
                  :schemaVersion 1})]
    (t/is (= "m2" (:memory/id memory)))
    (t/is (= sample-ts (:memory/timestamp memory)))
    (t/is (= "assistant" (:role memory)))
    (t/is (= "quack" (:content memory)))
    (t/is (= :message (:memory/kind memory)))))

(t/deftest clj-normalize-boundary-memory-record-keeps-canonical-shape
  (let [record (mem/normalize-boundary-memory-record
                 {:id "m3"
                  :timestamp sample-ts
                  :cephalonId "duck"
                  :sessionId "main"
                  :role "tool"
                  :kind "tool_result"
                  :content {:text "Result: ok"}
                  :source {:type "system"}
                  :retrieval {:pinned false :lockedByAdmin false :lockedBySystem false :weightKind 0.5 :weightSource 1.0}
                  :usage {:includedCountTotal 0 :includedCountDecay 0.0 :lastIncludedAt 0}
                  :embedding {:status "none"}
                  :lifecycle {:deleted false}
                  :schemaVersion 1})]
    (t/is (true? (mem/boundary-memory-record? record)))
    (t/is (= "tool_result" (:kind record)))
    (t/is (= 1 (:schemaVersion record)))))