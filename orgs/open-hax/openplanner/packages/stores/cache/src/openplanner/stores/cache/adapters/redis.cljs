(ns openplanner.stores.cache.adapters.redis
  (:require [openplanner.stores.cache.core :as core]
            [openplanner.stores.cache.protocol :refer [CacheStore]]))

(deftype RedisCache [^js client prefix default-ttl-ms]
  CacheStore
  (cache-get [_ k]
    (.get client (str prefix k)))

  (cache-put! [_ k v opts]
    (let [ttl-ms (core/ttl-ms opts default-ttl-ms)
          key (str prefix k)]
      (if (pos? ttl-ms)
        (.set client key v #js {:PX ttl-ms})
        (.set client key v))))

  (cache-evict! [_ k]
    (core/pthen (.del client (str prefix k)) pos?))

  (cache-touch! [_ k opts]
    (let [ttl-ms (core/ttl-ms opts default-ttl-ms)]
      (if (pos? ttl-ms)
        (core/pthen (.pExpire client (str prefix k) ttl-ms) pos?)
        (core/promise false))))

  (cache-cleanup! [_]
    (core/promise 0))

  (cache-stats [_]
    {:type "redis"
     :prefix prefix
     :defaultTtlMs default-ttl-ms}))

(defn create-redis-cache
  [opts]
  (let [client (core/jget opts "client")
        prefix (or (core/jget opts "prefix") "")
        default-ttl-ms (or (core/jget opts "defaultTtlMs") (* 5 60 60 1000))]
    (when-not client
      (throw (js/Error. "createRedisCache requires a connected Redis client")))
    (RedisCache. client prefix (long default-ttl-ms))))
