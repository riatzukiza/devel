(ns openplanner.stores.cache.adapters.memory
  (:require [openplanner.stores.cache.core :as core]
            [openplanner.stores.cache.protocol :refer [CacheStore]]
            [openplanner.stores.cache.schema :as schema]))

(deftype MemoryLruCache [state max-entries default-ttl-ms]
  CacheStore
  (cache-get [_ k]
    (let [entry (get @state k)
          now (core/now-ms)]
      (cond
        (nil? entry) nil
        (schema/entry-expired? entry now)
        (do (swap! state dissoc k) nil)
        :else
        (do (swap! state assoc k (schema/touch-entry entry nil))
            (schema/entry-value entry)))))

  (cache-put! [_ k v opts]
    (let [ttl-ms (core/ttl-ms opts default-ttl-ms)
          entry (schema/cache-entry {:key k :value v :ttl-ms ttl-ms})]
      (swap! state assoc k entry)
      (when (> (count @state) max-entries)
        (let [victims (->> @state
                           (sort-by (fn [[_ entry]]
                                      (or (:cache/touched-at-ms entry)
                                          (:touchedAt entry)
                                          0)))
                           (take (- (count @state) max-entries))
                           (map key))]
          (swap! state #(apply dissoc % victims))))
      true))

  (cache-evict! [_ k]
    (let [present? (contains? @state k)]
      (swap! state dissoc k)
      present?))

  (cache-touch! [_ k opts]
    (let [entry (get @state k)]
      (if-not entry
        false
        (let [ttl-ms (core/ttl-ms opts default-ttl-ms)]
          (swap! state assoc k (schema/touch-entry entry ttl-ms))
          true))))

  (cache-cleanup! [_]
    (let [before (count @state)
          now (core/now-ms)]
      (swap! state (fn [m]
                     (into {} (remove (fn [[_ entry]]
                                        (schema/entry-expired? entry now))
                                      m))))
      (- before (count @state))))

  (cache-stats [_]
    {:type "memory-lru"
     :size (count @state)
     :maxEntries max-entries
     :defaultTtlMs default-ttl-ms}))

(defn create-memory-lru-cache
  ([] (create-memory-lru-cache nil))
  ([opts]
   (let [opts (core/opts-map opts)]
     (MemoryLruCache. (atom {})
                      (long (or (:maxEntries opts) (:max-entries opts) 512))
                      (long (or (:defaultTtlMs opts) (:default-ttl-ms opts) (* 5 60 60 1000)))))))
