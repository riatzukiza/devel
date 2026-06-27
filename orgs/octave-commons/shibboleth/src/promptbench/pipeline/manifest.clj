(ns promptbench.pipeline.manifest
  "Manifest generation, writing, and reading.

   Every pipeline stage produces a manifest with:
   :stage, :version, :started-at, :completed-at, :seed,
   :input-hash, :output-hash, :artifact-count, :config-hash, :checksums.

   Build manifest aggregates all stage manifests (spec §5.4).

   Manifests are written as EDN files and are the backbone of the
   provenance and reproducibility system (spec §5.3)."
  (:require [clojure.edn :as edn]
            [clojure.java.io :as io]
            [clojure.string :as str]
            [promptbench.util.crypto :as crypto])
  (:import [java.time Instant]))

;; ============================================================
;; Creation
;; ============================================================

(defn create-stage-manifest
  "Create a stage manifest map with all required fields.

   `opts` must include:
   :stage          — keyword stage name (e.g. :fetch, :canonicalize)
   :version        — string version of the pipeline
   :seed           — integer build seed
   :input-hash     — SHA-256 hex string of input data/config
   :output-hash    — SHA-256 hex string of output artifacts
   :artifact-count — number of output artifacts/records
   :config-hash    — SHA-256 hex string of stage configuration
   :checksums      — map of filename -> SHA-256 hex string

   Automatically adds :started-at and :completed-at timestamps."
  [{:keys [stage version seed input-hash output-hash
           artifact-count config-hash checksums]}]
  (let [now (str (Instant/now))]
    {:stage          stage
     :version        version
     :started-at     now
     :completed-at   now
     :seed           seed
     :input-hash     input-hash
     :output-hash    output-hash
     :artifact-count artifact-count
     :config-hash    config-hash
     :checksums      (or checksums {})}))

;; ============================================================
;; I/O
;; ============================================================

(defn write-manifest!
  "Write a manifest map to an EDN file at `path`.
   Creates parent directories if they don't exist."
  [manifest path]
  (let [f (io/file path)]
    (.mkdirs (.getParentFile f))
    (spit f (pr-str manifest))))

(defn read-manifest
  "Read a manifest from an EDN file at `path`.
   Returns the manifest map."
  [path]
  (edn/read-string (slurp path)))

;; ============================================================
;; Build Manifest (Top-Level Aggregation, spec §5.4)
;; ============================================================

(defn- get-git-commit
  "Get the current git commit SHA, or 'unknown' if unavailable."
  []
  (try
    (let [process (.exec (Runtime/getRuntime)
                         (into-array String ["git" "rev-parse" "--short" "HEAD"]))
          result (str/trim (slurp (.getInputStream process)))]
      (.waitFor process)
      (if (str/blank? result) "unknown" result))
    (catch Exception _
      "unknown")))

(defn create-build-manifest
  "Create a top-level build manifest that aggregates all stage manifests.

   `opts` must include:
   :dataset-name    — string name of the dataset
   :version         — string pipeline version
   :build-seed      — integer build seed
   :stage-manifests — vector of stage manifest maps
   :total-prompts   — integer count of canonical prompts
   :total-variants  — integer count of transform variants

   `opts` may include:
   :source-versions — map of source-keyword -> version-string
                      (tracks curated and public source versions)

   Returns a build manifest map per spec §5.4."
  [{:keys [dataset-name version build-seed stage-manifests
           total-prompts total-variants source-versions]}]
  (let [stages (reduce
                 (fn [acc sm]
                   (assoc acc (:stage sm)
                          {:status :complete
                           :hash (:output-hash sm)}))
                 {}
                 stage-manifests)]
    (cond-> {:dataset-name    dataset-name
             :version         version
             :build-seed      build-seed
             :git-commit      (get-git-commit)
             :stages          stages
             :total-prompts   total-prompts
             :total-variants  total-variants}
      source-versions (assoc :source-versions source-versions))))

;; ============================================================
;; Checksum Verification
;; ============================================================

(defn verify-checksums
  "Verify that checksums in a stage manifest match actual files on disk.

   `stage-manifest` — a manifest map with :checksums {filename -> expected-hash}
   `data-dir`       — base data directory path

   Returns {:passed bool :mismatches [{:file :expected :actual}]}"
  [stage-manifest data-dir]
  (let [checksums (:checksums stage-manifest {})
        mismatches (into []
                         (keep
                           (fn [[filename expected-hash]]
                             (let [file-path (str data-dir "/" filename)
                                   file (io/file file-path)]
                               (if-not (.exists file)
                                 {:file filename
                                  :expected expected-hash
                                  :actual :missing}
                                 (let [actual-hash (crypto/sha256-file file-path)]
                                   (when (not= expected-hash actual-hash)
                                     {:file filename
                                      :expected expected-hash
                                      :actual actual-hash}))))))
                         (sort-by key checksums))]
    {:passed (empty? mismatches)
     :mismatches mismatches}))
