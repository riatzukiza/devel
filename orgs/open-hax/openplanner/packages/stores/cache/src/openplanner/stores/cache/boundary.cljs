(ns openplanner.stores.cache.boundary
  "JavaScript/CLJS conversion boundary for cache stores."
  (:require [openplanner.stores.cache.adapters.lmdb :as lmdb]
            [openplanner.stores.cache.adapters.memory :as memory]
            [openplanner.stores.cache.adapters.redis :as redis]
            [openplanner.stores.cache.core :as core]
            [openplanner.stores.cache.layered :as layered]
            [openplanner.stores.cache.protocol :as cache]
            [openplanner.stores.cache.schema :as schema]))

(defn create-memory-lru-cache
  ([] (create-memory-lru-cache nil))
  ([opts] (memory/create-memory-lru-cache opts)))

(defn create-redis-cache
  [opts]
  (redis/create-redis-cache opts))

(defn create-lmdb-cache
  [opts]
  (lmdb/create-lmdb-cache opts))

(defn create-layered-cache
  [caches]
  (layered/create-layered-cache (if (array? caches) (array-seq caches) caches)))

(defn cache-get-js [cache k] (cache/cache-get cache k))

(defn cache-put-js
  ([cache k v] (cache-put-js cache k v nil))
  ([cache k v ttl-ms]
   (cache/cache-put! cache k v (cond-> {} ttl-ms (assoc :ttlMs ttl-ms)))))

(defn cache-evict-js [cache k] (cache/cache-evict! cache k))

(defn cache-touch-js
  ([cache k] (cache-touch-js cache k nil))
  ([cache k ttl-ms]
   (cache/cache-touch! cache k (cond-> {} ttl-ms (assoc :ttlMs ttl-ms)))))

(defn cache-cleanup-js [cache] (cache/cache-cleanup! cache))
(defn cache-stats-js [cache] (clj->js (cache/cache-stats cache)))

(defn- maybe-js-map
  [value]
  (if (core/obj? value) (js->clj value :keywordize-keys true) value))

(defn- cache-entry-opts
  [opts]
  {:key (core/jget opts "key")
   :value (core/jget opts "value")
   :ttl-ms (core/jget opts "ttlMs")
   :now-ms (core/jget opts "nowMs")
   :metadata (maybe-js-map (core/jget opts "metadata"))})

(defn- qualified-js->clj
  [obj]
  (if-not (core/obj? obj)
    obj
    (into {}
          (map (fn [entry]
                 [(keyword (str (aget entry 0))) (aget entry 1)]))
          (array-seq (js/Object.entries obj)))))

(defn- cache-entry->js
  [entry]
  (let [obj (js-obj)]
    (aset obj "cache/key" (:cache/key entry))
    (aset obj "cache/value" (:cache/value entry))
    (aset obj "cache/created-at-ms" (:cache/created-at-ms entry))
    (aset obj "cache/touched-at-ms" (:cache/touched-at-ms entry))
    (when (contains? entry :cache/expires-at-ms)
      (aset obj "cache/expires-at-ms" (:cache/expires-at-ms entry)))
    (when (contains? entry :cache/metadata)
      (aset obj "cache/metadata" (clj->js (:cache/metadata entry))))
    obj))

(defn cache-entry-js
  [opts]
  (cache-entry->js (schema/cache-entry (cache-entry-opts opts))))

(defn- explain-result-js
  [{:keys [valid? errors]}]
  (clj->js {:valid valid?
            :errors errors}))

(defn explain-cache-entry-js
  [entry]
  (let [entry (qualified-js->clj entry)]
    (explain-result-js (schema/explain-cache-entry entry))))

(defn- projection-envelope-opts
  [opts]
  {:name (core/jget opts "name")
   :version (or (core/jget opts "version") 1)
   :source-store (core/jget opts "sourceStore")
   :source-collection (core/jget opts "sourceCollection")
   :source-key (core/jget opts "sourceKey")
   :source-updated-at (core/jget opts "sourceUpdatedAt")
   :watermark (core/jget opts "watermark")
   :value (core/jget opts "value")
   :metadata (maybe-js-map (core/jget opts "metadata"))})

(defn- projection-envelope->js
  [envelope]
  (let [obj (js-obj)]
    (aset obj "projection/name" (:projection/name envelope))
    (aset obj "projection/version" (:projection/version envelope))
    (aset obj "projection/source-store" (:projection/source-store envelope))
    (aset obj "projection/source-key" (:projection/source-key envelope))
    (aset obj "projection/value" (clj->js (:projection/value envelope)))
    (when (contains? envelope :projection/source-collection)
      (aset obj "projection/source-collection" (:projection/source-collection envelope)))
    (when (contains? envelope :projection/source-updated-at)
      (aset obj "projection/source-updated-at" (:projection/source-updated-at envelope)))
    (when (contains? envelope :projection/watermark)
      (aset obj "projection/watermark" (:projection/watermark envelope)))
    (when (contains? envelope :projection/metadata)
      (aset obj "projection/metadata" (clj->js (:projection/metadata envelope))))
    obj))

(defn projection-envelope-js
  [opts]
  (projection-envelope->js (schema/projection-envelope (projection-envelope-opts opts))))

(defn explain-projection-envelope-js
  [envelope]
  (let [envelope (qualified-js->clj envelope)]
    (explain-result-js (schema/explain-projection-envelope envelope))))
