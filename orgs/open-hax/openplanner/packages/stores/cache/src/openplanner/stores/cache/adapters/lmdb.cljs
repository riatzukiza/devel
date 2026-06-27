(ns openplanner.stores.cache.adapters.lmdb
  (:require [openplanner.stores.cache.core :as core]
            [openplanner.stores.cache.protocol :refer [CacheStore]]))

(deftype LmdbTtlCache [^js db prefix default-ttl-ms]
  CacheStore
  (cache-get [_ k]
    (let [key (str prefix k)
          entry (.get db key)
          now (core/now-ms)]
      (cond
        (nil? entry) nil
        (and (core/jget entry "expiresAt") (< (core/jget entry "expiresAt") now))
        (do (.remove db key) nil)
        :else (core/jget entry "value"))))

  (cache-put! [_ k v opts]
    (let [ttl-ms (core/ttl-ms opts default-ttl-ms)
          now (core/now-ms)
          expires-at (when (pos? ttl-ms) (+ now ttl-ms))]
      (.put db (str prefix k) #js {:value v
                                   :createdAt now
                                   :touchedAt now
                                   :expiresAt expires-at})))

  (cache-evict! [_ k]
    (.remove db (str prefix k)))

  (cache-touch! [_ k opts]
    (let [key (str prefix k)
          entry (.get db key)]
      (if-not entry
        false
        (let [ttl-ms (core/ttl-ms opts default-ttl-ms)
              now (core/now-ms)]
          (.put db key #js {:value (core/jget entry "value")
                            :createdAt (or (core/jget entry "createdAt") now)
                            :touchedAt now
                            :expiresAt (when (pos? ttl-ms) (+ now ttl-ms))})))))

  (cache-cleanup! [_]
    ;; LMDB key-range cleanup is intentionally left to explicit future compaction.
    0)

  (cache-stats [_]
    {:type "lmdb-ttl"
     :prefix prefix
     :defaultTtlMs default-ttl-ms}))

(defn create-lmdb-cache
  [opts]
  (let [db (core/jget opts "db")
        prefix (or (core/jget opts "prefix") "")
        default-ttl-ms (or (core/jget opts "defaultTtlMs") (* 5 60 60 1000))]
    (when-not db
      (throw (js/Error. "createLmdbCache requires an open LMDB database handle")))
    (LmdbTtlCache. db prefix (long default-ttl-ms))))
