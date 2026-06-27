(ns eta-mu.runtime.domain.state-test
  (:require [cljs.test :refer [deftest is testing]]
            [eta-mu.runtime.domain.state :as state]))

(deftest create-belief-clamps-unit-interval-test
  (testing "create-belief clamps values into the unit interval"
    (let [belief (state/create-belief {:urgency 2
                                       :ambiguity -1})]
      (is (= 1 (:urgency belief)))
      (is (= 0 (:ambiguity belief)))
      (is (= 0.5 (:user-intent-confidence belief))))))

(deftest create-state-defaults-test
  (testing "create-state preserves current runtime defaults when given explicit time"
    (let [runtime-state (state/create-state {:now "2026-05-29T00:00:00.000Z"})]
      (is (= [:field :movement] (:panels runtime-state)))
      (is (= "episode:bootstrap" (get-in runtime-state [:current-episode :id])))
      (is (= false (get-in runtime-state [:current-episode :pending-commit]))))))
