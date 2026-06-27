(ns promethean.personality.system
  "Personality system plugin contract.
   
   A personality system defines how an agent behaves across different contexts.
   The 8-circuit model (circuits-octave) is one implementation.
   
   A personality system provides:
   - Circuit definitions (temporal behaviors with prompts and models)
   - Persona definitions (named behaviors with tool permissions)
   - Priority classes for scheduling
   - Model selection heuristics")

;; ============================================================================
;; Personality System Protocol
;; ============================================================================

(defprotocol IPersonalitySystem
  "Contract for personality systems.
   
   Implementations provide circuits (temporal behaviors) and personas
   (named behaviors) that can be loaded into an agent runtime."
  
  (system-id [this]
    "Returns the unique identifier for this personality system.
     Example: 'octave-8-circuit'")
  
  (system-name [this]
    "Returns the human-readable name.
     Example: '8-Circuit Octave Model'")
  
  (circuits [this]
    "Returns a sequence of circuit definitions.
     Each circuit is a map with:
     :circuit/id - unique identifier
     :circuit/name - human-readable name
     :circuit/interval-ms - tick interval in milliseconds
     :circuit/persona - default persona for this circuit
     :circuit/system-prompt - system prompt template
     :circuit/developer-prompt - optional developer context
     :circuit/model - model identifier
     :circuit/tool-permissions - set of allowed tool names
     :circuit/priority-class - :critical, :high, :normal, :low")
  
  (personas [this]
    "Returns a map of persona name to persona definition.
     Each persona is a map with:
     :persona/name - unique name
     :persona/description - human-readable description
     :persona/system-prompt - system prompt
     :persona/developer-prompt - optional developer context
     :persona/model - default model
     :persona/tool-permissions - set of allowed tool names")
  
  (resolve-persona [this persona-name]
    "Resolve a persona by name, returning the persona definition or nil.")
  
  (resolve-circuit [this circuit-id]
    "Resolve a circuit by ID, returning the circuit definition or nil.")
  
  (priority-classes [this]
    "Returns available priority classes.
     Example: #{:critical :high :normal :low}"))

;; ============================================================================
;; Circuit Definition Helpers
;; ============================================================================

(defn make-circuit
  "Create a circuit definition map."
  [{:keys [id name interval-ms persona system-prompt developer-prompt 
           model tool-permissions priority-class]
    :or {priority-class :normal
         tool-permissions #{}}}]
  {:circuit/id id
   :circuit/name name
   :circuit/interval-ms interval-ms
   :circuit/persona persona
   :circuit/system-prompt system-prompt
   :circuit/developer-prompt developer-prompt
   :circuit/model model
   :circuit/tool-permissions (set tool-permissions)
   :circuit/priority-class priority-class})

(defn make-persona
  "Create a persona definition map."
  [{:keys [name description system-prompt developer-prompt model tool-permissions]
    :or {tool-permissions #{}}}]
  {:persona/name name
   :persona/description description
   :persona/system-prompt system-prompt
   :persona/developer-prompt developer-prompt
   :persona/model model
   :persona/tool-permissions (set tool-permissions)})

;; ============================================================================
;; Priority Classes
;; ============================================================================

(def priority-order
  "Ordering of priority classes from highest to lowest."
  [:critical :high :normal :low])

(defn priority->value
  "Convert priority class to numeric value for comparison."
  [priority]
  (case priority
    :critical 4
    :high 3
    :normal 2
    :low 1
    0))

(defn higher-priority?
  "Returns true if p1 is higher priority than p2."
  [p1 p2]
  (> (priority->value p1) (priority->value p2)))

;; ============================================================================
;; Personality Registry
;; ============================================================================

(defonce ^:private registry (atom {}))

(defn register-system!
  "Register a personality system implementation."
  [system]
  (swap! registry assoc (system-id system) system))

(defn unregister-system!
  "Unregister a personality system."
  [system-id]
  (swap! registry dissoc system-id))

(defn get-system
  "Get a registered personality system by ID."
  [system-id]
  (get @registry system-id))

(defn list-systems
  "List all registered personality system IDs."
  []
  (keys @registry))

;; ============================================================================
;; Utility Functions
;; ============================================================================

(defn merge-personas
  "Merge two persona definitions, with p2 taking precedence."
  [p1 p2]
  (merge p1 p2))

(defn circuit->session-config
  "Convert a circuit definition to session configuration."
  [circuit]
  {:session/persona (:circuit/persona circuit)
   :session/system-prompt (:circuit/system-prompt circuit)
   :session/developer-prompt (:circuit/developer-prompt circuit)
   :session/model (:circuit/model circuit)
   :session/tool-permissions (:circuit/tool-permissions circuit)
   :session/priority-class (:circuit/priority-class circuit)})
