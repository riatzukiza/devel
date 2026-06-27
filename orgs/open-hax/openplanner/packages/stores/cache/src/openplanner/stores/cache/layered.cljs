(ns openplanner.stores.cache.layered
  (:require [openplanner.stores.cache.core :as core]
            [openplanner.stores.cache.protocol :refer [CacheStore
                                                       cache-cleanup!
                                                       cache-evict!
                                                       cache-get
                                                       cache-put!
                                                       cache-stats
                                                       cache-touch!]]))

(deftype LayeredCache [layers]
  CacheStore
  (cache-get [_ k]
    (letfn [(try-layer [seen remaining]
              (if (empty? remaining)
                (core/promise nil)
                (let [layer (first remaining)]
                  (core/pthen (cache-get layer k)
                              (fn [v]
                                (if (some? v)
                                  (do
                                    (doseq [prior seen]
                                      (cache-put! prior k v nil))
                                    v)
                                  (try-layer (conj seen layer) (rest remaining))))))))]
      (try-layer [] layers)))

  (cache-put! [_ k v opts]
    (js/Promise.all (clj->js (map #(cache-put! % k v opts) layers))))

  (cache-evict! [_ k]
    (js/Promise.all (clj->js (map #(cache-evict! % k) layers))))

  (cache-touch! [_ k opts]
    (js/Promise.all (clj->js (map #(cache-touch! % k opts) layers))))

  (cache-cleanup! [_]
    (core/pthen (js/Promise.all (clj->js (map cache-cleanup! layers)))
                (fn [xs] (reduce + 0 (js->clj xs)))))

  (cache-stats [_]
    {:type "layered"
     :layers (mapv cache-stats layers)}))

(defn create-layered-cache
  [caches]
  (LayeredCache. (vec caches)))
