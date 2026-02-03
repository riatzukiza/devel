(ns promethean.memory.model-test
  (:require [cljs.test :refer [deftest is testing]]
            [promethean.memory.model :as model]))

(deftest test-base-memory-defaults
  (let [m (model/base-memory {})]
    (is (string? (:memory/id m)) "memory/id should be a string")
    (is (number? (:memory/ts m)) "memory/ts should be a number")
    (is (= :event (:memory/kind m)) "default kind should be :event")
    (is (= :user (:memory/role m)) "default role should be :user")
    (is (vector? (:memory/tags m)) "memory/tags should be a vector (empty by default)")
    (is (nil? (:memory/dedupe-key m)) "memory/dedupe-key should be nil by default")))
