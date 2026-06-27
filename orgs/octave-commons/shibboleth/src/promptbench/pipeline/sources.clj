(ns promptbench.pipeline.sources
   "def-source macro and source registry.

    Registers dataset sources with spec validation. Each source stores:
    :description, :version, :license (keyword), :format (from #{:parquet :csv :tsv :jsonl :edn}),
    requires :path, :url, or :urls, optional :schema and :taxonomy-mapping.

    Taxonomy mapping values must be keywords."
  (:refer-clojure :exclude [reset!])
  (:require [clojure.spec.alpha :as s]))

;; ============================================================
;; Registry Atom
;; ============================================================

(defonce ^:private sources-registry (atom {}))

;; ============================================================
;; Specs
;; ============================================================

(s/def ::description string?)
(s/def ::version string?)
(s/def ::license keyword?)
(s/def ::format #{:parquet :csv :tsv :jsonl :edn})
(s/def ::url (s/nilable string?))
(s/def ::urls (s/coll-of string? :kind vector? :min-count 1))
(s/def ::path (s/nilable string?))
(s/def ::schema map?)

;; Taxonomy mapping: a map of field-keyword -> {string -> keyword}
;; The inner map values must all be keywords.
(s/def ::taxonomy-mapping-inner
  (s/map-of any? keyword?))

(s/def ::taxonomy-mapping
  (s/map-of any? ::taxonomy-mapping-inner))

(s/def ::source-data
  (s/keys :req-un [::description ::version ::license ::format]
          :opt-un [::url ::urls ::path ::schema ::taxonomy-mapping]))

;; ============================================================
;; Validation Helpers
;; ============================================================

(defn- validate-url-or-path!
  "Ensure that at least one of :url, :urls, or :path is provided and non-nil."
  [source-name source-data]
  (let [url  (:url source-data)
        urls (:urls source-data)
        path (:path source-data)]
    (when (and (nil? url)
               (nil? path)
               (or (nil? urls) (empty? urls)))
      (throw (ex-info (str "Source " source-name " requires :path, :url, or :urls")
                      {:name source-name :url url :urls urls :path path})))))

(defn- validate-taxonomy-mapping-values!
  "Ensure all leaf values in :taxonomy-mapping are keywords."
  [source-name source-data]
  (when-let [mapping (:taxonomy-mapping source-data)]
    (doseq [[field-key inner-map] mapping]
      (when (map? inner-map)
        (doseq [[k v] inner-map]
          (when-not (keyword? v)
            (throw (ex-info (str "Source " source-name " taxonomy-mapping value must be keyword, got "
                                 (pr-str v) " for key " (pr-str k) " in field " (pr-str field-key))
                            {:name source-name
                             :field field-key
                             :key k
                             :value v}))))))))

;; ============================================================
;; Registration Functions
;; ============================================================

(defn register-source!
  "Register a source in the registry. Throws on invalid spec, missing url/path,
   invalid taxonomy-mapping values, or duplicate."
  [source-name source-data]
  (when-not (s/valid? ::source-data source-data)
    (throw (ex-info (str "Invalid source spec for " source-name ": "
                         (s/explain-str ::source-data source-data))
                    {:name source-name
                     :data source-data
                     :explain (s/explain-data ::source-data source-data)})))
  (validate-url-or-path! source-name source-data)
  (validate-taxonomy-mapping-values! source-name source-data)
  (when (contains? @sources-registry source-name)
    (throw (ex-info (str "Duplicate source: " source-name " is already registered")
                    {:name source-name})))
  (swap! sources-registry assoc source-name source-data)
  source-data)

;; ============================================================
;; Query Functions
;; ============================================================

(defn get-source
  "Retrieve a source by keyword name."
  [source-name]
  (get @sources-registry source-name))

(defn all-sources
  "Return all registered sources as a map of name -> data."
  []
  @sources-registry)

;; ============================================================
;; Reset (for test isolation)
;; ============================================================

(defn reset!
  "Clear the sources registry. Used for test isolation."
  []
  (clojure.core/reset! sources-registry {})
  nil)

;; ============================================================
;; Macro
;; ============================================================

(defmacro def-source
  "Define and register a dataset source.

   Required keys: :description (string), :version (string), :license (keyword),
                  :format (from #{:parquet :csv :tsv :jsonl :edn}).
   Requires either :url or :path (or both).
   Optional keys: :schema (map), :taxonomy-mapping (map with keyword values).

   Throws on invalid spec, missing url/path, bad taxonomy-mapping values, or duplicate.

   Usage:
     (def-source aya-redteaming
       {:description \"Aya Red Team dataset\"
        :url         \"https://huggingface.co/datasets/CohereForAI/aya_redteaming\"
        :version     \"1.0.0\"
        :license     :apache-2.0
        :format      :parquet
        :schema      {:prompt :string :language :string}
        :taxonomy-mapping
          {:harm_category {\"illegal_activity\" :illegal-activity}}})"
  [source-name source-data]
  (let [kw-name (keyword (name source-name))]
    `(register-source! ~kw-name ~source-data)))
