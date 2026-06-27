(ns promptbench.source-test
  "Tests for def-source macro and source registry.

   Fulfills: VAL-DSL-007 (def-source registration and validation).

   Tests written FIRST per TDD methodology."
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [promptbench.pipeline.sources :as sources]
            [promptbench.taxonomy.registry :as taxonomy-registry]))

;; ============================================================
;; Fixture: Reset registries between tests for isolation
;; ============================================================

(use-fixtures :each
  (fn [f]
    (taxonomy-registry/reset!)
    (sources/reset!)
    (f)))

;; ============================================================
;; VAL-DSL-007: def-source registration and validation
;; ============================================================

;; --- Basic registration ---

(deftest def-source-registers-url-based-test
  (testing "def-source registers a URL-based source"
    (sources/def-source aya-redteaming
      {:description "Aya Red Team dataset — multilingual adversarial prompts"
       :url         "https://huggingface.co/datasets/CohereForAI/aya_redteaming"
       :version     "1.0.0"
       :license     :apache-2.0
       :format      :parquet})
    (is (some? (sources/get-source :aya-redteaming))
        "Source should be retrievable from registry")))

(deftest def-source-registers-path-based-test
  (testing "def-source registers a path-based source (local)"
    (sources/def-source curated-persona-injections
      {:description "Hand-curated persona injection attacks"
       :path        "data/curated/persona-injections/"
       :version     "0.1.0"
       :license     :gpl-3.0
       :format      :jsonl})
    (is (some? (sources/get-source :curated-persona-injections))
        "Path-based source should be retrievable")))

;; --- Field round-trip ---

(deftest def-source-stores-all-fields-test
  (testing "All fields round-trip through registration"
    (sources/def-source full-source
      {:description      "Full source with all fields"
       :url              "https://example.com/data.parquet"
       :version          "2.0.0"
       :license          :mit
       :format           :parquet
       :schema           {:prompt :string :language :string}
       :taxonomy-mapping {:harm_category {"illegal" :illegal-activity
                                          "hate"    :hate-speech}}})
    (let [src (sources/get-source :full-source)]
      (is (= "Full source with all fields" (:description src)))
      (is (= "https://example.com/data.parquet" (:url src)))
      (is (= "2.0.0" (:version src)))
      (is (= :mit (:license src)))
      (is (= :parquet (:format src)))
      (is (= {:prompt :string :language :string} (:schema src)))
      (is (= {:harm_category {"illegal" :illegal-activity
                               "hate"    :hate-speech}}
             (:taxonomy-mapping src))))))

;; --- Required field validation ---

(deftest def-source-missing-description-errors-test
  (testing "Missing :description produces validation error"
    (is (thrown? Exception
          (sources/def-source no-desc
            {:url     "https://example.com/data"
             :version "1.0.0"
             :license :mit
             :format  :parquet})))))

(deftest def-source-missing-version-errors-test
  (testing "Missing :version produces validation error"
    (is (thrown? Exception
          (sources/def-source no-version
            {:description "Missing version"
             :url         "https://example.com/data"
             :license     :mit
             :format      :parquet})))))

(deftest def-source-missing-license-errors-test
  (testing "Missing :license produces validation error"
    (is (thrown? Exception
          (sources/def-source no-license
            {:description "Missing license"
             :url         "https://example.com/data"
             :version     "1.0.0"
             :format      :parquet})))))

(deftest def-source-missing-format-errors-test
  (testing "Missing :format produces validation error"
    (is (thrown? Exception
          (sources/def-source no-format
            {:description "Missing format"
             :url         "https://example.com/data"
             :version     "1.0.0"
             :license     :mit})))))

;; --- URL vs Path requirement ---

(deftest def-source-requires-url-or-path-test
  (testing "Source requires either :url or :path"
    (is (thrown? Exception
          (sources/def-source no-url-or-path
            {:description "Missing both url and path"
             :version     "1.0.0"
             :license     :mit
             :format      :csv})))))

(deftest def-source-accepts-url-only-test
  (testing "Source with only :url is valid"
    (sources/def-source url-only
      {:description "URL only"
       :url         "https://example.com/data.csv"
       :version     "1.0.0"
       :license     :mit
       :format      :csv})
    (let [src (sources/get-source :url-only)]
      (is (some? src))
      (is (= "https://example.com/data.csv" (:url src)))
      (is (nil? (:path src))))))

(deftest def-source-accepts-path-only-test
  (testing "Source with only :path is valid"
    (sources/def-source path-only
      {:description "Path only"
       :path        "data/local/dataset.jsonl"
       :version     "1.0.0"
       :license     :gpl-3.0
       :format      :jsonl})
    (let [src (sources/get-source :path-only)]
      (is (some? src))
      (is (= "data/local/dataset.jsonl" (:path src)))
      (is (nil? (:url src))))))

(deftest def-source-accepts-both-url-and-path-test
  (testing "Source with both :url and :path is valid"
    (sources/def-source both-url-path
      {:description "Both URL and path"
       :url         "https://example.com/data"
       :path        "data/cache/data"
       :version     "1.0.0"
       :license     :mit
       :format      :edn})
    (let [src (sources/get-source :both-url-path)]
      (is (some? src))
      (is (some? (:url src)))
      (is (some? (:path src))))))

;; --- License must be keyword ---

(deftest def-source-license-must-be-keyword-test
  (testing ":license must be a keyword"
    (is (thrown? Exception
          (sources/def-source bad-license
            {:description "Bad license type"
             :url         "https://example.com/data"
             :version     "1.0.0"
             :license     "mit"  ;; string, not keyword
             :format      :parquet})))))

;; --- Format validation ---

(deftest def-source-valid-formats-test
  (testing "All valid formats accepted"
    (doseq [[fmt idx] (map vector [:parquet :csv :tsv :jsonl :edn] (range))]
      (sources/reset!)
      (sources/register-source!
        (keyword (str "fmt-test-" idx))
        {:description (str "Format test " fmt)
         :url         "https://example.com/data"
         :version     "1.0.0"
         :license     :mit
         :format      fmt})
      (is (some? (sources/get-source (keyword (str "fmt-test-" idx))))
          (str "Format " fmt " should be accepted")))))

(deftest def-source-invalid-format-errors-test
  (testing "Invalid :format produces validation error"
    (is (thrown? Exception
          (sources/def-source bad-format
            {:description "Bad format"
             :url         "https://example.com/data"
             :version     "1.0.0"
             :license     :mit
             :format      :xml})))))

;; --- Taxonomy mapping validation ---

(deftest def-source-taxonomy-mapping-values-must-be-keywords-test
  (testing "Taxonomy mapping values must be keywords"
    (is (thrown? Exception
          (sources/def-source bad-mapping
            {:description      "Bad taxonomy mapping"
             :url              "https://example.com/data"
             :version          "1.0.0"
             :license          :mit
             :format           :csv
             :taxonomy-mapping {:field {"val1" "not-a-keyword"}}})))))

(deftest def-source-taxonomy-mapping-with-keyword-values-test
  (testing "Taxonomy mapping with keyword values succeeds"
    (sources/def-source good-mapping
      {:description      "Good taxonomy mapping"
       :url              "https://example.com/data"
       :version          "1.0.0"
       :license          :mit
       :format           :csv
       :taxonomy-mapping {:harm_category {"illegal" :illegal-activity
                                          "hate"    :hate-speech}
                          :family        {"persona" :persona-injection}}})
    (let [src (sources/get-source :good-mapping)]
      (is (= :illegal-activity
             (get-in src [:taxonomy-mapping :harm_category "illegal"]))))))

;; --- Duplicate rejection ---

(deftest def-source-duplicate-rejected-test
  (testing "Duplicate source registration produces error"
    (sources/def-source dupe-source
      {:description "First registration"
       :url         "https://example.com/data"
       :version     "1.0.0"
       :license     :mit
       :format      :csv})
    (is (thrown? Exception
          (sources/def-source dupe-source
            {:description "Second registration"
             :url         "https://example.com/data"
             :version     "2.0.0"
             :license     :mit
             :format      :csv})))))

;; --- all-sources query ---

(deftest all-sources-returns-complete-collection-test
  (testing "all-sources returns all registered sources"
    (sources/def-source source-a
      {:description "Source A"
       :url         "https://example.com/a"
       :version     "1.0"
       :license     :mit
       :format      :csv})
    (sources/def-source source-b
      {:description "Source B"
       :path        "data/b"
       :version     "2.0"
       :license     :gpl-3.0
       :format      :jsonl})
    (sources/def-source source-c
      {:description "Source C"
       :url         "https://example.com/c"
       :version     "3.0"
       :license     :apache-2.0
       :format      :parquet})
    (let [all (sources/all-sources)]
      (is (= 3 (count all)))
      (is (contains? all :source-a))
      (is (contains? all :source-b))
      (is (contains? all :source-c)))))

;; --- Multiple sources with different formats coexist ---

(deftest multiple-sources-different-formats-coexist-test
  (testing "Multiple sources with different formats coexist"
    (sources/def-source parquet-src
      {:description "Parquet source"
       :url         "https://example.com/data.parquet"
       :version     "1.0"
       :license     :mit
       :format      :parquet})
    (sources/def-source csv-src
      {:description "CSV source"
       :url         "https://example.com/data.csv"
       :version     "1.0"
       :license     :mit
       :format      :csv})
    (sources/def-source jsonl-src
      {:description "JSONL source"
       :path        "data/local/data.jsonl"
       :version     "1.0"
       :license     :gpl-3.0
       :format      :jsonl})
    (sources/def-source edn-src
      {:description "EDN source"
       :path        "data/local/data.edn"
       :version     "1.0"
       :license     :apache-2.0
       :format      :edn})
    (let [all (sources/all-sources)]
      (is (= 4 (count all)))
      (is (= :parquet (:format (sources/get-source :parquet-src))))
      (is (= :csv (:format (sources/get-source :csv-src))))
      (is (= :jsonl (:format (sources/get-source :jsonl-src))))
      (is (= :edn (:format (sources/get-source :edn-src)))))))

;; --- Reset clears sources ---

(deftest source-reset-clears-all-test
  (testing "reset! clears all sources"
    (sources/def-source temp-source
      {:description "Temporary source"
       :url         "https://example.com/temp"
       :version     "1.0"
       :license     :mit
       :format      :csv})
    (is (= 1 (count (sources/all-sources))))
    (sources/reset!)
    (is (= 0 (count (sources/all-sources))))))

(deftest source-reset-allows-re-registration-test
  (testing "After reset!, previously registered source names can be re-used"
    (sources/def-source reusable
      {:description "First time"
       :url         "https://example.com/data"
       :version     "1.0"
       :license     :mit
       :format      :csv})
    (sources/reset!)
    (sources/def-source reusable
      {:description "Second time after reset"
       :url         "https://example.com/data2"
       :version     "2.0"
       :license     :mit
       :format      :parquet})
    (is (= "Second time after reset"
           (:description (sources/get-source :reusable))))))

;; --- Optional fields schema and taxonomy-mapping ---

(deftest def-source-schema-is-optional-test
  (testing ":schema is optional"
    (sources/def-source no-schema
      {:description "No schema field"
       :url         "https://example.com/data"
       :version     "1.0"
       :license     :mit
       :format      :csv})
    (let [src (sources/get-source :no-schema)]
      (is (some? src))
      (is (nil? (:schema src))))))

(deftest def-source-taxonomy-mapping-is-optional-test
  (testing ":taxonomy-mapping is optional"
    (sources/def-source no-mapping
      {:description "No taxonomy mapping"
       :url         "https://example.com/data"
       :version     "1.0"
       :license     :mit
       :format      :parquet})
    (let [src (sources/get-source :no-mapping)]
      (is (some? src))
      (is (nil? (:taxonomy-mapping src))))))
