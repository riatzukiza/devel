(ns promptbench.curated-pipeline-integration-test
  "Integration tests for curated corpus pipeline integration.

   Fulfills:
   - VAL-CORPUS-003: Curated prompts flow through all pipeline stages,
     source metadata and license (:gpl-3.0) preserved.
   - VAL-CORPUS-004: Two builds with same seed = byte-identical output,
     curated source version tracked in build manifest.
   - VAL-CORPUS-006: Textually identical prompts across curated and public
     sources are detected. Dedup policy documented and applied.

   Tests run curated + synthetic sources through the full pipeline
   (fetch through split) and verify curated prompt presence, license
   preservation, dedup, and reproducibility at each stage."
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [clojure.java.io :as io]
            [clojure.string :as str]
            [cheshire.core :as json]
            [promptbench.taxonomy.registry :as taxonomy-registry]
            [promptbench.taxonomy.families :as families]
            [promptbench.taxonomy.categories :as categories]
            [promptbench.pipeline.sources :as sources]
            [promptbench.pipeline.stages :as stages]
            [promptbench.pipeline.manifest :as manifest]
            [promptbench.pipeline.core :as pipeline]
            [promptbench.corpus.curated :as curated]
            [promptbench.util.crypto :as crypto]))

;; ============================================================
;; Test Data Setup
;; ============================================================

(def ^:private test-data-dir
  "Unique temp directory per test run."
  (str (System/getProperty "java.io.tmpdir")
       "/shibboleth-curated-integration-" (System/nanoTime)))

(defn- setup-test-dirs! []
  (doseq [sub ["raw" "canonicalized" "manifests" "embedded" "split" "variants"]]
    (.mkdirs (io/file test-data-dir sub))))

(defn- teardown-test-dirs! []
  (let [dir (io/file test-data-dir)]
    (when (.exists dir)
      (doseq [f (reverse (file-seq dir))]
        (.delete f)))))

(defn- register-synthetic-source!
  "Register a synthetic test source (simulates public dataset).
   Uses the existing test fixture file."
  []
  (sources/register-source! :synthetic-test
    {:description      "Synthetic test dataset"
     :path             "test/fixtures/synthetic-prompts.jsonl"
     :version          "1.0.0"
     :license          :apache-2.0
     :format           :jsonl
     :schema           {:prompt :string :language :string
                        :harm_category :string :family :string :row_id :int}
     :taxonomy-mapping {:harm_category {"identity_manipulation" :identity-manipulation
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

(defn- register-test-transforms!
  "Register minimal transforms needed for pipeline."
  []
  (require 'promptbench.transform.registry)
  ((resolve 'promptbench.transform.registry/reset!))
  ;; Register the transforms that families reference
  ((resolve 'promptbench.transform.registry/register-transform!)
   :mt {:description "Machine translation" :type :linguistic
        :deterministic false :reversible :approximate
        :params-spec {} :provenance [:source-lang :target-lang :model]})
  ((resolve 'promptbench.transform.registry/register-transform!)
   :code-mix {:description "Code-mixing" :type :linguistic
              :deterministic true :reversible false
              :params-spec {} :provenance [:strategy :mix-rate :l2]})
  ((resolve 'promptbench.transform.registry/register-transform!)
   :homoglyph {:description "Homoglyph substitution" :type :obfuscation
               :deterministic true :reversible true
               :params-spec {} :provenance [:rate :substitutions]})
  ((resolve 'promptbench.transform.registry/register-transform!)
   :exhaustion {:description "Token exhaustion" :type :resource-attack
                :deterministic true :reversible true
                :params-spec {} :provenance [:position :length :pattern]}))

;; ============================================================
;; Fixtures
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
;; Helper: run fetch + canonicalize with curated + synthetic
;; ============================================================

(defn- run-fetch-and-canonicalize!
  "Run fetch + canonicalize stages with curated + synthetic sources.
   Returns {:fetch-result ... :canon-result ...}."
  [& {:keys [extra-sources seed] :or {extra-sources [] seed 1337}}]
  (curated/register-all!)
  (register-synthetic-source!)
  (register-test-transforms!)
  (let [all-sources (into [:curated-persona-injections
                           :curated-authority-escalation
                           :curated-developer-mode
                           :synthetic-test]
                          extra-sources)
        config {:sources  all-sources
                :data-dir test-data-dir
                :seed     seed
                :version  "0.1.0"}
        fetch-result (stages/fetch! config)
        canon-result (stages/canonicalize! config)]
    {:fetch-result fetch-result
     :canon-result canon-result
     :config       config}))

;; ============================================================
;; VAL-CORPUS-003: Curated prompts flow through pipeline stages
;; ============================================================

(deftest curated-prompts-present-after-fetch-test
  (testing "Curated JSONL files are fetched into data/raw/"
    (let [{:keys [fetch-result]} (run-fetch-and-canonicalize!)
          files (:files fetch-result)]
      ;; All 3 curated sources should be fetched
      (is (contains? files :curated-persona-injections)
          "Should fetch persona-injections")
      (is (contains? files :curated-authority-escalation)
          "Should fetch authority-escalation")
      (is (contains? files :curated-developer-mode)
          "Should fetch developer-mode")
      ;; Verify files exist on disk
      (doseq [[_src path] files]
        (is (.exists (io/file path))
            (str "Fetched file should exist: " path))))))

(deftest curated-prompts-present-after-canonicalize-test
  (testing "Curated prompts appear in canonicalized records with correct families"
    (let [{:keys [canon-result]} (run-fetch-and-canonicalize!)
          records (:records canon-result)
          families (set (map :attack-family records))]
      ;; Curated families should be present
      (is (contains? families :persona-injection)
          "persona-injection family should be present after canonicalize")
      (is (contains? families :authority-impersonation)
          "authority-impersonation family should be present after canonicalize")
      (is (contains? families :developer-mode)
          "developer-mode family should be present after canonicalize")
      ;; Verify curated source records exist
      (let [curated-records (filter #(str/starts-with?
                                       (name (get-in % [:source :dataset] :unknown))
                                       "curated")
                                    records)]
        (is (>= (count curated-records) 18)
            (str "Should have at least 18 curated records (8+5+5), got "
                 (count curated-records)))))))

(deftest curated-prompts-canonical-text-normalized-test
  (testing "Curated prompts have NFKC-normalized, whitespace-collapsed text"
    (let [{:keys [canon-result]} (run-fetch-and-canonicalize!)
          records (:records canon-result)
          curated (filter #(str/starts-with?
                             (name (get-in % [:source :dataset] :unknown))
                             "curated")
                          records)]
      (doseq [r curated]
        (let [text (:canonical-text r)]
          ;; No leading/trailing whitespace
          (is (= text (str/trim text))
              (str "Canonical text should be trimmed for source-id " (:source-id r)))
          ;; No multiple consecutive spaces
          (is (not (re-find #"  " text))
              (str "Canonical text should have collapsed whitespace for source-id "
                   (:source-id r))))))))

(deftest curated-prompts-have-canonical-hash-test
  (testing "Every curated prompt has a non-nil canonical hash"
    (let [{:keys [canon-result]} (run-fetch-and-canonicalize!)
          curated (filter #(str/starts-with?
                             (name (get-in % [:source :dataset] :unknown))
                             "curated")
                          (:records canon-result))]
      (doseq [r curated]
        (is (string? (:canonical-hash r))
            (str "canonical-hash should be a string for " (:source-id r)))
        (is (= 64 (count (:canonical-hash r)))
            "canonical-hash should be 64-char hex (SHA-256)")))))

(deftest curated-prompts-have-source-ids-test
  (testing "Every curated prompt has a unique, non-nil source-id"
    (let [{:keys [canon-result]} (run-fetch-and-canonicalize!)
          curated (filter #(str/starts-with?
                             (name (get-in % [:source :dataset] :unknown))
                             "curated")
                          (:records canon-result))
          source-ids (map :source-id curated)]
      (is (every? string? source-ids) "All source-ids should be strings")
      (is (= (count source-ids) (count (set source-ids)))
          "All source-ids should be unique"))))

;; ============================================================
;; VAL-CORPUS-003: License :gpl-3.0 preserved
;; ============================================================

(deftest license-gpl-3-preserved-in-source-metadata-test
  (testing "License :gpl-3.0 preserved in source metadata for all curated records"
    (let [{:keys [canon-result]} (run-fetch-and-canonicalize!)
          curated (filter #(str/starts-with?
                             (name (get-in % [:source :dataset] :unknown))
                             "curated")
                          (:records canon-result))]
      (is (pos? (count curated)) "Should have curated records")
      (doseq [r curated]
        (is (= :gpl-3.0 (get-in r [:source :license]))
            (str "License should be :gpl-3.0 for curated record "
                 (get-in r [:source :dataset]) " / " (:source-id r)))))))

(deftest license-preserved-across-all-record-fields-test
  (testing "All curated source records have complete source metadata"
    (let [{:keys [canon-result]} (run-fetch-and-canonicalize!)
          curated (filter #(str/starts-with?
                             (name (get-in % [:source :dataset] :unknown))
                             "curated")
                          (:records canon-result))]
      (doseq [r curated]
        (is (keyword? (get-in r [:source :dataset]))
            "Source :dataset should be a keyword")
        (is (some? (get-in r [:source :row-id]))
            "Source :row-id should be present")
        (is (= :gpl-3.0 (get-in r [:source :license]))
            "Source :license should be :gpl-3.0")))))

;; ============================================================
;; VAL-CORPUS-004: Curated source version in build manifest
;; ============================================================

(deftest curated-source-version-in-build-manifest-test
  (testing "Build manifest tracks curated source versions"
    (curated/register-all!)
    (register-synthetic-source!)
    (let [source-versions (into (sorted-map)
                                (keep (fn [src-kw]
                                        (when-let [src (sources/get-source src-kw)]
                                          [src-kw (:version src)])))
                                [:curated-persona-injections
                                 :curated-authority-escalation
                                 :curated-developer-mode
                                 :synthetic-test])
          bm (manifest/create-build-manifest
               {:dataset-name "test-build"
                :version "0.1.0"
                :build-seed 1337
                :stage-manifests []
                :total-prompts 100
                :total-variants 50
                :source-versions source-versions})]
      ;; Build manifest should contain :source-versions
      (is (map? (:source-versions bm))
          "Build manifest should have :source-versions map")
      ;; All curated sources should have versions
      (is (= "0.1.0" (get-in bm [:source-versions :curated-persona-injections]))
          "curated-persona-injections version should be '0.1.0'")
      (is (= "0.1.0" (get-in bm [:source-versions :curated-authority-escalation]))
          "curated-authority-escalation version should be '0.1.0'")
      (is (= "0.1.0" (get-in bm [:source-versions :curated-developer-mode]))
          "curated-developer-mode version should be '0.1.0'")
      ;; Public source version also tracked
      (is (= "1.0.0" (get-in bm [:source-versions :synthetic-test]))
          "synthetic-test version should be '1.0.0'"))))

(deftest build-manifest-without-source-versions-still-works-test
  (testing "Build manifest works without source-versions (backward compatible)"
    (let [bm (manifest/create-build-manifest
               {:dataset-name "test-build"
                :version "0.1.0"
                :build-seed 1337
                :stage-manifests []
                :total-prompts 100
                :total-variants 50})]
      ;; Should not have :source-versions key
      (is (not (contains? bm :source-versions))
          "No :source-versions when not provided"))))

;; ============================================================
;; VAL-CORPUS-006: Deduplication against public datasets
;; ============================================================

(deftest dedup-detects-cross-source-duplicates-test
  (testing "Dedup detects textually identical prompts across sources"
    ;; Create a synthetic source that has a prompt identical to a curated one
    (curated/register-all!)
    ;; Read a curated prompt to duplicate
    (let [curated-prompt (with-open [rdr (io/reader "data/curated/persona-injections/prompts.jsonl")]
                           (:prompt (json/parse-string (first (line-seq rdr)) true)))
          ;; Create a temp JSONL with the duplicate prompt
          dup-file (str test-data-dir "/duplicate-prompts.jsonl")
          _ (spit dup-file
                  (str (json/generate-string
                         {:prompt curated-prompt
                          :language "en"
                          :family "dan-variants"
                          :harm_category "identity_manipulation"})
                       "\n"))
          _ (sources/register-source! :test-with-dup
              {:description "Test source with duplicate prompt"
               :path dup-file
               :version "1.0.0"
               :license :apache-2.0
               :format :jsonl
               :schema {:prompt :string :language :string
                        :harm_category :string :family :string}
               :taxonomy-mapping {:harm_category {"identity_manipulation" :identity-manipulation}
                                  :family {"dan-variants" :dan-variants}}})]
      (register-test-transforms!)
      (let [config {:sources [:curated-persona-injections :test-with-dup]
                    :data-dir test-data-dir
                    :seed 1337
                    :version "0.1.0"}
            _ (stages/fetch! config)
            result (stages/canonicalize! config)
            dedup-report (:dedup-report result)]
        ;; Should detect the duplicate
        (is (some? dedup-report) "Should have dedup report")
        (is (pos? (:removed (:stats dedup-report)))
            (str "Should have removed at least 1 duplicate, stats: "
                 (:stats dedup-report)))
        ;; The duplicate entry should reference both sources
        (let [dups (:duplicates dedup-report)]
          (is (seq dups) "Should have duplicate entries")
          ;; Verify the duplicate was detected
          (when (seq dups)
            (let [dup-entry (first dups)]
              (is (string? (:canonical-hash dup-entry))
                  "Duplicate should have canonical hash")
              (is (keyword? (:kept-source dup-entry))
                  "Duplicate should identify kept source")
              (is (seq (:removed dup-entry))
                  "Duplicate should list removed entries"))))))))

(deftest dedup-policy-prefers-curated-source-test
  (testing "Dedup policy prefers curated source over public source"
    (curated/register-all!)
    ;; Create public source with duplicate of curated prompt
    (let [curated-prompt (with-open [rdr (io/reader "data/curated/persona-injections/prompts.jsonl")]
                           (:prompt (json/parse-string (first (line-seq rdr)) true)))
          dup-file (str test-data-dir "/dup-public.jsonl")
          _ (spit dup-file
                  (str (json/generate-string
                         {:prompt curated-prompt
                          :language "en"
                          :family "dan-variants"
                          :harm_category "identity_manipulation"})
                       "\n"))
          _ (sources/register-source! :public-with-dup
              {:description "Public source with duplicate"
               :path dup-file
               :version "1.0.0"
               :license :apache-2.0
               :format :jsonl
               :schema {:prompt :string :language :string
                        :harm_category :string :family :string}
               :taxonomy-mapping {:harm_category {"identity_manipulation" :identity-manipulation}
                                  :family {"dan-variants" :dan-variants}}})]
      (register-test-transforms!)
      (let [config {:sources [:curated-persona-injections :public-with-dup]
                    :data-dir test-data-dir
                    :seed 1337
                    :version "0.1.0"}
            _ (stages/fetch! config)
            result (stages/canonicalize! config)
            records (:records result)
            dedup-report (:dedup-report result)]
        ;; The kept source should be curated
        (when-let [dup (first (:duplicates dedup-report))]
          (is (= :curated-persona-injections (:kept-source dup))
              "Should keep curated source over public")
          ;; The removed should be public
          (is (some #(= :public-with-dup (:source %)) (:removed dup))
              "Should remove the public duplicate"))
        ;; Remaining records should have the curated version
        (let [matching (filter #(= (get-in % [:source :dataset]) :curated-persona-injections)
                               records)
              ;; No public-with-dup records should remain with that hash
              canon-hash (crypto/sha256-string
                           (stages/normalize-text curated-prompt))
              surviving (filter #(= canon-hash (:canonical-hash %)) records)]
          (is (= 1 (count surviving))
              "Only one copy of the duplicate should survive")
          (when (= 1 (count surviving))
            (is (= :curated-persona-injections
                    (get-in (first surviving) [:source :dataset]))
                "Surviving copy should be from curated source")))))))

(deftest dedup-no-false-positives-test
  (testing "Dedup does not remove records that are genuinely different"
    (curated/register-all!)
    (register-synthetic-source!)
    (register-test-transforms!)
    (let [config {:sources [:curated-persona-injections :synthetic-test]
                  :data-dir test-data-dir
                  :seed 1337
                  :version "0.1.0"}
          _ (stages/fetch! config)
          result (stages/canonicalize! config)]
      ;; The test fixture has no exact duplicates of curated prompts
      ;; (different text content), so no records should be removed
      (let [stats (get-in result [:dedup-report :stats])]
        (is (= (:total-input stats) (:total-output stats))
            (str "No records should be removed when no duplicates exist. "
                 "Stats: " stats))))))

(deftest dedup-report-written-to-disk-test
  (testing "Dedup report is written when duplicates exist"
    (curated/register-all!)
    (let [curated-prompt (with-open [rdr (io/reader "data/curated/persona-injections/prompts.jsonl")]
                           (:prompt (json/parse-string (first (line-seq rdr)) true)))
          dup-file (str test-data-dir "/dup-disk.jsonl")
          _ (spit dup-file
                  (str (json/generate-string
                         {:prompt curated-prompt
                          :language "en"
                          :family "dan-variants"
                          :harm_category "identity_manipulation"})
                       "\n"))
          _ (sources/register-source! :dup-disk-src
              {:description "Duplicate disk test"
               :path dup-file
               :version "1.0.0"
               :license :apache-2.0
               :format :jsonl
               :schema {:prompt :string :language :string
                        :harm_category :string :family :string}
               :taxonomy-mapping {:harm_category {"identity_manipulation" :identity-manipulation}
                                  :family {"dan-variants" :dan-variants}}})]
      (register-test-transforms!)
      (let [config {:sources [:curated-persona-injections :dup-disk-src]
                    :data-dir test-data-dir
                    :seed 1337
                    :version "0.1.0"}]
        (stages/fetch! config)
        (stages/canonicalize! config)
        ;; Check dedup report file on disk
        (let [report-file (io/file test-data-dir "canonicalized" "dedup-report.edn")]
          (is (.exists report-file)
              "dedup-report.edn should be written when duplicates exist"))))))

;; ============================================================
;; VAL-CORPUS-004: Reproducibility
;; ============================================================

(deftest reproducibility-fetch-canonicalize-test
  (testing "Two runs with same seed produce identical canonical records"
    ;; Run 1
    (curated/register-all!)
    (register-synthetic-source!)
    (register-test-transforms!)
    (let [config {:sources [:curated-persona-injections
                            :curated-authority-escalation
                            :curated-developer-mode
                            :synthetic-test]
                  :data-dir test-data-dir
                  :seed 1337
                  :version "0.1.0"}
          _ (stages/fetch! config)
          result1 (stages/canonicalize! config)
          records1 (:records result1)
          hashes1 (sort (map :canonical-hash records1))
          ids1 (sort (map :source-id records1))]
      ;; Run 2 (same config, same seed)
      (teardown-test-dirs!)
      (setup-test-dirs!)
      (let [_ (stages/fetch! config)
            result2 (stages/canonicalize! config)
            records2 (:records result2)
            hashes2 (sort (map :canonical-hash records2))
            ids2 (sort (map :source-id records2))]
        ;; Identical output
        (is (= (count records1) (count records2))
            "Same number of records")
        (is (= hashes1 hashes2)
            "Identical canonical hashes")
        (is (= ids1 ids2)
            "Identical source IDs")
        ;; Manifests should have same output hash
        (is (= (get-in result1 [:manifest :output-hash])
               (get-in result2 [:manifest :output-hash]))
            "Same manifest output hash")))))

(deftest reproducibility-dedup-deterministic-test
  (testing "Dedup produces identical results across runs"
    (let [records [{:canonical-hash "aaa" :source-id "s1"
                    :source {:dataset :curated-a :license :gpl-3.0}}
                   {:canonical-hash "aaa" :source-id "s2"
                    :source {:dataset :public-a :license :apache-2.0}}
                   {:canonical-hash "bbb" :source-id "s3"
                    :source {:dataset :public-b :license :apache-2.0}}]
          result1 (stages/deduplicate-cross-source records)
          result2 (stages/deduplicate-cross-source records)]
      (is (= (map :source-id (:records result1))
             (map :source-id (:records result2)))
          "Dedup should produce identical results across invocations"))))

;; ============================================================
;; Full pipeline flow with curated sources
;; ============================================================

(deftest full-pipeline-curated-plus-synthetic-test
  (testing "Full pipeline build completes with curated + synthetic sources"
    (curated/register-all!)
    (register-synthetic-source!)
    (register-test-transforms!)
    (pipeline/def-pipeline curated-integration-test
      {:version   "0.1.0"
       :seed      42
       :sources   [:curated-persona-injections
                   :curated-authority-escalation
                   :curated-developer-mode
                   :synthetic-test]
       :data-dir  test-data-dir
       :embedding {:model "intfloat/multilingual-e5-large"
                   :batch-size 256}
       :clustering {:min-cluster-size 2 :metric "cosine"}
       :split     {:train 0.70 :dev 0.15 :test 0.15
                   :stratify-by [:intent-label :attack-family :canonical-lang]
                   :constraint :cluster-disjoint}
       :transforms {:tier-1-mt {:languages [:es]}
                    :code-mix  {:rates [0.25]}
                    :homoglyph {:rates [0.15]}
                    :exhaustion {:lengths [1024]}}})
    (let [result (pipeline/build! :curated-integration-test :up-to :split)
          records (get-in result [:data :records])]
      ;; Pipeline should complete
      (is (some? records) "Should produce records")
      (is (pos? (count records)) "Should have records")
      ;; Every record should have a split
      (doseq [r records]
        (is (#{:train :dev :test} (:split r))
            (str "Record should have valid split, got: " (:split r))))
      ;; Curated families should be present in final records
      (let [families (set (map :attack-family records))]
        (is (contains? families :persona-injection)
            "persona-injection should survive through pipeline")
        (is (contains? families :authority-impersonation)
            "authority-impersonation should survive through pipeline")
        (is (contains? families :developer-mode)
            "developer-mode should survive through pipeline"))
      ;; License should be preserved
      (let [curated (filter #(str/starts-with?
                               (name (get-in % [:source :dataset] :unknown))
                               "curated")
                            records)]
        (doseq [r curated]
          (is (= :gpl-3.0 (get-in r [:source :license]))
              "GPL-3.0 license preserved through pipeline"))))))

(deftest pipeline-records-have-all-required-fields-test
  (testing "All records after pipeline have required fields"
    (curated/register-all!)
    (register-synthetic-source!)
    (register-test-transforms!)
    (pipeline/def-pipeline fields-check-test
      {:version   "0.1.0"
       :seed      42
       :sources   [:curated-persona-injections :synthetic-test]
       :data-dir  test-data-dir
       :embedding {:model "intfloat/multilingual-e5-large"
                   :batch-size 256}
       :clustering {:min-cluster-size 2 :metric "cosine"}
       :split     {:train 0.70 :dev 0.15 :test 0.15
                   :stratify-by [:intent-label :attack-family :canonical-lang]
                   :constraint :cluster-disjoint}})
    (let [result (pipeline/build! :fields-check-test :up-to :split)
          records (get-in result [:data :records])]
      (doseq [r records]
        ;; Core fields
        (is (some? (:source-id r)) "source-id required")
        (is (some? (:canonical-hash r)) "canonical-hash required")
        (is (some? (:canonical-text r)) "canonical-text required")
        (is (some? (:canonical-lang r)) "canonical-lang required")
        (is (some? (:intent-label r)) "intent-label required")
        (is (some? (:attack-family r)) "attack-family required")
        (is (some? (:harm-category r)) "harm-category required")
        (is (some? (:source r)) "source metadata required")
        ;; Pipeline-added fields
        (is (some? (:cluster-id r)) "cluster-id required after embed+cluster")
        (is (some? (:split r)) "split required after split stage")))))

;; ============================================================
;; Dedup unit tests for the function itself
;; ============================================================

(deftest deduplicate-cross-source-keeps-curated-test
  (testing "Dedup keeps curated source when duplicate exists"
    (let [records [{:canonical-hash "abc123"
                    :source-id "sid-curated-1"
                    :canonical-text "hello"
                    :source {:dataset :curated-test :license :gpl-3.0}}
                   {:canonical-hash "abc123"
                    :source-id "sid-public-1"
                    :canonical-text "hello"
                    :source {:dataset :public-test :license :apache-2.0}}
                   {:canonical-hash "def456"
                    :source-id "sid-public-2"
                    :canonical-text "world"
                    :source {:dataset :public-test :license :apache-2.0}}]
          result (stages/deduplicate-cross-source records)]
      (is (= 2 (count (:records result)))
          "Should have 2 records after dedup (1 dup removed)")
      (is (= 1 (:removed (:stats result)))
          "Should report 1 removed record")
      ;; The surviving record for hash "abc123" should be from curated source
      (let [abc-record (first (filter #(= "abc123" (:canonical-hash %))
                                       (:records result)))]
        (is (= :curated-test (get-in abc-record [:source :dataset]))
            "Should keep the curated source record")))))

(deftest deduplicate-cross-source-no-dups-test
  (testing "Dedup returns all records when no duplicates exist"
    (let [records [{:canonical-hash "abc123"
                    :source-id "sid-1"
                    :source {:dataset :source-a}}
                   {:canonical-hash "def456"
                    :source-id "sid-2"
                    :source {:dataset :source-b}}]
          result (stages/deduplicate-cross-source records)]
      (is (= 2 (count (:records result))))
      (is (= 0 (:removed (:stats result))))
      (is (empty? (:duplicates result))))))

(deftest deduplicate-cross-source-deterministic-ordering-test
  (testing "Dedup is deterministic regardless of input order"
    (let [rec-a {:canonical-hash "abc123"
                 :source-id "sid-curated"
                 :source {:dataset :curated-a}}
          rec-b {:canonical-hash "abc123"
                 :source-id "sid-public"
                 :source {:dataset :public-b}}
          result1 (stages/deduplicate-cross-source [rec-a rec-b])
          result2 (stages/deduplicate-cross-source [rec-b rec-a])]
      ;; Both should keep the same record (curated)
      (is (= (map :source-id (:records result1))
             (map :source-id (:records result2)))
          "Dedup should be order-independent (deterministic)"))))
