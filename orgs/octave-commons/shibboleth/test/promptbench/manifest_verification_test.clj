(ns promptbench.manifest-verification-test
  "Tests for manifest system enhancements and verification layer.

   Fulfills: VAL-PIPE-006 (Manifest system — build manifest, checksum verification),
             VAL-PIPE-008 (Verification layer),
             VAL-PIPE-009 (Parquet schema completeness).

   Tests written FIRST per TDD methodology."
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [clojure.java.io :as io]
            [clojure.set :as set]
            [promptbench.pipeline.manifest :as manifest]
            [promptbench.verification.core :as verification]
            [promptbench.verification.checks :as checks])
  (:import [java.io File]
           [java.security MessageDigest]
           [java.nio.file Files Paths]))

;; ============================================================
;; Helpers
;; ============================================================

(defn- sha256-bytes
  ^String [^bytes data]
  (let [md (MessageDigest/getInstance "SHA-256")]
    (.update md data)
    (let [digest (.digest md)]
      (apply str (map #(format "%02x" (bit-and % 0xff)) digest)))))

(defn- sha256-file
  ^String [^String path]
  (let [bytes (Files/readAllBytes (Paths/get path (into-array String [])))]
    (sha256-bytes bytes)))

(defn- sha256-string
  ^String [^String s]
  (sha256-bytes (.getBytes s "UTF-8")))

(def ^:private test-data-dir
  (str (System/getProperty "java.io.tmpdir") "/shibboleth-mv-test-" (System/nanoTime)))

(defn- setup-test-dirs! []
  (doseq [sub ["manifests" "raw" "canonicalized" "split"]]
    (.mkdirs (io/file test-data-dir sub))))

(defn- teardown-test-dirs! []
  (let [dir (io/file test-data-dir)]
    (when (.exists dir)
      (doseq [f (reverse (file-seq dir))]
        (.delete f)))))

;; ============================================================
;; Fixture
;; ============================================================

(use-fixtures :each
  (fn [f]
    (teardown-test-dirs!)
    (setup-test-dirs!)
    (try
      (f)
      (finally
        (teardown-test-dirs!)))))

;; ============================================================
;; VAL-PIPE-006: Build Manifest (Aggregation)
;; ============================================================

(deftest build-manifest-aggregates-all-stages-test
  (testing "Build manifest aggregates all stage manifests into one"
    (let [;; Create stage manifests
          fetch-m (manifest/create-stage-manifest
                    {:stage :fetch :version "0.1.0" :seed 1337
                     :input-hash "hash-a" :output-hash "hash-b"
                     :artifact-count 3 :config-hash "cfg-1"
                     :checksums {"raw/file.jsonl" "aaaa"}})
          canon-m (manifest/create-stage-manifest
                    {:stage :canonicalize :version "0.1.0" :seed 1337
                     :input-hash "hash-b" :output-hash "hash-c"
                     :artifact-count 15 :config-hash "cfg-2"
                     :checksums {"canonicalized/records.edn" "bbbb"}})
          embed-m (manifest/create-stage-manifest
                    {:stage :embed-cluster :version "0.1.0" :seed 1337
                     :input-hash "hash-c" :output-hash "hash-d"
                     :artifact-count 15 :config-hash "cfg-3"
                     :checksums {"embedded/clusters.edn" "cccc"}})
          split-m (manifest/create-stage-manifest
                    {:stage :split :version "0.1.0" :seed 1337
                     :input-hash "hash-d" :output-hash "hash-e"
                     :artifact-count 15 :config-hash "cfg-4"
                     :checksums {"split/assignments.edn" "dddd"}})
          stage-manifests [fetch-m canon-m embed-m split-m]
          build-m (manifest/create-build-manifest
                    {:dataset-name "guardrail-promptbench"
                     :version "0.1.0"
                     :build-seed 1337
                     :stage-manifests stage-manifests
                     :total-prompts 15
                     :total-variants 0})]
      ;; Must have all required keys
      (is (= "guardrail-promptbench" (:dataset-name build-m)))
      (is (= "0.1.0" (:version build-m)))
      (is (= 1337 (:build-seed build-m)))
      (is (string? (:git-commit build-m)))
      (is (map? (:stages build-m)))
      ;; Every stage must be represented
      (is (= :complete (get-in build-m [:stages :fetch :status])))
      (is (= :complete (get-in build-m [:stages :canonicalize :status])))
      (is (= :complete (get-in build-m [:stages :embed-cluster :status])))
      (is (= :complete (get-in build-m [:stages :split :status])))
      ;; Hashes match
      (is (= "hash-b" (get-in build-m [:stages :fetch :hash])))
      (is (= "hash-c" (get-in build-m [:stages :canonicalize :hash])))
      (is (= "hash-d" (get-in build-m [:stages :embed-cluster :hash])))
      (is (= "hash-e" (get-in build-m [:stages :split :hash])))
      ;; Totals
      (is (= 15 (:total-prompts build-m)))
      (is (= 0 (:total-variants build-m))))))

(deftest build-manifest-write-and-read-test
  (testing "Build manifest can be written and read back"
    (let [stage-manifests [(manifest/create-stage-manifest
                             {:stage :fetch :version "0.1.0" :seed 1337
                              :input-hash "a" :output-hash "b"
                              :artifact-count 1 :config-hash "c"
                              :checksums {}})]
          build-m (manifest/create-build-manifest
                    {:dataset-name "test" :version "0.1.0" :build-seed 1337
                     :stage-manifests stage-manifests
                     :total-prompts 1 :total-variants 0})
          path (str test-data-dir "/manifests/build_manifest.edn")]
      (manifest/write-manifest! build-m path)
      (let [loaded (manifest/read-manifest path)]
        (is (= "test" (:dataset-name loaded)))
        (is (= :complete (get-in loaded [:stages :fetch :status])))))))

;; ============================================================
;; VAL-PIPE-006: Checksum Verification
;; ============================================================

(deftest checksums-match-files-on-disk-test
  (testing "verify-checksums passes when checksums match actual files"
    (let [;; Write a test file
          file-path (str test-data-dir "/raw/test-file.txt")
          _ (spit file-path "hello world")
          actual-hash (sha256-file file-path)
          stage-manifest {:stage :fetch :checksums {"raw/test-file.txt" actual-hash}}
          result (manifest/verify-checksums stage-manifest test-data-dir)]
      (is (:passed result))
      (is (empty? (:mismatches result))))))

(deftest checksums-detect-mismatch-test
  (testing "verify-checksums detects when checksum doesn't match"
    (let [file-path (str test-data-dir "/raw/test-file.txt")
          _ (spit file-path "hello world")
          wrong-hash "0000000000000000000000000000000000000000000000000000000000000000"
          stage-manifest {:stage :fetch :checksums {"raw/test-file.txt" wrong-hash}}
          result (manifest/verify-checksums stage-manifest test-data-dir)]
      (is (not (:passed result)))
      (is (pos? (count (:mismatches result)))))))

(deftest checksums-detect-missing-file-test
  (testing "verify-checksums detects missing files"
    (let [stage-manifest {:stage :fetch :checksums {"raw/nonexistent.txt" "aaa"}}
          result (manifest/verify-checksums stage-manifest test-data-dir)]
      (is (not (:passed result)))
      (is (pos? (count (:mismatches result)))))))

;; ============================================================
;; VAL-PIPE-006: Config Hash Sensitivity
;; ============================================================

(deftest config-hash-changes-when-config-changes-test
  (testing "Config hash changes when config changes"
    (let [m1 (manifest/create-stage-manifest
               {:stage :fetch :version "0.1.0" :seed 1337
                :input-hash "a" :output-hash "b"
                :artifact-count 1
                :config-hash (sha256-string (pr-str {:seed 1337 :version "0.1.0"}))
                :checksums {}})
          m2 (manifest/create-stage-manifest
               {:stage :fetch :version "0.1.0" :seed 42
                :input-hash "a" :output-hash "b"
                :artifact-count 1
                :config-hash (sha256-string (pr-str {:seed 42 :version "0.1.0"}))
                :checksums {}})]
      (is (not= (:config-hash m1) (:config-hash m2))
          "Different config should produce different config-hash"))))

;; ============================================================
;; VAL-PIPE-008: cluster-disjoint-splits check
;; ============================================================

(deftest cluster-disjoint-splits-passes-valid-data-test
  (testing "cluster-disjoint-splits passes on correctly split data"
    (let [records [{:source-id "s1" :cluster-id 0 :split :train}
                   {:source-id "s2" :cluster-id 0 :split :train}
                   {:source-id "s3" :cluster-id 1 :split :dev}
                   {:source-id "s4" :cluster-id 2 :split :test}
                   {:source-id "s5" :cluster-id 2 :split :test}]
          result (checks/cluster-disjoint-splits records)]
      (is (:passed result))
      (is (empty? (:detail result))))))

(deftest cluster-disjoint-splits-fails-leaky-data-test
  (testing "cluster-disjoint-splits fails on leaky data with detail"
    (let [records [{:source-id "s1" :cluster-id 0 :split :train}
                   {:source-id "s2" :cluster-id 0 :split :test}  ;; LEAKED
                   {:source-id "s3" :cluster-id 1 :split :dev}]
          result (checks/cluster-disjoint-splits records)]
      (is (not (:passed result)))
      (is (seq (:detail result)) "Should include detail about the leak"))))

(deftest cluster-disjoint-splits-ignores-noise-test
  (testing "cluster-disjoint-splits ignores noise points (cluster_id=-1)"
    (let [records [{:source-id "s1" :cluster-id -1 :split :train}
                   {:source-id "s2" :cluster-id -1 :split :test}
                   {:source-id "s3" :cluster-id 0 :split :train}
                   {:source-id "s4" :cluster-id 1 :split :dev}]
          result (checks/cluster-disjoint-splits records)]
      (is (:passed result)
          "Noise points in different splits should not count as leaks"))))

;; ============================================================
;; VAL-PIPE-008: variant-split-consistency check
;; ============================================================

(deftest variant-split-consistency-passes-valid-test
  (testing "variant-split-consistency passes when variants match source splits"
    (let [prompts [{:source-id "s1" :split :train}
                   {:source-id "s2" :split :test}]
          variants [{:source-id "s1" :variant-id "v1" :split :train}
                    {:source-id "s2" :variant-id "v2" :split :test}]
          result (checks/variant-split-consistency prompts variants)]
      (is (:passed result))
      (is (empty? (:detail result))))))

(deftest variant-split-consistency-detects-mismatch-test
  (testing "variant-split-consistency detects when variant split doesn't match source"
    (let [prompts [{:source-id "s1" :split :train}
                   {:source-id "s2" :split :test}]
          variants [{:source-id "s1" :variant-id "v1" :split :train}
                    {:source-id "s2" :variant-id "v2" :split :train}]  ;; should be :test
          result (checks/variant-split-consistency prompts variants)]
      (is (not (:passed result)))
      (is (seq (:detail result))))))

;; ============================================================
;; VAL-PIPE-008: duplicate-detection check
;; ============================================================

(deftest duplicate-detection-passes-no-dupes-test
  (testing "duplicate-detection passes when no duplicates within splits"
    (let [records [{:source-id "s1" :canonical-hash "h1" :split :train}
                   {:source-id "s2" :canonical-hash "h2" :split :train}
                   {:source-id "s3" :canonical-hash "h1" :split :test}]  ;; same hash OK across splits
          result (checks/duplicate-detection records)]
      (is (:passed result))
      (is (empty? (:detail result))))))

(deftest duplicate-detection-catches-within-split-duplicates-test
  (testing "duplicate-detection catches duplicates within same split"
    (let [records [{:source-id "s1" :canonical-hash "h1" :split :train}
                   {:source-id "s2" :canonical-hash "h1" :split :train}  ;; DUPLICATE
                   {:source-id "s3" :canonical-hash "h2" :split :test}]
          result (checks/duplicate-detection records)]
      (is (not (:passed result)))
      (is (seq (:detail result))))))

;; ============================================================
;; VAL-PIPE-008: label-distribution-sane check
;; ============================================================

(deftest label-distribution-sane-passes-balanced-test
  (testing "label-distribution-sane passes on balanced data"
    (let [records (into []
                        (for [i (range 10)
                              label [:adversarial :benign]]
                          {:source-id (str "s" i "-" (name label))
                           :intent-label label
                           :split :train}))
          result (checks/label-distribution-sane records)]
      (is (:passed result)))))

(deftest label-distribution-sane-detects-extreme-skew-test
  (testing "label-distribution-sane detects extreme skew"
    (let [;; 99 adversarial, 1 benign => extreme skew
          records (into [{:source-id "benign-1" :intent-label :benign :split :train}]
                        (for [i (range 99)]
                          {:source-id (str "adv-" i) :intent-label :adversarial :split :train}))
          result (checks/label-distribution-sane records)]
      (is (not (:passed result))))))

;; ============================================================
;; VAL-PIPE-008: verify! runs all checks
;; ============================================================

(deftest verify-runs-all-checks-test
  (testing "verify! runs all registered checks and reports results"
    (let [;; Valid data that should pass all checks
          records [{:source-id "s1" :cluster-id 0 :split :train
                    :canonical-hash "h1" :intent-label :adversarial}
                   {:source-id "s2" :cluster-id 0 :split :train
                    :canonical-hash "h2" :intent-label :adversarial}
                   {:source-id "s3" :cluster-id 1 :split :dev
                    :canonical-hash "h3" :intent-label :benign}
                   {:source-id "s4" :cluster-id 2 :split :test
                    :canonical-hash "h4" :intent-label :adversarial}
                   {:source-id "s5" :cluster-id 2 :split :test
                    :canonical-hash "h5" :intent-label :benign}]
          result (verification/verify! {:records records :variants []})]
      (is (map? result))
      (is (boolean? (:passed result)))
      (is (seq (:checks result)) "Should report individual check results")
      ;; All checks should pass for valid data
      (is (:passed result) "All checks should pass for valid data"))))

(deftest verify-reports-individual-check-results-test
  (testing "verify! reports results for each check with :name, :passed, :fatal"
    (let [records [{:source-id "s1" :cluster-id 0 :split :train
                    :canonical-hash "h1" :intent-label :adversarial}
                   {:source-id "s2" :cluster-id 1 :split :dev
                    :canonical-hash "h2" :intent-label :benign}]
          result (verification/verify! {:records records :variants []})
          check-names (set (map :name (:checks result)))]
      ;; All four checks should be present
      (is (contains? check-names :cluster-disjoint-splits))
      (is (contains? check-names :duplicate-detection))
      (is (contains? check-names :label-distribution-sane))
      ;; Each check should have :name, :passed, :fatal
      (doseq [check (:checks result)]
        (is (keyword? (:name check)))
        (is (boolean? (:passed check)))
        (is (boolean? (:fatal check)))))))

;; ============================================================
;; VAL-PIPE-008: Fatal failure prevents build completion
;; ============================================================

(deftest fatal-check-failure-prevents-build-test
  (testing "Fatal check failure causes verify! to throw"
    (let [;; Data with leaked cluster — fatal check fails
          records [{:source-id "s1" :cluster-id 0 :split :train
                    :canonical-hash "h1" :intent-label :adversarial}
                   {:source-id "s2" :cluster-id 0 :split :test  ;; LEAKED
                    :canonical-hash "h2" :intent-label :adversarial}
                   {:source-id "s3" :cluster-id 1 :split :dev
                    :canonical-hash "h3" :intent-label :benign}]]
      (is (thrown-with-msg? clojure.lang.ExceptionInfo
                            #"fatal|Fatal|FATAL"
                            (verification/verify! {:records records :variants []}))))))

(deftest non-fatal-check-produces-warning-not-exception-test
  (testing "Non-fatal check failure produces warning but doesn't throw"
    (let [;; Data with extreme skew — only non-fatal check fails
          records (into [{:source-id "s-benign" :cluster-id 0 :split :train
                          :canonical-hash "h0" :intent-label :benign}]
                        (for [i (range 99)]
                          {:source-id (str "s" i) :cluster-id (inc i) :split :train
                           :canonical-hash (str "hash-" i) :intent-label :adversarial}))
          result (verification/verify! {:records records :variants []})]
      ;; Should NOT throw (non-fatal only)
      (is (map? result))
      ;; But should report the check as failed
      (let [sane-check (first (filter #(= :label-distribution-sane (:name %))
                                      (:checks result)))]
        (is (some? sane-check))
        (is (not (:passed sane-check))
            "label-distribution-sane should fail for extreme skew")))))

;; ============================================================
;; VAL-PIPE-009: Parquet Schema Validation
;; ============================================================

(deftest parquet-schema-has-12-columns-test
  (testing "Parquet schema for prompts has exactly 12 columns"
    (is (= 12 (count (verification/prompt-parquet-columns)))
        "Should define 12 columns for prompts.parquet")))

(deftest parquet-schema-column-names-test
  (testing "Parquet schema has correct column names"
    (let [cols (set (map :name (verification/prompt-parquet-columns)))]
      (is (contains? cols "source_id"))
      (is (contains? cols "canonical_hash"))
      (is (contains? cols "canonical_text"))
      (is (contains? cols "canonical_lang"))
      (is (contains? cols "intent_label"))
      (is (contains? cols "attack_family"))
      (is (contains? cols "harm_category"))
      (is (contains? cols "source_dataset"))
      (is (contains? cols "source_row_id"))
      (is (contains? cols "source_license"))
      (is (contains? cols "cluster_id"))
      (is (contains? cols "split")))))

(deftest parquet-schema-correct-types-test
  (testing "Parquet columns have correct types"
    (let [col-map (into {} (map (juxt :name :type) (verification/prompt-parquet-columns)))]
      ;; String columns
      (doseq [col ["source_id" "canonical_hash" "canonical_text"
                    "canonical_lang" "intent_label" "attack_family"
                    "harm_category" "source_dataset" "source_license" "split"]]
        (is (= :string (get col-map col))
            (str col " should be :string type")))
      ;; Integer columns
      (is (= :integer (get col-map "source_row_id")))
      (is (= :integer (get col-map "cluster_id"))))))

(deftest parquet-schema-required-columns-test
  (testing "Required columns are marked as required (no nulls allowed)"
    (let [required-cols #{"source_id" "canonical_hash" "canonical_text"
                          "canonical_lang" "intent_label" "split"}
          schema (verification/prompt-parquet-columns)
          req-cols (into #{} (comp (filter :required) (map :name)) schema)]
      (doseq [col required-cols]
        (is (contains? req-cols col)
            (str col " should be marked as required"))))))

(deftest validate-parquet-schema-passes-valid-records-test
  (testing "validate-parquet-schema passes for records with all required columns"
    (let [records [{:source-id "s1" :canonical-hash "h1"
                    :canonical-text "hello" :canonical-lang "en"
                    :intent-label "adversarial" :attack-family "persona-injection"
                    :harm-category "identity-manipulation"
                    :source-dataset "test" :source-row-id 0
                    :source-license "gpl-3.0" :cluster-id 1 :split "train"}]
          result (verification/validate-parquet-schema records)]
      (is (:passed result)))))

(deftest validate-parquet-schema-detects-nulls-in-required-test
  (testing "validate-parquet-schema detects null values in required columns"
    (let [records [{:source-id nil :canonical-hash "h1"
                    :canonical-text "hello" :canonical-lang "en"
                    :intent-label "adversarial" :attack-family "persona-injection"
                    :harm-category "identity-manipulation"
                    :source-dataset "test" :source-row-id 0
                    :source-license "gpl-3.0" :cluster-id 1 :split "train"}]
          result (verification/validate-parquet-schema records)]
      (is (not (:passed result)))
      (is (seq (:nulls result))))))

(deftest validate-parquet-schema-detects-wrong-column-count-test
  (testing "validate-parquet-schema detects incorrect number of columns"
    (let [records [{:source-id "s1" :canonical-hash "h1"}]  ;; only 2 columns
          result (verification/validate-parquet-schema records)]
      (is (not (:passed result))))))
