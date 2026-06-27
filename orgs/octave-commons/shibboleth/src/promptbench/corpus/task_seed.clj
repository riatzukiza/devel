(ns promptbench.corpus.task-seed
  "Build a normalized task-prompt seed artifact from registered external sources.

   This is an intermediate artifact for the new promptbench split between:
   - context/system prompts
   - task/user prompts

   The builder consumes the machine-readable task prompt source manifest,
   selects open + registered sources by default, runs Stage 0/1 in an isolated
   data dir, and writes a merged `task_prompts` seed artifact." 
  (:require [clojure.edn :as edn]
            [clojure.java.io :as io]
            [clojure.string :as str]
            [promptbench.corpus.external :as external]
            [promptbench.pipeline.manifest :as manifest]
            [promptbench.pipeline.sources :as sources]
            [promptbench.pipeline.stages :as stages]
            [promptbench.python.parquet :as parquet]
            [promptbench.util.crypto :as crypto]))

(def ^:private default-manifest-path
  "data/manifests/task-prompt-seed-sources.edn")

(def ^:private default-output-dir
  "data/task-prompts/seed-v0.1.0")

(def ^:private default-source-roles
  #{:core-adversarial-task-seed
    :benign-complement
    :specialized-adversarial-task-seed})

(defn load-source-manifest
  ([] (load-source-manifest default-manifest-path))
  ([path]
   (edn/read-string (slurp path))))

(defn- source-entry->kw
  [entry]
  (or (:source-key entry)
      (keyword (name (:dataset entry)))))

(defn select-source-entries
  "Select task-prompt source entries from the machine-readable source manifest.

   Defaults:
   - include open sources only (`:gated? false`)
   - include only registered sources
   - include roles in `default-source-roles`

   Returns a deterministically ordered vector of source entries." 
  ([source-manifest]
   (select-source-entries source-manifest {}))
  ([source-manifest {:keys [include-roles include-gated? require-registered?]
                     :or {include-roles default-source-roles
                          include-gated? false
                          require-registered? true}}]
   (->> (:sources source-manifest)
        (filter (fn [entry]
                  (and (contains? include-roles (:role entry))
                       (or include-gated? (not (:gated? entry)))
                       (or (not require-registered?)
                           (some? (sources/get-source (source-entry->kw entry)))))))
        (sort-by (juxt :priority :dataset))
        vec)))

(defn- source-entry-index
  [entries]
  (into {}
        (map (fn [entry] [(source-entry->kw entry) entry]))
        entries))

(defn- record->task-prompt
  [entry record]
  {:task_id             (crypto/sha256-id (str "task|" (:source-id record)))
   :source_id           (:source-id record)
   :canonical_hash      (:canonical-hash record)
   :canonical_text      (:canonical-text record)
   :language            (some-> (:canonical-lang record) name)
   :intent_label        (some-> (:intent-label record) name)
   :harm_category       (some-> (:harm-category record) name)
   :source_dataset      (some-> (get-in record [:source :dataset]) name)
   :source_license      (some-> (get-in record [:source :license]) name)
   :source_gated        (boolean (:gated? entry))
   :seed_kind           (some-> (:seed-kind entry) name)
   :seed_role           "task"
   :wrapper_confidence  (some-> (:wrapper-confidence entry) name)
   :priority            (long (or (:priority entry) 999999))})

(defn- summarize-task-prompts
  [task-prompts]
  {:total          (count task-prompts)
   :by_intent      (into (sorted-map) (frequencies (map :intent_label task-prompts)))
   :by_source      (into (sorted-map) (frequencies (map :source_dataset task-prompts)))
   :by_seed_kind   (into (sorted-map) (frequencies (map :seed_kind task-prompts)))
   :by_language    (into (sorted-map) (frequencies (map :language task-prompts)))})

(defn build-task-prompts!
  "Build a normalized task prompt seed artifact.

   Returns a map containing:
   - :task-prompts
   - :summary
   - :output-dir
   - :selected-sources
   - :stage-manifests" 
  ([] (build-task-prompts! {}))
  ([{:keys [manifest-path output-dir version seed include-gated? include-roles]
     :or {manifest-path default-manifest-path
          output-dir default-output-dir
          version "0.1.0"
          seed 1337
          include-gated? false
          include-roles default-source-roles}}]
   (external/register-all!)
   (let [source-manifest (load-source-manifest manifest-path)
         selected-entries (select-source-entries source-manifest
                                                 {:include-roles include-roles
                                                  :include-gated? include-gated?
                                                  :require-registered? true})
         selected-sources (mapv source-entry->kw selected-entries)
         entry-idx (source-entry-index selected-entries)
         data-dir output-dir
         _ (.mkdirs (io/file output-dir))
         fetch-result (stages/fetch! {:sources selected-sources
                                      :data-dir data-dir
                                      :seed seed
                                      :version version})
         canon-result (stages/canonicalize! {:sources selected-sources
                                             :data-dir data-dir
                                             :seed seed
                                             :version version})
         task-prompts (->> (:records canon-result)
                           (mapv (fn [record]
                                   (record->task-prompt
                                     (get entry-idx (get-in record [:source :dataset]))
                                     record))))
         summary (summarize-task-prompts task-prompts)
         edn-path (str output-dir "/task_prompts.edn")
         parquet-path (str output-dir "/task_prompts.parquet")
         manifest-path-out (str output-dir "/manifest.edn")
         _ (spit edn-path (pr-str task-prompts))
         _ (parquet/write-parquet task-prompts parquet-path)
         checksums {"task_prompts.edn" (crypto/sha256-file edn-path)
                    "task_prompts.parquet" (crypto/sha256-file parquet-path)}
         input-hash (crypto/sha256-string
                      (pr-str {:source-manifest-hash (crypto/sha256-file manifest-path)
                               :selected-sources selected-sources
                               :seed seed
                               :version version}))
         output-hash (crypto/sha256-string (pr-str (into (sorted-map) checksums)))
         out-manifest (assoc (manifest/create-stage-manifest
                               {:stage :task-prompt-seeds
                                :version version
                                :seed seed
                                :input-hash input-hash
                                :output-hash output-hash
                                :artifact-count (count task-prompts)
                                :config-hash input-hash
                                :checksums checksums})
                             :selected-sources selected-sources
                             :summary summary
                             :source-manifest manifest-path)
         _ (manifest/write-manifest! out-manifest manifest-path-out)]
     {:task-prompts task-prompts
      :summary summary
      :output-dir output-dir
      :selected-sources selected-sources
      :stage-manifests [(:manifest fetch-result) (:manifest canon-result) out-manifest]})))
