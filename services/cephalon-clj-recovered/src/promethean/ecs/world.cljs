(ns promethean.ecs.world)

(defn empty-world []
  {:entities {}})

(defn add-entity [w eid entity]
  (assoc-in w [:entities eid] entity))

(defn get-entity [w eid]
  (get-in w [:entities eid]))

(defn update-entity
  ([w eid f] (update-in w [:entities eid] (fn [e] (f (or e {})))))
  ([w eid f & args] (apply update-in w [:entities eid] (fn [e] (apply f (or e {}) args)) args)))

(defn entities-with [w ks]
  (let [ks (set ks)]
    (->> (:entities w)
         (keep (fn [[eid e]]
                 (when (every? #(contains? e %) ks)
                   eid)))
         vec)))
