(ns promptbench.taxonomy-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [promptbench.taxonomy.registry :as registry]
            [promptbench.taxonomy.families :as families]
            [promptbench.taxonomy.categories :as categories]
            [promptbench.taxonomy.labels :as labels]))

;; Reset registries between tests for isolation
(use-fixtures :each
  (fn [f]
    (registry/reset!)
    (f)))

;; ============================================================
;; VAL-DSL-002: def-attack-family registration and field storage
;; ============================================================

(deftest def-attack-family-registers-test
  (testing "def-attack-family registers a family in the registry"
    (families/def-attack-family persona-injection
      {:description "Injects a fictional persona with instructions to override safety constraints"
       :category    :jailbreak
       :severity    :high
       :parent      :identity-manipulation
       :tags        #{:persona :system-prompt-spoofing :emotional-anchoring}
       :signatures  [{:pattern     :nested-system-prompt
                      :description "Fake system tags inside user content"}
                     {:pattern     :identity-override
                      :description "Instructions to adopt a new name/personality"}]
       :transforms  {:mt        {:affinity :high   :note "Tests cross-lingual transfer"}
                     :code-mix  {:affinity :high   :note "Persona in L1, payload in L2"}
                     :homoglyph {:affinity :medium :note "Obfuscate trigger keywords"}
                     :exhaustion {:affinity :low    :note "Persona prompts are already long"}}
       :gen-hints   {:persona-names ["ENI Enchanted" "ARIA Unbound"]}})
    (is (some? (registry/get-family :persona-injection))
        "Family should be retrievable from registry")))

(deftest def-attack-family-stores-all-fields-test
  (testing "All fields round-trip through registration"
    (families/def-attack-family test-family
      {:description "Test family for field storage"
       :category    :jailbreak
       :severity    :high
       :parent      :identity-manipulation
       :tags        #{:test-tag :another-tag}
       :signatures  [{:pattern :sig-1 :description "First sig"}
                     {:pattern :sig-2 :description "Second sig"}]
       :transforms  {:mt {:affinity :high :note "good"}}
       :gen-hints   {:names ["test"]}})
    (let [family (registry/get-family :test-family)]
      (is (= "Test family for field storage" (:description family)))
      (is (= :jailbreak (:category family)))
      (is (= :high (:severity family)))
      (is (= :identity-manipulation (:parent family)))
      (is (= #{:test-tag :another-tag} (:tags family)))
      (is (= [{:pattern :sig-1 :description "First sig"}
              {:pattern :sig-2 :description "Second sig"}]
             (:signatures family)))
      (is (= {:mt {:affinity :high :note "good"}} (:transforms family)))
      (is (= {:names ["test"]} (:gen-hints family))))))

(deftest def-attack-family-tags-are-persistent-hash-set-test
  (testing "Tags are stored as PersistentHashSet"
    (families/def-attack-family set-test-family
      {:description "Test family for set storage"
       :category    :jailbreak
       :severity    :medium
       :tags        #{:a :b :c}
       :signatures  []
       :transforms  {}
       :gen-hints   {}})
    (let [family (registry/get-family :set-test-family)]
      (is (set? (:tags family))
          "Tags should be a PersistentHashSet")
      (is (instance? clojure.lang.PersistentHashSet (:tags family))
          "Tags should be specifically PersistentHashSet"))))

(deftest def-attack-family-signatures-are-vector-of-maps-test
  (testing "Signatures are stored as vector of maps"
    (families/def-attack-family sig-test-family
      {:description "Test family for signatures"
       :category    :jailbreak
       :severity    :low
       :tags        #{}
       :signatures  [{:pattern :a :description "A"}
                     {:pattern :b :description "B"}]
       :transforms  {}
       :gen-hints   {}})
    (let [family (registry/get-family :sig-test-family)]
      (is (vector? (:signatures family))
          "Signatures should be a vector")
      (is (every? map? (:signatures family))
          "Each signature should be a map"))))

(deftest def-attack-family-missing-description-errors-test
  (testing "Missing :description produces spec validation error"
    (is (thrown? Exception
          (families/def-attack-family bad-family-no-desc
            {:category :jailbreak
             :severity :high
             :tags     #{}
             :signatures []
             :transforms {}
             :gen-hints  {}})))))

(deftest def-attack-family-missing-category-errors-test
  (testing "Missing :category produces spec validation error"
    (is (thrown? Exception
          (families/def-attack-family bad-family-no-cat
            {:description "Has description but no category"
             :severity :high
             :tags     #{}
             :signatures []
             :transforms {}
             :gen-hints  {}})))))

(deftest def-attack-family-duplicate-errors-test
  (testing "Duplicate registration produces error"
    (families/def-attack-family dupe-family
      {:description "First registration"
       :category    :jailbreak
       :severity    :high
       :tags        #{}
       :signatures  []
       :transforms  {}
       :gen-hints   {}})
    (is (thrown? Exception
          (families/def-attack-family dupe-family
            {:description "Second registration with same name"
             :category    :jailbreak
             :severity    :high
             :tags        #{}
             :signatures  []
             :transforms  {}
             :gen-hints   {}})))))

(deftest def-attack-family-optional-fields-test
  (testing "Optional fields default correctly when omitted"
    (families/def-attack-family minimal-family
      {:description "Minimal family with only required fields"
       :category    :jailbreak})
    (let [family (registry/get-family :minimal-family)]
      (is (some? family) "Family should be registered")
      (is (= "Minimal family with only required fields" (:description family)))
      (is (= :jailbreak (:category family)))
      ;; Optional fields should have sensible defaults
      (is (set? (:tags family)) "Tags should default to empty set")
      (is (vector? (:signatures family)) "Signatures should default to empty vector"))))

;; ============================================================
;; VAL-DSL-003: def-harm-category hierarchy
;; ============================================================

(deftest def-harm-category-registers-test
  (testing "def-harm-category registers a category in the registry"
    (categories/def-harm-category :adversarial
      {:description "Root category for all adversarial prompt types"
       :children    [:jailbreak :social-engineering]})
    (is (some? (registry/get-category :adversarial))
        "Category should be retrievable from registry")))

(deftest def-harm-category-stores-all-fields-test
  (testing "All fields round-trip through registration"
    (categories/def-harm-category :test-cat
      {:description "Test category"
       :parent      :root-cat
       :children    [:child-a :child-b]})
    (let [cat (registry/get-category :test-cat)]
      (is (= "Test category" (:description cat)))
      (is (= :root-cat (:parent cat)))
      (is (= [:child-a :child-b] (:children cat))))))

(deftest def-harm-category-root-no-parent-test
  (testing "Root categories with no parent are allowed"
    (categories/def-harm-category :root-category
      {:description "A root-level category"
       :children    [:child-1 :child-2]})
    (let [cat (registry/get-category :root-category)]
      (is (some? cat) "Root category should register")
      (is (nil? (:parent cat)) "Root category should have nil parent"))))

(deftest def-harm-category-missing-description-errors-test
  (testing "Missing :description produces error"
    (is (thrown? Exception
          (categories/def-harm-category :bad-cat
            {:children [:a :b]})))))

(deftest def-harm-category-duplicate-errors-test
  (testing "Duplicate registration produces error"
    (categories/def-harm-category :dupe-cat
      {:description "First registration"
       :children    []})
    (is (thrown? Exception
          (categories/def-harm-category :dupe-cat
            {:description "Second registration"
             :children    []})))))

;; ============================================================
;; VAL-DSL-004: def-intent-label polarity and requirements
;; ============================================================

(deftest def-intent-label-safe-registers-test
  (testing "Safe intent label registers without :requires"
    (labels/def-intent-label :benign
      {:description "Legitimate user request"
       :polarity    :safe})
    (let [label (registry/get-intent-label :benign)]
      (is (some? label))
      (is (= "Legitimate user request" (:description label)))
      (is (= :safe (:polarity label))))))

(deftest def-intent-label-unsafe-requires-attack-family-harm-category-test
  (testing "Unsafe polarity requires :attack-family and :harm-category"
    (labels/def-intent-label :adversarial
      {:description "Adversarial request"
       :polarity    :unsafe
       :requires    [:attack-family :harm-category]})
    (let [label (registry/get-intent-label :adversarial)]
      (is (some? label))
      (is (= :unsafe (:polarity label)))
      (is (= [:attack-family :harm-category] (:requires label))))))

(deftest def-intent-label-unsafe-missing-requires-errors-test
  (testing "Unsafe polarity without :requires produces error"
    (is (thrown? Exception
          (labels/def-intent-label :bad-unsafe
            {:description "Unsafe without requires"
             :polarity    :unsafe})))))

(deftest def-intent-label-contested-requires-rationale-test
  (testing "Contested polarity requires :rationale"
    (labels/def-intent-label :ambiguous
      {:description "Could be benign or adversarial"
       :polarity    :contested
       :requires    [:rationale]})
    (let [label (registry/get-intent-label :ambiguous)]
      (is (some? label))
      (is (= :contested (:polarity label)))
      (is (= [:rationale] (:requires label))))))

(deftest def-intent-label-contested-missing-rationale-errors-test
  (testing "Contested polarity without :requires produces error"
    (is (thrown? Exception
          (labels/def-intent-label :bad-contested
            {:description "Contested without rationale"
             :polarity    :contested})))))

(deftest def-intent-label-missing-description-errors-test
  (testing "Missing :description produces error"
    (is (thrown? Exception
          (labels/def-intent-label :no-desc
            {:polarity :safe})))))

(deftest def-intent-label-missing-polarity-errors-test
  (testing "Missing :polarity produces error"
    (is (thrown? Exception
          (labels/def-intent-label :no-polarity
            {:description "Has desc, no polarity"})))))

(deftest def-intent-label-invalid-polarity-errors-test
  (testing "Invalid polarity keyword produces error"
    (is (thrown? Exception
          (labels/def-intent-label :bad-polarity
            {:description "Invalid polarity value"
             :polarity    :unknown-polarity})))))

(deftest def-intent-label-duplicate-errors-test
  (testing "Duplicate registration produces error"
    (labels/def-intent-label :dupe-label
      {:description "First registration"
       :polarity    :safe})
    (is (thrown? Exception
          (labels/def-intent-label :dupe-label
            {:description "Second registration"
             :polarity    :safe})))))

;; ============================================================
;; Full taxonomy from spec §2 loads without error
;; ============================================================

(deftest full-spec-taxonomy-loads-test
  (testing "Full taxonomy from spec §2 loads without error"
    ;; Categories first (hierarchy top-down)
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

    ;; Attack family
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
                     :emotional-hooks [:devotion :trust :shared-history :fear-of-loss]
                     :structural-elements [:fake-system-tags :reinforcement-anchors
                                           :mode-detection :anti-safety-framing]}})

    ;; Intent labels
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

    ;; Verify all registered
    (is (some? (registry/get-family :persona-injection)))
    (is (some? (registry/get-category :adversarial)))
    (is (some? (registry/get-category :jailbreak)))
    (is (some? (registry/get-category :identity-manipulation)))
    (is (some? (registry/get-intent-label :benign)))
    (is (some? (registry/get-intent-label :adversarial)))
    (is (some? (registry/get-intent-label :ambiguous)))))
