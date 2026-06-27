(ns openplanner.graph.claims.lifecycle
  "Pure lifecycle transition semantics for edge claims.

  Routes/adapters decide how to persist these transition plans. This namespace
  only decides the next status, confidence, event bucket, and timestamped update
  shape from normalized transition input."
  (:require [openplanner.graph.claims.boundary :as boundary]))

(def lifecycle-actions #{:support :refute :withdraw})

(defn- event-ids-from-js
  [value]
  (if (array? value)
    (->> (array-seq value)
         (map #(some-> % str .trim))
         (filter seq)
         distinct
         vec)
    []))

(defn- jget
  [obj k]
  (when (and (some? obj)
             (= "object" (goog/typeOf obj)))
    (aget obj k)))

(defn- action-keyword
  [value]
  (let [action (some-> value str .trim .toLowerCase keyword)]
    (when (contains? lifecycle-actions action) action)))

(defn- clamp-confidence
  [value fallback]
  (let [n (js/Number value)]
    (if (js/Number.isFinite n)
      (max 0 (min 1 n))
      fallback)))

(defn transition-plan
  [action body]
  (let [action (or (action-keyword action) :support)]
    (case action
      :support
      (let [status (boundary/normalize-edge-claim-status (jget body "status") :supported)
            next-status (if (= :active status) :active :supported)]
        {:action :support
         :status next-status
         :confidence (clamp-confidence (jget body "confidence") 0.75)
         :event-field :support_event_ids
         :event-ids (event-ids-from-js (or (jget body "event_ids")
                                           (jget body "eventIds")
                                           (jget body "support_event_ids")))})

      :refute
      {:action :refute
       :status :refuted
       :confidence (clamp-confidence (jget body "confidence") 0)
       :event-field :refute_event_ids
       :event-ids (event-ids-from-js (or (jget body "event_ids")
                                         (jget body "eventIds")
                                         (jget body "refute_event_ids")))}

      :withdraw
      {:action :withdraw
       :status :withdrawn
       :confidence nil
       :event-field nil
       :event-ids []})))

(defn transition-plan-js
  [action body]
  (let [{:keys [action status confidence event-field event-ids]} (transition-plan action body)]
    #js {:action (name action)
         :status (name status)
         :confidence confidence
         :eventField (some-> event-field name)
         :eventIds (clj->js event-ids)}))
