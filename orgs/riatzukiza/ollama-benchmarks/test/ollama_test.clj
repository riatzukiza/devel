(ns ollama-test
  (:require [clojure.test :refer :all]
            [clojure.string :as str]
            [ollama :as ollama]))

(deftest mean-handles-empty-and-values
  (testing "returns nil when no values"
    (is (nil? (ollama/mean []))))
  (testing "averages numeric collections"
    (is (= 2.5 (ollama/mean [1 2 3 4])))))

(deftest md-table-sanitizes-prompts-and-formats-numbers
  (let [sample-result {:model "bench-mode"
                       :prompt "line one\nline two"
                       :summary {:runs_total 2
                                 :runs_ok 1
                                 :mean_tps 3.5
                                 :mean_duration_ms 200.0}}]
    (let [table (ollama/md-table [sample-result])
          row-substr "| `bench-mode` | line one line two | 2 | 1 | 3.50 | 200.0 |"]
      (is (str/starts-with? table "# Ollama benchmark"))
      (is (str/includes? table "| Model | Prompt | Runs | OK | Mean TPS | Mean Duration (ms) |"))
      (is (str/includes? table row-substr)))))
