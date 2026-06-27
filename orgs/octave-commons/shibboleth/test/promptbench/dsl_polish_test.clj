(ns promptbench.dsl-polish-test
  "Tests for misc-dsl-polish fixes.

   Tests three non-blocking issues from scrutiny review:
   1. resolve-transforms deterministic ordering (sorted output)
   2. def-intent-label unsafe polarity rejects duplicate :requires keys
   3. All three macros accept either bare symbols or keywords"
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [promptbench.taxonomy.registry :as registry]
            [promptbench.taxonomy.families :as families]
            [promptbench.taxonomy.categories :as categories]
            [promptbench.taxonomy.labels :as labels]))

;; ============================================================
;; Fixture: Reset registries between tests for isolation
;; ============================================================

(use-fixtures :each
  (fn [f]
    (registry/reset!)
    (f)))

;; ============================================================
;; Fix #1: resolve-transforms returns deterministically-ordered results
;; ============================================================

(deftest resolve-transforms-deterministic-ordering-test
  (testing "resolve-transforms returns same order across invocations (sorted)"
    ;; Register a family with multiple high-affinity transforms
    (families/def-attack-family ordering-test
      {:description "Family for ordering test"
       :category    :test
       :transforms  {:mt        {:affinity :high}
                     :code-mix  {:affinity :high}
                     :homoglyph {:affinity :high}
                     :exhaustion {:affinity :high}
                     :zebra     {:affinity :high}}})
    (let [family (registry/get-family :ordering-test)
          ;; Use a large transform-config map to amplify hash-map non-determinism
          transform-config {:mt {} :code-mix {} :homoglyph {} :exhaustion {} :zebra {}}
          ;; Run 50 times and collect results — if sorted, all should be identical
          results (repeatedly 50
                    #(registry/resolve-transforms family transform-config {:seed 42}))]
      ;; All 50 runs should produce the same result
      (is (apply = results)
          "resolve-transforms must return identical ordering across invocations")
      ;; The result should be sorted by keyword name
      (let [result (first results)]
        (is (= result (sort result))
            "Result should be sorted alphabetically by keyword")))))

(deftest resolve-transforms-sorted-output-test
  (testing "resolve-transforms output is sorted alphabetically by transform keyword"
    (families/def-attack-family sorted-test
      {:description "Family for sort verification"
       :category    :test
       :transforms  {:zzz {:affinity :high}
                     :aaa {:affinity :high}
                     :mmm {:affinity :high}}})
    (let [family (registry/get-family :sorted-test)
          transform-config {:zzz {} :aaa {} :mmm {}}
          result (registry/resolve-transforms family transform-config {:seed 1})]
      (is (= [:aaa :mmm :zzz] result)
          "High-affinity transforms should appear sorted"))))

(deftest resolve-transforms-deterministic-with-medium-sampling-test
  (testing "resolve-transforms with medium affinities still returns sorted output"
    (families/def-attack-family medium-sorted-test
      {:description "Family for medium sort verification"
       :category    :test
       :transforms  {:zzz {:affinity :medium}
                     :aaa {:affinity :high}
                     :mmm {:affinity :medium}
                     :bbb {:affinity :high}}})
    (let [family (registry/get-family :medium-sorted-test)
          transform-config {:zzz {} :aaa {} :mmm {} :bbb {}}]
      ;; For any seed, the output should be sorted
      (doseq [seed (range 100)]
        (let [result (registry/resolve-transforms family transform-config {:seed seed})]
          (is (= result (vec (sort result)))
              (str "Result should be sorted for seed=" seed)))))))

;; ============================================================
;; Fix #2: def-intent-label rejects :requires with duplicate keys
;; ============================================================

(deftest unsafe-label-rejects-duplicate-requires-test
  (testing "Unsafe polarity rejects :requires with duplicate keys"
    (is (thrown-with-msg? Exception
          #"requires exactly"
          (labels/def-intent-label :bad-dupes
            {:description "Unsafe with duplicate requires"
             :polarity    :unsafe
             :requires    [:attack-family :harm-category :attack-family]})))))

(deftest unsafe-label-rejects-triple-duplicate-requires-test
  (testing "Unsafe polarity rejects :requires with all-same keys"
    (is (thrown-with-msg? Exception
          #"requires exactly"
          (labels/def-intent-label :bad-triple
            {:description "Unsafe with triple duplicate"
             :polarity    :unsafe
             :requires    [:attack-family :attack-family :attack-family]})))))

(deftest unsafe-label-rejects-extra-keys-in-requires-test
  (testing "Unsafe polarity rejects :requires with extra keys beyond the required two"
    (is (thrown-with-msg? Exception
          #"requires exactly"
          (labels/def-intent-label :bad-extra
            {:description "Unsafe with extra requires"
             :polarity    :unsafe
             :requires    [:attack-family :harm-category :rationale]})))))

(deftest unsafe-label-accepts-valid-requires-test
  (testing "Unsafe polarity accepts valid [:attack-family :harm-category]"
    (labels/def-intent-label :good-unsafe
      {:description "Valid unsafe label"
       :polarity    :unsafe
       :requires    [:attack-family :harm-category]})
    (let [label (registry/get-intent-label :good-unsafe)]
      (is (some? label))
      (is (= :unsafe (:polarity label)))
      (is (= [:attack-family :harm-category] (:requires label))))))

(deftest unsafe-label-accepts-reversed-order-requires-test
  (testing "Unsafe polarity accepts [:harm-category :attack-family] (order doesn't matter)"
    (labels/def-intent-label :good-reversed
      {:description "Valid unsafe label with reversed order"
       :polarity    :unsafe
       :requires    [:harm-category :attack-family]})
    (let [label (registry/get-intent-label :good-reversed)]
      (is (some? label))
      (is (= :unsafe (:polarity label))))))

(deftest unsafe-label-rejects-single-key-requires-test
  (testing "Unsafe polarity rejects :requires with only one key"
    (is (thrown-with-msg? Exception
          #"requires exactly"
          (labels/def-intent-label :bad-single
            {:description "Unsafe with single require"
             :polarity    :unsafe
             :requires    [:attack-family]})))))

(deftest unsafe-label-rejects-nil-requires-test
  (testing "Unsafe polarity rejects nil :requires"
    (is (thrown? Exception
          (labels/def-intent-label :bad-nil
            {:description "Unsafe with nil requires"
             :polarity    :unsafe})))))

(deftest unsafe-label-rejects-empty-requires-test
  (testing "Unsafe polarity rejects empty :requires"
    (is (thrown? Exception
          (labels/def-intent-label :bad-empty
            {:description "Unsafe with empty requires"
             :polarity    :unsafe
             :requires    []})))))

;; ============================================================
;; Fix #3: All three macros accept either bare symbols or keywords
;; ============================================================

;; --- def-attack-family ---

(deftest def-attack-family-accepts-bare-symbol-test
  (testing "def-attack-family accepts bare symbol (existing behavior)"
    (families/def-attack-family my-test-family
      {:description "Bare symbol family"
       :category    :test})
    (is (some? (registry/get-family :my-test-family))
        "Bare symbol should be converted to keyword")))

(deftest def-attack-family-accepts-keyword-test
  (testing "def-attack-family accepts keyword"
    (families/def-attack-family :kw-test-family
      {:description "Keyword family"
       :category    :test})
    (is (some? (registry/get-family :kw-test-family))
        "Keyword should be used as-is")))

;; --- def-harm-category ---

(deftest def-harm-category-accepts-keyword-test
  (testing "def-harm-category accepts keyword (existing behavior)"
    (categories/def-harm-category :kw-test-cat
      {:description "Keyword category"})
    (is (some? (registry/get-category :kw-test-cat))
        "Keyword should be used as-is")))

(deftest def-harm-category-accepts-bare-symbol-test
  (testing "def-harm-category accepts bare symbol"
    (categories/def-harm-category sym-test-cat
      {:description "Bare symbol category"})
    (is (some? (registry/get-category :sym-test-cat))
        "Bare symbol should be converted to keyword")))

;; --- def-intent-label ---

(deftest def-intent-label-accepts-keyword-test
  (testing "def-intent-label accepts keyword (existing behavior)"
    (labels/def-intent-label :kw-test-label
      {:description "Keyword label"
       :polarity    :safe})
    (is (some? (registry/get-intent-label :kw-test-label))
        "Keyword should be used as-is")))

(deftest def-intent-label-accepts-bare-symbol-test
  (testing "def-intent-label accepts bare symbol"
    (labels/def-intent-label sym-test-label
      {:description "Bare symbol label"
       :polarity    :safe})
    (is (some? (registry/get-intent-label :sym-test-label))
        "Bare symbol should be converted to keyword")))
