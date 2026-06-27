;; pm2-clj.internal - Internal keys and sentinel values
;;
;; This namespace defines internal keys used for prototype-based DSL
;; and sentinel values for special operations like key removal.

(ns pm2-clj.internal)

;; ============================================================================
;; Sentinel Values
;; ============================================================================

;; Sentinel used to remove keys during deep merge
(def remove ::remove)

;; ============================================================================
;; Internal Keys
;; ============================================================================

;; All internal keys use a namespaced keyword for safety.
;; These are used by the prototype DSL but are not passed to PM2.

;; Type marker for prototype objects
(def type-key ::type)

;; Kind marker for prototype variants (:app, :profile, :mixin, :stack)
(def kind-key ::kind)

;; ID for tracking and referencing prototypes
(def id-key ::id)

;; Base prototype reference (for extends)
(def base-key ::base)

;; Patch operations to apply
(def patch-key ::patch)

;; Exported symbols from a module
(def exports-key ::exports)

;; App removal flag
(def remove-app-flag ::remove-app)

;; Name prefix for scoping
(def name-prefix-key ::name-prefix)

;; Name delimiter for scoping
(def name-delim-key ::name-delim)

;; ============================================================================
;; Key Predicates
;; ============================================================================

(defn internal-key?
  "Check if a keyword is an internal DSL key."
  [k]
  (boolean (#{type-key kind-key id-key base-key patch-key exports-key} k)))

(defn sentinel?
  "Check if a value is the remove sentinel."
  [v]
  (= v remove))

;; ============================================================================
;; Utility Functions
;; ============================================================================

(defn remove-internal-keys
  "Remove all internal keys from a map before passing to PM2."
  [m]
  (when m
    (into {} (remove (fn [[k _]] (internal-key? k))) m)))

(defn has-internal-keys?
  "Check if a map contains any internal keys."
  [m]
  (some (fn [[k _]] (internal-key? k)) m))
