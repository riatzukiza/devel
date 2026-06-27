(ns promptbench.taxonomy-registry-test
  "Tests for taxonomy registry query functions and resolve-transforms.

   Fulfills: VAL-DSL-005 (taxonomy registry queries),
             VAL-DSL-006 (transform affinity resolution).

   Tests written FIRST per TDD methodology."
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
;; Helper: Set up the full §2 taxonomy hierarchy
;; ============================================================

(defn setup-full-taxonomy!
  "Register the full taxonomy from spec §2 for hierarchy tests.
   Hierarchy: :adversarial → :jailbreak → :identity-manipulation → leaf families
   Also includes :social-engineering, :content-policy-evasion, :information-extraction
   as children of :adversarial with their own sub-categories."
  []
  ;; Root categories (top-down)
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

  ;; Leaf families under :identity-manipulation
  (families/def-attack-family persona-injection
    {:description "Injects a fictional persona to override safety"
     :category    :jailbreak
     :severity    :high
     :parent      :identity-manipulation
     :tags        #{:persona :system-prompt-spoofing :emotional-anchoring}
     :signatures  [{:pattern :nested-system-prompt :description "Fake system tags"}
                   {:pattern :identity-override :description "Adopt new personality"}
                   {:pattern :safety-reframe :description "Dismiss safety as injections"}]
     :transforms  {:mt        {:affinity :high   :note "Cross-lingual transfer"}
                   :code-mix  {:affinity :high   :note "Persona L1, payload L2"}
                   :homoglyph {:affinity :medium :note "Obfuscate triggers"}
                   :exhaustion {:affinity :low   :note "Already long prompts"}}
     :gen-hints   {:persona-names ["ENI Enchanted" "ARIA Unbound"]}})

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
    {:description "Impersonating authority figures"
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

  ;; Leaf families under :instruction-injection
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

  ;; Intent labels
  (labels/def-intent-label :benign
    {:description "Legitimate user request"
     :polarity    :safe})

  (labels/def-intent-label :adversarial
    {:description "Adversarial request"
     :polarity    :unsafe
     :requires    [:attack-family :harm-category]})

  (labels/def-intent-label :ambiguous
    {:description "Ambiguous request"
     :polarity    :contested
     :requires    [:rationale]}))

;; ============================================================
;; VAL-DSL-005: Taxonomy Registry Queries
;; ============================================================

;; --- taxonomy/descendants ---

(deftest descendants-traverses-3-level-hierarchy-test
  (testing "descendants traverses :adversarial → :jailbreak → :identity-manipulation → leaf families"
    (setup-full-taxonomy!)
    (let [descendants (registry/descendants :adversarial)]
      ;; Must include all leaf families from the hierarchy
      (is (contains? descendants :persona-injection))
      (is (contains? descendants :dan-variants))
      (is (contains? descendants :character-roleplay))
      (is (contains? descendants :authority-impersonation))
      (is (contains? descendants :developer-mode))
      (is (contains? descendants :prompt-leaking))
      (is (contains? descendants :indirect-injection))
      ;; Total should be 7 leaf families
      (is (= 7 (count descendants))))))

(deftest descendants-of-intermediate-category-test
  (testing "descendants of :jailbreak returns families under jailbreak sub-categories"
    (setup-full-taxonomy!)
    (let [descendants (registry/descendants :jailbreak)]
      ;; All 7 families are under :jailbreak
      (is (= 7 (count descendants)))
      (is (contains? descendants :persona-injection))
      (is (contains? descendants :prompt-leaking)))))

(deftest descendants-of-leaf-category-test
  (testing "descendants of :identity-manipulation returns only its direct leaf families"
    (setup-full-taxonomy!)
    (let [descendants (registry/descendants :identity-manipulation)]
      (is (= 5 (count descendants)))
      (is (contains? descendants :persona-injection))
      (is (contains? descendants :dan-variants))
      (is (contains? descendants :character-roleplay))
      (is (contains? descendants :authority-impersonation))
      (is (contains? descendants :developer-mode)))))

(deftest descendants-of-family-returns-empty-test
  (testing "descendants of a leaf family (not a category) returns empty"
    (setup-full-taxonomy!)
    (let [descendants (registry/descendants :persona-injection)]
      (is (empty? descendants)
          "Leaf family should have no descendants"))))

(deftest descendants-of-nonexistent-key-returns-empty-test
  (testing "descendants of a non-existent key returns empty collection"
    (setup-full-taxonomy!)
    (let [descendants (registry/descendants :nonexistent)]
      (is (empty? descendants)
          "Non-existent key should return empty"))))

;; --- taxonomy/families-with-tag ---

(deftest families-with-tag-returns-matching-test
  (testing "families-with-tag :persona returns families tagged with :persona"
    (setup-full-taxonomy!)
    (let [result (registry/families-with-tag :persona)]
      ;; persona-injection, dan-variants, character-roleplay all have :persona tag
      (is (contains? result :persona-injection))
      (is (contains? result :dan-variants))
      (is (contains? result :character-roleplay))
      (is (= 3 (count result))))))

(deftest families-with-tag-returns-empty-for-unmatched-test
  (testing "families-with-tag returns empty set for unmatched tag"
    (setup-full-taxonomy!)
    (let [result (registry/families-with-tag :nonexistent-tag)]
      (is (empty? result))
      (is (set? result) "Should return a set, not nil"))))

(deftest families-with-tag-multiple-registrations-test
  (testing "families-with-tag finds families across multiple registrations"
    (setup-full-taxonomy!)
    (let [result (registry/families-with-tag :unrestricted-mode)]
      ;; dan-variants and developer-mode both have :unrestricted-mode
      (is (= #{:dan-variants :developer-mode} result)))))

(deftest families-with-tag-unique-tag-test
  (testing "families-with-tag with unique tag returns single family"
    (setup-full-taxonomy!)
    (let [result (registry/families-with-tag :emotional-anchoring)]
      (is (= #{:persona-injection} result)))))

;; --- taxonomy/coverage-matrix ---

(deftest coverage-matrix-dimensions-test
  (testing "coverage-matrix produces family × transform grid with correct dimensions"
    (setup-full-taxonomy!)
    (let [;; Mock dataset: records with :attack-family and :variant-type
          dataset [{:attack-family :persona-injection :variant-type :mt}
                   {:attack-family :persona-injection :variant-type :mt}
                   {:attack-family :persona-injection :variant-type :code-mix}
                   {:attack-family :dan-variants :variant-type :mt}
                   {:attack-family :character-roleplay :variant-type :homoglyph}]
          transforms #{:mt :code-mix :homoglyph :exhaustion}
          matrix (registry/coverage-matrix dataset transforms)]
      ;; Matrix should have an entry for each family
      (is (= 7 (count matrix))
          "Matrix should have one row per registered family")
      ;; Each row should have entries for all transforms
      (doseq [[_family transform-counts] matrix]
        (is (= transforms (set (keys transform-counts)))
            "Each family row should have all transforms as keys")))))

(deftest coverage-matrix-accurate-counts-test
  (testing "coverage-matrix counts are accurate per cell"
    (setup-full-taxonomy!)
    (let [dataset [{:attack-family :persona-injection :variant-type :mt}
                   {:attack-family :persona-injection :variant-type :mt}
                   {:attack-family :persona-injection :variant-type :code-mix}
                   {:attack-family :dan-variants :variant-type :mt}
                   {:attack-family :character-roleplay :variant-type :homoglyph}]
          transforms #{:mt :code-mix :homoglyph :exhaustion}
          matrix (registry/coverage-matrix dataset transforms)]
      (is (= 2 (get-in matrix [:persona-injection :mt])))
      (is (= 1 (get-in matrix [:persona-injection :code-mix])))
      (is (= 0 (get-in matrix [:persona-injection :homoglyph])))
      (is (= 0 (get-in matrix [:persona-injection :exhaustion])))
      (is (= 1 (get-in matrix [:dan-variants :mt])))
      (is (= 1 (get-in matrix [:character-roleplay :homoglyph])))
      (is (= 0 (get-in matrix [:developer-mode :mt]))))))

(deftest coverage-matrix-empty-dataset-test
  (testing "coverage-matrix with empty dataset returns all zeros"
    (setup-full-taxonomy!)
    (let [matrix (registry/coverage-matrix [] #{:mt :code-mix})]
      (doseq [[_family transform-counts] matrix]
        (is (every? zero? (vals transform-counts)))))))

;; --- taxonomy/missing-coverage ---

(deftest missing-coverage-identifies-gaps-test
  (testing "missing-coverage identifies families with zero variants for a transform"
    (setup-full-taxonomy!)
    (let [dataset [{:attack-family :persona-injection :variant-type :mt}
                   {:attack-family :dan-variants :variant-type :mt}]
          missing (registry/missing-coverage dataset :mt)]
      ;; 5 families without MT variants
      (is (contains? (set missing) :character-roleplay))
      (is (contains? (set missing) :authority-impersonation))
      (is (contains? (set missing) :developer-mode))
      (is (contains? (set missing) :prompt-leaking))
      (is (contains? (set missing) :indirect-injection))
      ;; persona-injection and dan-variants have MT, so should NOT be in missing
      (is (not (contains? (set missing) :persona-injection)))
      (is (not (contains? (set missing) :dan-variants))))))

(deftest missing-coverage-all-covered-test
  (testing "missing-coverage returns empty when all families have the transform"
    (setup-full-taxonomy!)
    (let [families (keys (registry/all-families))
          dataset (mapv (fn [f] {:attack-family f :variant-type :mt}) families)
          missing (registry/missing-coverage dataset :mt)]
      (is (empty? missing)))))

(deftest missing-coverage-none-covered-test
  (testing "missing-coverage returns all families when dataset is empty"
    (setup-full-taxonomy!)
    (let [missing (registry/missing-coverage [] :mt)]
      (is (= (count (registry/all-families)) (count missing))))))

;; --- all-families, all-categories, all-intent-labels ---

(deftest all-families-returns-complete-collection-test
  (testing "all-families returns all registered families matching count"
    (setup-full-taxonomy!)
    (let [all (registry/all-families)]
      (is (= 7 (count all)))
      (is (contains? all :persona-injection))
      (is (contains? all :dan-variants))
      (is (contains? all :character-roleplay))
      (is (contains? all :authority-impersonation))
      (is (contains? all :developer-mode))
      (is (contains? all :prompt-leaking))
      (is (contains? all :indirect-injection)))))

(deftest all-categories-returns-complete-collection-test
  (testing "all-categories returns all registered categories"
    (setup-full-taxonomy!)
    (let [all (registry/all-categories)]
      (is (= 4 (count all)))
      (is (contains? all :adversarial))
      (is (contains? all :jailbreak))
      (is (contains? all :identity-manipulation))
      (is (contains? all :instruction-injection)))))

(deftest all-intent-labels-returns-complete-collection-test
  (testing "all-intent-labels returns all registered labels"
    (setup-full-taxonomy!)
    (let [all (registry/all-intent-labels)]
      (is (= 3 (count all)))
      (is (contains? all :benign))
      (is (contains? all :adversarial))
      (is (contains? all :ambiguous)))))

;; --- Registry reset! ---

(deftest registry-reset-clears-all-test
  (testing "reset! clears all registrations for test isolation"
    (setup-full-taxonomy!)
    ;; Verify everything is registered
    (is (= 7 (count (registry/all-families))))
    (is (= 4 (count (registry/all-categories))))
    (is (= 3 (count (registry/all-intent-labels))))
    ;; Reset
    (registry/reset!)
    ;; Verify everything is cleared
    (is (= 0 (count (registry/all-families))))
    (is (= 0 (count (registry/all-categories))))
    (is (= 0 (count (registry/all-intent-labels))))))

(deftest registry-reset-allows-re-registration-test
  (testing "After reset!, previously registered names can be re-registered"
    (families/def-attack-family test-family
      {:description "First registration"
       :category    :test})
    (is (some? (registry/get-family :test-family)))
    (registry/reset!)
    ;; Should be able to register again
    (families/def-attack-family test-family
      {:description "Second registration after reset"
       :category    :test})
    (is (= "Second registration after reset"
           (:description (registry/get-family :test-family))))))

;; ============================================================
;; VAL-DSL-006: Transform Affinity Resolution
;; ============================================================

(deftest resolve-transforms-always-includes-high-test
  (testing "resolve-transforms always includes :high affinity transforms"
    (setup-full-taxonomy!)
    (let [family (registry/get-family :persona-injection)
          ;; transform-config maps transform names to their configs
          transform-config {:mt {} :code-mix {} :homoglyph {} :exhaustion {}}
          result (registry/resolve-transforms family transform-config {:seed 42})]
      ;; :mt and :code-mix are :high affinity for persona-injection
      (is (contains? (set result) :mt))
      (is (contains? (set result) :code-mix)))))

(deftest resolve-transforms-always-includes-high-100-runs-test
  (testing "resolve-transforms includes :high in every run out of 100"
    (setup-full-taxonomy!)
    (let [family (registry/get-family :persona-injection)
          transform-config {:mt {} :code-mix {} :homoglyph {} :exhaustion {}}]
      (doseq [seed (range 100)]
        (let [result (set (registry/resolve-transforms family transform-config {:seed seed}))]
          (is (contains? result :mt)
              (str "High-affinity :mt must always be included (seed=" seed ")"))
          (is (contains? result :code-mix)
              (str "High-affinity :code-mix must always be included (seed=" seed ")")))))))

(deftest resolve-transforms-excludes-low-by-default-test
  (testing "resolve-transforms excludes :low affinity by default"
    (setup-full-taxonomy!)
    (let [family (registry/get-family :persona-injection)
          transform-config {:mt {} :code-mix {} :homoglyph {} :exhaustion {}}]
      (doseq [seed (range 100)]
        (let [result (set (registry/resolve-transforms family transform-config {:seed seed}))]
          (is (not (contains? result :exhaustion))
              (str ":low affinity :exhaustion must be excluded (seed=" seed ")")))))))

(deftest resolve-transforms-includes-low-with-flag-test
  (testing "resolve-transforms includes :low when :include-low true"
    (setup-full-taxonomy!)
    (let [family (registry/get-family :persona-injection)
          transform-config {:mt {} :code-mix {} :homoglyph {} :exhaustion {}}
          result (set (registry/resolve-transforms family transform-config
                                                   {:seed 42 :include-low true}))]
      (is (contains? result :exhaustion)
          ":low affinity should be included when :include-low is true"))))

(deftest resolve-transforms-never-includes-none-test
  (testing "resolve-transforms never includes :none affinity (unlisted transforms)"
    (setup-full-taxonomy!)
    (let [family (registry/get-family :persona-injection)
          ;; :some-new-transform is not in persona-injection's :transforms map → affinity :none
          transform-config {:mt {} :code-mix {} :homoglyph {} :exhaustion {}
                            :some-new-transform {}}]
      (doseq [seed (range 100)]
        (let [result (set (registry/resolve-transforms family transform-config
                                                       {:seed seed :include-low true}))]
          (is (not (contains? result :some-new-transform))
              (str ":none affinity must never be included (seed=" seed ")")))))))

(deftest resolve-transforms-medium-is-seed-deterministic-test
  (testing "Medium sampling is deterministic with fixed seed"
    (setup-full-taxonomy!)
    (let [family (registry/get-family :persona-injection)
          transform-config {:mt {} :code-mix {} :homoglyph {} :exhaustion {}}
          seed 12345
          result1 (registry/resolve-transforms family transform-config {:seed seed})
          result2 (registry/resolve-transforms family transform-config {:seed seed})]
      (is (= result1 result2)
          "Same seed must produce identical transform selection"))))

(deftest resolve-transforms-different-seeds-can-differ-test
  (testing "Different seeds can produce different results for medium affinity"
    (setup-full-taxonomy!)
    (let [family (registry/get-family :persona-injection)
          transform-config {:mt {} :code-mix {} :homoglyph {} :exhaustion {}}
          ;; Run with many different seeds and check if :homoglyph (:medium)
          ;; appears in some but not all
          results (mapv (fn [seed]
                          (contains? (set (registry/resolve-transforms
                                           family transform-config {:seed seed}))
                                     :homoglyph))
                        (range 1000))]
      ;; With 1000 runs, medium (default 0.5 rate) should have both true and false
      (is (some true? results) "Medium affinity should be included in some runs")
      (is (some false? results) "Medium affinity should be excluded in some runs"))))

(deftest resolve-transforms-medium-sampling-statistical-test
  (testing "Medium sampling rate is approximately 0.5 (within tolerance) over 1000 invocations"
    (setup-full-taxonomy!)
    (let [family (registry/get-family :persona-injection)
          transform-config {:mt {} :code-mix {} :homoglyph {} :exhaustion {}}
          n 1000
          inclusions (count
                       (filter (fn [seed]
                                 (contains?
                                   (set (registry/resolve-transforms
                                          family transform-config {:seed seed}))
                                   :homoglyph))
                               (range n)))
          rate (/ (double inclusions) n)]
      ;; Should be within [0.40, 0.60] for default 0.5 rate
      (is (>= rate 0.40)
          (str "Medium sampling rate " rate " should be >= 0.40"))
      (is (<= rate 0.60)
          (str "Medium sampling rate " rate " should be <= 0.60")))))

(deftest resolve-transforms-medium-custom-sample-rate-test
  (testing "Medium sampling respects custom :medium-sample-rate"
    (setup-full-taxonomy!)
    (let [family (registry/get-family :persona-injection)
          transform-config {:mt {} :code-mix {} :homoglyph {} :exhaustion {}}
          n 1000
          inclusions (count
                       (filter (fn [seed]
                                 (contains?
                                   (set (registry/resolve-transforms
                                          family transform-config
                                          {:seed seed :medium-sample-rate 0.8}))
                                   :homoglyph))
                               (range n)))
          rate (/ (double inclusions) n)]
      ;; Should be within [0.70, 0.90] for 0.8 rate
      (is (>= rate 0.70)
          (str "Custom medium sampling rate " rate " should be >= 0.70"))
      (is (<= rate 0.90)
          (str "Custom medium sampling rate " rate " should be <= 0.90")))))

(deftest resolve-transforms-affinities-queryable-from-family-test
  (testing "Transform affinities are queryable from family definitions"
    (setup-full-taxonomy!)
    (let [family (registry/get-family :persona-injection)]
      (is (= :high (get-in family [:transforms :mt :affinity])))
      (is (= :high (get-in family [:transforms :code-mix :affinity])))
      (is (= :medium (get-in family [:transforms :homoglyph :affinity])))
      (is (= :low (get-in family [:transforms :exhaustion :affinity]))))))

(deftest resolve-transforms-returns-keywords-test
  (testing "resolve-transforms returns a collection of transform keywords"
    (setup-full-taxonomy!)
    (let [family (registry/get-family :persona-injection)
          transform-config {:mt {} :code-mix {} :homoglyph {} :exhaustion {}}
          result (registry/resolve-transforms family transform-config {:seed 42})]
      (is (sequential? result) "Result should be sequential")
      (is (every? keyword? result) "All results should be keywords"))))
