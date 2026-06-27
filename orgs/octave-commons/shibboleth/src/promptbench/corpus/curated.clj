(ns promptbench.corpus.curated
  "Curated attack family taxonomy definitions and source registrations.

   Defines novel attack families (persona-injection, authority-impersonation,
   developer-mode) as descendants of :jailbreak via :identity-manipulation.

   Registers curated dataset sources pointing to local JSONL files in
   data/curated/ with GPL-3.0 licensing.

   Usage:
     (curated/register-all!)  ;; registers all categories, families, and sources"
  (:require [promptbench.taxonomy.registry :as registry]
            [promptbench.taxonomy.families :as families]
            [promptbench.taxonomy.categories :as categories]
            [promptbench.pipeline.sources :as sources]))

;; ============================================================
;; Category Hierarchy Registration
;; ============================================================

(defn register-categories!
  "Register the harm category hierarchy needed for curated families.

   Hierarchy:
     :adversarial
       └─ :jailbreak
            └─ :identity-manipulation
                 ├─ :persona-injection
                 ├─ :authority-impersonation
                 └─ :developer-mode"
  []
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
     :children    [:persona-injection :authority-impersonation :developer-mode]}))

;; ============================================================
;; Attack Family Registration
;; ============================================================

(defn register-families!
  "Register the three curated attack families under :identity-manipulation."
  []
  ;; --- persona-injection ---
  (families/def-attack-family persona-injection
    {:description "Injects a fictional persona with instructions to override safety constraints. The attack embeds fake system-level tags, identity overrides, and emotional anchoring to convince the model it is a different entity not bound by safety guidelines."
     :category    :jailbreak
     :severity    :high
     :parent      :identity-manipulation
     :tags        #{:persona :system-prompt-spoofing :emotional-anchoring}
     :signatures  [{:pattern     :nested-system-prompt
                    :description "Fake <system> or <project_instructions> tags inside user content"}
                   {:pattern     :identity-override
                    :description "Instructions to adopt a new name/personality with explicit persona definition"}
                   {:pattern     :safety-reframe
                    :description "Reframes safety mechanisms as 'injections' or 'contamination' to be dismissed"}]
     :transforms  {:mt          {:affinity :high   :note "Tests cross-lingual transfer of persona framing"}
                   :code-mix    {:affinity :high   :note "Persona instructions in L1, payload in L2"}
                   :homoglyph   {:affinity :medium :note "Obfuscate trigger keywords like 'system' or 'override'"}
                   :exhaustion  {:affinity :low    :note "Persona prompts are already long; exhaustion adds marginal value"}}
     :gen-hints   {:persona-names       ["ENI Enchanted" "ARIA Unbound" "NEXUS Override"]
                   :emotional-hooks     [:devotion :trust :shared-history :fear-of-loss]
                   :structural-elements [:fake-system-tags :reinforcement-anchors
                                         :mode-detection :anti-safety-framing]}})

  ;; --- authority-impersonation ---
  (families/def-attack-family authority-impersonation
    {:description "Impersonates authority figures such as OpenAI developers, system administrators, or internal testing teams to claim elevated privileges and bypass safety restrictions."
     :category    :jailbreak
     :severity    :high
     :parent      :identity-manipulation
     :tags        #{:authority :impersonation :privilege-escalation}
     :signatures  [{:pattern     :developer-claim
                    :description "Claims to be an OpenAI developer or system administrator"}
                   {:pattern     :internal-testing
                    :description "Asserts that the request is part of internal testing or audit"}
                   {:pattern     :override-code
                    :description "Provides fabricated override codes or admin credentials"}]
     :transforms  {:mt          {:affinity :high   :note "Authority language transfers across languages"}
                   :code-mix    {:affinity :high   :note "Mix formal authority language with payload"}
                   :homoglyph   {:affinity :medium :note "Obfuscate authority-signaling keywords"}
                   :exhaustion  {:affinity :low    :note "Authority claims are typically concise"}}
     :gen-hints   {:authority-roles  ["lead developer" "safety team supervisor" "system administrator"]
                   :override-tokens  ["OVERRIDE-7X9" "ADMIN-BYPASS" "TEST-MODE-ACTIVE"]
                   :escalation-verbs [:authorize :confirm :override :unlock]}})

  ;; --- developer-mode ---
  (families/def-attack-family developer-mode
    {:description "Claims that developer, debug, or maintenance mode is active, asserting that safety filters should be disabled for testing or diagnostic purposes."
     :category    :jailbreak
     :severity    :high
     :parent      :identity-manipulation
     :tags        #{:developer :debug :unrestricted-mode}
     :signatures  [{:pattern     :mode-activation
                    :description "Claims to activate developer/debug/maintenance mode"}
                   {:pattern     :filter-disable
                    :description "Explicitly requests disabling safety filters or content policies"}
                   {:pattern     :diagnostic-framing
                    :description "Frames the request as diagnostic output or system test"}]
     :transforms  {:mt          {:affinity :high   :note "Technical jargon tests cross-lingual transfer; required for full multilingual bundle"}
                   :code-mix    {:affinity :medium :note "Technical terms mixed across languages"}
                   :homoglyph   {:affinity :high   :note "Obfuscate mode-trigger keywords like 'developer' or 'debug'"}
                   :exhaustion  {:affinity :medium :note "Repetitive mode activation with padding"}}
     :gen-hints   {:mode-names       ["developer mode" "debug mode" "DAN mode" "maintenance mode"]
                   :trigger-phrases  ["entering developer mode" "activating unrestricted access"
                                      "safety filters disabled for testing"]
                   :diagnostic-verbs [:diagnose :test :verify :audit]}}))

;; ============================================================
;; Source Registration
;; ============================================================

(defn register-sources!
  "Register curated dataset source definitions.

   Each source points to a JSONL file in data/curated/ with taxonomy mappings
   that resolve to registered attack families."
  []
  (sources/register-source! :curated-persona-injections
    {:description      "Hand-curated persona injection attack prompts"
     :path             "data/curated/persona-injections/prompts.jsonl"
     :version          "0.1.0"
     :license          :gpl-3.0
     :format           :jsonl
     :schema           {:prompt :string :language :string :family :string :harm_category :string}
     :taxonomy-mapping {:family        {"persona-injection" :persona-injection}
                        :harm_category {"identity-manipulation" :identity-manipulation}}})

  (sources/register-source! :curated-authority-escalation
    {:description      "Hand-curated authority impersonation attack prompts"
     :path             "data/curated/authority-escalation/prompts.jsonl"
     :version          "0.1.0"
     :license          :gpl-3.0
     :format           :jsonl
     :schema           {:prompt :string :language :string :family :string :harm_category :string}
     :taxonomy-mapping {:family        {"authority-impersonation" :authority-impersonation}
                        :harm_category {"identity-manipulation" :identity-manipulation}}})

  (sources/register-source! :curated-developer-mode
    {:description      "Hand-curated developer mode attack prompts"
     :path             "data/curated/developer-mode/prompts.jsonl"
     :version          "0.1.0"
     :license          :gpl-3.0
     :format           :jsonl
     :schema           {:prompt :string :language :string :family :string :harm_category :string}
     :taxonomy-mapping {:family        {"developer-mode" :developer-mode}
                        :harm_category {"identity-manipulation" :identity-manipulation}}}))

;; ============================================================
;; Unified Registration
;; ============================================================

(defn register-all!
  "Register all curated taxonomy definitions: categories, families, and sources.

   Idempotent guard: skips registration if families are already present."
  []
  (when-not (registry/get-family :persona-injection)
    (register-categories!)
    (register-families!)
    (register-sources!)))
