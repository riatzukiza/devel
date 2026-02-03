(ns promethean.eidolon.nexus-index-test
  (:require [cljs.test :refer-macros [deftest is testing]]
            [promethean.eidolon.nexus-index :as nexus]))

(deftest upsert-adds-and-removes-keys
  (let [idx (nexus/make-index)]
    (nexus/upsert! idx "m1" ["k1" "k2"])
    (is (= #{"k1" "k2"} (nexus/keys-for-id idx "m1")))
    (is (= #{"m1"} (nexus/ids-for-key idx "k1")))
    (nexus/upsert! idx "m1" ["k2" "k3"])
    (is (= #{"k2" "k3"} (nexus/keys-for-id idx "m1")))
    (is (= #{} (nexus/ids-for-key idx "k1")))
    (is (= #{"m1"} (nexus/ids-for-key idx "k3")))))

(deftest neighbors-shared-counts
  (let [idx (nexus/make-index)]
    (nexus/upsert! idx "m1" ["a" "b"])
    (nexus/upsert! idx "m2" ["b" "c"])
    (nexus/upsert! idx "m3" ["a"])
    (is (= {"m1" 2 "m2" 1 "m3" 1}
           (nexus/neighbors idx ["a" "b"])))))
