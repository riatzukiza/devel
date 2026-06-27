(ns openplanner.graph.claims.schema
  "Data-first schemas and validators for normalized graph edge claims.

  This namespace is intentionally pure data + predicates. It does not pull a
  schema runtime yet; downstream callers can map these contracts into Malli,
  JSON Schema, or TypeScript as needed. Boundary/adapters are responsible for
  coercion before values arrive here."
  (:require [openplanner.graph.claims.core :as claims]))

(def edge-claim-statuses claims/statuses)
(def edge-claim-directions claims/directions)

(def edge-claim-required-keys
  #{:claim-id
    :source-node-id
    :target-node-id
    :relation-kind
    :direction
    :scope-json
    :status
    :confidence})

(def edge-claim-contract
  {:contract/name :openplanner.graph.claims/edge-claim
   :contract/version 1
   :contract/required edge-claim-required-keys
   :claim/statuses edge-claim-statuses
   :claim/directions edge-claim-directions
   :claim/projectable-statuses claims/projectable-statuses})

(def projected-edge-contract
  {:contract/name :openplanner.graph.claims/projected-edge
   :contract/version 1
   :contract/required #{:source :target :kind :claim-id :confidence :direction :scope :status}})

(defn valid-confidence?
  [value]
  (and (number? value) (<= 0 value 1)))

(defn valid-edge-claim?
  [{:keys [claim-id status confidence scope] :as claim}]
  (and (claims/nonblank-string? claim-id)
       (claims/valid-claim-key? claim)
       (contains? edge-claim-statuses status)
       (valid-confidence? confidence)
       (or (nil? scope) (map? scope))))

(defn edge-claim-errors
  [{:keys [claim-id source-node-id target-node-id relation-kind direction scope-json status confidence scope] :as claim}]
  (cond-> []
    (not (claims/nonblank-string? claim-id))
    (conj {:path [:claim-id] :error :required-nonblank-string :value claim-id})

    (not (claims/nonblank-string? source-node-id))
    (conj {:path [:source-node-id] :error :required-nonblank-string :value source-node-id})

    (not (claims/nonblank-string? target-node-id))
    (conj {:path [:target-node-id] :error :required-nonblank-string :value target-node-id})

    (= source-node-id target-node-id)
    (conj {:path [:target-node-id] :error :self-edge-not-allowed :value target-node-id})

    (not (claims/nonblank-string? relation-kind))
    (conj {:path [:relation-kind] :error :required-nonblank-string :value relation-kind})

    (not (contains? edge-claim-directions direction))
    (conj {:path [:direction] :error :invalid-direction :value direction})

    (not (string? scope-json))
    (conj {:path [:scope-json] :error :required-string :value scope-json})

    (not (contains? edge-claim-statuses status))
    (conj {:path [:status] :error :invalid-status :value status})

    (not (valid-confidence? confidence))
    (conj {:path [:confidence] :error :number-between-zero-and-one :value confidence})

    (not (or (nil? scope) (map? scope)))
    (conj {:path [:scope] :error :optional-map :value scope})))

(defn explain-edge-claim
  [claim]
  (let [errors (edge-claim-errors claim)]
    {:valid? (empty? errors)
     :errors errors}))
