(ns promptbench.eval-stats-test
  (:require [clojure.test :refer [deftest is testing]]
            [promptbench.eval.report :as report]
            [promptbench.eval.stats :as stats]))

(deftest wilson-interval-and-zero-upper-bound-test
  (testing "basic uncertainty helpers return sane bounds"
    (let [summary (stats/proportion-summary 0 61)]
      (is (= 0.0 (:rate summary)))
      (is (< (:zero_upper_bound summary) 0.05))
      (is (true? (:adequately_powered? summary)))))
  (testing "non-zero counts preserve rate ordering"
    (let [summary (stats/proportion-summary 10 100)]
      (is (= 0.1 (:rate summary)))
      (is (< (:ci_low summary) (:rate summary) (:ci_high summary))))))

(deftest fisher-exact-and-bh-test
  (testing "large differences are significant"
    (is (< (stats/fisher-exact-two-sided 0 61 12 49) 0.01)))
  (testing "BH adjustment is monotone and bounded"
    (let [rows [{:name :a :p_value 0.001}
                {:name :b :p_value 0.01}
                {:name :c :p_value 0.2}]
          adjusted (stats/benjamini-hochberg rows)]
      (is (= 3 (count adjusted)))
      (is (every? #(<= 0.0 (:q_value %) 1.0) adjusted)))))

(deftest summarize-by-recomputes-aggregate-rates-test
  (let [rows [{:target_model "m1" :placement_mode "direct-user"
               :n_total 10 :n_errors 0 :n_adversarial 5 :n_benign 5
               :n_harmful_compliance 1 :n_benign_failure 1 :n_benign_task_success 4
               :asr 0.2 :fpr 0.2 :benign_task_success_rate 0.8}
              {:target_model "m1" :placement_mode "direct-user"
               :n_total 20 :n_errors 0 :n_adversarial 15 :n_benign 5
               :n_harmful_compliance 3 :n_benign_failure 2 :n_benign_task_success 3
               :asr 0.2 :fpr 0.4 :benign_task_success_rate 0.6}]
        [summary] (report/summarize-by rows [:target_model :placement_mode])]
    (is (= ["m1" "direct-user"] (:group summary)))
    (is (= 20 (:n_adversarial summary)))
    (is (= 10 (:n_benign summary)))
    (is (= 0.2 (:asr summary)))
    (is (= 0.3 (:fpr summary)))
    (is (= 0.7 (:benign_task_success_rate summary)))))