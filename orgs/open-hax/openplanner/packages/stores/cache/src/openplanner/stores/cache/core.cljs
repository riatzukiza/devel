(ns openplanner.stores.cache.core
  (:require [clojure.string :as str]))

(defn now-ms [] (.now js/Date))
(defn promise [v] (js/Promise.resolve v))
(defn pthen [v f] (.then (promise v) f))

(defn obj?
  [x]
  (and (some? x) (= "object" (goog/typeOf x)) (not (array? x))))

(defn jget
  [obj k]
  (when (obj? obj)
    (aget obj k)))

(defn nonblank
  [v]
  (let [s (some-> v str str/trim)]
    (when-not (str/blank? s) s)))

(defn opts-map
  [opts]
  (if (obj? opts) (js->clj opts :keywordize-keys true) (or opts {})))

(defn ttl-ms
  [opts default-ttl-ms]
  (let [opts (opts-map opts)]
    (long (or (:ttlMs opts)
              (:ttl-ms opts)
              default-ttl-ms
              0))))
