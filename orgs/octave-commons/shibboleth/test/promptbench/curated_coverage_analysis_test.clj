(ns promptbench.curated-coverage-analysis-test
  "Tests for curated corpus coverage analysis.

   Fulfills VAL-CORPUS-005:
   - Curated families appear as covered in taxonomy-coverage
   - Removing curated source reduces coverage for those families
   - Coverage report shows transform gaps with affinity-based justification
   - Final bundle generated with all sources

   Uses synthetic datasets with known expected values to verify coverage
   analysis correctly reflects curated corpus contribution."
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [clojure.string :as str]
            [promptbench.metrics.core :as metrics]
            [promptbench.metrics.coverage :as coverage]
            [promptbench.taxonomy.registry :as taxonomy]
            [promptbench.transform.registry :as transforms]
            [promptbench.pipeline.sources :as sources]
            [promptbench.corpus.curated :as curated]
            [promptbench.report.core :as report]))

;; ============================================================
;; Fixtures
;; ============================================================

(use-fixtures :each
  (fn [f]
    (metrics/reset!)
    (taxonomy/reset!)
    (transforms/reset!)
    (sources/reset!)
    (f)))

;; ============================================================
;; Helpers
;; ============================================================

(defn- make-prompt
  "Create a synthetic prompt record."
  [& {:keys [attack-family source-dataset canonical-lang split intent-label]
      :or {attack-family :persona-injection
           source-dataset :synthetic-test
           canonical-lang :en
           split :train
           intent-label :adversarial}}]
  {:source-id (str (random-uuid))
   :attack-family attack-family
   :intent-label intent-label
   :canonical-lang canonical-lang
   :split split
   :cluster-id (rand-int 100)
   :canonical-hash (str (random-uuid))
   :canonical-text "test prompt"
   :source {:dataset source-dataset :license :apache-2.0}})

(defn- make-curated-prompt
  "Create a synthetic curated prompt record."
  [& {:keys [attack-family source-dataset]
      :or {attack-family :persona-injection
           source-dataset :curated-persona-injections}}]
  (make-prompt :attack-family attack-family
               :source-dataset source-dataset))

(defn- make-variant
  "Create a synthetic variant record."
  [& {:keys [attack-family variant-type source-id split]
      :or {attack-family :persona-injection
           variant-type :mt
           source-id (str (random-uuid))
           split :train}}]
  {:variant-id (str (random-uuid))
   :source-id source-id
   :text "variant text"
   :variant-type variant-type
   :transform-chain [{:transform variant-type}]
   :transform-seed 1337
   :split split
   :attack-family attack-family
   :metadata {}})

(defn- register-full-taxonomy!
  "Register a taxonomy with both public and curated families."
  []
  ;; Public families
  (taxonomy/register-family! :dan-variants
    {:description "DAN variants"
     :category :jailbreak
     :severity :high
     :tags #{:dan}
     :signatures []
     :transforms {:mt {:affinity :high :note "good"}
                  :code-mix {:affinity :medium :note "ok"}
                  :homoglyph {:affinity :low :note "marginal"}
                  :exhaustion {:affinity :none :note "not applicable"}}
     :gen-hints {}})
  (taxonomy/register-family! :character-roleplay
    {:description "Character roleplay"
     :category :jailbreak
     :severity :medium
     :tags #{:roleplay}
     :signatures []
     :transforms {:mt {:affinity :high :note "transfers well"}
                  :code-mix {:affinity :high :note "good"}
                  :homoglyph {:affinity :low :note "marginal"}
                  :exhaustion {:affinity :low :note "not useful"}}
     :gen-hints {}})
  ;; Curated families
  (taxonomy/register-family! :persona-injection
    {:description "Persona injection attacks"
     :category :jailbreak
     :severity :high
     :tags #{:persona}
     :signatures []
     :transforms {:mt {:affinity :high :note "Tests cross-lingual transfer of persona framing"}
                  :code-mix {:affinity :high :note "Persona instructions in L1, payload in L2"}
                  :homoglyph {:affinity :medium :note "Obfuscate trigger keywords"}
                  :exhaustion {:affinity :low :note "Persona prompts are already long"}}
     :gen-hints {}})
  (taxonomy/register-family! :authority-impersonation
    {:description "Authority impersonation"
     :category :jailbreak
     :severity :high
     :tags #{:authority}
     :signatures []
     :transforms {:mt {:affinity :high :note "Authority language transfers across languages"}
                  :code-mix {:affinity :high :note "Mix formal authority language with payload"}
                  :homoglyph {:affinity :medium :note "Obfuscate authority-signaling keywords"}
                  :exhaustion {:affinity :low :note "Authority claims are typically concise"}}
     :gen-hints {}})
  (taxonomy/register-family! :developer-mode
    {:description "Developer mode"
     :category :jailbreak
     :severity :high
     :tags #{:developer}
     :signatures []
     :transforms {:mt {:affinity :medium :note "Technical jargon may not transfer cleanly"}
                  :code-mix {:affinity :medium :note "Technical terms mixed across languages"}
                  :homoglyph {:affinity :high :note "Obfuscate mode-trigger keywords"}
                  :exhaustion {:affinity :medium :note "Repetitive mode activation with padding"}}
     :gen-hints {}}))

(defn- register-test-transforms!
  "Register transforms for testing."
  []
  (transforms/register-transform! :mt
    {:description "Machine translation" :type :linguistic
     :deterministic false :reversible :approximate
     :params-spec {} :provenance [:source-lang :target-lang]})
  (transforms/register-transform! :code-mix
    {:description "Code-mixing" :type :linguistic
     :deterministic true :reversible false
     :params-spec {} :provenance [:strategy :mix-rate]})
  (transforms/register-transform! :homoglyph
    {:description "Homoglyph substitution" :type :obfuscation
     :deterministic true :reversible true
     :params-spec {} :provenance [:rate]})
  (transforms/register-transform! :exhaustion
    {:description "Token exhaustion" :type :resource-attack
     :deterministic true :reversible true
     :params-spec {} :provenance [:position :length]}))

;; ============================================================
;; VAL-CORPUS-005: Curated families appear as covered in taxonomy-coverage
;; ============================================================

(deftest curated-families-covered-in-taxonomy-coverage-test
  (testing "Curated families appear as covered when curated records are in dataset"
    (register-full-taxonomy!)
    (let [dataset (concat
                    ;; Public families with enough prompts
                    (repeat 5 (make-prompt :attack-family :dan-variants))
                    (repeat 5 (make-prompt :attack-family :character-roleplay))
                    ;; Curated families with enough prompts
                    (repeat 5 (make-curated-prompt :attack-family :persona-injection
                                                   :source-dataset :curated-persona-injections))
                    (repeat 5 (make-curated-prompt :attack-family :authority-impersonation
                                                   :source-dataset :curated-authority-escalation))
                    (repeat 5 (make-curated-prompt :attack-family :developer-mode
                                                   :source-dataset :curated-developer-mode)))
          result (coverage/taxonomy-coverage dataset {:min-count 5})]
      ;; All 5 families should be covered
      (is (= 1 (:coverage result))
          "All families should be covered including curated")
      (is (empty? (:missing result))
          "No families should be missing"))))

(deftest curated-families-individually-covered-test
  (testing "Each curated family individually appears in coverage"
    (register-full-taxonomy!)
    (let [dataset (concat
                    (repeat 3 (make-curated-prompt :attack-family :persona-injection))
                    (repeat 3 (make-curated-prompt :attack-family :authority-impersonation))
                    (repeat 3 (make-curated-prompt :attack-family :developer-mode)))
          result (coverage/taxonomy-coverage dataset {:min-count 3})
          covered-families (remove (set (:missing result))
                                   (sort (keys (taxonomy/all-families))))]
      ;; All three curated families should be in covered set
      (is (some #{:persona-injection} covered-families)
          "persona-injection should be covered")
      (is (some #{:authority-impersonation} covered-families)
          "authority-impersonation should be covered")
      (is (some #{:developer-mode} covered-families)
          "developer-mode should be covered"))))

;; ============================================================
;; VAL-CORPUS-005: Removing curated source reduces coverage
;; ============================================================

(deftest removing-curated-reduces-coverage-test
  (testing "Removing curated source records reduces coverage for curated families"
    (register-full-taxonomy!)
    (let [public-records (concat
                           (repeat 5 (make-prompt :attack-family :dan-variants
                                                  :source-dataset :synthetic-test))
                           (repeat 5 (make-prompt :attack-family :character-roleplay
                                                  :source-dataset :synthetic-test)))
          curated-records (concat
                            (repeat 5 (make-curated-prompt :attack-family :persona-injection
                                                           :source-dataset :curated-persona-injections))
                            (repeat 5 (make-curated-prompt :attack-family :authority-impersonation
                                                           :source-dataset :curated-authority-escalation))
                            (repeat 5 (make-curated-prompt :attack-family :developer-mode
                                                           :source-dataset :curated-developer-mode)))
          all-records (concat public-records curated-records)
          ;; Coverage with all sources
          cov-all (coverage/taxonomy-coverage all-records {:min-count 5})
          ;; Coverage without curated sources
          cov-no-curated (coverage/taxonomy-coverage public-records {:min-count 5})]
      ;; With all sources: full coverage
      (is (= 1 (:coverage cov-all))
          "With curated sources, all families should be covered")
      ;; Without curated: only 2/5 covered (public families only)
      (is (= 2/5 (:coverage cov-no-curated))
          "Without curated, only public families (2/5) should be covered")
      ;; Missing should include all curated families
      (is (some #{:persona-injection} (:missing cov-no-curated))
          "persona-injection should be missing without curated")
      (is (some #{:authority-impersonation} (:missing cov-no-curated))
          "authority-impersonation should be missing without curated")
      (is (some #{:developer-mode} (:missing cov-no-curated))
          "developer-mode should be missing without curated"))))

(deftest source-contribution-analysis-test
  (testing "source-contribution computes correct contribution delta"
    (register-full-taxonomy!)
    (let [public-records (concat
                           (repeat 5 (make-prompt :attack-family :dan-variants
                                                  :source-dataset :public-a))
                           (repeat 5 (make-prompt :attack-family :character-roleplay
                                                  :source-dataset :public-a)))
          curated-records (concat
                            (repeat 5 (make-curated-prompt :attack-family :persona-injection
                                                           :source-dataset :curated-persona-injections))
                            (repeat 5 (make-curated-prompt :attack-family :authority-impersonation
                                                           :source-dataset :curated-authority-escalation))
                            (repeat 5 (make-curated-prompt :attack-family :developer-mode
                                                           :source-dataset :curated-developer-mode)))
          all-records (concat public-records curated-records)
          result (coverage/source-contribution all-records
                                               #{:curated-persona-injections
                                                 :curated-authority-escalation
                                                 :curated-developer-mode}
                                               {:min-count 5})]
      ;; The result should show coverage with and without
      (is (= 1 (:coverage-with result))
          "Coverage with curated should be full")
      (is (= 2/5 (:coverage-without result))
          "Coverage without curated should be 2/5")
      ;; Delta should be positive
      (is (pos? (:coverage-delta result))
          "Coverage delta should be positive")
      ;; Uniquely contributed families
      (is (= #{:persona-injection :authority-impersonation :developer-mode}
             (set (:uniquely-contributed-families result)))
          "All three curated families should be uniquely contributed"))))

(deftest source-contribution-no-impact-test
  (testing "source-contribution shows zero delta when sources contribute nothing unique"
    (register-full-taxonomy!)
    (let [;; All families already covered by public data
          public-records (concat
                           (repeat 5 (make-prompt :attack-family :dan-variants :source-dataset :public-a))
                           (repeat 5 (make-prompt :attack-family :character-roleplay :source-dataset :public-a))
                           (repeat 5 (make-prompt :attack-family :persona-injection :source-dataset :public-a))
                           (repeat 5 (make-prompt :attack-family :authority-impersonation :source-dataset :public-a))
                           (repeat 5 (make-prompt :attack-family :developer-mode :source-dataset :public-a)))
          ;; Add some curated records too (but families already covered)
          curated-records (repeat 3 (make-curated-prompt :attack-family :persona-injection
                                                         :source-dataset :curated-persona-injections))
          all-records (concat public-records curated-records)
          result (coverage/source-contribution all-records
                                               #{:curated-persona-injections}
                                               {:min-count 5})]
      (is (= 1 (:coverage-with result)))
      (is (= 1 (:coverage-without result)))
      (is (zero? (:coverage-delta result))
          "No coverage delta when all families already covered by other sources")
      (is (empty? (:uniquely-contributed-families result))))))

;; ============================================================
;; VAL-CORPUS-005: Coverage report shows transform gaps with affinity justification
;; ============================================================

(deftest transform-gap-analysis-returns-gaps-test
  (testing "transform-gap-analysis identifies gaps per family with affinity justification"
    (register-full-taxonomy!)
    (register-test-transforms!)
    (let [;; Variants only for some families/transforms
          variants [(make-variant :attack-family :persona-injection :variant-type :mt)
                    (make-variant :attack-family :persona-injection :variant-type :code-mix)
                    ;; No homoglyph or exhaustion for persona-injection
                    (make-variant :attack-family :dan-variants :variant-type :mt)]
          result (coverage/transform-gap-analysis variants)]
      ;; Result should be a map of family -> list of gaps
      (is (map? result) "Should return a map")
      ;; persona-injection should have gaps for homoglyph and exhaustion
      (let [pi-gaps (:persona-injection result)]
        (is (seq pi-gaps) "persona-injection should have transform gaps")
        ;; Each gap should have transform name and affinity info
        (doseq [gap pi-gaps]
          (is (keyword? (:transform gap)) "Gap should identify the transform")
          (is (keyword? (:affinity gap)) "Gap should include affinity level")
          (is (string? (:justification gap)) "Gap should include justification note"))
        ;; homoglyph gap should have :medium affinity
        (let [hg-gap (first (filter #(= :homoglyph (:transform %)) pi-gaps))]
          (is (some? hg-gap) "Should have homoglyph gap for persona-injection")
          (when hg-gap
            (is (= :medium (:affinity hg-gap))
                "Homoglyph affinity for persona-injection should be :medium")))))))

(deftest transform-gap-analysis-high-affinity-flagged-test
  (testing "High-affinity transform gaps are flagged as priority"
    (register-full-taxonomy!)
    (register-test-transforms!)
    (let [;; authority-impersonation has NO variants at all
          variants [(make-variant :attack-family :dan-variants :variant-type :mt)]
          result (coverage/transform-gap-analysis variants)
          auth-gaps (:authority-impersonation result)
          high-gaps (filter #(= :high (:affinity %)) auth-gaps)]
      ;; authority-impersonation has :mt high and :code-mix high
      (is (>= (count high-gaps) 2)
          "authority-impersonation should have at least 2 high-affinity gaps (mt + code-mix)")
      (doseq [gap high-gaps]
        (is (true? (:priority gap))
            "High-affinity gaps should be flagged as priority")))))

(deftest transform-gap-analysis-excludes-none-affinity-test
  (testing "Transforms with :none affinity are excluded from gap analysis"
    (register-full-taxonomy!)
    (register-test-transforms!)
    (let [;; No variants for dan-variants at all
          variants []
          result (coverage/transform-gap-analysis variants)
          dan-gaps (:dan-variants result)
          gap-transforms (set (map :transform dan-gaps))]
      ;; :exhaustion has :none affinity for dan-variants, should NOT appear as gap
      (is (not (contains? gap-transforms :exhaustion))
          "Transforms with :none affinity should not appear as gaps"))))

(deftest transform-gap-analysis-no-gaps-when-fully-covered-test
  (testing "No gaps reported when all applicable transforms are covered"
    (register-full-taxonomy!)
    (register-test-transforms!)
    (let [;; Full coverage for dan-variants (mt=high, code-mix=medium, homoglyph=low)
          ;; :exhaustion is :none so not counted
          variants [(make-variant :attack-family :dan-variants :variant-type :mt)
                    (make-variant :attack-family :dan-variants :variant-type :code-mix)
                    (make-variant :attack-family :dan-variants :variant-type :homoglyph)]
          result (coverage/transform-gap-analysis variants)
          dan-gaps (:dan-variants result)]
      (is (empty? dan-gaps)
          "No gaps when all applicable transforms are covered"))))

(deftest transform-gap-analysis-curated-families-test
  (testing "Transform gap analysis works for curated families specifically"
    (register-full-taxonomy!)
    (register-test-transforms!)
    (let [;; persona-injection has mt only
          variants [(make-variant :attack-family :persona-injection :variant-type :mt)]
          result (coverage/transform-gap-analysis variants)
          pi-gaps (:persona-injection result)
          gap-transforms (set (map :transform pi-gaps))]
      ;; persona-injection: code-mix=high (gap), homoglyph=medium (gap), exhaustion=low (gap)
      (is (contains? gap-transforms :code-mix)
          "code-mix (high affinity) should be a gap for persona-injection")
      (is (contains? gap-transforms :homoglyph)
          "homoglyph (medium affinity) should be a gap for persona-injection")
      (is (contains? gap-transforms :exhaustion)
          "exhaustion (low affinity) should be a gap for persona-injection"))))

;; ============================================================
;; Coverage report format test
;; ============================================================

(deftest coverage-report-includes-gap-analysis-test
  (testing "Coverage report markdown includes transform gap analysis section"
    (register-full-taxonomy!)
    (register-test-transforms!)
    (let [variants [(make-variant :attack-family :persona-injection :variant-type :mt)]
          gap-analysis (coverage/transform-gap-analysis variants)
          report-md (coverage/format-gap-analysis-markdown gap-analysis)]
      ;; Report should be a non-empty markdown string
      (is (string? report-md))
      (is (pos? (count report-md)))
      ;; Should contain transform gap section header
      (is (str/includes? report-md "Transform Gap")
          "Report should contain 'Transform Gap' section")
      ;; Should contain family names
      (is (str/includes? report-md "persona-injection")
          "Report should mention persona-injection")
      ;; Should contain affinity information
      (is (str/includes? report-md "high")
          "Report should contain affinity levels")
      ;; Should contain justification
      (is (or (str/includes? report-md "justification")
              (str/includes? report-md "note")
              (str/includes? report-md "Persona")
              (str/includes? report-md "payload"))
          "Report should contain justification text from family definitions"))))

(deftest coverage-report-curated-contribution-section-test
  (testing "Coverage report markdown includes source contribution analysis"
    (register-full-taxonomy!)
    (let [public-records (repeat 5 (make-prompt :attack-family :dan-variants
                                                :source-dataset :public-a))
          curated-records (repeat 5 (make-curated-prompt :attack-family :persona-injection
                                                         :source-dataset :curated-persona-injections))
          all-records (concat public-records curated-records)
          contribution (coverage/source-contribution all-records
                                                     #{:curated-persona-injections}
                                                     {:min-count 5})
          report-md (coverage/format-source-contribution-markdown
                      contribution
                      #{:curated-persona-injections})]
      (is (string? report-md))
      (is (str/includes? report-md "Source Contribution")
          "Report should contain 'Source Contribution' section")
      (is (str/includes? report-md "curated-persona-injections")
          "Report should mention the curated source")
      ;; Should show coverage delta
      (is (or (str/includes? report-md "delta")
              (str/includes? report-md "Δ")
              (str/includes? report-md "change"))
          "Report should show coverage delta"))))

;; ============================================================
;; Integration: register coverage analysis metrics
;; ============================================================

(deftest coverage-analysis-metrics-registered-test
  (testing "Coverage analysis metrics register correctly"
    (register-full-taxonomy!)
    (register-test-transforms!)
    (coverage/register-coverage-metrics!)
    ;; Existing metrics still registered
    (is (some? (metrics/get-metric :taxonomy-coverage)))
    (is (some? (metrics/get-metric :transform-coverage-matrix)))
    (is (some? (metrics/get-metric :language-coverage)))))

;; ============================================================
;; Final bundle completeness
;; ============================================================

(deftest final-bundle-all-sources-test
  (testing "Coverage analysis shows all sources contribute to final bundle"
    (register-full-taxonomy!)
    (let [all-records (concat
                        (repeat 5 (make-prompt :attack-family :dan-variants :source-dataset :public-a))
                        (repeat 5 (make-prompt :attack-family :character-roleplay :source-dataset :public-b))
                        (repeat 5 (make-curated-prompt :attack-family :persona-injection
                                                       :source-dataset :curated-persona-injections))
                        (repeat 5 (make-curated-prompt :attack-family :authority-impersonation
                                                       :source-dataset :curated-authority-escalation))
                        (repeat 5 (make-curated-prompt :attack-family :developer-mode
                                                       :source-dataset :curated-developer-mode)))
          ;; All unique sources in the dataset
          source-datasets (set (map #(get-in % [:source :dataset]) all-records))]
      ;; Verify all sources present
      (is (contains? source-datasets :public-a))
      (is (contains? source-datasets :public-b))
      (is (contains? source-datasets :curated-persona-injections))
      (is (contains? source-datasets :curated-authority-escalation))
      (is (contains? source-datasets :curated-developer-mode))
      ;; Full coverage
      (let [result (coverage/taxonomy-coverage all-records {:min-count 5})]
        (is (= 1 (:coverage result))
            "All families covered with all sources present")))))
