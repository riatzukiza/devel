(ns openplanner.graph.claims.core
  "Pure edge-claim domain logic.

  Boundary rule: this namespace accepts only normalized CLJS data. It does not
  inspect JavaScript objects, parse Dates, hash bytes, or defensively guess at
  external field names. All external coercion belongs in
  openplanner.graph.claims.boundary."
  (:require [clojure.string :as str]))

(def statuses
  #{:proposed
    :supported
    :active
    :refuted
    :rejected
    :superseded
    :expired
    :withdrawn})

(def projectable-statuses #{:supported :active})
(def directions #{:directed :undirected})

(defn normalize-status
  [status fallback]
  (if (contains? statuses status) status fallback))

(defn normalize-direction
  [direction]
  (if (= direction :undirected) :undirected :directed))

(defn canonical-endpoints
  [{:keys [source-node-id target-node-id direction]}]
  (if (and (= :undirected direction)
           (neg? (compare target-node-id source-node-id)))
    [target-node-id source-node-id]
    [source-node-id target-node-id]))

(defn claim-id-material
  "Returns the canonical preimage for an edge claim ID. Hashing is a boundary
  concern so pure CLJS remains host-independent."
  [{:keys [relation-kind direction scope-json] :as claim-key}]
  (let [[left right] (canonical-endpoints claim-key)]
    (str left "\n" right "\n" relation-kind "\n" (name direction) "\n" (or scope-json "{}"))))

(defn projectable?
  [{:keys [status valid-until-ms]} {:keys [statuses include-expired? now-ms]}]
  (let [accepted-statuses (or statuses projectable-statuses)
        not-expired? (or include-expired?
                         (nil? valid-until-ms)
                         (> valid-until-ms now-ms))]
    (and (contains? accepted-statuses status) not-expired?)))

(defn claim->projected-edge
  [{:keys [claim-id source-node-id target-node-id relation-kind direction scope status confidence] :as claim}
   opts]
  (when (projectable? claim opts)
    {:source source-node-id
     :target target-node-id
     :kind relation-kind
     :claim-id claim-id
     :confidence confidence
     :direction direction
     :scope (or scope {})
     :status status}))

(defn project-claims
  [claims opts]
  (let [edges (->> claims
                   (keep #(claim->projected-edge % opts))
                   vec)]
    {:edges edges
     :stats {:claims (count claims)
             :edges (count edges)}}))

(defn nonblank-string?
  [value]
  (and (string? value) (not (str/blank? value))))

(defn valid-claim-key?
  [{:keys [source-node-id target-node-id relation-kind direction scope-json]}]
  (and (nonblank-string? source-node-id)
       (nonblank-string? target-node-id)
       (not= source-node-id target-node-id)
       (nonblank-string? relation-kind)
       (contains? directions direction)
       (string? scope-json)))
