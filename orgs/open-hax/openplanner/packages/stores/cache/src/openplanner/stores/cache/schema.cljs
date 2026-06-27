(ns openplanner.stores.cache.schema
  "Data-first contracts for cache entries and store projections.

  These are intentionally plain maps and predicates instead of a hard dependency
  on a schema runtime. Callers can translate the contracts to Malli, JSON Schema,
  TypeScript, or database validators at the boundary."
  (:require [openplanner.stores.cache.core :as core]))

(def cache-backends
  #{:memory :redis :lmdb :mongo :postgresql :chromadb :duckdb :sqlite})

(def cache-entry-contract
  {:contract/name :openplanner.stores.cache/cache-entry
   :contract/version 1
   :contract/required #{:cache/key :cache/value :cache/created-at-ms :cache/touched-at-ms}
   :cache/backends cache-backends})

(def projection-envelope-contract
  {:contract/name :openplanner.stores.cache/projection-envelope
   :contract/version 1
   :contract/required #{:projection/name
                        :projection/version
                        :projection/source-store
                        :projection/source-key
                        :projection/value}})

(defn valid-cache-key?
  [value]
  (boolean (core/nonblank value)))

(defn valid-ms?
  [value]
  (and (number? value) (not (js/Number.isNaN value)) (not (neg? value))))

(defn expires-at-ms
  [now-ms ttl-ms]
  (when (and (number? ttl-ms) (pos? ttl-ms))
    (+ now-ms ttl-ms)))

(defn cache-entry
  [{:keys [key value ttl-ms now-ms metadata]}]
  (let [now-ms (or now-ms (core/now-ms))]
    (cond-> {:cache/key (str key)
             :cache/value value
             :cache/created-at-ms now-ms
             :cache/touched-at-ms now-ms}
    (some? (expires-at-ms now-ms ttl-ms))
    (assoc :cache/expires-at-ms (expires-at-ms now-ms ttl-ms))

      (some? metadata)
      (assoc :cache/metadata metadata))))

(defn entry-expires-at
  [entry]
  (or (:cache/expires-at-ms entry)
      (:expiresAt entry)
      (:expires-at entry)))

(defn entry-value
  [entry]
  (if (contains? entry :cache/value)
    (:cache/value entry)
    (:value entry)))

(defn entry-expired?
  ([entry] (entry-expired? entry (core/now-ms)))
  ([entry now]
   (let [expires-at (entry-expires-at entry)]
     (boolean (and (number? expires-at) (< expires-at now))))))

(defn touch-entry
  [entry ttl-ms]
  (let [now (core/now-ms)]
    (cond-> (assoc entry :cache/touched-at-ms now :touchedAt now)
      (and (number? ttl-ms) (pos? ttl-ms))
      (assoc :cache/expires-at-ms (+ now ttl-ms)
             :expiresAt (+ now ttl-ms)))))

(defn cache-entry-errors
  [entry]
  (cond-> []
    (not (valid-cache-key? (:cache/key entry)))
    (conj {:path [:cache/key] :error :required-nonblank-string :value (:cache/key entry)})

    (not (contains? entry :cache/value))
    (conj {:path [:cache/value] :error :required :value nil})

    (not (valid-ms? (:cache/created-at-ms entry)))
    (conj {:path [:cache/created-at-ms] :error :non-negative-number :value (:cache/created-at-ms entry)})

    (not (valid-ms? (:cache/touched-at-ms entry)))
    (conj {:path [:cache/touched-at-ms] :error :non-negative-number :value (:cache/touched-at-ms entry)})

    (and (contains? entry :cache/expires-at-ms)
         (some? (:cache/expires-at-ms entry))
         (not (valid-ms? (:cache/expires-at-ms entry))))
    (conj {:path [:cache/expires-at-ms] :error :nil-or-non-negative-number :value (:cache/expires-at-ms entry)})))

(defn explain-cache-entry
  [entry]
  (let [errors (cache-entry-errors entry)]
    {:valid? (empty? errors)
     :errors errors}))

(defn projection-envelope
  [{:keys [name version source-store source-collection source-key source-updated-at watermark value metadata]}]
  (let [version (or version 1)]
    (cond-> {:projection/name name
             :projection/version version
             :projection/source-store source-store
             :projection/source-key source-key
             :projection/value value}
    (some? source-collection) (assoc :projection/source-collection source-collection)
    (some? source-updated-at) (assoc :projection/source-updated-at source-updated-at)
    (some? watermark) (assoc :projection/watermark watermark)
      (some? metadata) (assoc :projection/metadata metadata))))

(defn projection-envelope-errors
  [envelope]
  (cond-> []
    (not (valid-cache-key? (:projection/name envelope)))
    (conj {:path [:projection/name] :error :required-nonblank-string :value (:projection/name envelope)})

    (not (and (number? (:projection/version envelope))
              (pos? (:projection/version envelope))))
    (conj {:path [:projection/version] :error :positive-number :value (:projection/version envelope)})

    (not (valid-cache-key? (:projection/source-store envelope)))
    (conj {:path [:projection/source-store] :error :required-nonblank-string :value (:projection/source-store envelope)})

    (not (valid-cache-key? (:projection/source-key envelope)))
    (conj {:path [:projection/source-key] :error :required-nonblank-string :value (:projection/source-key envelope)})

    (not (contains? envelope :projection/value))
    (conj {:path [:projection/value] :error :required :value nil})))

(defn explain-projection-envelope
  [envelope]
  (let [errors (projection-envelope-errors envelope)]
    {:valid? (empty? errors)
     :errors errors}))
