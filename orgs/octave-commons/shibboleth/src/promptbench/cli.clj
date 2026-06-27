(ns promptbench.cli
  "CLI interface for the Shibboleth promptbench pipeline.

   Commands:
   - build    — Full pipeline build, produces complete bundle
   - verify   — Validates an existing build
   - coverage — Generates coverage report
   - rebuild  — Re-executes pipeline from a specified stage

   Uses babashka/cli for argument parsing.

   Exit codes:
   - 0 = success
   - 1 = verification failure / error
   - 2 = invalid arguments

   See spec §4.4 for CLI interface design."
  (:require [babashka.cli :as cli]
            [clojure.edn :as edn]
            [clojure.java.io :as io]
            [clojure.java.shell :as shell]
            [clojure.string :as str]
            [promptbench.corpus.curated :as curated]
            [promptbench.corpus.external :as external]
            [promptbench.pipeline.core :as pipeline]
            [promptbench.pipeline.stages :as stages]
            [promptbench.verification.core :as verification]
            [promptbench.report.bundle :as bundle]
            [promptbench.report.core :as report]
            [promptbench.metrics.core :as metrics]
            [promptbench.metrics.coverage :as coverage]
            [promptbench.metrics.quality :as quality]
            [promptbench.pipeline.manifest :as manifest]
            [promptbench.pipeline.sources :as sources]
            [promptbench.transform.builtins :as xforms-builtins]))

(defn- ensure-runtime-registrations!
  "Ensure required registries are populated for CLI execution.

   The pipeline expects sources, taxonomy, and transforms to be registered
   before execution. Tests often register selectively; CLI should be usable
   out-of-the-box.

   Idempotent and safe to call multiple times." 
  []
  (external/register-all!)
  (curated/register-all!)
  (xforms-builtins/register-all!)
  nil)

;; ============================================================
;; Config Loading
;; ============================================================

(defn load-config
  "Load a pipeline configuration from an EDN file.
   Returns the config map or throws on error."
  [config-path]
  (let [f (io/file config-path)]
    (when-not (.exists f)
      (throw (ex-info (str "Config file not found: " config-path)
                      {:path config-path :type :config-error})))
    (edn/read-string (slurp f))))

(defn- register-pipeline-from-config!
  "Register a pipeline from a loaded config map.
   Overrides :seed if provided in opts.
   Returns the pipeline keyword name."
  [config opts]
  (let [pipeline-name (or (:name config) :default-pipeline)
        seed (or (:seed opts) (:seed config) 1337)
        final-config (assoc config :seed seed)]
    (pipeline/register-pipeline! pipeline-name final-config)
    pipeline-name))

;; ============================================================
;; Build Command
;; ============================================================

(defn build-command
  "Execute a full pipeline build.

   Options:
     --config PATH  — pipeline config file (required)
     --seed N       — override build seed (optional)

   Produces a complete reproducibility bundle.
   Exits 0 on success, non-zero on error."
  [{:keys [opts]}]
  (let [{:keys [config seed]} opts]
    (when-not config
      (binding [*out* *err*]
        (println "Error: --config is required"))
      {:exit-code 2 :error "Missing --config"})
    (if-not config
      {:exit-code 2 :error "Missing --config"}
      (try
        (let [cfg (load-config config)
              pipeline-name (register-pipeline-from-config! cfg {:seed seed})
              result (pipeline/build! pipeline-name)
              records (get-in result [:data :records] [])
              variants (get-in result [:data :variants] [])
              ;; Run Stage 7 verification
              verification-result (verification/run-stage7!
                                    {:records records :variants variants})
              ;; Collect stage manifests from build data dir
              data-dir (or (:data-dir cfg) "data")
              manifests-dir (str data-dir "/manifests")
              stage-manifests (into []
                                    (keep (fn [stage-name]
                                            (let [mf-path (str manifests-dir "/"
                                                               (name stage-name)
                                                               "-manifest.edn")]
                                              (when (.exists (io/file mf-path))
                                                (manifest/read-manifest mf-path)))))
                                    [:fetch :canonicalize :embed-cluster :split
                                     :tier1-mt :tier2-mt :eval-suites])
              ;; Gather source versions for build manifest
              source-versions (into (sorted-map)
                                    (keep (fn [src-kw]
                                            (when-let [src-data (sources/get-source src-kw)]
                                              [src-kw (:version src-data)])))
                                    (or (:sources cfg) []))
              ;; Build info for bundle
              version (or (:version cfg) "0.1.0")
              build-seed (or seed (:seed cfg) 1337)
              build-info {:version version
                          :seed build-seed
                          :total-prompts (count records)
                          :total-variants (count variants)
                          :languages (vec (sort (distinct (keep :canonical-lang records))))
                          :sources (or (:sources cfg) [])
                          :source-versions source-versions
                          :license "GPL-3.0"
                          :git-commit (try
                                        (str/trim (:out (shell/sh "git" "rev-parse" "--short" "HEAD")))
                                        (catch Exception _ "unknown"))
                          :splits (frequencies (map :split records))
                          :dataset-name (or (some-> (:name cfg) name) "guardrail-promptbench")
                          :stage-manifests stage-manifests}
              ;; Generate bundle
              bundle-dir (str data-dir "/build/" version)
              bundle-result (bundle/generate-bundle!
                              {:bundle-dir bundle-dir
                               :records records
                               :variants variants
                               :build-info build-info
                               :verification-result (:verification verification-result)})]
          (println (str "Build complete. Bundle at: " bundle-dir))
          (println (str "  Prompts: " (count records)))
          (println (str "  Variants: " (count variants)))
          (println (str "  Bundle files: " (str/join ", " (:files bundle-result))))
          {:exit-code 0 :result bundle-result})
        (catch clojure.lang.ExceptionInfo e
          (binding [*out* *err*]
            (println (str "Build failed: " (.getMessage e))))
          {:exit-code 1 :error (.getMessage e)})
        (catch Exception e
          (binding [*out* *err*]
            (println (str "Build failed: " (.getMessage e))))
          {:exit-code 1 :error (.getMessage e)})))))

;; ============================================================
;; Fetch Command
;; ============================================================

(defn fetch-command
  "Execute Stage 0 only: fetch/download all sources listed in the config.

   Options:
     --config PATH  — pipeline config file (required)
     --seed N       — override build seed (optional)

   This is intended for prefetching large external corpora without running
   Python-dependent stages (parquet reading, embeddings, clustering, MT, etc.)."
  [{:keys [opts]}]
  (let [{:keys [config seed]} opts]
    (when-not config
      (binding [*out* *err*]
        (println "Error: --config is required"))
      {:exit-code 2 :error "Missing --config"})
    (if-not config
      {:exit-code 2 :error "Missing --config"}
      (try
        (let [cfg (load-config config)
              final-seed (or seed (:seed cfg) 1337)
              final-cfg (assoc cfg :seed final-seed)
              result (stages/fetch! final-cfg)
              files (:files result)]
          (println "Fetch complete.")
          (println (str "  Sources: " (count (or (:sources final-cfg) []))))
          (println (str "  Files:   " (count files)))
          (doseq [[k p] (sort-by key files)]
            (println (str "  - " (name k) " -> " p)))
          {:exit-code 0 :result result})
        (catch clojure.lang.ExceptionInfo e
          (binding [*out* *err*]
            (println (str "Fetch failed: " (.getMessage e))))
          {:exit-code 1 :error (.getMessage e)})
        (catch Exception e
          (binding [*out* *err*]
            (println (str "Fetch failed: " (.getMessage e))))
          {:exit-code 1 :error (.getMessage e)})))))

;; ============================================================
;; Verify Command
;; ============================================================

(defn verify-command
  "Validate an existing build.

   Options:
     --config PATH  — pipeline config file (required)

   Reads existing build artifacts and runs verification suite.
   Exits 0 if valid, non-zero if invalid."
  [{:keys [opts]}]
  (let [{:keys [config]} opts]
    (when-not config
      (binding [*out* *err*]
        (println "Error: --config is required"))
      {:exit-code 2 :error "Missing --config"})
    (if-not config
      {:exit-code 2 :error "Missing --config"}
      (try
        (let [cfg (load-config config)
              pipeline-name (register-pipeline-from-config! cfg {})
              ;; Try to build (will skip completed stages)
              result (pipeline/build! pipeline-name)
              records (get-in result [:data :records] [])
              variants (get-in result [:data :variants] [])
              ;; Run verification
              verification-result (verification/run-stage7!
                                    {:records records :variants variants})]
          (if (get-in verification-result [:verification :passed])
            (do
              (println "Verification PASSED")
              (println (str "  Checks: " (count (get-in verification-result [:verification :checks]))))
              (when-let [metrics (:metric-assertions verification-result)]
                (println (str "  Metric assertions: " (:passed metrics) "/" (:total metrics) " passed")))
              {:exit-code 0 :result verification-result})
            (do
              (println "Verification FAILED")
              (doseq [check (get-in verification-result [:verification :checks])
                      :when (not (:passed check))]
                (println (str "  FAILED: " (name (:name check))
                              (when (:fatal check) " [FATAL]"))))
              {:exit-code 1 :result verification-result})))
        (catch clojure.lang.ExceptionInfo e
          (let [data (ex-data e)]
            (binding [*out* *err*]
              (println (str "Verification FAILED: " (.getMessage e))))
            (when (:fatal data)
              (doseq [f (:failures data)]
                (binding [*out* *err*]
                  (println (str "  FATAL: " (name (:name f)))))))
            {:exit-code 1 :error (.getMessage e)}))
        (catch Exception e
          (binding [*out* *err*]
            (println (str "Verification error: " (.getMessage e))))
          {:exit-code 1 :error (.getMessage e)})))))

;; ============================================================
;; Coverage Command
;; ============================================================

(defn coverage-command
  "Generate a coverage report.

   Options:
     --config PATH    — pipeline config file (required)
     --format FORMAT  — output format: markdown (default)

   Computes all metrics and generates formatted report.
   Exits 0 on success."
  [{:keys [opts]}]
  (let [{:keys [config]} opts
        fmt (or (:format opts) "markdown")]
    (when-not config
      (binding [*out* *err*]
        (println "Error: --config is required"))
      {:exit-code 2 :error "Missing --config"})
    (if-not config
      {:exit-code 2 :error "Missing --config"}
      (try
        (let [cfg (load-config config)
              pipeline-name (register-pipeline-from-config! cfg {})
              ;; Build (will skip completed stages)
              result (pipeline/build! pipeline-name)
              records (get-in result [:data :records] [])
              variants (get-in result [:data :variants] [])
              ;; Register metrics
              _ (coverage/register-coverage-metrics!)
              _ (quality/register-quality-metrics!)
              ;; Compute coverage metrics
              tax-cov (coverage/taxonomy-coverage records {:min-count 1})
              xform-matrix (coverage/transform-coverage-matrix variants)
              lang-cov (coverage/language-coverage records)
              ;; Compute quality metrics
              leakage (quality/cluster-leakage-rate records)
              diversity (quality/semantic-diversity records)
              fidelity (quality/transform-fidelity records variants)
              ;; Distribution reports
              label-dist (report/label-distribution records)
              lang-fam-matrix (report/language-attack-family-matrix records)]
          (case fmt
            "markdown"
            (let [sb (StringBuilder.)
                  fmt-str (fn [pattern & args] (apply clojure.core/format pattern args))]
              (.append sb "# Coverage Report\n\n")
              (.append sb "## Taxonomy Coverage\n\n")
              (.append sb (str "Coverage: " (if (ratio? (:coverage tax-cov))
                                              (fmt-str "%.1f%%" (* 100.0 (double (:coverage tax-cov))))
                                              (fmt-str "%.1f%%" (* 100.0 (:coverage tax-cov))))
                               "\n"))
              (when (seq (:missing tax-cov))
                (.append sb (str "Missing: " (str/join ", " (map name (:missing tax-cov))) "\n")))
              (.append sb "\n## Label Distribution\n\n")
              (.append sb (report/format-label-distribution-markdown label-dist))
              (.append sb "\n\n## Language × Attack Family Matrix\n\n")
              (.append sb (report/format-matrix-markdown lang-fam-matrix))
              (.append sb "\n\n## Quality Metrics\n\n")
              (.append sb (str "Cluster leakage rate: " (:rate leakage) "\n"))
              (.append sb (str "Leaky clusters: " (count (:leaks leakage)) "\n"))
              (.append sb "\n### Semantic Diversity\n\n")
              (doseq [[split val] (sort-by key diversity)]
                (.append sb (str "- " (name split) ": " (fmt-str "%.4f" (double val)) "\n")))
              (.append sb "\n### Transform Fidelity (Backtranslation)\n\n")
              (.append sb (str "Mean BLEU: " (fmt-str "%.4f" (double (:mean-bleu fidelity))) "\n"))
              (.append sb (str "Mean chrF: " (fmt-str "%.4f" (double (:mean-chrf fidelity))) "\n"))
              (.append sb (str "\nScored variants: " (count (:scores fidelity)) "\n"))
              (println (.toString sb))
              {:exit-code 0})
            ;; default
            (do
              (println (str "Unknown format: " fmt))
              {:exit-code 2 :error (str "Unknown format: " fmt)})))
        (catch Exception e
          (binding [*out* *err*]
            (println (str "Coverage report failed: " (.getMessage e))))
          {:exit-code 1 :error (.getMessage e)})))))

;; ============================================================
;; Rebuild Command
;; ============================================================

(defn rebuild-command
  "Re-execute pipeline from a specified stage.

   Options:
     --config PATH  — pipeline config file (required)
     --from STAGE   — stage to rebuild from (required)
     --seed N       — override build seed (optional)

   Invalidates the specified stage and all downstream stages,
   then re-executes them. Upstream stages are preserved.
   Exits 0 on success."
  [{:keys [opts]}]
  (let [{:keys [config from seed]} opts]
    (when-not config
      (binding [*out* *err*]
        (println "Error: --config is required"))
      {:exit-code 2 :error "Missing --config"})
    (when-not from
      (binding [*out* *err*]
        (println "Error: --from is required"))
      {:exit-code 2 :error "Missing --from"})
    (if-not (and config from)
      {:exit-code 2 :error "Missing required arguments"}
      (try
        (let [cfg (load-config config)
              pipeline-name (register-pipeline-from-config! cfg {:seed seed})
              from-stage (keyword from)
              result (pipeline/rebuild! pipeline-name :from from-stage)
              records (get-in result [:data :records] [])
              variants (get-in result [:data :variants] [])]
          (println (str "Rebuild from :" (name from-stage) " complete."))
          (println (str "  Prompts: " (count records)))
          (println (str "  Variants: " (count variants)))
          (println (str "  Stages: " (str/join ", "
                                              (map (fn [[k v]]
                                                     (str (name k) "=" (name (:status v))))
                                                   (sort-by key (:stages result))))))
          {:exit-code 0 :result result})
        (catch clojure.lang.ExceptionInfo e
          (binding [*out* *err*]
            (println (str "Rebuild failed: " (.getMessage e))))
          {:exit-code 1 :error (.getMessage e)})
        (catch Exception e
          (binding [*out* *err*]
            (println (str "Rebuild failed: " (.getMessage e))))
          {:exit-code 1 :error (.getMessage e)})))))

;; ============================================================
;; CLI Dispatch Table
;; ============================================================

(def ^:private cli-spec
  "CLI argument specs for all commands."
  {:config {:desc "Path to pipeline config EDN file"
            :alias :c
            :require true}
   :seed   {:desc "Build seed (integer)"
            :alias :s
            :coerce :long}
   :from   {:desc "Stage to rebuild from"
            :alias :f}
   :format {:desc "Output format (markdown)"
            :default "markdown"}})

(def dispatch-table
  "Dispatch table for babashka/cli — vector of command maps."
  [{:cmds ["build"]
    :fn   build-command
    :spec (select-keys cli-spec [:config :seed])
    :desc "Run full pipeline build"}
   {:cmds ["fetch"]
    :fn   fetch-command
    :spec (select-keys cli-spec [:config :seed])
    :desc "Fetch/download all sources (Stage 0 only)"}
   {:cmds ["verify"]
    :fn   verify-command
    :spec (select-keys cli-spec [:config])
    :desc "Validate an existing build"}
   {:cmds ["coverage"]
    :fn   coverage-command
    :spec (select-keys cli-spec [:config :format])
    :desc "Generate coverage report"}
   {:cmds ["rebuild"]
    :fn   rebuild-command
    :spec (select-keys cli-spec [:config :from :seed])
    :desc "Re-execute from specified stage"}])

;; ============================================================
;; Main Entry Point
;; ============================================================

(defn- print-help []
  (println "promptbench — Generative DSL for Adversarial Prompt Evaluation Datasets")
  (println)
  (println "Commands:")
  (doseq [{:keys [cmds desc]} dispatch-table]
    (let [cmd (first cmds)]
      (println (str "  " cmd (apply str (repeat (- 12 (count cmd)) " ")) desc))))
  (println)
  (println "Options:")
  (println "  --config PATH    Pipeline config file (required)")
  (println "  --seed N         Override build seed")
  (println "  --from STAGE     Stage to rebuild from (rebuild only)")
  (println "  --format FORMAT  Output format (coverage only, default: markdown)")
  (println)
  (println "Examples:")
  (println "  promptbench fetch --config pipelines/prefetch-all.edn")
  (println "  promptbench build --config pipelines/v1.edn --seed 1337")
  (println "  promptbench verify --config pipelines/v1.edn")
  (println "  promptbench coverage --config pipelines/v1.edn --format markdown")
  (println "  promptbench rebuild --config pipelines/v1.edn --from transforms"))

(defn run
  "Main CLI dispatch. Parses args and dispatches to the appropriate command.
   Returns a map with :exit-code."
  [args]
  (if (or (empty? args) (some #{"--help" "-h" "help"} args))
    (do (print-help)
        {:exit-code 0})
    (do
      (ensure-runtime-registrations!)
      (let [result (cli/dispatch dispatch-table args)]
        (or result {:exit-code 0})))))
