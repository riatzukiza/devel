(ns promethean.memory.store-test
  (:require [promethean.memory.store :refer [make-store put-memory! inc-usage!]]
            [cljs.test :refer-macros [deftest is testing]]))

(deftest test-put-memory-increments-put
  (let [store (make-store)
        mem {:memory/id "m1" :memory/dedupe-key "d1"}]
    (put-memory! store mem)
    (is (= 1 (get-in @store [:stats :put])))))

(deftest test-memory-dedupe-prevents-overwrite-on-collision
  (let [store (make-store)
        mem1 {:memory/id "m1" :memory/dedupe-key "d1"}
        mem2 {:memory/id "m2" :memory/dedupe-key "d1"}]
    (put-memory! store mem1)
    (put-memory! store mem2)
    (is (nil? (get-in @store [:by-id "m2"])))
    (is (= 1 (get-in @store [:stats :deduped])))))

(deftest test-inc-usage-updates-usage-and-stats
  (let [store (make-store)
        mem {:memory/id "m3" :memory/usage {:included-total 0 :included-decay 0}}]
    (put-memory! store mem)
    (inc-usage! store "m3")
    (is (= 1 (get-in @store [:by-id "m3" :memory/usage :included-total])))
    (is (= 1 (get-in @store [:by-id "m3" :memory/usage :included-decay])))
    (is (= 1 (get-in @store [:stats :usage-inc])))))
