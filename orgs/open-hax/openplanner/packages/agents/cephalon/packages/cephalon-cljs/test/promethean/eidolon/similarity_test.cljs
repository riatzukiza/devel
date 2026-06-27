(ns promethean.eidolon.similarity-test
  (:require [promethean.eidolon.similarity :as sim]
            [cljs.test :refer [deftest is]]))

(deftest test-cosine-similarity-same-vector
  (let [v [1 2 3 4]
        s (sim/cosine v v)]
    (is (= 1.0 s))))

(deftest test-cosine-similarity-orthogonal
  (let [a [1 0 0]
        b [0 1 0]
        s (sim/cosine a b)]
    (is (= 0.0 s))))

(deftest test-recency-bonus-decreases-with-age
  (let [bonus0 (sim/recency-bonus 0 0)
        bonus1 (sim/recency-bonus 86400000 0)]
    (is (> bonus0 bonus1))))
