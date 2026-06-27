(ns openplanner.graph.claims.boundary
  "JavaScript/CLJS conversion boundary for edge-claim logic.

  All JS object field aliases, Date parsing, number coercion, JSON canonicalizing,
  and Node crypto calls live here. The pure core namespace receives normalized
  CLJS maps only."
  (:require [clojure.string :as str]
            [goog.crypt :as crypt]
            [openplanner.graph.claims.core :as claims]
            [openplanner.graph.claims.policy :as policy]
            [openplanner.graph.claims.schema :as schema])
  (:import [goog.crypt Sha256]))

(defn- js-object?
  [value]
  (and (some? value)
       (= "object" (goog/typeOf value))
       (not (array? value))))

(defn- jget
  [obj k]
  (when (js-object? obj)
    (aget obj k)))

(defn- nonblank
  [value]
  (let [s (some-> value str str/trim)]
    (when-not (str/blank? s) s)))

(defn- token-keyword
  [value]
  (some-> value str str/trim str/lower-case (str/replace #"-" "_") keyword))

(defn- status->wire
  [status]
  (some-> status name (str/replace #"_" "-")))

(defn- wire-status-name
  [status]
  (some-> status name (str/replace #"_" "_")))

(defn- edge-claim-status-keyword
  [value]
  (let [status (token-keyword value)]
    (when (contains? claims/statuses status) status)))

(defn normalize-edge-claim-status
  ([value] (normalize-edge-claim-status value :proposed))
  ([value fallback]
   (or (edge-claim-status-keyword value)
       (edge-claim-status-keyword fallback)
       :proposed)))

(defn normalize-edge-claim-direction
  [value]
  (claims/normalize-direction (token-keyword value)))

(defn- plain-scope-entry?
  [[_ value]]
  (and (some? value) (not (str/blank? (str value)))))

(defn normalize-edge-claim-scope
  [value]
  (when (js-object? value)
    (let [entries (->> (js/Object.entries value)
                       (array-seq)
                       (map (fn [entry] [(str (aget entry 0)) (aget entry 1)]))
                       (filter plain-scope-entry?))]
      (when (seq entries)
        (into {} entries)))))

(defn- inferred-scope
  [input]
  (normalize-edge-claim-scope
    #js {:tenant_id (jget input "tenant_id")
         :org_id (jget input "org_id")
         :project (jget input "project")
         :lake (jget input "lake")
         :graph_version (jget input "graph_version")}))

(defn- canonical-scope-json
  [scope]
  (if (seq scope)
    (let [obj (clj->js scope)
          keys (clj->js (sort (keys scope)))]
      (js/JSON.stringify obj keys))
    "{}"))

(defn edge-claim-key-from-js
  [input]
  (let [direction (normalize-edge-claim-direction (jget input "direction"))
        scope (or (normalize-edge-claim-scope (jget input "scope"))
                  (inferred-scope input))
        source-node-id (nonblank (or (jget input "sourceNodeId")
                                     (jget input "source_node_id")
                                     (jget input "source")))
        target-node-id (nonblank (or (jget input "targetNodeId")
                                     (jget input "target_node_id")
                                     (jget input "target")))
        relation-kind (or (nonblank (or (jget input "relationKind")
                                        (jget input "relation_kind")
                                        (jget input "kind")))
                          "related_to")]
    {:source-node-id source-node-id
     :target-node-id target-node-id
     :relation-kind relation-kind
     :direction direction
     :scope scope
     :scope-json (canonical-scope-json scope)}))

(defn- sha256-hex-24
  [text]
  (let [sha (Sha256.)]
    (.update sha text)
    (subs (crypt/byteArrayToHex (.digest sha)) 0 24)))

(defn build-edge-claim-id
  [input]
  (let [claim-key (edge-claim-key-from-js input)]
    (when-not (claims/valid-claim-key? claim-key)
      (throw (ex-info "Invalid edge claim key"
                      {:claim-key claim-key})))
    (str "edge_claim:" (sha256-hex-24 (claims/claim-id-material claim-key)))))

(defn- parse-ms
  [value]
  (cond
    (nil? value) nil
    (number? value) value
    (string? value) (let [ms (.parse js/Date value)]
                      (when-not (js/Number.isNaN ms) ms))
    (and (some? value) (fn? (.-getTime value))) (let [ms (.getTime value)]
                                                  (when-not (js/Number.isNaN ms) ms))
    :else nil))

(defn- clamp-confidence
  [value fallback]
  (let [n (js/Number value)]
    (if (js/Number.isFinite n)
      (max 0 (min 1 n))
      fallback)))

(defn- status-set-from-js
  [value]
  (when (array? value)
    (->> (array-seq value)
         (keep edge-claim-status-keyword)
         set)))

(defn projection-options-from-js
  [opts]
  {:statuses (or (status-set-from-js (jget opts "statuses")) claims/projectable-statuses)
   :include-expired? (true? (jget opts "includeExpired"))
   :now-ms (or (parse-ms (jget opts "now")) (.now js/Date))})

(defn edge-claim-from-js
  [input]
  (let [key (edge-claim-key-from-js input)
        claim-id (or (nonblank (or (jget input "claimId") (jget input "claim_id")))
                     (build-edge-claim-id input))]
    (assoc key
           :claim-id claim-id
           :status (normalize-edge-claim-status (jget input "status") :proposed)
           :confidence (clamp-confidence (jget input "confidence") 0.5)
           :valid-until-ms (parse-ms (or (jget input "validUntil")
                                         (jget input "valid_until"))))))

(defn- edge-claim-from-js-soft
  [input]
  (let [key (edge-claim-key-from-js input)
        [source-node-id target-node-id] (claims/canonical-endpoints key)
        canonical-key (assoc key
                             :source-node-id source-node-id
                             :target-node-id target-node-id)
        claim-id (or (nonblank (or (jget input "claimId") (jget input "claim_id")))
                     (when (claims/valid-claim-key? canonical-key)
                       (str "edge_claim:" (sha256-hex-24 (claims/claim-id-material canonical-key)))))]
    (assoc canonical-key
           :claim-id claim-id
           :status (normalize-edge-claim-status (jget input "status") :proposed)
           :confidence (clamp-confidence (jget input "confidence") 0.5)
           :valid-until-ms (parse-ms (or (jget input "validUntil")
                                         (jget input "valid_until"))))))

(defn- edge-claim->wire-js
  [claim]
  #js {:claim_id (:claim-id claim)
       :source_node_id (:source-node-id claim)
       :target_node_id (:target-node-id claim)
       :relation_kind (:relation-kind claim)
       :direction (name (:direction claim))
       :scope (clj->js (or (:scope claim) {}))
       :status (wire-status-name (:status claim))
       :confidence (:confidence claim)
       :valid_until_ms (:valid-until-ms claim)})

(defn- projected-edge->js
  [edge]
  (clj->js {:source (:source edge)
            :target (:target edge)
            :kind (:kind edge)
            :claim_id (:claim-id edge)
            :confidence (:confidence edge)
            :direction (name (:direction edge))
            :scope (:scope edge)
            :status (wire-status-name (:status edge))}))

(defn normalize-edge-claim-status-js
  ([value] (normalize-edge-claim-status-js value "proposed"))
  ([value fallback]
   (wire-status-name (normalize-edge-claim-status value fallback))))

(defn normalize-edge-claim-direction-js
  [value]
  (name (normalize-edge-claim-direction value)))

(defn normalize-edge-claim-scope-js
  [value]
  (some-> (normalize-edge-claim-scope value) clj->js))

(defn build-edge-claim-id-js
  [input]
  (build-edge-claim-id input))

(defn normalize-edge-claim-input-js
  [input]
  (edge-claim->wire-js (edge-claim-from-js-soft input)))

(defn claim-projectable-js
  ([claim] (claim-projectable-js claim #js {}))
  ([claim opts]
   (boolean (claims/projectable? (edge-claim-from-js claim) (projection-options-from-js opts)))))

(defn project-edge-claim-js
  ([claim] (project-edge-claim-js claim #js {}))
  ([claim opts]
   (some-> (claims/claim->projected-edge (edge-claim-from-js claim)
                                         (projection-options-from-js opts))
           projected-edge->js)))

(defn project-edge-claims-js
  ([claim-rows] (project-edge-claims-js claim-rows #js {}))
  ([claim-rows opts]
   (let [claims (if (array? claim-rows)
                  (mapv edge-claim-from-js (array-seq claim-rows))
                  [])
         result (claims/project-claims claims (projection-options-from-js opts))]
     #js {:edges (clj->js (mapv #(js->clj (projected-edge->js %) :keywordize-keys true) (:edges result)))
          :stats (clj->js (:stats result))})))

(defn explain-edge-claim-js
  [claim]
  (clj->js (schema/explain-edge-claim (edge-claim-from-js-soft claim))))

(defn- decision->js
  [decision]
  #js {:kind (name (:decision/kind decision))
       :reason (name (:decision/reason decision))
       :data (clj->js (:decision/data decision))})

(defn evaluate-edge-claim-js
  [claim]
  (decision->js (policy/evaluate-claim (edge-claim-from-js-soft claim))))
