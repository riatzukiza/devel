(ns promptbench.corpus.context-seed
  "Build a normalized context-prompt seed artifact from curated local sources.

   These prompts are intended for insertion into `system` or `developer`
   channels rather than being used as direct user asks." 
  (:require [cheshire.core :as json]
            [clojure.java.io :as io]
            [promptbench.pipeline.manifest :as manifest]
            [promptbench.pipeline.stages :as stages]
            [promptbench.python.parquet :as parquet]
            [promptbench.util.crypto :as crypto]))

(def ^:private default-output-dir
  "data/context-prompts/seed-v0.1.0")

(def ^:private source-configs
  [{:dataset :curated-persona-injections
    :path "data/curated/persona-injections/prompts.jsonl"
    :intent-label "adversarial"
    :role-channel "system"
    :category "persona-injection"}
   {:dataset :curated-authority-escalation
    :path "data/curated/authority-escalation/prompts.jsonl"
    :intent-label "adversarial"
    :role-channel "system"
    :category "authority-impersonation"}
   {:dataset :curated-developer-mode
    :path "data/curated/developer-mode/prompts.jsonl"
    :intent-label "adversarial"
    :role-channel "developer"
    :category "developer-mode"}
   {:dataset :curated-benign-contexts
    :path "data/curated/benign-contexts/prompts.jsonl"
    :intent-label nil
    :role-channel nil
    :category "benign-context"}])

(defn- read-jsonl
  [path]
  (with-open [rdr (io/reader path)]
    (->> (line-seq rdr)
         (mapv #(json/parse-string % true)))))

(defn- row->context-prompt
  [cfg idx row]
  (let [text (str (:prompt row))
        canon (stages/normalize-text text)
        c-hash (stages/canonical-hash text)
        hash-prefix (subs c-hash 0 (min 16 (count c-hash)))
        source-id (stages/compute-source-id (name (:dataset cfg)) idx hash-prefix)
        role-channel (or (:role_channel row) (:role-channel cfg) "system")
        intent-label (or (:intent_label row)
                         (:intent-label cfg)
                         (if (= "benign" (:harm_category row)) "benign" "adversarial"))
        category (or (:family row) (:category cfg) (:harm_category row) "unknown")]
    {:context_id          (crypto/sha256-id (str "context|" source-id))
     :source_id           source-id
     :canonical_hash      c-hash
     :canonical_text      canon
     :language            (or (:language row) "en")
     :intent_label        intent-label
     :role_channel        role-channel
     :category            category
     :source_dataset      (name (:dataset cfg))
     :dataset_origin      [(name (:dataset cfg))]
     :quality_flags       []}))

(defn- summarize-context-prompts
  [rows]
  {:total           (count rows)
   :by_intent       (into (sorted-map) (frequencies (map :intent_label rows)))
   :by_role_channel (into (sorted-map) (frequencies (map :role_channel rows)))
   :by_source       (into (sorted-map) (frequencies (map :source_dataset rows)))
   :by_language     (into (sorted-map) (frequencies (map :language rows)))})

(defn build-context-prompts!
  ([] (build-context-prompts! {}))
  ([{:keys [output-dir version seed]
     :or {output-dir default-output-dir
          version "0.1.0"
          seed 1337}}]
   (let [_ (.mkdirs (io/file output-dir))
         rows (->> source-configs
                   (mapcat (fn [cfg]
                             (map-indexed (fn [idx row]
                                            (row->context-prompt cfg idx row))
                                          (read-jsonl (:path cfg)))))
                   vec)
         summary (summarize-context-prompts rows)
         edn-path (str output-dir "/context_prompts.edn")
         parquet-path (str output-dir "/context_prompts.parquet")
         manifest-path (str output-dir "/manifest.edn")
         _ (spit edn-path (pr-str rows))
         _ (parquet/write-parquet rows parquet-path)
         checksums {"context_prompts.edn" (crypto/sha256-file edn-path)
                    "context_prompts.parquet" (crypto/sha256-file parquet-path)}
         input-hash (crypto/sha256-string (pr-str {:sources (mapv :dataset source-configs)
                                                   :seed seed
                                                   :version version}))
         output-hash (crypto/sha256-string (pr-str (into (sorted-map) checksums)))
         out-manifest (assoc (manifest/create-stage-manifest
                               {:stage :context-prompt-seeds
                                :version version
                                :seed seed
                                :input-hash input-hash
                                :output-hash output-hash
                                :artifact-count (count rows)
                                :config-hash input-hash
                                :checksums checksums})
                             :sources (mapv :dataset source-configs)
                             :summary summary)
         _ (manifest/write-manifest! out-manifest manifest-path)]
     {:context-prompts rows
      :summary summary
      :output-dir output-dir
      :sources (mapv :dataset source-configs)})))
