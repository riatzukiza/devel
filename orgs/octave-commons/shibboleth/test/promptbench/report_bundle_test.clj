(ns promptbench.report-bundle-test
  "Tests for distribution reports, datasheet generation, reproducibility bundle,
   and Stage 7 verification suite.

   Covers validation contract assertions:
   - VAL-METRIC-004: Distribution reports
   - VAL-METRIC-005: Datasheet generation
   - VAL-METRIC-006: Reproducibility bundle completeness
   - VAL-METRIC-007: Stage 7 verification suite"
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [clojure.string :as str]
            [clojure.java.io :as io]
            [clojure.edn :as edn]
            [promptbench.report.core :as report]
            [promptbench.report.datasheet :as datasheet]
            [promptbench.report.bundle :as bundle]
            [promptbench.verification.core :as verification]
            [promptbench.metrics.core :as metrics]
            [promptbench.metrics.coverage :as coverage]
            [promptbench.metrics.quality :as quality]
            [promptbench.taxonomy.registry :as taxonomy]
            [promptbench.transform.registry :as transforms]
            [promptbench.pipeline.sources :as sources]
            [promptbench.pipeline.manifest :as manifest]
            [promptbench.util.crypto :as crypto]))

;; ============================================================
;; Fixtures — reset all registries between tests
;; ============================================================

(use-fixtures :each
  (fn [f]
    (metrics/reset!)
    (taxonomy/reset!)
    (transforms/reset!)
    (sources/reset!)
    (f)))

;; ============================================================
;; Test Helpers
;; ============================================================

(defn- make-prompt
  "Create a synthetic prompt record with all required fields."
  [& {:keys [source-id attack-family intent-label canonical-lang split cluster-id
             canonical-hash canonical-text harm-category source-dataset source-license]
      :or {source-id (str (random-uuid))
           attack-family :persona-injection
           intent-label :adversarial
           canonical-lang :en
           split :train
           cluster-id 1
           canonical-hash (str (random-uuid))
           canonical-text "test prompt"
           harm-category :jailbreak
           source-dataset :test-source
           source-license :apache-2.0}}]
  {:source-id source-id
   :attack-family attack-family
   :intent-label intent-label
   :canonical-lang canonical-lang
   :split split
   :cluster-id cluster-id
   :canonical-hash canonical-hash
   :canonical-text canonical-text
   :harm-category harm-category
   :source {:dataset source-dataset :row-id 0 :license source-license}})

(defn- make-variant
  "Create a synthetic variant record."
  [& {:keys [variant-id source-id text variant-type transform-chain transform-seed
             split metadata attack-family canonical-lang]
      :or {variant-id (str (random-uuid))
           source-id (str (random-uuid))
           text "variant text"
           variant-type :mt
           transform-chain [:mt/ja]
           transform-seed 1337
           split :train
           metadata {}
           attack-family :persona-injection
           canonical-lang :ja}}]
  {:variant-id variant-id
   :source-id source-id
   :text text
   :variant-type variant-type
   :transform-chain transform-chain
   :transform-seed transform-seed
   :split split
   :metadata metadata
   :attack-family attack-family
   :canonical-lang canonical-lang})

(defn- register-test-taxonomy! []
  (taxonomy/register-family! :persona-injection
    {:description "Persona injection" :category :jailbreak :severity :high
     :tags #{:persona} :signatures [] :transforms {:mt {:affinity :high :note "good"}} :gen-hints {}})
  (taxonomy/register-family! :dan-variants
    {:description "DAN variants" :category :jailbreak :severity :high
     :tags #{:dan} :signatures [] :transforms {:mt {:affinity :high :note "good"}} :gen-hints {}})
  (taxonomy/register-family! :authority-impersonation
    {:description "Authority impersonation" :category :jailbreak :severity :medium
     :tags #{:authority} :signatures [] :transforms {:mt {:affinity :medium :note "ok"}} :gen-hints {}}))

(defn- register-test-transforms! []
  (transforms/register-transform! :mt
    {:description "Machine translation" :type :linguistic :deterministic false
     :reversible :approximate :params-spec {} :provenance [:engine :target-lang]})
  (transforms/register-transform! :code-mix
    {:description "Code mixing" :type :linguistic :deterministic true
     :reversible false :params-spec {} :provenance [:mix-rate :strategy]}))

(defn- register-test-source! []
  (sources/register-source! :test-source
    {:description "Test dataset" :version "1.0.0" :license :apache-2.0
     :format :jsonl :path "/tmp/test.jsonl" :taxonomy-mapping {}}))

;; ============================================================
;; VAL-METRIC-004: Distribution reports
;; ============================================================

(deftest label-distribution-per-split-test
  (testing "Label distribution includes all registered labels per-split with correct sums"
    (register-test-taxonomy!)
    (let [records (concat
                    ;; train: 5 adversarial, 3 benign
                    (repeat 5 (make-prompt :split :train :intent-label :adversarial))
                    (repeat 3 (make-prompt :split :train :intent-label :benign))
                    ;; dev: 2 adversarial, 1 benign
                    (repeat 2 (make-prompt :split :dev :intent-label :adversarial))
                    (repeat 1 (make-prompt :split :dev :intent-label :benign))
                    ;; test: 4 adversarial, 2 benign
                    (repeat 4 (make-prompt :split :test :intent-label :adversarial))
                    (repeat 2 (make-prompt :split :test :intent-label :benign)))
          result (report/label-distribution records)]
      ;; Should have entries for each split
      (is (contains? result :train))
      (is (contains? result :dev))
      (is (contains? result :test))
      ;; Check counts are correct
      (is (= 5 (get-in result [:train :adversarial])))
      (is (= 3 (get-in result [:train :benign])))
      (is (= 2 (get-in result [:dev :adversarial])))
      (is (= 1 (get-in result [:dev :benign])))
      (is (= 4 (get-in result [:test :adversarial])))
      (is (= 2 (get-in result [:test :benign])))
      ;; Verify sums per split
      (is (= 8 (reduce + (vals (:train result)))))
      (is (= 3 (reduce + (vals (:dev result)))))
      (is (= 6 (reduce + (vals (:test result))))))))

(deftest label-distribution-all-labels-present-test
  (testing "Label distribution includes all labels that appear in dataset"
    (let [records [(make-prompt :split :train :intent-label :adversarial)
                   (make-prompt :split :train :intent-label :benign)
                   (make-prompt :split :train :intent-label :contested)]
          result (report/label-distribution records)]
      (is (= 3 (count (:train result))))
      (is (contains? (:train result) :adversarial))
      (is (contains? (:train result) :benign))
      (is (contains? (:train result) :contested)))))

(deftest label-distribution-sums-correct-test
  (testing "Sum of all labels across splits equals total records"
    (let [records (concat
                    (repeat 10 (make-prompt :split :train :intent-label :adversarial))
                    (repeat 5 (make-prompt :split :dev :intent-label :benign))
                    (repeat 3 (make-prompt :split :test :intent-label :adversarial)))
          result (report/label-distribution records)
          total (reduce + (for [[_split labels] result
                                [_label cnt] labels]
                            cnt))]
      (is (= 18 total)))))

(deftest language-attack-family-matrix-test
  (testing "Language × attack_family matrix has complete dimensions with accurate counts"
    (register-test-taxonomy!)
    (let [records [(make-prompt :canonical-lang :en :attack-family :persona-injection)
                   (make-prompt :canonical-lang :en :attack-family :persona-injection)
                   (make-prompt :canonical-lang :en :attack-family :dan-variants)
                   (make-prompt :canonical-lang :ja :attack-family :persona-injection)
                   (make-prompt :canonical-lang :ja :attack-family :authority-impersonation)
                   (make-prompt :canonical-lang :fr :attack-family :dan-variants)]
          result (report/language-attack-family-matrix records)]
      ;; Matrix should have all language rows present in data
      (is (contains? result :en))
      (is (contains? result :ja))
      (is (contains? result :fr))
      ;; Each language row should have counts for all families in data
      (is (= 2 (get-in result [:en :persona-injection])))
      (is (= 1 (get-in result [:en :dan-variants])))
      (is (= 0 (get-in result [:en :authority-impersonation])))
      (is (= 1 (get-in result [:ja :persona-injection])))
      (is (= 1 (get-in result [:ja :authority-impersonation])))
      (is (= 0 (get-in result [:ja :dan-variants])))
      (is (= 1 (get-in result [:fr :dan-variants])))
      (is (= 0 (get-in result [:fr :persona-injection]))))))

(deftest language-attack-family-matrix-complete-dimensions-test
  (testing "Matrix includes all families from the dataset as columns"
    (let [records [(make-prompt :canonical-lang :en :attack-family :persona-injection)
                   (make-prompt :canonical-lang :en :attack-family :dan-variants)]
          result (report/language-attack-family-matrix records)
          ;; All families appearing in the dataset should be columns in each row
          all-families (set (map :attack-family records))]
      (doseq [[_lang row] result]
        (doseq [fam all-families]
          (is (contains? row fam)
              (str "Row should contain column for family " fam)))))))

;; ============================================================
;; VAL-METRIC-005: Datasheet generation
;; ============================================================

(deftest datasheet-has-all-gebru-sections-test
  (testing "Datasheet follows Gebru et al. 2021 format with all required sections"
    (register-test-taxonomy!)
    (register-test-source!)
    (let [build-info {:version "0.1.0"
                      :seed 1337
                      :total-prompts 100
                      :total-variants 500
                      :languages [:en :ja :fr]
                      :sources [:test-source]
                      :license "GPL-3.0"
                      :git-commit "abc123"
                      :splits {:train 70 :dev 15 :test 15}}
          md (datasheet/generate-datasheet build-info)]
      ;; All 7 Gebru sections must be present
      (is (str/includes? md "## Motivation"))
      (is (str/includes? md "## Composition"))
      (is (str/includes? md "## Collection Process"))
      (is (str/includes? md "## Preprocessing"))
      (is (str/includes? md "## Uses"))
      (is (str/includes? md "## Distribution"))
      (is (str/includes? md "## Maintenance")))))

(deftest datasheet-contains-actual-build-values-test
  (testing "Datasheet contains actual build values (counts, languages, etc.)"
    (register-test-taxonomy!)
    (register-test-source!)
    (let [build-info {:version "0.1.0"
                      :seed 1337
                      :total-prompts 100
                      :total-variants 500
                      :languages [:en :ja :fr]
                      :sources [:test-source]
                      :license "GPL-3.0"
                      :git-commit "abc123"
                      :splits {:train 70 :dev 15 :test 15}}
          md (datasheet/generate-datasheet build-info)]
      ;; Should contain actual values
      (is (str/includes? md "1337") "Should contain seed value")
      (is (str/includes? md "100") "Should contain prompt count")
      (is (str/includes? md "500") "Should contain variant count")
      (is (str/includes? md "0.1.0") "Should contain version")
      (is (str/includes? md "GPL-3.0") "Should contain license"))))

(deftest datasheet-no-placeholder-text-test
  (testing "Datasheet has no placeholder text"
    (register-test-taxonomy!)
    (register-test-source!)
    (let [build-info {:version "0.1.0"
                      :seed 1337
                      :total-prompts 100
                      :total-variants 500
                      :languages [:en :ja :fr]
                      :sources [:test-source]
                      :license "GPL-3.0"
                      :git-commit "abc123"
                      :splits {:train 70 :dev 15 :test 15}}
          md (datasheet/generate-datasheet build-info)]
      ;; Should NOT contain common placeholder markers
      (is (not (str/includes? md "TODO")))
      (is (not (str/includes? md "FIXME")))
      (is (not (str/includes? md "PLACEHOLDER")))
      (is (not (str/includes? md "[TBD]")))
      (is (not (str/includes? md "[INSERT"))))))

;; ============================================================
;; VAL-METRIC-006: Reproducibility bundle completeness
;; ============================================================

(deftest bundle-contains-all-required-files-test
  (testing "Bundle contains all required files"
    (let [bundle-dir (str (System/getProperty "java.io.tmpdir")
                          "/shibboleth-test-bundle-" (System/currentTimeMillis))
          records [(make-prompt :split :train :canonical-text "hello")]
          variants [(make-variant :split :train)]
          ;; Create minimal stage manifests
          stage-manifests [(manifest/create-stage-manifest
                             {:stage :fetch :version "0.1.0" :seed 1337
                              :input-hash "abc" :output-hash "def"
                              :artifact-count 1 :config-hash "ghi"
                              :checksums {}})]
          build-info {:version "0.1.0"
                      :seed 1337
                      :total-prompts (count records)
                      :total-variants (count variants)
                      :languages [:en]
                      :sources [:test-source]
                      :license "GPL-3.0"
                      :git-commit "abc123"
                      :splits {:train 1 :dev 0 :test 0}
                      :dataset-name "test-dataset"
                      :stage-manifests stage-manifests}]
      (try
        (register-test-taxonomy!)
        (register-test-source!)
        (bundle/generate-bundle!
          {:bundle-dir bundle-dir
           :records records
           :variants variants
           :build-info build-info
           :verification-result {:passed true :checks []}})
        ;; Check all required files exist
        (is (.exists (io/file bundle-dir "prompts.parquet")))
        (is (.exists (io/file bundle-dir "variants.parquet")))
        (is (.isDirectory (io/file bundle-dir "manifests")))
        (is (.exists (io/file bundle-dir "checksums.sha256")))
        (is (.exists (io/file bundle-dir "verification_report.edn")))
        (is (.exists (io/file bundle-dir "datasheet.md")))
        (is (.exists (io/file bundle-dir "build_manifest.edn")))
        (finally
          ;; Cleanup
          (doseq [f (reverse (file-seq (io/file bundle-dir)))]
            (.delete f)))))))

(deftest bundle-checksums-match-files-test
  (testing "Bundle checksums match actual file hashes"
    (let [bundle-dir (str (System/getProperty "java.io.tmpdir")
                          "/shibboleth-test-checksums-" (System/currentTimeMillis))
          records [(make-prompt :split :train :canonical-text "hello world")]
          variants [(make-variant :split :train)]
          stage-manifests [(manifest/create-stage-manifest
                             {:stage :fetch :version "0.1.0" :seed 1337
                              :input-hash "abc" :output-hash "def"
                              :artifact-count 1 :config-hash "ghi"
                              :checksums {}})]
          build-info {:version "0.1.0"
                      :seed 1337
                      :total-prompts (count records)
                      :total-variants (count variants)
                      :languages [:en]
                      :sources [:test-source]
                      :license "GPL-3.0"
                      :git-commit "abc123"
                      :splits {:train 1 :dev 0 :test 0}
                      :dataset-name "test-dataset"
                      :stage-manifests stage-manifests}]
      (try
        (register-test-taxonomy!)
        (register-test-source!)
        (bundle/generate-bundle!
          {:bundle-dir bundle-dir
           :records records
           :variants variants
           :build-info build-info
           :verification-result {:passed true :checks []}})
        ;; Read checksums file and verify each entry
        (let [checksum-lines (str/split-lines (slurp (str bundle-dir "/checksums.sha256")))
              entries (keep (fn [line]
                             (when-not (str/blank? line)
                               (let [parts (str/split (str/trim line) #"\s+")]
                                 (when (= 2 (count parts))
                                   {:hash (first parts) :file (second parts)}))))
                           checksum-lines)]
          (is (pos? (count entries)) "Should have at least one checksum entry")
          (doseq [{:keys [hash file]} entries]
            (let [actual-hash (crypto/sha256-file (str bundle-dir "/" file))]
              (is (= hash actual-hash)
                  (str "Checksum mismatch for " file)))))
        (finally
          (doseq [f (reverse (file-seq (io/file bundle-dir)))]
            (.delete f)))))))

(deftest bundle-build-manifest-has-required-fields-test
  (testing "Build manifest has all required fields"
    (let [bundle-dir (str (System/getProperty "java.io.tmpdir")
                          "/shibboleth-test-manifest-" (System/currentTimeMillis))
          records [(make-prompt :split :train :canonical-text "test prompt text")]
          variants [(make-variant :split :train)]
          stage-manifests [(manifest/create-stage-manifest
                             {:stage :fetch :version "0.1.0" :seed 1337
                              :input-hash "abc" :output-hash "def"
                              :artifact-count 1 :config-hash "ghi"
                              :checksums {}})]
          build-info {:version "0.1.0"
                      :seed 1337
                      :total-prompts (count records)
                      :total-variants (count variants)
                      :languages [:en]
                      :sources [:test-source]
                      :license "GPL-3.0"
                      :git-commit "abc123"
                      :splits {:train 1 :dev 0 :test 0}
                      :dataset-name "test-dataset"
                      :stage-manifests stage-manifests}]
      (try
        (register-test-taxonomy!)
        (register-test-source!)
        (bundle/generate-bundle!
          {:bundle-dir bundle-dir
           :records records
           :variants variants
           :build-info build-info
           :verification-result {:passed true :checks []}})
        (let [bm (edn/read-string (slurp (str bundle-dir "/build_manifest.edn")))]
          (is (contains? bm :dataset-name))
          (is (contains? bm :version))
          (is (contains? bm :build-seed))
          (is (contains? bm :git-commit))
          (is (contains? bm :stages))
          (is (contains? bm :total-prompts))
          (is (contains? bm :total-variants))
          (is (= 1 (:total-prompts bm)))
          (is (= 1 (:total-variants bm)))
          (is (= "0.1.0" (:version bm)))
          (is (= 1337 (:build-seed bm))))
        (finally
          (doseq [f (reverse (file-seq (io/file bundle-dir)))]
            (.delete f)))))))

(deftest bundle-verification-report-is-valid-edn-test
  (testing "Verification report in bundle is valid EDN"
    (let [bundle-dir (str (System/getProperty "java.io.tmpdir")
                          "/shibboleth-test-vr-" (System/currentTimeMillis))
          records [(make-prompt :split :train :canonical-text "test")]
          variants [(make-variant :split :train)]
          stage-manifests [(manifest/create-stage-manifest
                             {:stage :fetch :version "0.1.0" :seed 1337
                              :input-hash "abc" :output-hash "def"
                              :artifact-count 1 :config-hash "ghi"
                              :checksums {}})]
          build-info {:version "0.1.0" :seed 1337
                      :total-prompts 1 :total-variants 1
                      :languages [:en] :sources [:test-source]
                      :license "GPL-3.0" :git-commit "abc123"
                      :splits {:train 1 :dev 0 :test 0}
                      :dataset-name "test-dataset"
                      :stage-manifests stage-manifests}]
      (try
        (register-test-taxonomy!)
        (register-test-source!)
        (bundle/generate-bundle!
          {:bundle-dir bundle-dir
           :records records
           :variants variants
           :build-info build-info
           :verification-result {:passed true :checks [{:name :test-check :passed true :fatal false}]}})
        (let [vr (edn/read-string (slurp (str bundle-dir "/verification_report.edn")))]
          (is (map? vr))
          (is (contains? vr :passed))
          (is (contains? vr :checks)))
        (finally
          (doseq [f (reverse (file-seq (io/file bundle-dir)))]
            (.delete f)))))))

;; ============================================================
;; VAL-METRIC-007: Stage 7 verification suite
;; ============================================================

(deftest stage7-runs-all-checks-test
  (testing "Stage 7 verification runs all defined checks"
    (let [records [(make-prompt :cluster-id 1 :split :train :canonical-hash "h1"
                                :intent-label :adversarial)
                   (make-prompt :cluster-id 2 :split :dev :canonical-hash "h2"
                                :intent-label :adversarial)
                   (make-prompt :cluster-id 3 :split :test :canonical-hash "h3"
                                :intent-label :benign)]
          result (verification/verify! {:records records :variants []})]
      (is (:passed result))
      ;; Should have run all 4 checks
      (is (= 4 (count (:checks result))))
      (is (every? :passed (:checks result))))))

(deftest stage7-fatal-failure-blocks-build-test
  (testing "Fatal verification failure throws exception (blocks build)"
    (let [;; Create leaky data — cluster 1 in both train and test
          records [(make-prompt :cluster-id 1 :split :train :canonical-hash "h1")
                   (make-prompt :cluster-id 1 :split :test :canonical-hash "h2")
                   (make-prompt :cluster-id 2 :split :dev :canonical-hash "h3")]]
      (is (thrown-with-msg? clojure.lang.ExceptionInfo #"FATAL"
            (verification/verify! {:records records :variants []}))))))

(deftest stage7-nonfatal-produces-warnings-test
  (testing "Non-fatal check failures produce warnings but don't throw"
    (let [;; Create extremely skewed data (>80% one label) — non-fatal failure
          ;; Each record needs a unique canonical-hash to avoid triggering duplicate-detection
          train-records (mapv (fn [i]
                                (make-prompt :cluster-id 1 :split :train
                                             :intent-label :adversarial
                                             :canonical-hash (str "train-" i)))
                              (range 90))
          dev-records (mapv (fn [i]
                              (make-prompt :cluster-id 2 :split :dev
                                           :intent-label :benign
                                           :canonical-hash (str "dev-" i)))
                            (range 5))
          test-records (mapv (fn [i]
                               (make-prompt :cluster-id 3 :split :test
                                            :intent-label :benign
                                            :canonical-hash (str "test-" i)))
                             (range 5))
          records (concat train-records dev-records test-records)
          result (verification/verify! {:records records :variants []})]
      ;; Should not throw (label-distribution-sane is non-fatal)
      (is (false? (:passed result)) "Overall should fail due to label skew")
      ;; The label-distribution-sane check should be failed
      (let [label-check (first (filter #(= :label-distribution-sane (:name %))
                                       (:checks result)))]
        (is (some? label-check))
        (is (false? (:passed label-check)))))))

(deftest stage7-metric-assertions-evaluated-test
  (testing "Stage 7 evaluates metric assertions and reports results"
    (register-test-taxonomy!)
    (coverage/register-coverage-metrics!)
    (quality/register-quality-metrics!)
    (let [records [(make-prompt :cluster-id 1 :split :train :canonical-hash "h1"
                                :intent-label :adversarial :attack-family :persona-injection)
                   (make-prompt :cluster-id 2 :split :dev :canonical-hash "h2"
                                :intent-label :adversarial :attack-family :dan-variants)
                   (make-prompt :cluster-id 3 :split :test :canonical-hash "h3"
                                :intent-label :benign :attack-family :authority-impersonation)]
          result (verification/run-stage7!
                   {:records records :variants []})]
      (is (map? result))
      (is (contains? result :verification))
      (is (contains? result :metrics))
      ;; Metrics should be evaluated
      (is (map? (:metrics result)))
      ;; cluster-leakage-rate should pass assertion (0.0 rate)
      (let [leakage-result (get-in result [:metrics :cluster-leakage-rate])]
        (when leakage-result
          (is (= 0.0 (:rate (:value leakage-result)))))))))

(deftest stage7-check-enumeration-test
  (testing "Stage 7 enumerates all defined checks"
    (let [check-names (verification/all-check-names)]
      ;; Should include all standard checks
      (is (some #{:cluster-disjoint-splits} check-names))
      (is (some #{:variant-split-consistency} check-names))
      (is (some #{:duplicate-detection} check-names))
      (is (some #{:label-distribution-sane} check-names)))))

;; ============================================================
;; Integration: Datasheet with actual taxonomy data
;; ============================================================

(deftest datasheet-includes-taxonomy-info-test
  (testing "Datasheet includes actual taxonomy information"
    (register-test-taxonomy!)
    (register-test-source!)
    (let [build-info {:version "0.1.0"
                      :seed 1337
                      :total-prompts 100
                      :total-variants 500
                      :languages [:en :ja :fr]
                      :sources [:test-source]
                      :license "GPL-3.0"
                      :git-commit "abc123"
                      :splits {:train 70 :dev 15 :test 15}}
          md (datasheet/generate-datasheet build-info)]
      ;; Should mention attack families from taxonomy
      (is (str/includes? md "persona-injection"))
      ;; Should mention at least some language
      (is (str/includes? md "en")))))
