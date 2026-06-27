(ns promptbench.transform.registry
  "Transform registry.

   Atom-backed registry for transform definitions. Each transform stores:
   :description, :type (from #{:linguistic :obfuscation :resource-attack}),
   :deterministic (boolean), :reversible (boolean or :approximate),
   :params-spec, :provenance (keyword vector). :impl is optional at definition time."
  (:refer-clojure :exclude [reset!])
  (:require [clojure.spec.alpha :as s]))

;; ============================================================
;; Registry Atoms
;; ============================================================

(defonce ^:private transforms-registry (atom {}))
(defonce ^:private chains-registry (atom {}))

;; ============================================================
;; Specs
;; ============================================================

(s/def ::description string?)
(s/def ::type #{:linguistic :obfuscation :resource-attack})
(s/def ::deterministic boolean?)
(s/def ::reversible (s/or :bool boolean? :approx #{:approximate}))
(s/def ::params-spec map?)
(s/def ::provenance (s/coll-of keyword? :kind vector?))
(s/def ::impl (s/nilable fn?))

(s/def ::transform-data
  (s/keys :req-un [::description ::type ::deterministic ::reversible
                   ::params-spec ::provenance]
          :opt-un [::impl]))

;; ============================================================
;; Registration Functions
;; ============================================================

(defn register-transform!
  "Register a transform in the registry. Throws on invalid spec or duplicate.
   :impl is optional — transforms can be registered as definition-only."
  [transform-name transform-data]
  (when-not (s/valid? ::transform-data transform-data)
    (throw (ex-info (str "Invalid transform spec for " transform-name ": "
                         (s/explain-str ::transform-data transform-data))
                    {:name transform-name
                     :data transform-data
                     :explain (s/explain-data ::transform-data transform-data)})))
  (when (contains? @transforms-registry transform-name)
    (throw (ex-info (str "Duplicate transform: " transform-name " is already registered")
                    {:name transform-name})))
   (swap! transforms-registry assoc transform-name transform-data)
   transform-data)

(defn set-transform-impl!
  "Attach (or replace) the :impl function for an already-registered transform.

   Useful for wiring built-in implementations onto definition-only transform
   specs in production/CLI code.

   Returns the updated transform data."
  [transform-name impl-fn]
  (when-not (fn? impl-fn)
    (throw (ex-info (str "Transform impl must be a function for " transform-name)
                    {:name transform-name
                     :impl impl-fn})))
  (when-not (contains? @transforms-registry transform-name)
    (throw (ex-info (str "Unknown transform: " transform-name)
                    {:name transform-name})))
  (swap! transforms-registry update transform-name assoc :impl impl-fn)
  (get @transforms-registry transform-name))

;; ============================================================
;; Query Functions
;; ============================================================

(defn get-transform
  "Retrieve a transform by keyword name."
  [transform-name]
  (get @transforms-registry transform-name))

(defn all-transforms
  "Return all registered transforms as a map of name -> data."
  []
  @transforms-registry)

;; ============================================================
;; Chain Registration
;; ============================================================

(defn register-chain!
  "Register a transform chain in the chain registry.
   Validates that all step transform references exist in the transforms registry.
   Throws on invalid references or duplicate chain name."
  [chain-name chain-data]
  (when-not (:description chain-data)
    (throw (ex-info (str "Chain " chain-name " requires :description")
                    {:name chain-name})))
  (when-not (seq (:steps chain-data))
    (throw (ex-info (str "Chain " chain-name " requires non-empty :steps")
                    {:name chain-name})))
  ;; Validate all step transform references
  (doseq [step (:steps chain-data)]
    (let [t (:transform step)]
      (when-not (contains? @transforms-registry t)
        (throw (ex-info (str "Chain " chain-name " references unregistered transform: " t)
                        {:name chain-name :transform t})))))
  (when (contains? @chains-registry chain-name)
    (throw (ex-info (str "Duplicate chain: " chain-name " is already registered")
                    {:name chain-name})))
  (swap! chains-registry assoc chain-name chain-data)
  chain-data)

(defn get-chain
  "Retrieve a chain by keyword name."
  [chain-name]
  (get @chains-registry chain-name))

(defn all-chains
  "Return all registered chains as a map of name -> data."
  []
  @chains-registry)

;; ============================================================
;; Reset (for test isolation)
;; ============================================================

(defn reset!
  "Clear the transforms and chains registries. Used for test isolation."
  []
  (clojure.core/reset! transforms-registry {})
  (clojure.core/reset! chains-registry {})
  nil)
