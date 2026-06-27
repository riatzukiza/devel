(ns openplanner.graph.claims.policy
  "Pure policy bridge for normalized claim contexts.

  This is not the full Proxx policy engine. It is the graph-claim domain seam:
  callers provide normalized claims and explicit strategy functions; this
  namespace returns data decisions that can later be backed by the shared
  abductive policy evaluator."
  (:require [openplanner.graph.claims.core :as claims]
            [openplanner.graph.claims.schema :as schema]))

(def decisions #{:accept :reject :defer :supersede})

(defn claim-context
  [claim]
  {:claim claim
   :claim/status (:status claim)
   :claim/relation-kind (:relation-kind claim)
   :claim/source-node-id (:source-node-id claim)
   :claim/target-node-id (:target-node-id claim)
   :claim/scope (or (:scope claim) {})
   :claim/confidence (:confidence claim)})

(defn decision
  ([kind reason] (decision kind reason {}))
  ([kind reason data]
   {:decision/kind (if (contains? decisions kind) kind :defer)
    :decision/reason reason
    :decision/data data}))

(defn default-claim-decision
  [claim]
  (let [{:keys [valid? errors]} (schema/explain-edge-claim claim)]
    (cond
      (not valid?)
      (decision :reject :invalid-claim {:errors errors})

      (contains? claims/projectable-statuses (:status claim))
      (decision :accept :projectable-status {:status (:status claim)})

      (contains? #{:refuted :rejected :withdrawn :expired} (:status claim))
      (decision :reject :negative-status {:status (:status claim)})

      (= :superseded (:status claim))
      (decision :supersede :superseded-status {:status (:status claim)})

      :else
      (decision :defer :not-yet-supported {:status (:status claim)}))))

(defn evaluate-claim
  "Evaluates a normalized claim using an optional sequence of strategy fns.

  Strategy fns receive `(claim-context claim)` and should return nil when they
  do not apply, or a decision map with `:decision/kind` when they do. The first
  applicable strategy wins."
  ([claim] (evaluate-claim claim []))
  ([claim strategies]
   (let [ctx (claim-context claim)]
     (or (some (fn [strategy]
                 (when (fn? strategy)
                   (let [result (strategy ctx)]
                     (when (and (map? result)
                                (contains? decisions (:decision/kind result)))
                       result))))
               strategies)
         (default-claim-decision claim)))))

(defn accepted?
  [claim]
  (= :accept (:decision/kind (evaluate-claim claim))))
