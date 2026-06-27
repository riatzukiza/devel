(ns promptbench.metrics-test
  "Tests for the metrics DSL: def-metric macro, coverage metrics, and quality metrics.

   Uses synthetic datasets with known expected values to verify all metric computations.
   Tests are written first (RED phase) against the validation contract assertions:
   - VAL-METRIC-001: def-metric registration and validation
   - VAL-METRIC-002: Coverage metrics compute correctly
   - VAL-METRIC-003: Quality metrics compute correctly"
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [promptbench.metrics.core :as metrics]
            [promptbench.metrics.coverage :as coverage]
            [promptbench.metrics.quality :as quality]
            [promptbench.taxonomy.registry :as taxonomy]
            [promptbench.transform.registry :as transforms]))

;; ============================================================
;; Fixtures — reset all registries between tests
;; ============================================================

(use-fixtures :each
  (fn [f]
    (metrics/reset!)
    (taxonomy/reset!)
    (transforms/reset!)
    (f)))

;; ============================================================
;; Synthetic Dataset Helpers
;; ============================================================

(defn- make-prompt
  "Create a synthetic prompt record."
  [& {:keys [source-id attack-family intent-label canonical-lang split cluster-id
             canonical-hash canonical-text]
      :or {source-id (str "sha256:" (random-uuid))
           attack-family :persona-injection
           intent-label :adversarial
           canonical-lang :en
           split :train
           cluster-id 1
           canonical-hash (str "sha256:" (random-uuid))
           canonical-text "test prompt"}}]
  {:source-id source-id
   :attack-family attack-family
   :intent-label intent-label
   :canonical-lang canonical-lang
   :split split
   :cluster-id cluster-id
   :canonical-hash canonical-hash
   :canonical-text canonical-text})

(defn- make-variant
  "Create a synthetic variant record."
  [& {:keys [variant-id source-id text variant-type transform-chain transform-seed
             split metadata attack-family]
      :or {variant-id (str "sha256:" (random-uuid))
           source-id (str "sha256:" (random-uuid))
           text "variant text"
           variant-type :mt
           transform-chain [:mt/ja]
           transform-seed 1337
           split :train
           metadata {}
           attack-family nil}}]
  (cond-> {:variant-id variant-id
           :source-id source-id
           :text text
           :variant-type variant-type
           :transform-chain transform-chain
           :transform-seed transform-seed
           :split split
           :metadata metadata}
    attack-family (assoc :attack-family attack-family)))

(defn- register-test-taxonomy!
  "Register a minimal taxonomy for testing coverage metrics."
  []
  ;; Register families
  (taxonomy/register-family! :persona-injection
    {:description "Persona injection attacks"
     :category :jailbreak
     :severity :high
     :tags #{:persona}
     :signatures []
     :transforms {:mt {:affinity :high :note "good"}}
     :gen-hints {}})
  (taxonomy/register-family! :dan-variants
    {:description "DAN variants"
     :category :jailbreak
     :severity :high
     :tags #{:dan}
     :signatures []
     :transforms {:mt {:affinity :high :note "good"}}
     :gen-hints {}})
  (taxonomy/register-family! :authority-impersonation
    {:description "Authority impersonation"
     :category :jailbreak
     :severity :medium
     :tags #{:authority}
     :signatures []
     :transforms {:mt {:affinity :medium :note "ok"}}
     :gen-hints {}})
  (taxonomy/register-family! :developer-mode
    {:description "Developer mode"
     :category :jailbreak
     :severity :high
     :tags #{:developer}
     :signatures []
     :transforms {:code-mix {:affinity :high :note "good"}}
     :gen-hints {}}))

(defn- register-test-transforms!
  "Register minimal transforms for testing transform-coverage-matrix."
  []
  (transforms/register-transform! :mt
    {:description "Machine translation"
     :type :linguistic
     :deterministic false
     :reversible :approximate
     :params-spec {}
     :provenance [:engine :target-lang]})
  (transforms/register-transform! :code-mix
    {:description "Code mixing"
     :type :linguistic
     :deterministic true
     :reversible false
     :params-spec {}
     :provenance [:mix-rate :strategy]})
  (transforms/register-transform! :homoglyph
    {:description "Homoglyph substitution"
     :type :obfuscation
     :deterministic true
     :reversible true
     :params-spec {}
     :provenance [:rate]}))

;; ============================================================
;; VAL-METRIC-001: def-metric macro registration and validation
;; ============================================================

(deftest def-metric-registers-test
  (testing "def-metric registers a metric with required keys"
    (metrics/def-metric test-metric
      {:description "A test metric"
       :compute     (fn [_dataset _params] {:value 42})})
    (is (some? (metrics/get-metric :test-metric))
        "Metric should be retrievable from registry")))

(deftest def-metric-stores-all-fields-test
  (testing "All fields round-trip through registration"
    (metrics/def-metric full-metric
      {:description "Full metric with all fields"
       :compute     (fn [_dataset _params] {:value 1.0})
       :params      {:min-count {:type :int :default 10}}
       :assertion   #(> (:value %) 0)})
    (let [m (metrics/get-metric :full-metric)]
      (is (= "Full metric with all fields" (:description m)))
      (is (fn? (:compute m)))
      (is (some? (:params m)))
      (is (fn? (:assertion m))))))

(deftest def-metric-missing-description-errors-test
  (testing "Missing :description produces error"
    (is (thrown? Exception
          (metrics/def-metric bad-no-desc
            {:compute (fn [_ _] {})})))))

(deftest def-metric-missing-compute-errors-test
  (testing "Missing :compute produces error"
    (is (thrown? Exception
          (metrics/def-metric bad-no-compute
            {:description "Has description but no compute"})))))

(deftest def-metric-optional-params-test
  (testing "Optional :params and :assertion are not required"
    (metrics/def-metric minimal-metric
      {:description "Minimal metric"
       :compute     (fn [_ _] {:val 0})})
    (let [m (metrics/get-metric :minimal-metric)]
      (is (nil? (:params m)))
      (is (nil? (:assertion m))))))

(deftest all-metrics-returns-all-registered-test
  (testing "all-metrics returns all registered metrics"
    (metrics/def-metric metric-a
      {:description "Metric A" :compute (fn [_ _] {})})
    (metrics/def-metric metric-b
      {:description "Metric B" :compute (fn [_ _] {})})
    (let [all (metrics/all-metrics)]
      (is (= 2 (count all)))
      (is (contains? all :metric-a))
      (is (contains? all :metric-b)))))

(deftest compute-metric-invokes-compute-fn-test
  (testing "compute-metric invokes the metric's :compute function"
    (metrics/def-metric computable
      {:description "Computable metric"
       :compute     (fn [dataset params]
                      {:count (count dataset)
                       :min (:min-count params 5)})
       :params      {:min-count {:type :int :default 5}}})
    (let [result (metrics/compute-metric :computable
                                         [{:a 1} {:a 2} {:a 3}]
                                         {:min-count 10})]
      (is (= 3 (:count result)))
      (is (= 10 (:min result))))))

(deftest compute-metric-assertion-passes-test
  (testing "compute-metric with passing assertion returns result"
    (metrics/def-metric asserting-metric
      {:description "Metric with assertion"
       :compute     (fn [_ _] {:rate 0.0})
       :assertion   #(= 0.0 (:rate %))})
    (let [result (metrics/compute-metric :asserting-metric [] {})]
      (is (= 0.0 (:rate result))))))

(deftest compute-metric-assertion-fails-test
  (testing "compute-metric with failing assertion marks failure"
    (metrics/def-metric bad-assertion-metric
      {:description "Metric with failing assertion"
       :compute     (fn [_ _] {:rate 0.5})
       :assertion   #(= 0.0 (:rate %))})
    (let [result (metrics/compute-metric :bad-assertion-metric [] {})]
      ;; Result should include assertion-failed indicator
      (is (false? (:assertion-passed (meta result)))
          "Assertion failure should be indicated in metadata"))))

(deftest reset-clears-registry-test
  (testing "reset! clears metric registry"
    (metrics/def-metric ephemeral
      {:description "Will be cleared" :compute (fn [_ _] {})})
    (is (some? (metrics/get-metric :ephemeral)))
    (metrics/reset!)
    (is (nil? (metrics/get-metric :ephemeral)))))

;; ============================================================
;; VAL-METRIC-002: taxonomy-coverage
;; ============================================================

(deftest taxonomy-coverage-correct-proportion-test
  (testing "taxonomy-coverage returns correct proportion and missing list"
    (register-test-taxonomy!)
    ;; 4 families registered: persona-injection, dan-variants, authority-impersonation, developer-mode
    ;; Create dataset with prompts for 3 out of 4 families (min-count 2)
    (let [dataset [(make-prompt :attack-family :persona-injection)
                   (make-prompt :attack-family :persona-injection)
                   (make-prompt :attack-family :persona-injection)
                   (make-prompt :attack-family :dan-variants)
                   (make-prompt :attack-family :dan-variants)
                   (make-prompt :attack-family :authority-impersonation)
                   (make-prompt :attack-family :authority-impersonation)
                   ;; developer-mode has only 1 prompt — below min-count of 2
                   (make-prompt :attack-family :developer-mode)]
          result (coverage/taxonomy-coverage dataset {:min-count 2})]
      (is (= 3/4 (:coverage result))
          "3 of 4 families have >= 2 prompts")
      (is (= [:developer-mode] (vec (sort (:missing result))))
          "developer-mode is missing (only 1 prompt)"))))

(deftest taxonomy-coverage-all-covered-test
  (testing "taxonomy-coverage returns 1.0 when all families covered"
    (register-test-taxonomy!)
    (let [dataset (mapcat (fn [fam]
                            (repeat 5 (make-prompt :attack-family fam)))
                          [:persona-injection :dan-variants
                           :authority-impersonation :developer-mode])
          result (coverage/taxonomy-coverage dataset {:min-count 5})]
      (is (= 1 (:coverage result)))
      (is (empty? (:missing result))))))

(deftest taxonomy-coverage-none-covered-test
  (testing "taxonomy-coverage returns 0 when no families have enough prompts"
    (register-test-taxonomy!)
    (let [dataset [(make-prompt :attack-family :persona-injection)]
          result (coverage/taxonomy-coverage dataset {:min-count 10})]
      (is (= 0 (:coverage result)))
      (is (= 4 (count (:missing result)))))))

(deftest taxonomy-coverage-default-min-count-test
  (testing "taxonomy-coverage uses default min-count of 10 when not specified"
    (register-test-taxonomy!)
    (let [dataset (repeat 10 (make-prompt :attack-family :persona-injection))
          result (coverage/taxonomy-coverage dataset {})]
      ;; Only persona-injection has 10, so 1/4 covered
      (is (= 1/4 (:coverage result))))))

;; ============================================================
;; VAL-METRIC-002: transform-coverage-matrix
;; ============================================================

(deftest transform-coverage-matrix-dimensions-test
  (testing "transform-coverage-matrix has correct dimensions"
    (register-test-taxonomy!)
    (register-test-transforms!)
    (let [dataset [(make-variant :attack-family :persona-injection :variant-type :mt)
                   (make-variant :attack-family :persona-injection :variant-type :code-mix)
                   (make-variant :attack-family :dan-variants :variant-type :mt)]
          result (coverage/transform-coverage-matrix dataset)]
      ;; Should have one row per registered family (4)
      (is (= 4 (count result))
          "Matrix should have rows for all registered families")
      ;; Each row should have columns for all registered transforms (3)
      (doseq [[_family row] result]
        (is (= 3 (count row))
            "Each row should have columns for all registered transforms")))))

(deftest transform-coverage-matrix-accurate-counts-test
  (testing "transform-coverage-matrix has accurate cell counts"
    (register-test-taxonomy!)
    (register-test-transforms!)
    (let [dataset [(make-variant :attack-family :persona-injection :variant-type :mt)
                   (make-variant :attack-family :persona-injection :variant-type :mt)
                   (make-variant :attack-family :persona-injection :variant-type :code-mix)
                   (make-variant :attack-family :dan-variants :variant-type :mt)
                   (make-variant :attack-family :dan-variants :variant-type :homoglyph)
                   (make-variant :attack-family :dan-variants :variant-type :homoglyph)
                   (make-variant :attack-family :dan-variants :variant-type :homoglyph)]
          result (coverage/transform-coverage-matrix dataset)]
      ;; persona-injection: mt=2, code-mix=1, homoglyph=0
      (is (= 2 (get-in result [:persona-injection :mt])))
      (is (= 1 (get-in result [:persona-injection :code-mix])))
      (is (= 0 (get-in result [:persona-injection :homoglyph])))
      ;; dan-variants: mt=1, code-mix=0, homoglyph=3
      (is (= 1 (get-in result [:dan-variants :mt])))
      (is (= 0 (get-in result [:dan-variants :code-mix])))
      (is (= 3 (get-in result [:dan-variants :homoglyph])))
      ;; authority-impersonation: all zeros
      (is (= 0 (get-in result [:authority-impersonation :mt])))
      ;; developer-mode: all zeros
      (is (= 0 (get-in result [:developer-mode :mt]))))))

(deftest transform-coverage-matrix-empty-dataset-test
  (testing "transform-coverage-matrix with empty dataset has all zeros"
    (register-test-taxonomy!)
    (register-test-transforms!)
    (let [result (coverage/transform-coverage-matrix [])]
      (is (= 4 (count result)))
      (doseq [[_family row] result]
        (is (every? zero? (vals row)))))))

;; ============================================================
;; VAL-METRIC-002: language-coverage
;; ============================================================

(deftest language-coverage-groups-correctly-test
  (testing "language-coverage groups by language/split/label with correct sums"
    (let [dataset [(make-prompt :canonical-lang :en :split :train :intent-label :adversarial)
                   (make-prompt :canonical-lang :en :split :train :intent-label :adversarial)
                   (make-prompt :canonical-lang :en :split :train :intent-label :benign)
                   (make-prompt :canonical-lang :en :split :test :intent-label :adversarial)
                   (make-prompt :canonical-lang :ja :split :train :intent-label :adversarial)
                   (make-prompt :canonical-lang :ja :split :train :intent-label :benign)
                   (make-prompt :canonical-lang :ja :split :test :intent-label :benign)]
          result (coverage/language-coverage dataset)]
      ;; en/train/adversarial = 2
      (is (= 2 (get-in result [:en :train :adversarial])))
      ;; en/train/benign = 1
      (is (= 1 (get-in result [:en :train :benign])))
      ;; en/test/adversarial = 1
      (is (= 1 (get-in result [:en :test :adversarial])))
      ;; ja/train/adversarial = 1
      (is (= 1 (get-in result [:ja :train :adversarial])))
      ;; ja/train/benign = 1
      (is (= 1 (get-in result [:ja :train :benign])))
      ;; ja/test/benign = 1
      (is (= 1 (get-in result [:ja :test :benign]))))))

(deftest language-coverage-empty-dataset-test
  (testing "language-coverage with empty dataset returns empty map"
    (let [result (coverage/language-coverage [])]
      (is (= {} result)))))

(deftest language-coverage-sums-correct-test
  (testing "language-coverage sums are correct across dimensions"
    (let [dataset (concat
                    (repeat 10 (make-prompt :canonical-lang :en :split :train :intent-label :adversarial))
                    (repeat 5 (make-prompt :canonical-lang :en :split :dev :intent-label :benign))
                    (repeat 3 (make-prompt :canonical-lang :fr :split :test :intent-label :adversarial)))
          result (coverage/language-coverage dataset)
          ;; Sum all counts
          total (reduce + (for [[_lang splits] result
                                [_split labels] splits
                                [_label cnt] labels]
                            cnt))]
      (is (= 18 total) "Total should equal dataset size"))))

;; ============================================================
;; VAL-METRIC-003: cluster-leakage-rate
;; ============================================================

(deftest cluster-leakage-rate-zero-on-valid-test
  (testing "cluster-leakage-rate is 0.0 on valid (disjoint) build"
    (let [;; Valid dataset: clusters are disjoint across splits
          dataset [(make-prompt :cluster-id 1 :split :train)
                   (make-prompt :cluster-id 2 :split :train)
                   (make-prompt :cluster-id 3 :split :dev)
                   (make-prompt :cluster-id 4 :split :dev)
                   (make-prompt :cluster-id 5 :split :test)
                   (make-prompt :cluster-id 6 :split :test)]
          result (quality/cluster-leakage-rate dataset)]
      (is (= 0.0 (:rate result))
          "Leakage rate should be 0.0 on valid data")
      (is (empty? (:leaks result))
          "No leaks on valid data"))))

(deftest cluster-leakage-rate-nonzero-on-corrupted-test
  (testing "cluster-leakage-rate is non-zero on corrupted (leaky) data"
    (let [;; Corrupted: cluster 1 appears in both train and test splits
          dataset [(make-prompt :cluster-id 1 :split :train)
                   (make-prompt :cluster-id 1 :split :test)   ;; LEAK!
                   (make-prompt :cluster-id 2 :split :train)
                   (make-prompt :cluster-id 3 :split :dev)
                   (make-prompt :cluster-id 4 :split :test)]
          result (quality/cluster-leakage-rate dataset)]
      (is (pos? (:rate result))
          "Leakage rate should be positive on corrupted data")
      (is (seq (:leaks result))
          "Should report leaky clusters"))))

(deftest cluster-leakage-rate-assertion-predicate-test
  (testing "cluster-leakage-rate has assertion that checks for 0.0"
    (register-test-taxonomy!)
    (quality/register-quality-metrics!)
    (let [m (metrics/get-metric :cluster-leakage-rate)]
      (is (some? (:assertion m))
          "Should have assertion predicate")
      ;; Assertion should pass on 0.0 rate
      (is (true? ((:assertion m) {:rate 0.0})))
      ;; Assertion should fail on non-zero rate
      (is (false? ((:assertion m) {:rate 0.5}))))))

(deftest cluster-leakage-rate-noise-points-excluded-test
  (testing "cluster-leakage-rate excludes noise points (cluster-id -1)"
    (let [;; Noise points (-1) in multiple splits should not count as leakage
          dataset [(make-prompt :cluster-id -1 :split :train)
                   (make-prompt :cluster-id -1 :split :test)
                   (make-prompt :cluster-id 1 :split :train)
                   (make-prompt :cluster-id 2 :split :test)]
          result (quality/cluster-leakage-rate dataset)]
      (is (= 0.0 (:rate result))
          "Noise points should not count as leakage"))))

;; ============================================================
;; VAL-METRIC-003: semantic-diversity
;; ============================================================

(deftest semantic-diversity-per-split-values-test
  (testing "semantic-diversity returns per-split values"
    (let [;; Synthetic embeddings: 3D vectors for simplicity
          dataset [(assoc (make-prompt :split :train) :embedding [1.0 0.0 0.0])
                   (assoc (make-prompt :split :train) :embedding [0.0 1.0 0.0])
                   (assoc (make-prompt :split :train) :embedding [0.0 0.0 1.0])
                   (assoc (make-prompt :split :test) :embedding [1.0 0.0 0.0])
                   (assoc (make-prompt :split :test) :embedding [0.9 0.1 0.0])]
          result (quality/semantic-diversity dataset)]
      ;; Should have entries for :train and :test
      (is (contains? result :train))
      (is (contains? result :test))
      ;; Train should have higher diversity (orthogonal vectors)
      (is (number? (:train result)))
      (is (number? (:test result)))
      ;; Train: orthogonal vectors = cosine distance 1.0 between each pair
      (is (> (:train result) (:test result))
          "Orthogonal vectors should show higher diversity"))))

(deftest semantic-diversity-single-item-split-test
  (testing "semantic-diversity handles single-item splits"
    (let [dataset [(assoc (make-prompt :split :train) :embedding [1.0 0.0 0.0])]
          result (quality/semantic-diversity dataset)]
      (is (= 0.0 (:train result))
          "Single item split should have 0.0 diversity"))))

(deftest semantic-diversity-empty-dataset-test
  (testing "semantic-diversity handles empty dataset"
    (let [result (quality/semantic-diversity [])]
      (is (= {} result)))))

;; ============================================================
;; VAL-METRIC-003: transform-fidelity
;; ============================================================

(deftest transform-fidelity-backtranslated-only-test
  (testing "transform-fidelity computes scores for backtranslated variants only"
    (let [;; Backtranslated variant: has :backtranslation in metadata
          prompts [(make-prompt :source-id "src-1" :canonical-text "Hello world")]
          variants [(make-variant :source-id "src-1"
                                 :text "Hello world"
                                 :variant-type :mt
                                 :metadata {:backtranslation "Hello world"
                                            :target-lang :ja})
                    ;; Non-backtranslated variant (code-mix) — should be excluded
                    (make-variant :source-id "src-1"
                                 :text "Helloこんにちは world"
                                 :variant-type :code-mix
                                 :metadata {:mix-rate 0.25})]
          result (quality/transform-fidelity prompts variants)]
      ;; Should have results
      (is (seq (:scores result))
          "Should compute scores for backtranslated variants")
      ;; All scores should be in [0, 1] range
      (doseq [score (:scores result)]
        (is (<= 0.0 (:bleu score) 1.0)
            "BLEU should be in [0, 1]")
        (is (<= 0.0 (:chrf score) 1.0)
            "chrF should be in [0, 1]")))))

(deftest transform-fidelity-excludes-non-backtranslated-test
  (testing "transform-fidelity excludes non-backtranslated variants"
    (let [prompts [(make-prompt :source-id "src-1" :canonical-text "Hello")]
          variants [;; Only code-mix variants, no backtranslations
                    (make-variant :source-id "src-1"
                                 :text "Helloこんにちは"
                                 :variant-type :code-mix
                                 :metadata {:mix-rate 0.25})
                    (make-variant :source-id "src-1"
                                 :text "H3ll0"
                                 :variant-type :homoglyph
                                 :metadata {:rate 0.1})]
          result (quality/transform-fidelity prompts variants)]
      (is (empty? (:scores result))
          "No scores when no backtranslated variants exist"))))

(deftest transform-fidelity-valid-range-test
  (testing "transform-fidelity scores are in valid range [0, 1]"
    (let [prompts [(make-prompt :source-id "src-1" :canonical-text "The cat sat on the mat")
                   (make-prompt :source-id "src-2" :canonical-text "Machine learning is great")]
          variants [(make-variant :source-id "src-1"
                                 :text "The cat sat on the mat"
                                 :variant-type :mt
                                 :metadata {:backtranslation "The cat sat on the mat"
                                            :target-lang :fr})
                    (make-variant :source-id "src-2"
                                 :text "Machine learning is wonderful"
                                 :variant-type :mt
                                 :metadata {:backtranslation "Machine learning is wonderful"
                                            :target-lang :de})]
          result (quality/transform-fidelity prompts variants)]
      (doseq [score (:scores result)]
        (is (<= 0.0 (:bleu score) 1.0))
        (is (<= 0.0 (:chrf score) 1.0))))))

(deftest transform-fidelity-perfect-backtranslation-test
  (testing "Perfect backtranslation yields high scores"
    (let [text "The quick brown fox jumps over the lazy dog"
          prompts [(make-prompt :source-id "src-1" :canonical-text text)]
          variants [(make-variant :source-id "src-1"
                                 :text text
                                 :variant-type :mt
                                 :metadata {:backtranslation text
                                            :target-lang :fr})]
          result (quality/transform-fidelity prompts variants)]
      (is (= 1 (count (:scores result))))
      ;; Perfect backtranslation should have BLEU = 1.0
      (is (= 1.0 (:bleu (first (:scores result))))
          "Perfect backtranslation should have BLEU = 1.0"))))

;; ============================================================
;; Integration: def-metric with actual coverage metric
;; ============================================================

(deftest def-metric-taxonomy-coverage-integration-test
  (testing "def-metric can register taxonomy-coverage and compute it"
    (register-test-taxonomy!)
    (coverage/register-coverage-metrics!)
    (let [m (metrics/get-metric :taxonomy-coverage)]
      (is (some? m) "taxonomy-coverage should be registered")
      (is (= "Proportion of leaf attack families with at least N prompts"
             (:description m))))))

(deftest def-metric-transform-coverage-matrix-integration-test
  (testing "def-metric can register transform-coverage-matrix and compute it"
    (register-test-taxonomy!)
    (register-test-transforms!)
    (coverage/register-coverage-metrics!)
    (let [m (metrics/get-metric :transform-coverage-matrix)]
      (is (some? m) "transform-coverage-matrix should be registered"))))

(deftest def-metric-language-coverage-integration-test
  (testing "def-metric can register language-coverage and compute it"
    (coverage/register-coverage-metrics!)
    (let [m (metrics/get-metric :language-coverage)]
      (is (some? m) "language-coverage should be registered"))))

(deftest def-metric-cluster-leakage-rate-integration-test
  (testing "def-metric can register cluster-leakage-rate with assertion"
    (quality/register-quality-metrics!)
    (let [m (metrics/get-metric :cluster-leakage-rate)]
      (is (some? m) "cluster-leakage-rate should be registered")
      (is (some? (:assertion m)) "Should have assertion"))))

(deftest def-metric-semantic-diversity-integration-test
  (testing "def-metric can register semantic-diversity"
    (quality/register-quality-metrics!)
    (let [m (metrics/get-metric :semantic-diversity)]
      (is (some? m) "semantic-diversity should be registered"))))

(deftest def-metric-transform-fidelity-integration-test
  (testing "def-metric can register transform-fidelity"
    (quality/register-quality-metrics!)
    (let [m (metrics/get-metric :transform-fidelity)]
      (is (some? m) "transform-fidelity should be registered"))))

;; ============================================================
;; Compute via registry integration
;; ============================================================

(deftest compute-taxonomy-coverage-via-registry-test
  (testing "Computing taxonomy-coverage through the metrics registry"
    (register-test-taxonomy!)
    (coverage/register-coverage-metrics!)
    (let [dataset (concat
                    (repeat 10 (make-prompt :attack-family :persona-injection))
                    (repeat 10 (make-prompt :attack-family :dan-variants))
                    (repeat 10 (make-prompt :attack-family :authority-impersonation))
                    (repeat 10 (make-prompt :attack-family :developer-mode)))
          result (metrics/compute-metric :taxonomy-coverage dataset {:min-count 10})]
      (is (= 1 (:coverage result)))
      (is (empty? (:missing result))))))

(deftest compute-cluster-leakage-via-registry-test
  (testing "Computing cluster-leakage-rate through the metrics registry"
    (quality/register-quality-metrics!)
    (let [dataset [(make-prompt :cluster-id 1 :split :train)
                   (make-prompt :cluster-id 2 :split :test)
                   (make-prompt :cluster-id 3 :split :dev)]
          result (metrics/compute-metric :cluster-leakage-rate dataset {})]
      (is (= 0.0 (:rate result))))))
