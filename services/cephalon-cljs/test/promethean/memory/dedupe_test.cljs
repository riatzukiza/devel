(ns promethean.memory.dedupe-test
  (:require [cljs.test :refer-macros [deftest is testing]]
            [promethean.memory.dedupe :as d]
            [clojure.string :as str]))

(deftest test-discord-key
  (let [evt {:event/payload {:message-id "12345"}
             :event/source {:channel-id "chan1"}}]
    (is (= "discord:chan1:12345" (d/dedupe-key evt)))))

(deftest test-content-hash-key-when-discord-missing
  (let [evt {:event/payload {:content "Hello World"}
             :event/source {:channel-id "chanA"}}]
    (let [k (d/dedupe-key evt)]
      (is (str/starts-with? k "content:chanA:"))
      (is (some? k)))))

(deftest test-discord-takes-precedence-over-content
  (let [evt {:event/payload {:message-id "X" :content "Hi"}
             :event/source {:channel-id "chanB"}}]
    (is (= "discord:chanB:X" (d/dedupe-key evt)))))

(deftest test-no-channel-id-results-nil
  (let [evt {:event/payload {:content "abc"}
             :event/source {}}]
    (is (nil? (d/dedupe-key evt)))))
