(ns openplanner.graph.claims.adapters.mongo
  "Mongo row/document adapter for graph edge claims.

  This namespace normalizes Mongo-ish document shapes into the same JS-facing
  boundary used by HTTP/ESM callers. It contains field alias knowledge only; it
  does not decide whether a claim should be accepted or projected."
  (:require [openplanner.graph.claims.boundary :as boundary]
            [openplanner.graph.claims.core :as claims]))

(defn- get-any
  [m ks]
  (some (fn [k]
          (when (contains? m k)
            (get m k)))
        ks))

(defn- mongo-claim->js
  [doc]
  #js {:claim_id (get-any doc [:_id :id :claim-id :claim_id "_id" "id" "claim_id"])
       :source_node_id (get-any doc [:source-node-id :source_node_id :source "source_node_id" "source"])
       :target_node_id (get-any doc [:target-node-id :target_node_id :target "target_node_id" "target"])
       :relation_kind (get-any doc [:relation-kind :relation_kind :kind "relation_kind" "kind"])
       :direction (get-any doc [:direction "direction"])
       :status (get-any doc [:status "status"])
       :confidence (get-any doc [:confidence "confidence"])
       :valid_until (get-any doc [:valid-until :valid_until "valid_until"])
       :scope (clj->js (or (get-any doc [:scope "scope"])
                           (select-keys doc [:tenant_id :org_id :project :lake :graph_version])))} )

(defn edge-claim-from-mongo
  [doc]
  (boundary/edge-claim-from-js (mongo-claim->js doc)))

(defn edge-claims-from-mongo
  [docs]
  (mapv edge-claim-from-mongo docs))

(defn- projected-edge->js
  [edge]
  (clj->js {:source (:source edge)
            :target (:target edge)
            :kind (:kind edge)
            :claim_id (:claim-id edge)
            :confidence (:confidence edge)
            :direction (name (:direction edge))
            :scope (:scope edge)
            :status (name (:status edge))}))

(defn project-mongo-edge-claims
  ([docs] (project-mongo-edge-claims docs #js {}))
  ([docs opts]
   (let [normalized (edge-claims-from-mongo docs)
         result (claims/project-claims normalized (boundary/projection-options-from-js opts))]
     #js {:edges (clj->js (mapv #(js->clj (projected-edge->js %) :keywordize-keys true) (:edges result)))
          :stats (clj->js (:stats result))})))

(defn project-mongo-edge-claims-js
  "JS export for projecting Mongo/API edge claim rows.

  Accepts an array of row-like JS objects. Field alias coercion stays inside the
  graph-claim boundary; callers do not need to map Mongo rows into projected
  edges themselves."
  ([docs] (project-mongo-edge-claims-js docs #js {}))
  ([docs opts]
   (boundary/project-edge-claims-js docs opts)))
