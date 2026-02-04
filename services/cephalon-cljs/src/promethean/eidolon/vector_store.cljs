(ns promethean.eidolon.vector-store
  (:require [promethean.eidolon.similarity :as sim]))

(defn make-store []
  (atom {:lanes {}
         :stats {:upsert 0 :search 0}}))

(defn upsert! [vs lane memory-id vec meta]
  (swap! vs
         (fn [st]
           (-> st
               (assoc-in [:lanes lane :id->vec memory-id] vec)
               (assoc-in [:lanes lane :id->meta memory-id] meta)
               (update-in [:stats :upsert] (fnil inc 0))))))

(defn search [vs lane query-vec {:keys [k now-ms]}]
  (let [k (or k 12)
        now-ms (or now-ms (.now js/Date))
        lane-data (get-in @vs [:lanes lane])
        id->vec (:id->vec lane-data)
        id->meta (:id->meta lane-data)
        scored (->> id->vec
                    (map (fn [[mid v]]
                           (let [{:keys [ts deleted]} (get id->meta mid)
                                 c (sim/cosine query-vec v)
                                 b (sim/recency-bonus now-ms (or ts now-ms))
                                 score (+ c b)]
                             [mid score deleted])))
                    (remove (fn [[_ _ deleted]] deleted))
                    (sort-by second >)
                    (take k)
                    vec)]
    (swap! vs update-in [:stats :search] (fnil inc 0))
    scored))
