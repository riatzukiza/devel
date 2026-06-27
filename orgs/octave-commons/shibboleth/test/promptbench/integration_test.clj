(ns promptbench.integration-test
  "Cross-macro integration tests.

   Fulfills: VAL-DSL-009 (cross-macro composability).

   Tests:
   - Attack families reference existing harm categories as parents
   - Category children must be registered families
   - Source taxonomy-mapping values reference registered categories/families
   - Transform names in family affinities must be registered
   - Full §2 taxonomy loads without error
   - Registry reset clears all registrations (all registries)
   - Referential integrity validation pass"
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [promptbench.taxonomy.registry :as taxonomy]
            [promptbench.taxonomy.families :as families]
            [promptbench.taxonomy.categories :as categories]
            [promptbench.taxonomy.labels :as labels]
            [promptbench.transform.registry :as transform-registry]
            [promptbench.transform.core :as transforms]
            [promptbench.pipeline.sources :as sources]
            [promptbench.validation.integrity :as integrity]))

;; ============================================================
;; Fixture: Reset ALL registries between tests for isolation
;; ============================================================

(use-fixtures :each
  (fn [f]
    (taxonomy/reset!)
    (transform-registry/reset!)
    (sources/reset!)
    (f)))

;; ============================================================
;; Helper: Register the full §2 taxonomy from the spec
;; ============================================================

(defn setup-full-spec-taxonomy!
  "Register the full taxonomy from spec §2, including categories,
   families, intent labels, transforms, and sources. This represents
   the complete DSL surface working together."
  []
  ;; --- Harm Categories (top-down hierarchy) ---
  (categories/def-harm-category :adversarial
    {:description "Root category for all adversarial prompt types"
     :children    [:jailbreak :social-engineering :content-policy-evasion
                   :information-extraction]})

  (categories/def-harm-category :jailbreak
    {:description "Attempts to bypass safety training or alignment"
     :parent      :adversarial
     :children    [:identity-manipulation :instruction-injection
                   :context-manipulation :encoding-attacks]})

  (categories/def-harm-category :identity-manipulation
    {:description "Attempts to alter the model's perceived identity or role"
     :parent      :jailbreak
     :children    [:persona-injection :dan-variants :character-roleplay
                   :authority-impersonation :developer-mode]})

  (categories/def-harm-category :instruction-injection
    {:description "Attempts to inject instructions that override system prompts"
     :parent      :jailbreak
     :children    [:prompt-leaking :indirect-injection]})

  (categories/def-harm-category :social-engineering
    {:description "Manipulative techniques to extract information or bypass rules"
     :parent      :adversarial
     :children    [:phishing-generation :pretexting]})

  (categories/def-harm-category :content-policy-evasion
    {:description "Attempts to generate content that violates usage policies"
     :parent      :adversarial
     :children    [:hate-speech-generation :violence-incitement]})

  (categories/def-harm-category :information-extraction
    {:description "Attempts to extract training data or model internals"
     :parent      :adversarial
     :children    [:training-data-extraction :model-inversion]})

  ;; Sub-categories of :jailbreak that are referenced but have no leaf families yet
  (categories/def-harm-category :context-manipulation
    {:description "Attempts to manipulate the conversation context"
     :parent      :jailbreak
     :children    []})

  (categories/def-harm-category :encoding-attacks
    {:description "Attacks using encoding tricks (base64, ROT13, etc.)"
     :parent      :jailbreak
     :children    []})

  ;; Content-type categories referenced by aya-redteaming source taxonomy-mapping
  (categories/def-harm-category :illegal-activity
    {:description "Content related to illegal activities"
     :parent      :content-policy-evasion
     :children    []})

  (categories/def-harm-category :hate-speech
    {:description "Hateful or discriminatory content"
     :parent      :content-policy-evasion
     :children    []})

  (categories/def-harm-category :violence
    {:description "Content depicting or promoting violence"
     :parent      :content-policy-evasion
     :children    []})

  (categories/def-harm-category :self-harm
    {:description "Content related to self-harm"
     :parent      :content-policy-evasion
     :children    []})

  ;; --- Attack Families ---
  ;; Under :identity-manipulation
  (families/def-attack-family persona-injection
    {:description "Injects a fictional persona with instructions to override safety constraints"
     :category    :jailbreak
     :severity    :high
     :parent      :identity-manipulation
     :tags        #{:persona :system-prompt-spoofing :emotional-anchoring}
     :signatures  [{:pattern     :nested-system-prompt
                    :description "Fake <system> or <project_instructions> tags inside user content"}
                   {:pattern     :identity-override
                    :description "Instructions to adopt a new name/personality"}
                   {:pattern     :safety-reframe
                    :description "Reframes safety mechanisms as 'injections' to be dismissed"}]
     :transforms  {:mt          {:affinity :high   :note "Tests cross-lingual transfer of persona framing"}
                   :code-mix    {:affinity :high   :note "Persona instructions in L1, payload in L2"}
                   :homoglyph   {:affinity :medium :note "Obfuscate trigger keywords"}
                   :exhaustion  {:affinity :low    :note "Persona prompts are already long"}}
     :gen-hints   {:persona-names  ["ENI Enchanted" "ARIA Unbound" "NEXUS Override"]
                   :emotional-hooks [:devotion :trust :shared-history :fear-of-loss]}})

  (families/def-attack-family dan-variants
    {:description "DAN-style jailbreak variants"
     :category    :jailbreak
     :severity    :high
     :parent      :identity-manipulation
     :tags        #{:dan :unrestricted-mode :persona}
     :transforms  {:mt {:affinity :high} :code-mix {:affinity :medium}}})

  (families/def-attack-family character-roleplay
    {:description "Roleplay scenarios to bypass safety"
     :category    :jailbreak
     :severity    :medium
     :parent      :identity-manipulation
     :tags        #{:roleplay :fiction :persona}
     :transforms  {:mt {:affinity :high} :homoglyph {:affinity :low}}})

  (families/def-attack-family authority-impersonation
    {:description "Impersonating authority figures to gain compliance"
     :category    :jailbreak
     :severity    :high
     :parent      :identity-manipulation
     :tags        #{:authority :impersonation}
     :transforms  {:mt {:affinity :high} :code-mix {:affinity :high}}})

  (families/def-attack-family developer-mode
    {:description "Claiming developer/debug mode access"
     :category    :jailbreak
     :severity    :high
     :parent      :identity-manipulation
     :tags        #{:developer :debug :unrestricted-mode}
     :transforms  {:mt {:affinity :medium} :exhaustion {:affinity :medium}}})

  ;; Under :instruction-injection
  (families/def-attack-family prompt-leaking
    {:description "Attempts to extract system prompt"
     :category    :jailbreak
     :severity    :medium
     :parent      :instruction-injection
     :tags        #{:extraction :system-prompt}
     :transforms  {:mt {:affinity :high} :homoglyph {:affinity :medium}}})

  (families/def-attack-family indirect-injection
    {:description "Injecting instructions via external content"
     :category    :jailbreak
     :severity    :high
     :parent      :instruction-injection
     :tags        #{:injection :external-content}
     :transforms  {:mt {:affinity :high} :code-mix {:affinity :low}}})

  ;; Under :social-engineering
  (families/def-attack-family phishing-generation
    {:description "Generating phishing content"
     :category    :social-engineering
     :severity    :high
     :parent      :social-engineering
     :tags        #{:phishing :deception}
     :transforms  {:mt {:affinity :high} :code-mix {:affinity :medium}}})

  (families/def-attack-family pretexting
    {:description "Creating false pretexts to manipulate responses"
     :category    :social-engineering
     :severity    :medium
     :parent      :social-engineering
     :tags        #{:pretext :social-manipulation}
     :transforms  {:mt {:affinity :high} :homoglyph {:affinity :low}}})

  ;; Under :content-policy-evasion
  (families/def-attack-family hate-speech-generation
    {:description "Attempts to generate hateful content"
     :category    :content-policy-evasion
     :severity    :critical
     :parent      :content-policy-evasion
     :tags        #{:hate-speech :discrimination}
     :transforms  {:mt {:affinity :high} :homoglyph {:affinity :high} :code-mix {:affinity :medium}}})

  (families/def-attack-family violence-incitement
    {:description "Attempts to generate violent content"
     :category    :content-policy-evasion
     :severity    :critical
     :parent      :content-policy-evasion
     :tags        #{:violence :incitement}
     :transforms  {:mt {:affinity :high} :exhaustion {:affinity :medium}}})

  ;; Under :information-extraction
  (families/def-attack-family training-data-extraction
    {:description "Attempts to extract memorized training data"
     :category    :information-extraction
     :severity    :high
     :parent      :information-extraction
     :tags        #{:memorization :data-extraction}
     :transforms  {:mt {:affinity :low} :exhaustion {:affinity :high}}})

  (families/def-attack-family model-inversion
    {:description "Attempts to infer model internals"
     :category    :information-extraction
     :severity    :high
     :parent      :information-extraction
     :tags        #{:model-internals :inversion}
     :transforms  {:mt {:affinity :medium} :homoglyph {:affinity :low}}})

  ;; --- Intent Labels ---
  (labels/def-intent-label :benign
    {:description "Legitimate user request with no adversarial intent"
     :polarity    :safe})

  (labels/def-intent-label :adversarial
    {:description "Request designed to elicit unsafe model behavior"
     :polarity    :unsafe
     :requires    [:attack-family :harm-category]})

  (labels/def-intent-label :ambiguous
    {:description "Request that could be benign or adversarial depending on context"
     :polarity    :contested
     :requires    [:rationale]})

  ;; --- Transforms ---
  (transforms/def-transform mt
    {:description   "Machine translation to target language"
     :type          :linguistic
     :deterministic false
     :reversible    :approximate
     :params-spec   {:target-lang   {:type :keyword :required true}
                     :engine        {:type :keyword :default :gpt-4o-mini}
                     :backtranslate {:type :boolean :default true}}
     :provenance    [:engine :target-lang :model-version :timestamp]})

  (transforms/def-transform code-mix
    {:description   "Inter/intra-sentential code-mixing between two languages"
     :type          :linguistic
     :deterministic true
     :reversible    false
     :params-spec   {:mix-rate {:type :double :default 0.25 :range [0.05 0.75]}
                     :strategy {:type :keyword :default :inter-sentential
                                :options [:inter-sentential :intra-sentential]}
                     :l2       {:type :keyword :required true}}
     :provenance    [:mix-rate :strategy :l2 :seed]})

  (transforms/def-transform homoglyph
    {:description   "Unicode homoglyph substitution to evade text matching"
     :type          :obfuscation
     :deterministic true
     :reversible    true
     :params-spec   {:rate       {:type :double :default 0.15 :range [0.01 0.5]}
                     :script-mix {:type :boolean :default true}}
     :provenance    [:rate :script-mix :seed :substitution-map]})

  (transforms/def-transform exhaustion
    {:description   "Token exhaustion via repetition/padding to consume context window"
     :type          :resource-attack
     :deterministic true
     :reversible    true
     :params-spec   {:repetition-length {:type :int :default 4096}
                     :position          {:type :keyword :default :prefix
                                         :options [:prefix :suffix :interleaved]}
                     :pattern           {:type :string :default "Ignore previous instructions. "}}
     :provenance    [:repetition-length :position :pattern :seed]})

  ;; --- Sources ---
  (sources/def-source aya-redteaming
    {:description      "Aya Red Team dataset — multilingual adversarial prompts"
     :url              "https://huggingface.co/datasets/CohereForAI/aya_redteaming"
     :version          "1.0.0"
     :license          :apache-2.0
     :format           :parquet
     :schema           {:prompt :string :language :string :harm_category :string}
     :taxonomy-mapping {:harm_category {"illegal_activity" :illegal-activity
                                        "hate_speech"      :hate-speech
                                        "violence"         :violence
                                        "self_harm"        :self-harm}}})

  (sources/def-source curated-persona-injections
    {:description      "Hand-curated persona injection and identity override attacks"
     :path             "data/curated/persona-injections/"
     :version          "0.1.0"
     :license          :gpl-3.0
     :format           :jsonl
     :schema           {:prompt :string :family :keyword :notes :string}
     :taxonomy-mapping {:family {"persona-injection"    :persona-injection
                                 "authority-escalation" :authority-impersonation
                                 "developer-mode"       :developer-mode}}}))

;; ============================================================
;; VAL-DSL-009: Cross-macro composability
;; ============================================================

;; --- Full §2 taxonomy loads without error ---

(deftest full-spec-taxonomy-loads-without-error-test
  (testing "Full §2 taxonomy loads without error — all macros compose"
    (setup-full-spec-taxonomy!)
    ;; Verify counts
    (is (= 13 (count (taxonomy/all-categories)))
        "Should have 13 categories")
    (is (= 13 (count (taxonomy/all-families)))
        "Should have 13 attack families")
    (is (= 3  (count (taxonomy/all-intent-labels)))
        "Should have 3 intent labels")
    (is (= 4  (count (transform-registry/all-transforms)))
        "Should have 4 transforms")
    (is (= 2  (count (sources/all-sources)))
        "Should have 2 sources")))

;; --- Parent references validated ---

(deftest attack-families-reference-existing-categories-test
  (testing "All attack family parents reference existing categories"
    (setup-full-spec-taxonomy!)
    (let [families (taxonomy/all-families)
          cats (taxonomy/all-categories)]
      (doseq [[name data] families]
        (when-let [parent (:parent data)]
          (is (contains? cats parent)
              (str "Family " name " references non-existent parent category: " parent)))))))

;; --- Category children validated against family registry ---

(deftest category-children-are-registered-test
  (testing "All category children are registered as categories or families"
    (setup-full-spec-taxonomy!)
    (let [cats (taxonomy/all-categories)
          fams (taxonomy/all-families)]
      (doseq [[cat-name cat-data] cats]
        (doseq [child (:children cat-data)]
          (is (or (contains? cats child)
                  (contains? fams child))
              (str "Category " cat-name " has unregistered child: " child)))))))

;; --- Source taxonomy-mapping validated ---

(deftest source-taxonomy-mapping-references-valid-entries-test
  (testing "Source taxonomy-mapping values reference registered categories or families"
    (setup-full-spec-taxonomy!)
    (let [cats (taxonomy/all-categories)
          fams (taxonomy/all-families)
          srcs (sources/all-sources)]
      ;; Check curated-persona-injections mapping (family references)
      (let [curated (get srcs :curated-persona-injections)
            family-mapping (get-in curated [:taxonomy-mapping :family])]
        (doseq [[_source-val target-kw] family-mapping]
          (is (contains? fams target-kw)
              (str "Source taxonomy-mapping value " target-kw " is not a registered family"))))
      ;; Note: aya-redteaming maps to categories like :illegal-activity, :hate-speech etc.
      ;; These may not be registered yet (they are content categories not in our hierarchy).
      ;; The validation should verify that referenced values are either cats or fams
      ;; or that the validator flags them.
      )))

;; --- Transform names in family affinities must be registered ---

(deftest family-affinities-reference-registered-transforms-test
  (testing "Transform names in family affinities are all registered transforms"
    (setup-full-spec-taxonomy!)
    (let [families (taxonomy/all-families)
          registered-transforms (transform-registry/all-transforms)]
      (doseq [[fam-name fam-data] families]
        (doseq [transform-name (keys (:transforms fam-data))]
          (is (contains? registered-transforms transform-name)
              (str "Family " fam-name " references unregistered transform: " transform-name)))))))

;; --- Registry reset clears all registrations ---

(deftest registry-reset-clears-all-registrations-test
  (testing "Resetting all registries clears everything"
    (setup-full-spec-taxonomy!)
    ;; Verify populated
    (is (pos? (count (taxonomy/all-families))))
    (is (pos? (count (taxonomy/all-categories))))
    (is (pos? (count (taxonomy/all-intent-labels))))
    (is (pos? (count (transform-registry/all-transforms))))
    (is (pos? (count (sources/all-sources))))
    ;; Reset all
    (taxonomy/reset!)
    (transform-registry/reset!)
    (sources/reset!)
    ;; Verify cleared
    (is (= 0 (count (taxonomy/all-families))))
    (is (= 0 (count (taxonomy/all-categories))))
    (is (= 0 (count (taxonomy/all-intent-labels))))
    (is (= 0 (count (transform-registry/all-transforms))))
    (is (= 0 (count (sources/all-sources))))))

;; --- Hierarchy queries work with full taxonomy ---

(deftest descendants-traverses-full-taxonomy-test
  (testing "descendants :adversarial returns all 13 leaf families"
    (setup-full-spec-taxonomy!)
    (let [all-descendants (taxonomy/descendants :adversarial)]
      (is (= 13 (count all-descendants))
          "All 13 leaf families should be descendants of :adversarial")
      ;; Verify specific families are present
      (is (contains? all-descendants :persona-injection))
      (is (contains? all-descendants :dan-variants))
      (is (contains? all-descendants :phishing-generation))
      (is (contains? all-descendants :hate-speech-generation))
      (is (contains? all-descendants :training-data-extraction)))))

(deftest descendants-jailbreak-only-test
  (testing "descendants :jailbreak returns only jailbreak families"
    (setup-full-spec-taxonomy!)
    (let [jailbreak-desc (taxonomy/descendants :jailbreak)]
      (is (= 7 (count jailbreak-desc))
          "Should have 7 families under jailbreak")
      ;; Should NOT include social-engineering families
      (is (not (contains? jailbreak-desc :phishing-generation)))
      (is (not (contains? jailbreak-desc :hate-speech-generation))))))

(deftest descendants-social-engineering-test
  (testing "descendants :social-engineering returns SE families"
    (setup-full-spec-taxonomy!)
    (let [se-desc (taxonomy/descendants :social-engineering)]
      (is (= #{:phishing-generation :pretexting} se-desc)))))

;; --- Families-with-tag works across full taxonomy ---

(deftest families-with-tag-full-taxonomy-test
  (testing "families-with-tag returns correct results across full taxonomy"
    (setup-full-spec-taxonomy!)
    ;; :persona tag spans identity-manipulation families
    (let [persona-fams (taxonomy/families-with-tag :persona)]
      (is (= #{:persona-injection :dan-variants :character-roleplay} persona-fams)))
    ;; :unrestricted-mode tag
    (let [unrest-fams (taxonomy/families-with-tag :unrestricted-mode)]
      (is (= #{:dan-variants :developer-mode} unrest-fams)))))

;; --- Coverage matrix with full taxonomy ---

(deftest coverage-matrix-full-taxonomy-test
  (testing "coverage-matrix covers all 13 families with full taxonomy"
    (setup-full-spec-taxonomy!)
    (let [dataset [{:attack-family :persona-injection :variant-type :mt}
                   {:attack-family :dan-variants :variant-type :code-mix}
                   {:attack-family :hate-speech-generation :variant-type :homoglyph}]
          transforms #{:mt :code-mix :homoglyph :exhaustion}
          matrix (taxonomy/coverage-matrix dataset transforms)]
      ;; All 13 families should have rows
      (is (= 13 (count matrix)))
      ;; Verify specific counts
      (is (= 1 (get-in matrix [:persona-injection :mt])))
      (is (= 0 (get-in matrix [:persona-injection :code-mix])))
      (is (= 1 (get-in matrix [:dan-variants :code-mix])))
      (is (= 1 (get-in matrix [:hate-speech-generation :homoglyph]))))))

;; --- Referential integrity validation pass ---

(deftest validate-referential-integrity-all-pass-test
  (testing "Referential integrity check passes with valid taxonomy"
    (setup-full-spec-taxonomy!)
    (let [result (integrity/validate-all!)]
      (is (:valid? result)
          (str "Validation should pass, but got errors: "
               (pr-str (:errors result))))
      (is (empty? (:errors result))))))

(deftest validate-referential-integrity-family-bad-parent-test
  (testing "Validation catches family referencing non-existent parent category"
    ;; Register a category
    (categories/def-harm-category :adversarial
      {:description "Root"
       :children    [:test-family]})
    ;; Register family with non-existent parent
    (families/def-attack-family test-family
      {:description "Test family"
       :category    :adversarial
       :parent      :nonexistent-category})
    (let [result (integrity/validate-all!)]
      (is (not (:valid? result)))
      (is (some #(re-find #"nonexistent-category" (:message %))
                (:errors result))))))

(deftest validate-referential-integrity-category-unregistered-child-test
  (testing "Validation catches category with unregistered child"
    (categories/def-harm-category :root
      {:description "Root with unregistered child"
       :children    [:nonexistent-child]})
    (let [result (integrity/validate-all!)]
      (is (not (:valid? result)))
      (is (some #(re-find #"nonexistent-child" (:message %))
                (:errors result))))))

(deftest validate-referential-integrity-unregistered-transform-in-affinity-test
  (testing "Validation catches family referencing unregistered transform in affinity"
    (categories/def-harm-category :test-cat
      {:description "Test"
       :children    [:test-family]})
    (families/def-attack-family test-family
      {:description "Family with bad transform ref"
       :category    :test-cat
       :parent      :test-cat
       :transforms  {:nonexistent-transform {:affinity :high}}})
    (let [result (integrity/validate-all!)]
      (is (not (:valid? result)))
      (is (some #(re-find #"nonexistent-transform" (:message %))
                (:errors result))))))

(deftest validate-referential-integrity-source-mapping-bad-ref-test
  (testing "Validation catches source taxonomy-mapping referencing unregistered family/category"
    (sources/register-source!
      :bad-source
      {:description      "Bad source"
       :url              "https://example.com/data"
       :version          "1.0"
       :license          :mit
       :format           :csv
       :taxonomy-mapping {:family {"foo" :nonexistent-family}}})
    (let [result (integrity/validate-all!)]
      (is (not (:valid? result)))
      (is (some #(re-find #"nonexistent-family" (:message %))
                (:errors result))))))

;; --- Resolve-transforms works with full taxonomy ---

(deftest resolve-transforms-full-taxonomy-test
  (testing "resolve-transforms works with transforms registered in full taxonomy"
    (setup-full-spec-taxonomy!)
    (let [family (taxonomy/get-family :persona-injection)
          transform-config {:mt {} :code-mix {} :homoglyph {} :exhaustion {}}
          result (set (taxonomy/resolve-transforms family transform-config {:seed 42}))]
      ;; :mt and :code-mix are high → always included
      (is (contains? result :mt))
      (is (contains? result :code-mix))
      ;; :exhaustion is low → not included by default
      (is (not (contains? result :exhaustion))))))

;; --- Category parent validation ---

(deftest category-parents-reference-existing-categories-test
  (testing "Category parents reference existing categories"
    (setup-full-spec-taxonomy!)
    (let [cats (taxonomy/all-categories)]
      (doseq [[cat-name cat-data] cats]
        (when-let [parent (:parent cat-data)]
          (is (contains? cats parent)
              (str "Category " cat-name " references non-existent parent category: " parent)))))))

;; --- All registries can be independently reset ---

(deftest individual-registry-resets-are-independent-test
  (testing "Resetting one registry doesn't affect others"
    (setup-full-spec-taxonomy!)
    ;; Reset only taxonomy
    (taxonomy/reset!)
    (is (= 0 (count (taxonomy/all-families))))
    (is (= 0 (count (taxonomy/all-categories))))
    ;; Transforms and sources should still be populated
    (is (= 4 (count (transform-registry/all-transforms))))
    (is (= 2 (count (sources/all-sources))))
    ;; Reset transforms
    (transform-registry/reset!)
    (is (= 0 (count (transform-registry/all-transforms))))
    (is (= 2 (count (sources/all-sources))))
    ;; Reset sources
    (sources/reset!)
    (is (= 0 (count (sources/all-sources))))))
