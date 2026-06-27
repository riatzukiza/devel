(ns promptbench.report.bundle
  "Reproducibility bundle generation.

   Generates a complete reproducibility bundle containing:
   - prompts.parquet — canonical prompt records
   - variants.parquet — transform variant records
   - manifests/ — per-stage manifests
   - checksums.sha256 — file-level integrity checksums
   - verification_report.edn — post-build verification results
   - datasheet.md — Gebru et al. 2021 datasheet
   - build_manifest.edn — top-level build metadata

   All checksums are computed after file generation to ensure correctness.
   Parquet files are written via the polars bridge (promptbench.python.parquet).

   See validation contract VAL-METRIC-006."
  (:require [clojure.java.io :as io]
            [clojure.string :as str]
            [promptbench.python.parquet :as parquet]
            [promptbench.pipeline.manifest :as manifest]
            [promptbench.report.datasheet :as datasheet]
            [promptbench.util.crypto :as crypto]))

;; ============================================================
;; Parquet Field Preparation
;; ============================================================

(defn- prepare-prompt-for-parquet
  "Prepare a prompt record for parquet output.
   Flattens nested fields and converts keywords to strings.
   Ensures 12-column schema per spec §5.1."
  [record]
  {:source_id      (str (:source-id record))
   :canonical_hash (str (:canonical-hash record))
   :canonical_text (str (:canonical-text record))
   :canonical_lang (if (:canonical-lang record) (name (:canonical-lang record)) "unknown")
   :intent_label   (if (:intent-label record) (name (:intent-label record)) "unknown")
   :attack_family  (when (:attack-family record) (name (:attack-family record)))
   :harm_category  (when (:harm-category record) (name (:harm-category record)))
   :source_dataset (when (get-in record [:source :dataset])
                     (name (get-in record [:source :dataset])))
   :source_row_id  (get-in record [:source :row-id])
   :source_license (when (get-in record [:source :license])
                     (name (get-in record [:source :license])))
   :cluster_id     (:cluster-id record)
   :split          (if (:split record) (name (:split record)) "unknown")})

(defn- prepare-variant-for-parquet
  "Prepare a variant record for parquet output."
  [record]
  {:variant_id      (str (:variant-id record))
   :source_id       (str (:source-id record))
   ;; Target language of the variant (required by docs; best-effort fallback to metadata)
   :language        (cond
                      (:language record) (name (:language record))
                      (keyword? (get-in record [:metadata 0 :target-lang])) (name (get-in record [:metadata 0 :target-lang]))
                      :else "unknown")
   :text            (str (:text record))
   :variant_type    (if (:variant-type record) (name (:variant-type record)) "unknown")
   :transform_chain (pr-str (:transform-chain record))
   :transform_seed  (:transform-seed record)
   :split           (if (:split record) (name (:split record)) "unknown")
   ;; Extra columns (useful for stratified analysis; may be null)
   :attack_family   (when (:attack-family record) (name (:attack-family record)))
   :canonical_lang  (when (:canonical-lang record) (name (:canonical-lang record)))})

;; ============================================================
;; Checksum Generation
;; ============================================================

(defn- generate-checksums
  "Generate SHA-256 checksums for all files in the bundle directory.
   Returns a map of relative-path -> hash."
  [bundle-dir files]
  (into (sorted-map)
        (keep (fn [rel-path]
                (let [f (io/file bundle-dir rel-path)]
                  (when (.exists f)
                    [rel-path (crypto/sha256-file (.getAbsolutePath f))]))))
        files))

(defn- write-checksums-file!
  "Write checksums as a standard sha256sum format file."
  [checksums path]
  (let [lines (mapv (fn [[file hash]]
                      (str hash "  " file))
                    (sort-by key checksums))]
    (spit path (str (str/join "\n" lines) "\n"))))

;; ============================================================
;; Bundle Generation
;; ============================================================

(defn generate-bundle!
  "Generate a complete reproducibility bundle.

   opts — map with keys:
     :bundle-dir           — output directory path
     :records              — vector of canonical prompt records
     :variants             — vector of variant records
     :build-info           — map with build metadata
     :verification-result  — verification suite result map

   build-info must include:
     :version, :seed, :total-prompts, :total-variants,
     :languages, :sources, :license, :git-commit, :splits,
     :dataset-name, :stage-manifests

   Creates the bundle directory and writes all required files:
   - prompts.parquet
   - variants.parquet
   - manifests/ (copies of stage manifests)
   - checksums.sha256
   - verification_report.edn
   - datasheet.md
   - build_manifest.edn"
  [{:keys [bundle-dir records variants build-info verification-result]}]
  (let [bundle-file (io/file bundle-dir)
        manifests-dir (io/file bundle-dir "manifests")]
    ;; Create directories
    (.mkdirs bundle-file)
    (.mkdirs manifests-dir)

    ;; 1. Write prompts.parquet
    (let [parquet-records (mapv prepare-prompt-for-parquet records)]
      (parquet/write-parquet parquet-records (str bundle-dir "/prompts.parquet")))

    ;; 2. Write variants.parquet
    (let [parquet-variants (if (seq variants)
                             (mapv prepare-variant-for-parquet variants)
                             ;; Write at least an empty-schema parquet
                             [{:variant_id "" :source_id "" :language ""
                               :text "" :variant_type "" :transform_chain "" :transform_seed 0
                               :split "" :attack_family nil :canonical_lang nil}])]
      (parquet/write-parquet parquet-variants (str bundle-dir "/variants.parquet")))

    ;; 3. Write stage manifests
    (doseq [sm (:stage-manifests build-info)]
      (let [stage-name (name (:stage sm))
            manifest-path (str bundle-dir "/manifests/" stage-name "-manifest.edn")]
        (manifest/write-manifest! sm manifest-path)))

    ;; 4. Write verification report
    (spit (str bundle-dir "/verification_report.edn")
          (pr-str verification-result))

    ;; 5. Generate and write datasheet
    (let [md (datasheet/generate-datasheet build-info)]
      (spit (str bundle-dir "/datasheet.md") md))

    ;; 6. Create build manifest
    (let [build-manifest (manifest/create-build-manifest
                           {:dataset-name (:dataset-name build-info "guardrail-promptbench")
                            :version (:version build-info)
                            :build-seed (:seed build-info)
                            :stage-manifests (or (:stage-manifests build-info) [])
                            :total-prompts (count records)
                            :total-variants (count variants)
                            :source-versions (:source-versions build-info)})]
      (manifest/write-manifest! build-manifest
                                (str bundle-dir "/build_manifest.edn")))

    ;; 7. Compute and write checksums for all bundle files
    (let [files-to-checksum ["prompts.parquet"
                             "variants.parquet"
                             "verification_report.edn"
                             "datasheet.md"
                             "build_manifest.edn"]
          ;; Also include manifest files
          manifest-files (when (.exists manifests-dir)
                           (mapv (fn [f]
                                   (str "manifests/" (.getName f)))
                                 (filter #(.isFile %) (file-seq manifests-dir))))
          all-files (concat files-to-checksum manifest-files)
          checksums (generate-checksums bundle-dir all-files)]
      (write-checksums-file! checksums (str bundle-dir "/checksums.sha256")))

    ;; Return bundle summary
    {:bundle-dir bundle-dir
     :files (vec (.list bundle-file))
     :prompt-count (count records)
     :variant-count (count variants)}))
