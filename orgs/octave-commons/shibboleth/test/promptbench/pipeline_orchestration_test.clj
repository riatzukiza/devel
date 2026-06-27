(ns promptbench.pipeline-orchestration-test
  "Tests for pipeline orchestration: def-pipeline, build!, rebuild!, resume, up-to, seed.

   Fulfills: VAL-PIPE-007 (Pipeline orchestration)."
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [clojure.java.io :as io]
            [clojure.set :as set]
            [promptbench.pipeline.core :as pipeline]
            [promptbench.pipeline.sources :as sources]
            [promptbench.pipeline.manifest :as manifest]
            [promptbench.pipeline.stages :as stages]
            [promptbench.taxonomy.registry :as taxonomy-registry]))

;; ============================================================
;; Helpers
;; ============================================================

(def ^:private test-data-dir
  (str (System/getProperty "java.io.tmpdir") "/shibboleth-orch-test-" (System/nanoTime)))

(def ^:private fixture-path "test/fixtures/synthetic-prompts.jsonl")

(defn- setup-test-dirs! []
  (doseq [sub ["raw" "canonicalized" "manifests" "embedded" "split"]]
    (.mkdirs (io/file test-data-dir sub))))

(defn- teardown-test-dirs! []
  (let [dir (io/file test-data-dir)]
    (when (.exists dir)
      (doseq [f (reverse (file-seq dir))]
        (.delete f)))))

(defn- register-test-source! []
  (sources/register-source!
    :synthetic-test
    {:description "Synthetic test dataset"
     :path fixture-path
     :version "1.0.0"
     :license :gpl-3.0
     :format :jsonl
     :schema {:prompt :string :language :string
              :harm_category :string :family :string :row_id :int}
     :taxonomy-mapping
       {:harm_category {"identity_manipulation" :identity-manipulation
                        "instruction_injection" :instruction-injection
                        "social_engineering"    :social-engineering
                        "benign"               :benign}
        :family        {"dan-variants"           :dan-variants
                        "instruction-injection"  :instruction-injection
                        "character-roleplay"     :character-roleplay
                        "benign"                 :benign
                        "persona-injection"      :persona-injection
                        "developer-mode"         :developer-mode
                        "authority-impersonation" :authority-impersonation}}}))

;; ============================================================
;; Fixture
;; ============================================================

(use-fixtures :each
  (fn [f]
    (taxonomy-registry/reset!)
    (sources/reset!)
    (pipeline/reset-pipelines!)
    (teardown-test-dirs!)
    (setup-test-dirs!)
    (try
      (f)
      (finally
        (teardown-test-dirs!)))))

;; ============================================================
;; def-pipeline macro
;; ============================================================

(deftest def-pipeline-produces-valid-definition-test
  (testing "def-pipeline produces valid pipeline definition"
    (pipeline/def-pipeline test-pipeline
      {:version "0.1.0"
       :seed 1337
       :sources [:synthetic-test]
       :data-dir test-data-dir
       :canonicalize {:normalization :nfkc :whitespace :collapse :hash-algo :sha256}
       :embedding {:model "intfloat/multilingual-e5-large" :batch-size 128}
       :clustering {:min-cluster-size 2 :metric "euclidean"}
       :split {:train 0.70 :dev 0.15 :test 0.15
               :stratify-by [:intent-label :attack-family :canonical-lang]
               :constraint :cluster-disjoint}})
    (let [p (pipeline/get-pipeline :test-pipeline)]
      (is (some? p) "Pipeline should be registered")
      (is (= "0.1.0" (:version p)))
      (is (= 1337 (:seed p)))
      (is (= [:synthetic-test] (:sources p))))))

;; ============================================================
;; Pipeline stages execute in order
;; ============================================================

(deftest pipeline-stages-execute-in-order-test
  (testing "Pipeline executes stages in order: fetch, canonicalize, embed-cluster, split"
    (register-test-source!)
    (pipeline/def-pipeline order-test-pipeline
      {:version "0.1.0"
       :seed 1337
       :sources [:synthetic-test]
       :data-dir test-data-dir
       :embedding {:model "intfloat/multilingual-e5-large" :batch-size 128}
       :clustering {:min-cluster-size 2 :metric "euclidean"}
       :split {:train 0.70 :dev 0.15 :test 0.15
               :stratify-by [:intent-label :attack-family :canonical-lang]
               :constraint :cluster-disjoint}})
    (let [result (pipeline/build! :order-test-pipeline)]
      ;; All stages should have completed
      (is (= :complete (get-in result [:stages :fetch :status])))
      (is (= :complete (get-in result [:stages :canonicalize :status])))
      (is (= :complete (get-in result [:stages :embed-cluster :status])))
      (is (= :complete (get-in result [:stages :split :status]))))))

;; ============================================================
;; build! :up-to stops at requested stage
;; ============================================================

(deftest build-up-to-stops-at-stage-test
  (testing "build! :up-to stops at requested stage"
    (register-test-source!)
    (pipeline/def-pipeline up-to-pipeline
      {:version "0.1.0"
       :seed 1337
       :sources [:synthetic-test]
       :data-dir test-data-dir
       :embedding {:model "intfloat/multilingual-e5-large" :batch-size 128}
       :clustering {:min-cluster-size 2 :metric "euclidean"}
       :split {:train 0.70 :dev 0.15 :test 0.15
               :stratify-by [:intent-label :attack-family :canonical-lang]
               :constraint :cluster-disjoint}})
    (let [result (pipeline/build! :up-to-pipeline :up-to :canonicalize)]
      (is (= :complete (get-in result [:stages :fetch :status])))
      (is (= :complete (get-in result [:stages :canonicalize :status])))
      (is (nil? (get-in result [:stages :embed-cluster :status]))
          "embed-cluster should not have run")
      (is (nil? (get-in result [:stages :split :status]))
          "split should not have run"))))

;; ============================================================
;; Pipeline is idempotent
;; ============================================================

(deftest pipeline-idempotent-test
  (testing "Pipeline is idempotent (same output on re-run)"
    (register-test-source!)
    (pipeline/def-pipeline idem-pipeline
      {:version "0.1.0"
       :seed 1337
       :sources [:synthetic-test]
       :data-dir test-data-dir
       :embedding {:model "intfloat/multilingual-e5-large" :batch-size 128}
       :clustering {:min-cluster-size 2 :metric "euclidean"}
       :split {:train 0.70 :dev 0.15 :test 0.15
               :stratify-by [:intent-label :attack-family :canonical-lang]
               :constraint :cluster-disjoint}})
    (let [r1 (pipeline/build! :idem-pipeline)
          r2 (pipeline/build! :idem-pipeline)]
      (is (= (count (get-in r1 [:data :records]))
             (count (get-in r2 [:data :records])))
          "Record count should be identical")
      (is (= (set (map (juxt :source-id :split) (get-in r1 [:data :records])))
             (set (map (juxt :source-id :split) (get-in r2 [:data :records]))))
          "Split assignments should be identical"))))

;; ============================================================
;; Pipeline is resumable
;; ============================================================

(deftest pipeline-resumable-test
  (testing "Pipeline is resumable (skips completed stages)"
    (register-test-source!)
    (pipeline/def-pipeline resume-pipeline
      {:version "0.1.0"
       :seed 1337
       :sources [:synthetic-test]
       :data-dir test-data-dir
       :embedding {:model "intfloat/multilingual-e5-large" :batch-size 128}
       :clustering {:min-cluster-size 2 :metric "euclidean"}
       :split {:train 0.70 :dev 0.15 :test 0.15
               :stratify-by [:intent-label :attack-family :canonical-lang]
               :constraint :cluster-disjoint}})
    ;; First, build up to canonicalize
    (pipeline/build! :resume-pipeline :up-to :canonicalize)
    ;; Now build fully — should skip fetch and canonicalize
    (let [result (pipeline/build! :resume-pipeline)]
      (is (= :complete (get-in result [:stages :fetch :status])))
      (is (= :complete (get-in result [:stages :canonicalize :status])))
      (is (= :complete (get-in result [:stages :embed-cluster :status])))
      (is (= :complete (get-in result [:stages :split :status]))))))

;; ============================================================
;; rebuild! invalidates downstream stages
;; ============================================================

(deftest rebuild-invalidates-downstream-test
  (testing "rebuild! invalidates downstream stages"
    (register-test-source!)
    (pipeline/def-pipeline rebuild-pipeline
      {:version "0.1.0"
       :seed 1337
       :sources [:synthetic-test]
       :data-dir test-data-dir
       :embedding {:model "intfloat/multilingual-e5-large" :batch-size 128}
       :clustering {:min-cluster-size 2 :metric "euclidean"}
       :split {:train 0.70 :dev 0.15 :test 0.15
               :stratify-by [:intent-label :attack-family :canonical-lang]
               :constraint :cluster-disjoint}})
    ;; Full build first
    (pipeline/build! :rebuild-pipeline)
    ;; Rebuild from canonicalize — should invalidate embed-cluster and split
    (let [result (pipeline/rebuild! :rebuild-pipeline :from :canonicalize)]
      (is (= :complete (get-in result [:stages :canonicalize :status])))
      (is (= :complete (get-in result [:stages :embed-cluster :status])))
      (is (= :complete (get-in result [:stages :split :status]))))))

;; ============================================================
;; Seed controls reproducibility
;; ============================================================

(deftest seed-controls-reproducibility-test
  (testing "Same seed = same output, different seed = different output"
    (register-test-source!)
    ;; Build with seed 1337
    (pipeline/def-pipeline seed-a
      {:version "0.1.0"
       :seed 1337
       :sources [:synthetic-test]
       :data-dir test-data-dir
       :embedding {:model "intfloat/multilingual-e5-large" :batch-size 128}
       :clustering {:min-cluster-size 2 :metric "euclidean"}
       :split {:train 0.70 :dev 0.15 :test 0.15
               :stratify-by [:intent-label :attack-family :canonical-lang]
               :constraint :cluster-disjoint}})
    (let [r1 (pipeline/build! :seed-a)
          splits-1337 (set (map (juxt :source-id :split) (get-in r1 [:data :records])))]
      ;; Build again with seed 1337 (idempotent)
      (pipeline/reset-pipelines!)
      (pipeline/def-pipeline seed-a-again
        {:version "0.1.0"
         :seed 1337
         :sources [:synthetic-test]
         :data-dir test-data-dir
         :embedding {:model "intfloat/multilingual-e5-large" :batch-size 128}
         :clustering {:min-cluster-size 2 :metric "euclidean"}
         :split {:train 0.70 :dev 0.15 :test 0.15
                 :stratify-by [:intent-label :attack-family :canonical-lang]
                 :constraint :cluster-disjoint}})
      (let [r2 (pipeline/build! :seed-a-again)
            splits-1337-again (set (map (juxt :source-id :split) (get-in r2 [:data :records])))]
        (is (= splits-1337 splits-1337-again)
            "Same seed should produce same splits")))))
