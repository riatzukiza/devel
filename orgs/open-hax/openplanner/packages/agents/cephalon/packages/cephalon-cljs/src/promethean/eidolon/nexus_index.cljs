(ns promethean.eidolon.nexus-index
  (:require [clojure.set :as set]))

(defn make-index []
  (atom {:key->ids {}
         :id->keys {}
         :stats {:upsert 0}}))

(defn upsert! [idx memory-id keys]
  (swap! idx
         (fn [st]
           (let [old (get-in st [:id->keys memory-id] #{})
                 new (set keys)
                 removed (set/difference old new)
                 added (set/difference new old)]
             (-> st
                 (assoc-in [:id->keys memory-id] new)
                 (update :key->ids
                         (fn [m]
                           (let [m (or m {})
                                 m (reduce (fn [m k]
                                             (update m k (fn [s] (disj (or s #{}) memory-id))))
                                           m
                                           removed)]
                             (reduce (fn [m k]
                                       (update m k (fn [s] (conj (or s #{}) memory-id))))
                                     m
                                     added))))
                 (update-in [:stats :upsert] (fnil inc 0)))))))

(defn ids-for-key [idx k]
  (get-in @idx [:key->ids k] #{}))

(defn keys-for-id [idx memory-id]
  (get-in @idx [:id->keys memory-id] #{}))

(defn neighbors [idx seed-keys]
  (let [seed-keys (set seed-keys)
        ids (->> seed-keys
                 (map #(ids-for-key idx %))
                 (apply set/union #{}))]
    (reduce
      (fn [m mid]
        (let [ks (keys-for-id idx mid)
              shared (count (set/intersection seed-keys ks))]
          (assoc m mid shared)))
      {}
      ids)))
