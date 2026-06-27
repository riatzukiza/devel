(ns promptbench.pipeline.core
  "def-pipeline macro and pipeline orchestration.

   Provides:
   - `def-pipeline` macro for declarative pipeline definition
   - `build!` for full or partial pipeline execution
   - `rebuild!` for invalidating and re-running from a stage
   - `resume!` for resuming from last completed stage

   Pipeline stages execute in order:
     :fetch -> :canonicalize -> :embed-cluster -> :split
     -> :tier1-mt -> :tier2-mt -> :eval-suites

   Stages 0-3 produce canonical records with splits.
   Stages 4-6 generate transform variants from those records.

   Pipelines are resumable (skip completed stages), idempotent,
   and seed-controlled for reproducibility."
  (:refer-clojure :exclude [reset!])
  (:require [promptbench.pipeline.stages :as stages]
            [promptbench.pipeline.transform-stages :as xform-stages]
            [promptbench.pipeline.manifest :as manifest]
            [clojure.java.io :as io]
            [clojure.edn :as edn]))

;; ============================================================
;; Registry
;; ============================================================

(defonce ^:private pipeline-registry (atom {}))

(defn register-pipeline!
  "Register a pipeline definition."
  [pipeline-name config]
  (swap! pipeline-registry assoc pipeline-name config)
  config)

(defn get-pipeline
  "Get a registered pipeline definition by keyword name."
  [pipeline-name]
  (get @pipeline-registry pipeline-name))

;; reset-pipelines! defined after build-state atom below

;; ============================================================
;; Macro
;; ============================================================

(defmacro def-pipeline
  "Define and register a pipeline configuration.

   Usage:
     (def-pipeline my-pipeline
       {:version \"0.1.0\"
        :seed 1337
        :sources [:aya-redteaming :harmbench]
        :data-dir \"data\"
        :embedding {:model \"intfloat/multilingual-e5-large\" :batch-size 256}
        :clustering {:min-cluster-size 5 :metric \"cosine\"}
        :split {:train 0.70 :dev 0.15 :test 0.15
                :stratify-by [:intent-label :attack-family :canonical-lang]
                :constraint :cluster-disjoint}})"
  [pipeline-name config]
  (let [kw-name (keyword (name pipeline-name))]
    `(register-pipeline! ~kw-name ~config)))

;; ============================================================
;; Stage Ordering
;; ============================================================

(def ^:private stage-order
  "Ordered vector of pipeline stages.
   Stages 0-3: data preparation (fetch, canonicalize, embed+cluster, split).
   Stages 4-6: transform generation (tier1-mt, tier2-mt, eval-suites)."
  [:fetch :canonicalize :embed-cluster :split :tier1-mt :tier2-mt :eval-suites])

(defn- stage-index
  "Get the index of a stage in the pipeline order."
  [stage]
  (let [idx (.indexOf stage-order stage)]
    (when (neg? idx)
      (throw (ex-info (str "Unknown stage: " stage)
                      {:stage stage :known-stages stage-order})))
    idx))

;; ============================================================
;; Build State
;; ============================================================

(defonce ^:private build-state (atom {}))

(defn- get-build-state
  "Get the build state for a pipeline."
  [pipeline-name]
  (get @build-state pipeline-name))

(defn- set-stage-complete!
  "Mark a stage as complete in the build state."
  [pipeline-name stage data]
  (swap! build-state assoc-in [pipeline-name :stages stage]
         {:status :complete :data data}))

(defn- clear-build-state!
  "Clear build state for a pipeline from a given stage onward."
  [pipeline-name from-stage]
  (let [from-idx (stage-index from-stage)]
    (doseq [stage (subvec stage-order from-idx)]
      (swap! build-state update-in [pipeline-name :stages] dissoc stage))))

(defn- reset-build-state!
  "Clear all build state. Used for test isolation."
  []
  (clojure.core/reset! build-state {}))

(defn reset-pipelines!
  "Clear all registered pipelines and build state. Used for test isolation."
  []
  (clojure.core/reset! pipeline-registry {})
  (reset-build-state!)
  nil)

;; ============================================================
;; Stage Execution
;; ============================================================

(defn- run-fetch!
  "Execute the fetch stage."
  [config]
  (stages/fetch! config))

(defn- run-canonicalize!
  "Execute the canonicalize stage."
  [config]
  (stages/canonicalize! config))

(defn- run-embed-cluster!
  "Execute the embed+cluster stage."
  [config records]
  (stages/embed-cluster! (assoc config :records records)))

(defn- run-split!
  "Execute the split stage."
  [config records]
  (stages/split! (assoc config :records records)))

(defn- run-tier1-mt!
  "Execute the tier-1 MT stage."
  [config records]
  (xform-stages/tier1-mt! config records))

(defn- run-tier2-mt!
  "Execute the tier-2 MT stage."
  [config records]
  (xform-stages/tier2-mt! config records))

(defn- run-eval-suites!
  "Execute the eval suites stage."
  [config records]
  (xform-stages/eval-suites! config records))

;; ============================================================
;; Pipeline Orchestration
;; ============================================================

(defn build!
  "Build a pipeline, executing stages in order.

   Options:
     :up-to — keyword stage name to stop at (inclusive)

   The pipeline is resumable: completed stages are skipped unless
   their state has been invalidated.

   Stages 0-3 produce canonical records with splits.
   Stages 4-6 produce transform variants, accumulated across stages.

   Returns a build result map with :stages and :data.
   :data contains :records (canonical) and :variants (transform-generated)."
  [pipeline-name & {:keys [up-to]}]
  (let [config (get-pipeline pipeline-name)
        _ (when-not config
            (throw (ex-info (str "Pipeline not found: " pipeline-name)
                            {:pipeline pipeline-name})))
        max-stage-idx (if up-to
                        (stage-index up-to)
                        (dec (count stage-order)))
        stages-to-run (subvec stage-order 0 (inc max-stage-idx))
        ;; Get existing build state
        existing-state (get-build-state pipeline-name)]

    ;; Execute stages in order, accumulating records and variants
    (loop [remaining stages-to-run
           last-records nil
           all-variants []]
      (if (empty? remaining)
        ;; Done — return build result
        {:stages (reduce-kv (fn [m k v]
                              (assoc m k (select-keys v [:status])))
                            {}
                            (get-in @build-state [pipeline-name :stages] {}))
         :data {:records last-records
                :variants all-variants}}
        (let [stage (first remaining)
              existing (get-in existing-state [:stages stage])]
          (if (and existing (= :complete (:status existing)))
            ;; Stage already complete — skip but recover data
            (let [data (:data existing)
                  records (or (:records data) last-records)
                  new-variants (or (:variants data) [])]
              (recur (rest remaining) records (into all-variants new-variants)))
            ;; Execute stage
            (let [result (case stage
                           :fetch
                           (run-fetch! config)

                           :canonicalize
                           (run-canonicalize! config)

                           :embed-cluster
                           (let [records (or last-records
                                             ;; Try to read from disk
                                             (let [canon-file (str (:data-dir config "data")
                                                                   "/canonicalized/canonical-records.edn")]
                                               (when (.exists (io/file canon-file))
                                                 (edn/read-string (slurp canon-file)))))]
                             (run-embed-cluster! config records))

                           :split
                           (run-split! config last-records)

                           :tier1-mt
                           (run-tier1-mt! config last-records)

                           :tier2-mt
                           (run-tier2-mt! config last-records)

                           :eval-suites
                           (run-eval-suites! config last-records))

                  ;; Records only come from stages 0-3; transform stages
                  ;; don't modify canonical records
                  records (or (:records result) last-records)
                  new-variants (or (:variants result) [])]
              ;; Store completion
              (set-stage-complete! pipeline-name stage result)
              (recur (rest remaining)
                     records
                     (into all-variants new-variants)))))))))

(defn rebuild!
  "Rebuild a pipeline from a specific stage onward.

   Invalidates the specified stage and all downstream stages,
   then re-executes them.

   Options:
     :from — keyword stage name to start rebuilding from

   Returns the build result."
  [pipeline-name & {:keys [from]}]
  (let [from-stage (or from :fetch)]
    ;; Clear build state from the specified stage onward
    (clear-build-state! pipeline-name from-stage)
    ;; Re-build fully
    (build! pipeline-name)))


