(ns promptbench.pipeline-polish-test
  "Regression tests for misc-pipeline-polish scrutiny fixes.

   Tests cover:
   1. SECURITY: clojure.edn/read-string used instead of clojure.core/read-string
   2. PERFORMANCE: noise-groups pre-computed outside mapv loop in splitter
   3. CORRECTNESS: verification/core.clj explicit ns :require for clojure.string/clojure.set"
  (:require [clojure.test :refer [deftest is testing]]
            [clojure.set :as set]
            [clojure.java.io :as io]
            [promptbench.pipeline.splitter :as splitter]
            [promptbench.verification.core :as verification]))

;; ============================================================
;; 1. SECURITY: No clojure.core/read-string in src/
;; ============================================================

(deftest no-core-read-string-in-src-test
  (testing "No clojure.core/read-string usage in src/ (security: reader macros)"
    (let [src-dir (io/file "src")
          clj-files (->> (file-seq src-dir)
                         (filter #(.isFile %))
                         (filter #(.endsWith (.getName %) ".clj")))
          violations (for [f clj-files
                           :let [content (slurp f)
                                 ;; Match bare (read-string ...) calls that are NOT
                                 ;; preceded by edn/ or reset! context
                                 lines (clojure.string/split-lines content)]
                           [idx line] (map-indexed vector lines)
                           ;; Detect bare read-string (not edn/read-string, not
                           ;; clojure.edn/read-string, and not inside a comment)
                           :when (and (re-find #"\bread-string\b" line)
                                      (not (re-find #"edn/read-string" line))
                                      (not (re-find #"^\s*;" line)))]
                       {:file (.getPath f)
                        :line (inc idx)
                        :content (clojure.string/trim line)})]
      (is (empty? violations)
          (str "Found clojure.core/read-string usage (security risk):\n"
               (clojure.string/join "\n"
                 (map #(str "  " (:file %) ":" (:line %) " — " (:content %))
                      violations)))))))

(deftest pipeline-core-uses-edn-read-string-test
  (testing "pipeline/core.clj requires clojure.edn and uses edn/read-string"
    (let [content (slurp "src/promptbench/pipeline/core.clj")]
      (is (re-find #"clojure\.edn" content)
          "pipeline/core.clj should require clojure.edn")
      (is (re-find #"edn/read-string" content)
          "pipeline/core.clj should use edn/read-string"))))

;; ============================================================
;; 2. PERFORMANCE: noise-groups pre-computed outside mapv
;; ============================================================

(deftest splitter-noise-groups-precomputed-test
  (testing "Noise groups computed once outside mapv (O(n) not O(n^2))"
    ;; Verify functionally: many noise records should still work correctly
    ;; and produce consistent results. If noise-groups were re-computed
    ;; inside the loop with wrong indices, results would be inconsistent.
    (let [n 200
          records (mapv (fn [i]
                          {:source-id (format "s%04d" i)
                           :cluster-id -1
                           :intent-label :adversarial
                           :attack-family :persona-injection
                           :canonical-lang :en})
                        (range n))
          result (splitter/split-clusters records
                   {:train 0.70 :dev 0.15 :test 0.15
                    :stratify-by [:intent-label :attack-family :canonical-lang]
                    :constraint :cluster-disjoint}
                   1337)]
      ;; Every record must have a split assignment
      (is (= n (count result)))
      (doseq [r result]
        (is (contains? #{:train :dev :test} (:split r))
            (str "Noise record " (:source-id r) " missing split"))))))

(deftest splitter-noise-groups-deterministic-test
  (testing "Split of noise-heavy dataset is deterministic (same seed = same result)"
    (let [records (mapv (fn [i]
                          {:source-id (format "s%04d" i)
                           :cluster-id (if (< i 50) -1 (mod i 5))
                           :intent-label (if (even? i) :adversarial :benign)
                           :attack-family :persona-injection
                           :canonical-lang :en})
                        (range 100))
          run-split (fn [seed]
                      (mapv (juxt :source-id :split)
                            (splitter/split-clusters records
                              {:train 0.70 :dev 0.15 :test 0.15
                               :stratify-by [:intent-label :attack-family :canonical-lang]
                               :constraint :cluster-disjoint}
                              seed)))
          r1 (run-split 42)
          r2 (run-split 42)]
      (is (= r1 r2) "Same seed must produce identical split assignments"))))

(deftest splitter-disjointness-with-noise-test
  (testing "Splitter maintains cluster disjointness with mixed noise and real clusters"
    (let [records (mapv (fn [i]
                          {:source-id (str "s" i)
                           :cluster-id (cond
                                         (< i 5)  -1    ;; noise
                                         (< i 15) 0     ;; cluster 0
                                         (< i 25) 1     ;; cluster 1
                                         :else    2)    ;; cluster 2
                           :intent-label :adversarial
                           :attack-family :persona-injection
                           :canonical-lang :en})
                        (range 30))
          result (splitter/split-clusters records
                   {:train 0.70 :dev 0.15 :test 0.15
                    :stratify-by [:intent-label :attack-family :canonical-lang]
                    :constraint :cluster-disjoint}
                   1337)
          disjointness (splitter/verify-disjointness result)]
      (is (:passed disjointness)
          (str "Disjointness check failed: " (:leaks disjointness))))))

;; ============================================================
;; 3. CORRECTNESS: verification/core.clj explicit requires
;; ============================================================

(deftest verification-core-has-explicit-requires-test
  (testing "verification/core.clj explicitly requires clojure.string and clojure.set"
    (let [content (slurp "src/promptbench/verification/core.clj")]
      (is (re-find #"clojure\.string" content)
          "verification/core.clj should explicitly require clojure.string")
      (is (re-find #"clojure\.set" content)
          "verification/core.clj should explicitly require clojure.set"))))

(deftest verification-validate-parquet-schema-works-standalone-test
  (testing "validate-parquet-schema works when loaded as standalone ns"
    ;; This confirms clojure.string is properly required (used in
    ;; record-key->col-name for dash-to-underscore conversion)
    (let [records [{:source-id "s1" :canonical-hash "h1"
                    :canonical-text "text" :canonical-lang "en"
                    :intent-label "adversarial" :attack-family "test"
                    :harm-category "test" :source-dataset "test"
                    :source-row-id 0 :source-license "gpl" :cluster-id 1
                    :split "train"}]
          result (verification/validate-parquet-schema records)]
      (is (:passed result) "validate-parquet-schema should pass for valid records"))))

(deftest verification-verify-works-standalone-test
  (testing "verify! works when loaded as standalone ns (uses clojure.string/join)"
    ;; This confirms clojure.string is properly required (used in
    ;; error message construction in verify!)
    (let [records [{:source-id "s1" :cluster-id 0 :split :train
                    :canonical-hash "h1" :intent-label :adversarial}
                   {:source-id "s2" :cluster-id 1 :split :dev
                    :canonical-hash "h2" :intent-label :benign}]
          result (verification/verify! {:records records :variants []})]
      (is (:passed result) "verify! should pass for valid data"))))

(deftest verification-set-operations-work-test
  (testing "validate-parquet-schema correctly uses set/difference for column checks"
    ;; Records with missing columns should trigger set/difference path
    (let [records [{:source-id "s1" :canonical-hash "h1"}]
          result (verification/validate-parquet-schema records)]
      (is (not (:passed result))
          "Should detect missing columns using set/difference")
      (is (seq (:column-issues result))
          "Should report column issues"))))
