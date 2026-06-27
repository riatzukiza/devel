(ns openplanner.stores.document-hydration
  (:require [clojure.string :as str]
            [openplanner.stores.cache.boundary :as cache]))

(def document-kinds #{"docs" "code" "config" "data"})

(defn- obj?
  [x]
  (and (some? x) (= "object" (goog/typeOf x)) (not (array? x))))

(defn- jget
  [obj k]
  (when (obj? obj)
    (aget obj k)))

(defn- jassoc!
  [obj k v]
  (aset obj k v)
  obj)

(defn- clone-obj
  [obj]
  (js/Object.assign #js {} obj))

(defn- nonblank
  [v]
  (let [s (some-> v str str/trim)]
    (when-not (str/blank? s) s)))

(defn- parse-extra
  [row]
  (let [extra (jget row "extra")]
    (cond
      (obj? extra) extra
      (string? extra) (try (js/JSON.parse extra) (catch :default _ #js {}))
      :else #js {})))

(defn- metadata
  [extra]
  (let [m (jget extra "metadata")]
    (if (obj? m) m #js {})))

(defn- normalize-visibility
  [v]
  (let [s (str v)]
    (if (contains? #{"review" "public" "archived"} s) s "internal")))

(defn- public-kind
  [v]
  (let [k (str v)]
    (if (contains? document-kinds k) k "docs")))

(defn- source-ref-map
  [row]
  (let [extra (parse-extra row)
        meta (metadata extra)
        source-path (or (nonblank (jget extra "source_path"))
                        (nonblank (jget extra "path"))
                        (nonblank (jget meta "path"))
                        (nonblank (jget meta "file_id")))
        url (or (nonblank (jget extra "url"))
                (nonblank (jget meta "url")))
        hostname (or (nonblank (jget extra "hostname"))
                     (nonblank (jget meta "hostname")))
        lake (or (nonblank (jget row "project"))
                 (nonblank (jget extra "lake"))
                 (nonblank (jget meta "lake")))
        content-hash (or (nonblank (jget extra "content_hash"))
                         (nonblank (jget meta "content_hash"))
                         (nonblank (jget (jget extra "migration_2") "text_hash_sha256")))]
    (when (or source-path url hostname)
      {:sourcePath source-path
       :url url
       :hostname hostname
       :lake lake
       :contentHash content-hash
       :cacheKey (str "openplanner:source:"
                      (or lake "unknown") ":"
                      (or content-hash source-path url hostname "unknown"))})))

(defn document-source-ref
  [row]
  (some-> (source-ref-map row) clj->js))

(defn document-cache-key
  [row]
  (some-> (source-ref-map row) :cacheKey))

(defn document-needs-hydration
  [row]
  (let [text (jget row "text")]
    (and (or (nil? text) (str/blank? (str text)))
         (boolean (source-ref-map row)))))

(defn hydrate-document-row
  [row source-text]
  (let [hydrated? (and (document-needs-hydration row)
                       (not (str/blank? (str (or source-text "")))))
        next-row (clone-obj row)
        source-ref (source-ref-map row)]
    (when hydrated?
      (jassoc! next-row "text" (str source-text)))
    #js {:row next-row
         :hydrated hydrated?
         :sourceRef (clj->js source-ref)}))

(defn row-to-document
  [row]
  (let [extra (parse-extra row)
        meta (metadata extra)
        ts (jget row "ts")]
    #js {:id (str (or (jget row "id") ""))
         :title (str (or (jget extra "title") (jget row "message") (jget row "id") ""))
         :content (str (or (jget row "text") ""))
         :project (str (or (jget row "project") "devel"))
         :kind (public-kind (jget row "kind"))
         :visibility (normalize-visibility (jget extra "visibility"))
         :source (some-> (jget row "source") str)
         :sourcePath (some-> (jget extra "source_path") str)
         :domain (some-> (jget extra "domain") str)
         :language (or (some-> (jget extra "language") str) "en")
         :createdBy (some-> (jget extra "created_by") str)
         :publishedBy (some-> (jget extra "published_by") str)
         :publishedAt (if (some? (jget extra "published_at")) (str (jget extra "published_at")) nil)
         :aiDrafted (boolean (jget extra "ai_drafted"))
         :aiModel (if (some? (jget extra "ai_model")) (str (jget extra "ai_model")) nil)
         :aiPromptHash (if (some? (jget extra "ai_prompt_hash")) (str (jget extra "ai_prompt_hash")) nil)
         :metadata meta
         :ts (if (some? ts) (str ts) (.toISOString (js/Date.)))}))

;; Cache compatibility facade -------------------------------------------------
;;
;; Document hydration originally hosted the generic cache protocol/adapters.
;; The canonical implementation now lives in @open-hax/openplanner-store-cache
;; under openplanner.stores.cache.*. Keep these exports as a compatibility
;; facade for existing TypeScript callers while new domain stores import the
;; cache package directly.

(defn create-memory-lru-cache
  ([] (cache/create-memory-lru-cache))
  ([opts] (cache/create-memory-lru-cache opts)))

(defn create-redis-cache
  [opts]
  (cache/create-redis-cache opts))

(defn create-lmdb-cache
  [opts]
  (cache/create-lmdb-cache opts))

(defn create-layered-cache
  [caches]
  (cache/create-layered-cache caches))

(defn cache-get-js
  [cache-handle k]
  (cache/cache-get-js cache-handle k))

(defn cache-put-js
  ([cache-handle k v] (cache/cache-put-js cache-handle k v))
  ([cache-handle k v ttl-ms] (cache/cache-put-js cache-handle k v ttl-ms)))

(defn cache-evict-js
  [cache-handle k]
  (cache/cache-evict-js cache-handle k))

(defn cache-touch-js
  ([cache-handle k] (cache/cache-touch-js cache-handle k))
  ([cache-handle k ttl-ms] (cache/cache-touch-js cache-handle k ttl-ms)))

(defn cache-cleanup-js
  [cache-handle]
  (cache/cache-cleanup-js cache-handle))

(defn cache-stats-js
  [cache-handle]
  (cache/cache-stats-js cache-handle))
