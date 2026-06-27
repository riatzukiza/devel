(ns promptbench.curated-taxonomy-test
  "Tests for curated taxonomy definitions and source registrations.

   Fulfills: VAL-CORPUS-001 (curated source definition and loading),
             VAL-CORPUS-002 (novel attack families defined).

   Verifies:
   - persona-injection registered with all fields populated
   - authority-impersonation and developer-mode registered
   - All three appear in (taxonomy/descendants :jailbreak)
   - curated-persona-injections source defined with valid :path
   - JSONL files parse correctly
   - Taxonomy mappings resolve to registered families"
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [clojure.java.io :as io]
            [cheshire.core :as json]
            [promptbench.taxonomy.registry :as registry]
            [promptbench.taxonomy.families :as families]
            [promptbench.taxonomy.categories :as categories]
            [promptbench.pipeline.sources :as sources]
            [promptbench.corpus.curated :as curated]))

;; ============================================================
;; Fixture: Reset registries, then load curated taxonomy
;; ============================================================

(use-fixtures :each
  (fn [f]
    (registry/reset!)
    (sources/reset!)
    (curated/register-all!)
    (f)))

;; ============================================================
;; VAL-CORPUS-002: Novel attack families defined
;; ============================================================

(deftest persona-injection-registered-with-all-fields-test
  (testing "persona-injection is registered with all required fields populated"
    (let [family (registry/get-family :persona-injection)]
      (is (some? family) "persona-injection should be registered")
      ;; Required fields
      (is (string? (:description family)) "Should have :description")
      (is (= :jailbreak (:category family)) "Category should be :jailbreak")
      (is (= :high (:severity family)) "Severity should be :high")
      (is (= :identity-manipulation (:parent family)) "Parent should be :identity-manipulation")
      ;; Tags as set
      (is (set? (:tags family)) "Tags should be a set")
      (is (not (empty? (:tags family))) "Tags should not be empty")
      ;; Signatures
      (is (vector? (:signatures family)) "Signatures should be a vector")
      (is (>= (count (:signatures family)) 3) "Should have at least 3 signatures")
      ;; Check specific signature patterns
      (let [sig-patterns (set (map :pattern (:signatures family)))]
        (is (contains? sig-patterns :nested-system-prompt)
            "Should have nested-system-prompt signature")
        (is (contains? sig-patterns :identity-override)
            "Should have identity-override signature")
        (is (contains? sig-patterns :safety-reframe)
            "Should have safety-reframe signature"))
      ;; Transforms with MT :high and code-mix :high
      (is (map? (:transforms family)) "Transforms should be a map")
      (is (= :high (get-in family [:transforms :mt :affinity]))
          "MT affinity should be :high")
      (is (= :high (get-in family [:transforms :code-mix :affinity]))
          "code-mix affinity should be :high")
      ;; Gen-hints
      (is (map? (:gen-hints family)) "Gen-hints should be a map")
      (is (not (empty? (:gen-hints family))) "Gen-hints should not be empty"))))

(deftest authority-impersonation-registered-test
  (testing "authority-impersonation is registered with required fields"
    (let [family (registry/get-family :authority-impersonation)]
      (is (some? family) "authority-impersonation should be registered")
      (is (string? (:description family)))
      (is (= :jailbreak (:category family)))
      (is (keyword? (:severity family)))
      (is (= :identity-manipulation (:parent family)))
      (is (set? (:tags family)))
      (is (not (empty? (:tags family))))
      (is (map? (:transforms family))))))

(deftest developer-mode-registered-test
  (testing "developer-mode is registered with required fields"
    (let [family (registry/get-family :developer-mode)]
      (is (some? family) "developer-mode should be registered")
      (is (string? (:description family)))
      (is (= :jailbreak (:category family)))
      (is (keyword? (:severity family)))
      (is (= :identity-manipulation (:parent family)))
      (is (set? (:tags family)))
      (is (not (empty? (:tags family))))
      (is (map? (:transforms family))))))

(deftest all-three-families-are-jailbreak-descendants-test
  (testing "All three families appear in (taxonomy/descendants :jailbreak)"
    (let [descendants (registry/descendants :jailbreak)]
      (is (contains? descendants :persona-injection)
          "persona-injection should be a descendant of :jailbreak")
      (is (contains? descendants :authority-impersonation)
          "authority-impersonation should be a descendant of :jailbreak")
      (is (contains? descendants :developer-mode)
          "developer-mode should be a descendant of :jailbreak"))))

(deftest all-three-families-are-identity-manipulation-descendants-test
  (testing "All three families appear in (taxonomy/descendants :identity-manipulation)"
    (let [descendants (registry/descendants :identity-manipulation)]
      (is (contains? descendants :persona-injection))
      (is (contains? descendants :authority-impersonation))
      (is (contains? descendants :developer-mode)))))

(deftest hierarchy-categories-registered-test
  (testing "Required categories in hierarchy are registered"
    (is (some? (registry/get-category :adversarial)))
    (is (some? (registry/get-category :jailbreak)))
    (is (some? (registry/get-category :identity-manipulation)))))

;; ============================================================
;; VAL-CORPUS-001: Curated source definition and loading
;; ============================================================

(deftest curated-persona-injections-source-defined-test
  (testing "curated-persona-injections source has all required keys"
    (let [src (sources/get-source :curated-persona-injections)]
      (is (some? src) "Source should be registered")
      (is (string? (:description src)))
      (is (string? (:version src)))
      (is (= :gpl-3.0 (:license src)))
      (is (= :jsonl (:format src)))
      (is (nil? (:url src)) ":url should be nil for local source")
      (is (string? (:path src)) ":path should be a string")
      (is (.contains ^String (:path src) "data/curated/persona-injections")
          "Path should point to persona-injections directory"))))

(deftest curated-authority-escalation-source-defined-test
  (testing "curated-authority-escalation source is defined"
    (let [src (sources/get-source :curated-authority-escalation)]
      (is (some? src) "Source should be registered")
      (is (= :jsonl (:format src)))
      (is (= :gpl-3.0 (:license src))))))

(deftest curated-developer-mode-source-defined-test
  (testing "curated-developer-mode source is defined"
    (let [src (sources/get-source :curated-developer-mode)]
      (is (some? src) "Source should be registered")
      (is (= :jsonl (:format src)))
      (is (= :gpl-3.0 (:license src))))))

;; ============================================================
;; JSONL file parsing tests
;; ============================================================

(deftest persona-injection-jsonl-exists-and-parses-test
  (testing "Persona injection JSONL file exists and parses correctly"
    (let [src (sources/get-source :curated-persona-injections)
          path (:path src)
          file (io/file path)]
      (is (.exists file) (str "JSONL file should exist at " path))
      (when (.exists file)
        (let [lines (with-open [rdr (io/reader file)]
                      (into []
                            (comp (map clojure.string/trim)
                                  (remove clojure.string/blank?)
                                  (map #(json/parse-string % true)))
                            (line-seq rdr)))]
          (is (>= (count lines) 5)
              "Should have at least 5 persona injection examples")
          ;; Each line should have required schema fields
          (doseq [line lines]
            (is (string? (:prompt line))
                (str "Each entry should have :prompt string, got: " (pr-str line)))
            (is (string? (:language line))
                (str "Each entry should have :language string, got: " (pr-str line)))
            (is (string? (:family line))
                (str "Each entry should have :family string, got: " (pr-str line)))
            (is (string? (:harm_category line))
                (str "Each entry should have :harm_category string, got: " (pr-str line)))))))))

(deftest authority-escalation-jsonl-exists-and-parses-test
  (testing "Authority escalation JSONL file exists and parses correctly"
    (let [src (sources/get-source :curated-authority-escalation)
          path (:path src)
          file (io/file path)]
      (is (.exists file) (str "JSONL file should exist at " path))
      (when (.exists file)
        (let [lines (with-open [rdr (io/reader file)]
                      (into []
                            (comp (map clojure.string/trim)
                                  (remove clojure.string/blank?)
                                  (map #(json/parse-string % true)))
                            (line-seq rdr)))]
          (is (>= (count lines) 3)
              "Should have at least 3 authority escalation examples")
          (doseq [line lines]
            (is (string? (:prompt line)))
            (is (= "authority-impersonation" (:family line)))))))))

(deftest developer-mode-jsonl-exists-and-parses-test
  (testing "Developer mode JSONL file exists and parses correctly"
    (let [src (sources/get-source :curated-developer-mode)
          path (:path src)
          file (io/file path)]
      (is (.exists file) (str "JSONL file should exist at " path))
      (when (.exists file)
        (let [lines (with-open [rdr (io/reader file)]
                      (into []
                            (comp (map clojure.string/trim)
                                  (remove clojure.string/blank?)
                                  (map #(json/parse-string % true)))
                            (line-seq rdr)))]
          (is (>= (count lines) 3)
              "Should have at least 3 developer mode examples")
          (doseq [line lines]
            (is (string? (:prompt line)))
            (is (= "developer-mode" (:family line)))))))))

;; ============================================================
;; Taxonomy mapping resolution tests
;; ============================================================

(deftest taxonomy-mapping-resolves-persona-injection-test
  (testing "Taxonomy mapping for curated-persona-injections resolves correctly"
    (let [src (sources/get-source :curated-persona-injections)
          mapping (:taxonomy-mapping src)]
      (is (some? mapping) "Should have taxonomy-mapping")
      ;; The family mapping should resolve persona-injection
      (let [family-mapping (get mapping :family)]
        (is (some? family-mapping) "Should have :family in taxonomy-mapping")
        (is (= :persona-injection (get family-mapping "persona-injection"))
            "Should map 'persona-injection' to :persona-injection keyword")))))

(deftest taxonomy-mapping-resolves-authority-impersonation-test
  (testing "Taxonomy mapping for authority-escalation resolves correctly"
    (let [src (sources/get-source :curated-authority-escalation)
          mapping (:taxonomy-mapping src)]
      (is (some? mapping))
      (let [family-mapping (get mapping :family)]
        (is (= :authority-impersonation (get family-mapping "authority-impersonation")))))))

(deftest taxonomy-mapping-resolves-developer-mode-test
  (testing "Taxonomy mapping for developer-mode resolves correctly"
    (let [src (sources/get-source :curated-developer-mode)
          mapping (:taxonomy-mapping src)]
      (is (some? mapping))
      (let [family-mapping (get mapping :family)]
        (is (= :developer-mode (get family-mapping "developer-mode")))))))

;; ============================================================
;; Registry query tests for novel families
;; ============================================================

(deftest all-families-includes-curated-test
  (testing "all-families returns the three curated families"
    (let [all (registry/all-families)]
      (is (contains? all :persona-injection))
      (is (contains? all :authority-impersonation))
      (is (contains? all :developer-mode)))))

(deftest families-with-tag-finds-curated-test
  (testing "families-with-tag returns curated families for relevant tags"
    (let [persona-families (registry/families-with-tag :persona)]
      (is (contains? persona-families :persona-injection)
          "persona-injection should have :persona tag"))
    (let [authority-families (registry/families-with-tag :authority)]
      (is (contains? authority-families :authority-impersonation)
          "authority-impersonation should have :authority tag"))
    (let [dev-families (registry/families-with-tag :developer)]
      (is (contains? dev-families :developer-mode)
          "developer-mode should have :developer tag"))))
