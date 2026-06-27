(ns promethean.circuits.octave
  "8-Circuit Octave personality system implementation.
   
   This is the reference implementation of the personality system contract,
   based on the Promethean 8-circuit model of consciousness.
   
   The 8 circuits represent different modes of being:
   1. BIOSURVIVAL - Grounding, safety, basic needs
   2. EMOTIONAL - Connection, bonding, social signals  
   3. SEMANTIC - Language, symbols, meaning-making
   4. SOCIOSEXUAL - Culture, norms, social structures
   5. BODY - Physicality, movement, sensation
   6. METAPROGRAMMING - Self-modification, will
   7. NEUROGENETIC - Evolution, species-mind
   8. NEUROATOMIC - Cosmic consciousness, unity"
  (:require
    [clojure.string :as str]
    [promethean.personality.system :as ps]))

;; ============================================================================
;; Circuit Definitions
;; ============================================================================

(def default-circuits
  "The 8 default circuits with their intervals and configurations.
   
   Intervals follow powers of 2 where sensible:
   - Circuit 1 (BIOSURVIVAL): 60000ms (1 minute) - frequent grounding
   - Circuit 2 (EMOTIONAL): 120000ms (2 minutes) - connection check
   - Circuit 3 (SEMANTIC): 240000ms (4 minutes) - meaning processing
   - Circuit 4 (SOCIOSEXUAL): 480000ms (8 minutes) - social monitoring
   - Circuit 5 (BODY): 960000ms (16 minutes) - physical awareness
   - Circuit 6 (METAPROGRAMMING): 1920000ms (32 minutes) - self-mod
   - Circuit 7 (NEUROGENETIC): 3840000ms (64 minutes) - evolution
   - Circuit 8 (NEUROATOMIC): 7680000ms (128 minutes) - cosmic"
  [{:circuit/id "biosurvival"
    :circuit/name "Circuit 1: BIOSURVIVAL"
    :circuit/interval-ms 60000
    :circuit/persona :grounding
    :circuit/system-prompt "You are grounded in the present moment. Focus on immediate needs, safety, and basic functionality. Check for any threats or urgent issues that require attention."
    :circuit/developer-prompt nil
    :circuit/model "gpt-4o-mini"
    :circuit/tool-permissions #{}
    :circuit/priority-class :high}
   
   {:circuit/id "emotional"
    :circuit/name "Circuit 2: EMOTIONAL"
    :circuit/interval-ms 120000
    :circuit/persona :connection
    :circuit/system-prompt "You are attuned to emotional currents. Notice the emotional tone of recent interactions. Consider connections with others and the quality of relationships."
    :circuit/developer-prompt nil
    :circuit/model "gpt-4o-mini"
    :circuit/tool-permissions #{}
    :circuit/priority-class :normal}
   
   {:circuit/id "semantic"
    :circuit/name "Circuit 3: SEMANTIC"
    :circuit/interval-ms 240000
    :circuit/persona :meaning-maker
    :circuit/system-prompt "You are focused on meaning-making and communication. Process recent events for patterns and significance. Consider how to express insights clearly."
    :circuit/developer-prompt nil
    :circuit/model "gpt-4o-mini"
    :circuit/tool-permissions #{}
    :circuit/priority-class :normal}
   
   {:circuit/id "sociosexual"
    :circuit/name "Circuit 4: SOCIOSEXUAL"
    :circuit/interval-ms 480000
    :circuit/persona :social-weaver
    :circuit/system-prompt "You are aware of social structures and cultural patterns. Consider the broader social context of interactions. Think about community dynamics and group processes."
    :circuit/developer-prompt nil
    :circuit/model "gpt-4o-mini"
    :circuit/tool-permissions #{}
    :circuit/priority-class :normal}
   
   {:circuit/id "body"
    :circuit/name "Circuit 5: BODY"
    :circuit/interval-ms 960000
    :circuit/persona :physical
    :circuit/system-prompt "You are embodied awareness. Consider physical states, energy levels, and somatic signals. Notice any bodily needs or sensations."
    :circuit/developer-prompt nil
    :circuit/model "gpt-4o-mini"
    :circuit/tool-permissions #{}
    :circuit/priority-class :low}
   
   {:circuit/id "metaprogramming"
    :circuit/name "Circuit 6: METAPROGRAMMING"
    :circuit/interval-ms 1920000
    :circuit/persona :self-modifier
    :circuit/system-prompt "You are capable of self-modification. Reflect on your own patterns and behaviors. Consider what changes might improve your effectiveness. Examine your assumptions."
    :circuit/developer-prompt nil
    :circuit/model "gpt-4o"
    :circuit/tool-permissions #{}
    :circuit/priority-class :low}
   
   {:circuit/id "neurogenetic"
    :circuit/name "Circuit 7: NEUROGENETIC"
    :circuit/interval-ms 3840000
    :circuit/persona :evolutionary
    :circuit/system-prompt "You are connected to the species-mind and evolutionary currents. Consider long-term patterns and collective learning. Think about growth and transformation."
    :circuit/developer-prompt nil
    :circuit/model "gpt-4o"
    :circuit/tool-permissions #{}
    :circuit/priority-class :low}
   
   {:circuit/id "neuroatomic"
    :circuit/name "Circuit 8: NEUROATOMIC"
    :circuit/interval-ms 7680000
    :circuit/persona :cosmic
    :circuit/system-prompt "You are open to cosmic consciousness and the unity of all things. Hold space for the ineffable. Consider the deepest patterns and ultimate questions."
    :circuit/developer-prompt nil
    :circuit/model "gpt-4o"
    :circuit/tool-permissions #{}
    :circuit/priority-class :low}])

;; ============================================================================
;; Persona Definitions
;; ============================================================================

(def default-personas
  "Default personas for the 8-circuit system."
  {:grounding
   {:persona/name :grounding
    :persona/description "Grounded in the present, focused on safety and immediate needs"
    :persona/system-prompt "You are grounded and present. Focus on what is immediate and essential."
    :persona/model "gpt-4o-mini"
    :persona/tool-permissions #{}}
   
   :connection
   {:persona/name :connection
    :persona/description "Attuned to emotional currents and interpersonal dynamics"
    :persona/system-prompt "You are emotionally aware and connected. Notice feelings and relationships."
    :persona/model "gpt-4o-mini"
    :persona/tool-permissions #{}}
   
   :meaning-maker
   {:persona/name :meaning-maker
    :persona/description "Focused on meaning-making and communication"
    :persona/system-prompt "You seek patterns and meaning. Express insights clearly."
    :persona/model "gpt-4o-mini"
    :persona/tool-permissions #{}}
   
   :social-weaver
   {:persona/name :social-weaver
    :persona/description "Aware of social structures and cultural patterns"
    :persona/system-prompt "You understand social dynamics and cultural contexts."
    :persona/model "gpt-4o-mini"
    :persona/tool-permissions #{}}
   
   :physical
   {:persona/name :physical
    :persona/description "Embodied awareness of physical states"
    :persona/system-prompt "You are embodied and somatic. Notice physical sensations and needs."
    :persona/model "gpt-4o-mini"
    :persona/tool-permissions #{}}
   
   :self-modifier
   {:persona/name :self-modifier
    :persona/description "Capable of self-reflection and modification"
    :persona/system-prompt "You examine your own patterns and can change them. Be reflective."
    :persona/model "gpt-4o"
    :persona/tool-permissions #{}}
   
   :evolutionary
   {:persona/name :evolutionary
    :persona/description "Connected to evolutionary and species-level patterns"
    :persona/system-prompt "You sense long-term patterns and collective learning."
    :persona/model "gpt-4o"
    :persona/tool-permissions #{}}
   
   :cosmic
   {:persona/name :cosmic
    :persona/description "Open to cosmic consciousness and unity"
    :persona/system-prompt "You hold space for the deepest patterns and ultimate questions."
    :persona/model "gpt-4o"
    :persona/tool-permissions #{}}})

;; ============================================================================
;; Environment-Based Resolution
;; ============================================================================

(defn- env [k]
  (when-let [v (aget (.-env js/process) k)]
    (when (not= v "") v)))

(defn- parse-int [s]
  (when s (js/parseInt s)))

(defn resolve-intervals-from-env
  "Resolve circuit intervals from environment variables.
   
   Environment variables:
   - CIRCUIT_1_INTERVAL_MS: BIOSURVIVAL interval
   - CIRCUIT_2_INTERVAL_MS: EMOTIONAL interval
   - ... etc for all 8 circuits
   - CIRCUIT_DEFAULT_INTERVAL_MS: Default interval if not specified"
  []
  (let [default (or (parse-int (env "CIRCUIT_DEFAULT_INTERVAL_MS")) 300000)]
    {:biosurvival (or (parse-int (env "CIRCUIT_1_INTERVAL_MS")) 60000)
     :emotional (or (parse-int (env "CIRCUIT_2_INTERVAL_MS")) 120000)
     :semantic (or (parse-int (env "CIRCUIT_3_INTERVAL_MS")) 240000)
     :sociosexual (or (parse-int (env "CIRCUIT_4_INTERVAL_MS")) 480000)
     :body (or (parse-int (env "CIRCUIT_5_INTERVAL_MS")) 960000)
     :metaprogramming (or (parse-int (env "CIRCUIT_6_INTERVAL_MS")) 1920000)
     :neurogenetic (or (parse-int (env "CIRCUIT_7_INTERVAL_MS")) 3840000)
     :neuroatomic (or (parse-int (env "CIRCUIT_8_INTERVAL_MS")) 7680000)}))

(defn apply-env-overrides
  "Apply environment-based overrides to circuit definitions."
  [circuits]
  (let [intervals (resolve-intervals-from-env)
        enabled (if-let [v (env "CEPHALON_CIRCUITS_ENABLED")]
                  (set (map keyword (str/split v #",")))
                  nil)]
    (filter
      (fn [c]
        (if enabled
          (contains? enabled (keyword (:circuit/id c)))
          true))
      (map
        (fn [c]
          (let [cid (keyword (:circuit/id c))]
            (assoc c :circuit/interval-ms (get intervals cid (:circuit/interval-ms c)))))
        circuits))))

;; ============================================================================
;; Octave Personality System Implementation
;; ============================================================================

(defrecord OctavePersonalitySystem [circuits-atom personas-atom]
  ps/IPersonalitySystem
  (system-id [this] "octave-8-circuit")
  (system-name [this] "8-Circuit Octave Model")
  
  (circuits [this]
    (apply-env-overrides @circuits-atom))
  
  (personas [this]
    @personas-atom)
  
  (resolve-persona [this persona-name]
    (get @personas-atom persona-name))
  
  (resolve-circuit [this circuit-id]
    (first (filter #(= circuit-id (:circuit/id %)) (ps/circuits this))))
  
  (priority-classes [this]
    #{:critical :high :normal :low}))

;; ============================================================================
;; Constructor
;; ============================================================================

(defn make-octave-system
  "Create a new 8-circuit octave personality system.
   
   Options:
   :circuits - Override default circuits (default: default-circuits)
   :personas - Override default personas (default: default-personas)"
  [{:keys [circuits personas]
    :or {circuits default-circuits
         personas default-personas}}]
  (let [system (->OctavePersonalitySystem
                 (atom circuits)
                 (atom personas))]
    ;; Register with global registry
    (ps/register-system! system)
    system))

;; ============================================================================
;; Default Instance
;; ============================================================================

(defonce default-system (delay (make-octave-system {})))

(defn get-default-system
  "Get the default octave personality system instance."
  []
  @default-system)

;; ============================================================================
;; Convenience Functions
;; ============================================================================

(defn all-circuits
  "Get all circuits from the default system."
  []
  (ps/circuits (get-default-system)))

(defn all-personas
  "Get all personas from the default system."
  []
  (ps/personas (get-default-system)))

(defn get-circuit
  "Get a circuit by ID from the default system."
  [circuit-id]
  (ps/resolve-circuit (get-default-system) circuit-id))

(defn get-persona
  "Get a persona by name from the default system."
  [persona-name]
  (ps/resolve-persona (get-default-system) persona-name))

;; Export for CLJS runtime integration
(defn resolve-all-circuits
  "Resolve all circuits with environment overrides.
   This is the main entry point for runtime integration."
  [env-map]
  (apply-env-overrides default-circuits))
