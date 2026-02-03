(ns promethean.memory.store)

(defn make-store []
  (atom {:by-id {}
         :by-dedupe {}
         :stats {:put 0 :deduped 0 :usage-inc 0}}))

(defn get-memory [store memory-id]
  (get-in @store [:by-id memory-id]))

(defn put-memory! [store mem]
  (let [mid (:memory/id mem)
        dkey (:memory/dedupe-key mem)]
    (swap! store
           (fn [st]
             (cond
               (and dkey (get-in st [:by-dedupe dkey]))
               (-> st (update-in [:stats :deduped] (fnil inc 0)))

               :else
               (-> st
                   (assoc-in [:by-id mid] mem)
                   (cond-> dkey (assoc-in [:by-dedupe dkey] mid))
                   (update-in [:stats :put] (fnil inc 0))))))))

(defn mark-deleted! [store memory-id summary-id]
  (swap! store update-in [:by-id memory-id]
         (fn [m]
           (-> m
               (assoc-in [:memory/lifecycle :deleted] true)
               (assoc-in [:memory/lifecycle :replaced-by] summary-id)))))

(defn inc-usage! [store memory-id]
  (swap! store
         (fn [st]
           (-> st
               (update-in [:by-id memory-id :memory/usage :included-total] (fnil inc 0))
               (update-in [:by-id memory-id :memory/usage :included-decay] (fnil inc 0))
               (update-in [:stats :usage-inc] (fnil inc 0))))))

(defn all-memories [store]
  (vals (get @store :by-id {})))
