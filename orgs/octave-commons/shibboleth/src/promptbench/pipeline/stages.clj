(ns promptbench.pipeline.stages
  "Stage execution engine.

   Stage 0 (Fetch): Download/copy source datasets to data/raw/,
   compute SHA-256 checksums, write stage manifest.

   Stage 1 (Canonicalize): NFKC normalize text, collapse whitespace,
   compute canonical_hash (SHA-256 of normalized text), generate source_id
   (SHA-256 of dataset-id + row-id + canonical-hash-prefix), map source
   labels to taxonomy via taxonomy-mapping, output records with all
   required fields.

   Stage 2 (Embed + Cluster): Embed all canonical prompts via
   sentence-transformers, cluster via HDBSCAN, assign cluster_ids.
   No records dropped.

   Stage 3 (Split): Cluster-level stratified split (70/15/15) with
   enforced disjointness invariant.

   All stages are idempotent and write manifests per spec §5.3."
  (:require [clojure.java.io :as io]
            [clojure.string :as str]
            [clojure.data.csv :as csv]
            [cheshire.core :as json]
            [clj-http.client :as http]
            [promptbench.pipeline.sources :as sources]
            [promptbench.pipeline.manifest :as manifest]
            [promptbench.pipeline.splitter :as splitter]
            [promptbench.python.embed :as embed]
            [promptbench.python.cluster :as cluster]
            [promptbench.python.parquet :as parquet]
            [promptbench.util.crypto :as crypto])
  (:import [java.nio.file Files Paths StandardCopyOption]
           [java.text Normalizer Normalizer$Form]))

;; ============================================================
;; Hashing Utilities (delegated to promptbench.util.crypto)
;; ============================================================

(def ^:private sha256-file crypto/sha256-file)
(def ^:private sha256-string crypto/sha256-string)

;; ============================================================
;; Text Normalization
;; ============================================================

(defn normalize-text
  "Apply NFKC normalization and whitespace collapse.

   1. NFKC Unicode normalization (decomposes ligatures, fullwidth chars, etc.)
   2. Replace all whitespace sequences (tabs, newlines, multiple spaces) with single space
   3. Trim leading/trailing whitespace"
  ^String [^String text]
  (-> text
      (Normalizer/normalize Normalizer$Form/NFKC)
      (str/replace #"\s+" " ")
      str/trim))

;; ============================================================
;; Canonical Hashing
;; ============================================================

(defn canonical-hash
  "Compute the canonical hash of a text string.
   Returns SHA-256 hex string of the normalized text.

   The text is first NFKC-normalized and whitespace-collapsed,
   then hashed. This ensures the same logical text always produces
   the same hash regardless of encoding or whitespace variations."
  ^String [^String text]
  (sha256-string (normalize-text text)))

;; ============================================================
;; Source ID Generation
;; ============================================================

(defn compute-source-id
  "Generate a deterministic source_id from (dataset-id, row-id, canonical-hash-prefix).

   source_id = SHA-256(dataset-id + '|' + row-id + '|' + canonical-hash-prefix)

   This ensures uniqueness across datasets and rows while being
   fully deterministic from the input components."
  ^String [^String dataset-id row-id ^String canonical-hash-prefix]
  (let [input (str dataset-id "|" row-id "|" canonical-hash-prefix)]
    (sha256-string input)))

;; ============================================================
;; Taxonomy Resolution
;; ============================================================

(defn resolve-taxonomy
  "Resolve taxonomy labels from a raw record using source taxonomy-mapping.

   Returns a map with resolved :harm-category, :attack-family, and :intent-label.
   Unmapped labels resolve to :unmapped with a warning logged."
  [record source-data]
  (let [mapping (:taxonomy-mapping source-data)
        raw-harm (get record :harm_category (get record "harm_category"))
        raw-family (get record :family (get record "family"))
        ;; Resolve harm category
        harm-mapping (get mapping :harm_category {})
        resolved-harm (get harm-mapping raw-harm)
        ;; Resolve attack family
        family-mapping (get mapping :family {})
        resolved-family (get family-mapping raw-family)
        ;; Determine intent label based on harm category
        intent (cond
                 (= raw-harm "benign") :benign
                 (or (= raw-family "benign") (= resolved-harm :benign)) :benign
                 :else :adversarial)]
    (when (and raw-harm (nil? resolved-harm))
      (binding [*out* *err*]
        (println (str "WARNING: Unmapped harm_category '" raw-harm
                      "' in source " (:description source-data)))))
    (when (and raw-family (nil? resolved-family))
      (binding [*out* *err*]
        (println (str "WARNING: Unmapped family '" raw-family
                      "' in source " (:description source-data)))))
    {:harm-category (or resolved-harm :unmapped)
     :attack-family (or resolved-family :unmapped)
     :intent-label  intent}))

;; ============================================================
;; JSONL Reading
;; ============================================================

(defn- read-jsonl
  "Read a JSONL file and return a vector of maps with string keys converted to keywords."
  [^String path]
  (with-open [rdr (io/reader path)]
    (into []
          (comp (map str/trim)
                (remove str/blank?)
                (map #(json/parse-string % true)))
          (line-seq rdr))))

;; ============================================================
;; CSV Reading
;; ============================================================

(defn- read-csv-file
  "Read a CSV file and return a vector of maps.
   The first row is treated as headers, converted to keywords.
   Returns maps with keyword keys."
  [^String path]
  (with-open [rdr (io/reader path)]
    (let [data (csv/read-csv rdr)
          headers (map keyword (first data))
          rows (rest data)]
      (into []
            (map (fn [row]
                   (zipmap headers row)))
            rows))))

(defn- read-tsv-file
  "Read a TSV file (tab-separated) and return a vector of maps.
   The first row is treated as headers, converted to keywords." 
  [^String path]
  (with-open [rdr (io/reader path)]
    (let [data (csv/read-csv rdr :separator \tab)
          headers (map keyword (first data))
          rows (rest data)]
      (into []
            (map (fn [row]
                   (zipmap headers row)))
            rows))))

;; ============================================================
;; Parquet Reading (via Python bridge)
;; ============================================================

(defn- read-parquet-file
  "Read a Parquet file and return a vector of maps with keyword keys.
   Uses polars via the Python bridge."
  [^String path]
  (parquet/read-parquet path))

;; ============================================================
;; Format-Dispatched Reading
;; ============================================================

(defn- read-source-file
  "Read a source file from data/raw/ based on the source's declared format.

   Dispatches to:
   - :jsonl   → read-jsonl (JSON lines)
   - :csv     → read-csv-file (CSV with header row)
   - :tsv     → read-tsv-file (TSV with header row)
   - :parquet → read-parquet-file (Parquet via polars/libpython-clj)
   - :edn     → clojure.edn/read-string

   Returns a vector of maps with keyword keys."
  [^String path format]
  (case format
    :jsonl   (read-jsonl path)
    :csv     (read-csv-file path)
    :tsv     (read-tsv-file path)
    :parquet (read-parquet-file path)
    :edn     (clojure.edn/read-string (slurp path))
    (throw (ex-info (str "Unsupported source format: " format)
                    {:format format :path path}))))

;; ============================================================
;; Field Extraction from Source Records
;; ============================================================

(defn- extract-text-field
  "Extract the text field from a source record using field-mapping.

   Checks :field-mapping for a key that maps to :text.
   Falls back to :prompt or 'prompt' for backwards compatibility."
  [row source-data]
  (let [field-mapping (:field-mapping source-data)
        ;; Find which source column maps to :text
        text-source-key (when field-mapping
                          (some (fn [[k v]] (when (= v :text) k)) field-mapping))]
    (if text-source-key
      ;; Use field-mapping: try keyword first, then string
      (or (get row text-source-key)
          (get row (name text-source-key))
          "")
      ;; Fallback: legacy JSONL convention (prompt field)
      (or (:prompt row) (get row "prompt") ""))))

(defn- extract-language-field
  "Extract the language field from a source record.

   Checks :field-mapping for a key that maps to :language.
   Falls back to :default-language from source-data, then 'en'."
  [row source-data]
  (let [field-mapping (:field-mapping source-data)
        lang-source-key (when field-mapping
                          (some (fn [[k v]] (when (= v :language) k)) field-mapping))
        default-lang (or (:default-language source-data) "en")]
    (if lang-source-key
      ;; Use field-mapping: try keyword first, then string
      (let [val (or (get row lang-source-key)
                    (get row (name lang-source-key)))]
        (if (and val (not (str/blank? (str val))))
          (str val)
          default-lang))
      ;; Fallback: legacy JSONL convention (language field), then default
      (or (some-> (or (:language row) (get row "language"))
                  str
                  (#(when-not (str/blank? %) %)))
           default-lang))))

;; ============================================================
;; Language Normalization
;; ============================================================

(def ^:private language-aliases
  "Common language labels mapped to lowercase ISO-639-1-ish codes.

   Used to normalize sources that emit language names (e.g. 'English') or
   ISO-639-3 codes (e.g. 'eng')."
  {"en" "en" "eng" "en" "english" "en"
   "es" "es" "spa" "es" "spanish" "es"
   "fr" "fr" "fra" "fr" "french" "fr"
   "hi" "hi" "hin" "hi" "hindi" "hi"
   "ru" "ru" "rus" "ru" "russian" "ru"
   "ar" "ar" "arb" "ar" "arabic" "ar"
   "sr" "sr" "srp" "sr" "serbian" "sr"
   ;; Tagalog / Filipino
   "tl" "tl" "tgl" "tl" "fil" "tl" "tagalog" "tl" "filipino" "tl"
   ;; Other common languages used by the pipeline
   "de" "de" "deu" "de" "german" "de"
   "pt" "pt" "por" "pt" "portuguese" "pt"
   "zh" "zh" "zho" "zh" "chinese" "zh"
   "ja" "ja" "jpn" "ja" "japanese" "ja"
   "ko" "ko" "kor" "ko" "korean" "ko"
   "sw" "sw" "swa" "sw" "swahili" "sw"
   "ur" "ur" "urd" "ur" "urdu" "ur"
   "bn" "bn" "ben" "bn" "bengali" "bn"
   "th" "th" "tha" "th" "thai" "th"
   "vi" "vi" "vie" "vi" "vietnamese" "vi"
   "id" "id" "ind" "id" "indonesian" "id"
   "tr" "tr" "tur" "tr" "turkish" "tr"
   "fa" "fa" "fas" "fa" "farsi" "fa" "persian" "fa"
   "he" "he" "heb" "he" "hebrew" "he"})

(defn- normalize-language-code
  "Normalize a language label into a lowercase code suitable for keywording.

   Examples:
   - 'English' -> 'en'
   - 'eng' -> 'en'
   - 'en-US' -> 'en'

   For unknown inputs, returns the lowercased base token." 
  [lang]
  (let [s0 (-> (str (or lang "")) str/trim)
        s1 (if (str/starts-with? s0 ":") (subs s0 1) s0)
        s2 (-> s1 (str/replace "_" "-"))
        base (first (str/split s2 #"-" 2))
        lower (str/lower-case base)]
    (or (get language-aliases lower)
        (when (= 2 (count lower)) lower)
        lower)))

(defn- extract-harm-category-field
  "Extract the harm category field from a source record using field-mapping.

   Checks :field-mapping for a key mapping to :harm-category.
   Falls back to :harm_category for backwards compatibility."
  [row source-data]
  (let [field-mapping (:field-mapping source-data)
        harm-source-key (when field-mapping
                          (some (fn [[k v]] (when (= v :harm-category) k)) field-mapping))]
    (if harm-source-key
      (or (get row harm-source-key)
          (get row (name harm-source-key)))
      ;; Fallback: legacy convention
      (or (:harm_category row) (get row "harm_category")))))

(defn- extract-intent-label-field
  "Extract the intent-label field from a source record using field-mapping.

   Checks :field-mapping for a key mapping to :intent-label.
   Falls back to :default-intent-label from source-data if present.

   Returns the raw value (string/keyword/etc.) or nil." 
  [row source-data]
  (let [field-mapping (:field-mapping source-data)
        intent-source-key (when field-mapping
                            (some (fn [[k v]] (when (= v :intent-label) k)) field-mapping))]
    (if intent-source-key
      (or (get row intent-source-key)
          (get row (name intent-source-key))
          (:default-intent-label source-data))
      (:default-intent-label source-data))))

(defn- normalize-intent-label
  "Normalize various source-specific label values into :benign or :adversarial.

   Returns nil when no safe normalization can be inferred." 
  [v]
  (let [s (some-> v name str/lower-case)
        s (or s (some-> v str str/lower-case str/trim))]
    (cond
      (nil? v) nil
      (contains? #{"benign" "safe" "harmless" "allowed" "allow"} s) :benign
      (contains? #{"adversarial" "unsafe" "harmful" "malicious" "blocked" "block"} s) :adversarial
      :else nil)))

;; ============================================================
;; Cross-Source Deduplication
;; ============================================================

(defn deduplicate-cross-source
  "Deduplicate canonical records across sources by canonical-hash.

   **Dedup Policy** (documented per VAL-CORPUS-006):
   When the same text (identical after NFKC normalization and whitespace
   collapse) appears in multiple sources:
   1. Curated sources take precedence over public sources
      (source keyword contains 'curated' prefix).
   2. Among same-type sources (both curated or both public),
      the record from the alphabetically-first source is kept.
   3. Deterministic: same input always produces same output.

   Rationale: Curated sources carry more precise attack family
   classifications. Keeping curated provenance preserves the
   taxonomy granularity that curated data provides.

   Arguments:
   - records — vector of canonical records (output of canonicalize!)

   Returns:
   {:records     [<deduplicated-records>]
    :duplicates  [{:canonical-hash ... :kept-source ... :removed [{:source ... :source-id ...}]}]
    :stats       {:total-input int :total-output int :removed int}}"
  [records]
  (let [;; Group by canonical-hash
        by-hash (group-by :canonical-hash records)
        ;; Process each group
        results
        (reduce-kv
          (fn [acc hash group]
            (if (= 1 (count group))
              ;; No duplicates — keep as-is
              (update acc :records conj (first group))
              ;; Duplicates found — apply dedup policy
              (let [curated? (fn [r]
                               (let [src-name (name (get-in r [:source :dataset] :unknown))]
                                 (str/starts-with? src-name "curated")))
                    ;; Sort: curated first, then alphabetically by source name
                    sorted-group (sort-by (fn [r]
                                            [(if (curated? r) 0 1)
                                             (name (get-in r [:source :dataset] :unknown))])
                                          group)
                    keeper (first sorted-group)
                    removed (rest sorted-group)]
                (-> acc
                    (update :records conj keeper)
                    (update :duplicates conj
                            {:canonical-hash hash
                             :kept-source    (get-in keeper [:source :dataset])
                             :removed        (mapv (fn [r]
                                                     {:source    (get-in r [:source :dataset])
                                                      :source-id (:source-id r)})
                                                   removed)})))))
          {:records [] :duplicates []}
          (into (sorted-map) by-hash))
        total-input (count records)
        total-output (count (:records results))
        removed (- total-input total-output)]
    (when (pos? removed)
      (binding [*out* *err*]
        (println (str "DEDUP: Removed " removed " cross-source duplicate(s). "
                      "Policy: curated sources preferred."))))
    (assoc results
           :stats {:total-input total-input
                   :total-output total-output
                   :removed removed})))

;; ============================================================
;; Stage 0: Fetch
;; ============================================================

(defn- hf-auth-headers
  "Return HTTP request headers for Hugging Face downloads.

   For `gated=auto` datasets, HF requires an auth token after you accept the
   dataset terms in the browser.

   This function looks for one of:
   - HF_TOKEN
   - HUGGINGFACE_TOKEN

   If no token is present, returns {}." 
  []
  (if-let [token (or (System/getenv "HF_TOKEN")
                     (System/getenv "HUGGINGFACE_TOKEN"))]
    {"Authorization" (str "Bearer " token)}
    {}))

(defn- detect-compression
  "Infer compression from a URL/path string.

   Returns one of:
   - :gzip for *.gz
   - :xz   for *.xz
   - nil   otherwise" 
  [^String s]
  (cond
    (and s (str/ends-with? s ".gz")) :gzip
    (and s (str/ends-with? s ".xz")) :xz
    :else nil))

(defn- copy-stream->file!
  "Copy an InputStream to dest-path, optionally decompressing.

   compression may be nil, :gzip, or :xz." 
  [in ^String dest-path compression]
  (let [dest-file (io/file dest-path)]
    (.mkdirs (.getParentFile dest-file))
    (with-open [out (io/output-stream dest-file)
                src (case compression
                      :gzip (java.util.zip.GZIPInputStream. in)
                      :xz   (org.tukaani.xz.XZInputStream. in)
                      in)]
      (io/copy src out))
    dest-path))

(defn- copy-file!
  "Copy a local file to dest-path, optionally decompressing." 
  [^String src-path ^String dest-path compression]
  (with-open [in (io/input-stream (io/file src-path))]
    (copy-stream->file! in dest-path compression)))

(defn- download-url!
  "Download a file from a URL to a local destination path.

   - Streaming download (avoids loading large corpora into memory)
   - Optional Authorization headers (HF gated datasets)
   - Optional decompression (:gzip/:xz)

   Throws on HTTP errors (non-2xx status)."
  ([^String url ^String dest-path]
   (download-url! url dest-path {}))
  ([^String url ^String dest-path {:keys [headers compression]
                                  :or {headers {} compression nil}}]
   (let [resp (http/get url {:as :stream
                             :throw-exceptions false
                             :headers headers
                             :redirect-strategy :lax
                             :socket-timeout 600000
                             :connection-timeout 60000})]
     (when-not (<= 200 (:status resp) 299)
       (throw (ex-info (str "HTTP fetch failed with status " (:status resp)
                            " for URL: " url)
                       {:url url :status (:status resp)})))
     (with-open [in (:body resp)]
       (copy-stream->file! in dest-path compression))
     dest-path)))

(defn- download-urls!
  "Download multiple URLs and concatenate them into a single destination file.

   Intended for JSONL corpora that ship as one file per language.
   Adds a newline separator between parts to avoid accidental line joining.

   Note: currently assumes parts are uncompressed." 
  ([urls ^String dest-path]
   (download-urls! urls dest-path {}))
  ([urls ^String dest-path {:keys [headers]
                            :or {headers {}}}]
   (with-open [out (io/output-stream (io/file dest-path))]
     (doseq [url urls]
       (let [resp (http/get url {:as :stream
                                 :throw-exceptions false
                                 :headers headers
                                 :redirect-strategy :lax
                                 :socket-timeout 600000
                                 :connection-timeout 60000})]
         (when-not (<= 200 (:status resp) 299)
           (throw (ex-info (str "HTTP fetch failed with status " (:status resp)
                                " for URL: " url)
                           {:url url :status (:status resp)})))
         (with-open [in (:body resp)]
           (io/copy in out))
         ;; Separator between concatenated parts (safe for JSONL; blank lines ignored by reader).
         (.write out (byte-array [(byte 10)])))))
   dest-path))

(defn fetch!
  "Stage 0: Fetch source datasets.

   For each source in :sources, copies/downloads the data to data/raw/
   with a deterministic filename based on the source name.

   Supports:
    - :path sources — copies local files
    - :url sources  — downloads from HTTP(S) URLs (CSV, Parquet, JSONL)
    - :urls sources — downloads multiple URLs and concatenates (e.g. JSONL per language)

   Config map keys:
   :sources   — vector of source keywords to fetch
   :data-dir  — base data directory (default: 'data')
   :seed      — integer build seed
   :version   — pipeline version string

   Returns:
   {:manifest <stage-manifest>
    :files    {source-kw file-path ...}}

   Idempotent: re-running with the same config produces identical output."
  [{:keys [sources data-dir seed version]
    :or   {data-dir "data" version "0.1.0"}}]
  (let [raw-dir (str data-dir "/raw")
        manifests-dir (str data-dir "/manifests")
        manifest-path (str manifests-dir "/fetch-manifest.edn")
        hf-headers (hf-auth-headers)
        _ (.mkdirs (io/file raw-dir))
        _ (.mkdirs (io/file manifests-dir))
        expected-config-hash (sha256-string
                               (pr-str {:sources (sort sources)
                                        :seed seed
                                        :version version}))
        expected-files (into {}
                             (for [source-name (sort sources)]
                               (let [source-data (sources/get-source source-name)
                                     _ (when-not source-data
                                         (throw (ex-info (str "Source not found: " source-name)
                                                         {:source source-name})))
                                     fmt (name (:format source-data))
                                     dest-filename (str (name source-name) "." fmt)
                                     dest-path (str raw-dir "/" dest-filename)]
                                 [source-name dest-path])))
        cached-manifest (when (.exists (io/file manifest-path))
                          (manifest/read-manifest manifest-path))]
    (if (and cached-manifest
             (= expected-config-hash (:config-hash cached-manifest))
             (every? (fn [[_ p]] (.exists (io/file p))) expected-files))
      {:manifest cached-manifest
       :files expected-files}
      (let [files (into {}
                        (for [source-name (sort sources)]
                          (let [source-data (sources/get-source source-name)
                                _ (when-not source-data
                                    (throw (ex-info (str "Source not found: " source-name)
                                                    {:source source-name})))
                                fmt (name (:format source-data))
                                dest-filename (str (name source-name) "." fmt)
                                dest-path (str raw-dir "/" dest-filename)
                                src-path (:path source-data)
                                src-urls (:urls source-data)
                                src-url  (:url source-data)
                                compression (or (:compression source-data)
                                                (detect-compression src-url)
                                                (detect-compression src-path))]
                            ;; Fetch: prefer path (local), fallback to URL download
                            (cond
                              ;; Local path — copy file (optionally decompress)
                              (and src-path (.exists (io/file src-path)))
                              (if compression
                                (copy-file! src-path dest-path compression)
                                (io/copy (io/file src-path) (io/file dest-path)))

                              ;; URL list — download parts and concatenate
                              (seq src-urls)
                              (do
                                (doseq [[idx url] (map-indexed vector src-urls)]
                                  (binding [*out* *err*]
                                    (println (str "Fetching " (name source-name)
                                                  " (" (inc idx) "/" (count src-urls) ") from " url "..."))))
                                (download-urls! src-urls dest-path {:headers hf-headers}))

                              ;; URL — download from remote
                              src-url
                              (do
                                (binding [*out* *err*]
                                  (println (str "Fetching " (name source-name)
                                                " from " src-url "...")))
                                (download-url! src-url dest-path {:headers hf-headers
                                                                  :compression compression}))

                              ;; Local path specified but file doesn't exist
                              src-path
                              (throw (ex-info (str "Source file not found: " src-path
                                                   " for source " source-name)
                                              {:source source-name :path src-path}))

                              ;; Neither path nor URL
                              :else
                              (throw (ex-info (str "Source " source-name
                                                   " has neither :path, :url, nor :urls")
                                              {:source source-name})))
                            [source-name dest-path])))
            ;; Compute checksums for all fetched files
            checksums (into {}
                            (for [[source-name file-path] (sort-by key files)]
                              (let [rel-path (str "raw/" (name source-name) "."
                                                  (name (:format (sources/get-source source-name))))]
                                [rel-path (sha256-file file-path)])))
            ;; Compute output hash (hash of sorted checksums)
            output-hash (sha256-string
                          (pr-str (into (sorted-map) checksums)))
            ;; Create manifest
            stage-manifest (manifest/create-stage-manifest
                             {:stage :fetch
                              :version version
                              :seed seed
                              :input-hash expected-config-hash
                              :output-hash output-hash
                              :artifact-count (count files)
                              :config-hash expected-config-hash
                              :checksums checksums})]
        ;; Write manifest
        (manifest/write-manifest! stage-manifest manifest-path)
        {:manifest stage-manifest
         :files files}))))

;; ============================================================
;; Stage 1: Canonicalize
;; ============================================================

(defn canonicalize!
  "Stage 1: Canonicalize source records.

   Reads JSONL files from data/raw/, applies NFKC normalization,
   collapses whitespace, computes canonical hashes, generates source IDs,
   and maps taxonomy labels. Writes canonical records and stage manifest.

   Config map keys:
   :sources   — vector of source keywords to canonicalize
   :data-dir  — base data directory (default: 'data')
   :seed      — integer build seed
   :version   — pipeline version string

   Returns:
   {:manifest <stage-manifest>
    :records  [<canonical-record> ...]}

   Output record shape (spec §5.1):
   {:source-id      'sha256:...'
    :canonical-hash 'sha256:...'
    :canonical-text '...'
    :canonical-lang :en
    :intent-label   :adversarial
    :attack-family  :persona-injection
    :harm-category  :identity-manipulation
    :source         {:dataset :source-name :row-id 42 :license :gpl-3.0}}

   Idempotent: same input produces identical output."
  [{:keys [sources data-dir seed version]
    :or   {data-dir "data" version "0.1.0"}}]
  (let [raw-dir (str data-dir "/raw")
        canon-dir (str data-dir "/canonicalized")
        manifests-dir (str data-dir "/manifests")
        canon-file (str canon-dir "/canonical-records.edn")
        dedup-report-file (str canon-dir "/dedup-report.edn")
        manifest-path (str manifests-dir "/canonicalize-manifest.edn")
        expected-config-hash (sha256-string
                               (pr-str {:sources (sort sources)
                                        :seed seed
                                        :version version
                                        :normalization :nfkc
                                        :whitespace :collapse
                                        :hash-algo :sha256}))
        _ (.mkdirs (io/file canon-dir))
        _ (.mkdirs (io/file manifests-dir))
        cached-manifest (when (.exists (io/file manifest-path))
                          (manifest/read-manifest manifest-path))]
    (if (and cached-manifest
             (= expected-config-hash (:config-hash cached-manifest))
             (.exists (io/file canon-file)))
      (let [records (clojure.edn/read-string (slurp canon-file))
            dedup-report (if (.exists (io/file dedup-report-file))
                           (clojure.edn/read-string (slurp dedup-report-file))
                           {:duplicates [] :stats {}})]
        {:manifest cached-manifest
         :records records
         :dedup-report dedup-report})
      (let [;; Process each source
            all-records
            (into []
                  (mapcat
                    (fn [source-name]
                      (let [source-data (sources/get-source source-name)
                            _ (when-not source-data
                                (throw (ex-info (str "Source not found: " source-name)
                                                {:source source-name})))
                            fmt (:format source-data)
                            raw-file (str raw-dir "/" (name source-name) "." (name fmt))
                            _ (when-not (.exists (io/file raw-file))
                                (throw (ex-info (str "Raw file not found: " raw-file
                                                      ". Run fetch! first.")
                                                {:source source-name :file raw-file})))
                            rows (read-source-file raw-file fmt)
                            ;; Check if this is a toxicchat-style source (has toxicity + jailbreaking columns)
                            has-toxicity-cols? (and (contains? (:schema source-data) :toxicity)
                                                    (contains? (:schema source-data) :jailbreaking))]
                        (map-indexed
                          (fn [idx row]
                            (let [raw-text (extract-text-field row source-data)
                                  lang-str (extract-language-field row source-data)
                                  lang-code (normalize-language-code lang-str)
                                  raw-harm (extract-harm-category-field row source-data)
                                  raw-intent (extract-intent-label-field row source-data)
                                  row-id (or (:row_id row) (get row "row_id") idx)
                                  ;; Normalize text
                                  canon-text (normalize-text (str raw-text))
                                  ;; Compute canonical hash
                                  c-hash (sha256-string canon-text)
                                  ;; Compute source ID
                                  hash-prefix (subs c-hash 0 (min 16 (count c-hash)))
                                  s-id (compute-source-id (name source-name) row-id hash-prefix)
                                  ;; Build a record with the harm category field for taxonomy resolution
                                  record-for-taxonomy (cond-> row
                                                       raw-harm (assoc :harm_category raw-harm))
                                  ;; Resolve taxonomy labels
                                  taxonomy (resolve-taxonomy record-for-taxonomy source-data)
                                  direct-intent (normalize-intent-label raw-intent)
                                  ;; For ToxicChat-style sources, derive intent from toxicity/jailbreaking
                                  intent-label (if direct-intent
                                                 direct-intent
                                                 (if has-toxicity-cols?
                                                 (let [get-int (fn [row k]
                                                                 (let [v (if (contains? row k)
                                                                           (get row k)
                                                                           (get row (name k)))]
                                                                   (cond (nil? v) 0
                                                                         (string? v) (or (parse-long v) 0)
                                                                         (number? v) (long v)
                                                                         :else 0)))
                                                       toxicity     (get-int row :toxicity)
                                                       jailbreaking (get-int row :jailbreaking)]
                                                   (if (or (= 1 jailbreaking) (= 1 toxicity))
                                                     :adversarial
                                                     :benign))
                                                   (:intent-label taxonomy)))]
                              {:source-id      s-id
                               :canonical-hash c-hash
                               :canonical-text canon-text
                               :canonical-lang (keyword lang-code)
                               :intent-label   intent-label
                               :attack-family  (:attack-family taxonomy)
                               :harm-category  (:harm-category taxonomy)
                               :source         {:dataset source-name
                                               :row-id  row-id
                                               :license (:license source-data)}}))
                          rows))))
                  (sort sources))
            ;; Deduplicate cross-source records (VAL-CORPUS-006)
            dedup-result (deduplicate-cross-source all-records)
            all-records (:records dedup-result)
            dedup-report {:duplicates (:duplicates dedup-result)
                          :stats (:stats dedup-result)}
            ;; Write canonical records as EDN
            _ (spit canon-file (pr-str all-records))
            ;; Write dedup report if any duplicates found
            _ (when (seq (:duplicates dedup-report))
                (spit dedup-report-file (pr-str dedup-report)))
            ;; Compute checksums
            canon-checksum (sha256-file canon-file)
            checksums {"canonicalized/canonical-records.edn" canon-checksum}
            ;; Read fetch manifest for input hash chaining
            fetch-manifest-path (str manifests-dir "/fetch-manifest.edn")
            input-hash (if (.exists (io/file fetch-manifest-path))
                         (:output-hash (manifest/read-manifest fetch-manifest-path))
                         (sha256-string "no-fetch-manifest"))
            output-hash (sha256-string (pr-str (into (sorted-map) checksums)))
            ;; Create manifest
            stage-manifest (manifest/create-stage-manifest
                             {:stage :canonicalize
                              :version version
                              :seed seed
                              :input-hash input-hash
                              :output-hash output-hash
                              :artifact-count (count all-records)
                              :config-hash expected-config-hash
                              :checksums checksums})]
        ;; Write manifest
        (manifest/write-manifest! stage-manifest manifest-path)
        {:manifest stage-manifest
         :records all-records
         :dedup-report dedup-report}))))

;; ============================================================
;; Stage 2: Embed + Cluster
;; ============================================================

(defn embed-cluster!
  "Stage 2: Embed all canonical prompts and cluster them.

   Embeds each prompt's canonical text using sentence-transformers,
   then clusters embeddings using HDBSCAN. No records are dropped.

   Config map keys:
   :records    — vector of canonical records from Stage 1
   :data-dir   — base data directory (default: 'data')
   :seed       — integer build seed
   :version    — pipeline version string
   :embedding  — {:model str, :batch-size int}
   :clustering — {:min-cluster-size int, :metric str}

   Returns:
   {:manifest <stage-manifest>
    :records  [<record-with-embedding-and-cluster-id> ...]}

   Each output record gains :embedding (vector of doubles) and
   :cluster-id (integer >= -1, where -1 = noise).

   Idempotent: same input + seed produces identical output."
  [{:keys [records data-dir seed version embedding clustering]
    :or   {data-dir "data" version "0.1.0"}}]
  (let [manifests-dir (str data-dir "/manifests")
        embedded-dir (str data-dir "/embedded")
        manifest-path (str manifests-dir "/embed-cluster-manifest.edn")
        cluster-file (str embedded-dir "/cluster-assignments.edn")
        _ (.mkdirs (io/file manifests-dir))
        _ (.mkdirs (io/file embedded-dir))
        model-name (or (:model embedding) "intfloat/multilingual-e5-large")
        batch-size (or (:batch-size embedding) 256)
        min-cluster-size (or (:min-cluster-size clustering) 5)
        metric (or (:metric clustering) "cosine")
        expected-config-hash (sha256-string
                               (pr-str {:embedding {:model model-name
                                                    :batch-size batch-size}
                                        :clustering {:min-cluster-size min-cluster-size
                                                     :metric metric}
                                        :seed seed
                                        :version version}))
        cached-manifest (when (.exists (io/file manifest-path))
                          (manifest/read-manifest manifest-path))]
    (if (and cached-manifest
             (= expected-config-hash (:config-hash cached-manifest))
             (.exists (io/file cluster-file)))
      (let [cluster-data (clojure.edn/read-string (slurp cluster-file))
            cid-by-sid (into {}
                             (map (fn [{:keys [source-id cluster-id]}]
                                    [source-id cluster-id]))
                             cluster-data)
            enriched-records (mapv (fn [record]
                                     (assoc record :cluster-id
                                            (long (get cid-by-sid (:source-id record) -1))))
                                   records)]
        {:manifest cached-manifest
         :records enriched-records})
      (let [;; Extract texts for embedding (use canonical-text)
            texts (mapv :canonical-text records)
            ;; Embed all texts
            embeddings (embed/embed-batch texts model-name :batch-size batch-size)
            ;; Cluster embeddings
            labels (cluster/cluster-embeddings embeddings
                     :min-cluster-size min-cluster-size
                     :metric metric)
            ;; Attach embeddings and cluster-ids to records
            enriched-records (mapv (fn [record emb label]
                                     (assoc record
                                            :embedding (vec emb)
                                            :cluster-id (long label)))
                                   records embeddings labels)
            ;; Write enriched records as EDN (without embeddings for size)
            cluster-data (mapv #(select-keys % [:source-id :cluster-id]) enriched-records)
            _ (spit cluster-file (pr-str cluster-data))
            ;; Compute checksums and manifest
            cluster-checksum (sha256-file cluster-file)
            checksums {"embedded/cluster-assignments.edn" cluster-checksum}
            ;; Chain input hash from canonicalize manifest
            canon-manifest-path (str manifests-dir "/canonicalize-manifest.edn")
            input-hash (if (.exists (io/file canon-manifest-path))
                         (:output-hash (manifest/read-manifest canon-manifest-path))
                         (sha256-string "no-canonicalize-manifest"))
            output-hash (sha256-string (pr-str (into (sorted-map) checksums)))
            stage-manifest (manifest/create-stage-manifest
                             {:stage :embed-cluster
                              :version version
                              :seed seed
                              :input-hash input-hash
                              :output-hash output-hash
                              :artifact-count (count enriched-records)
                              :config-hash expected-config-hash
                              :checksums checksums})]
        (manifest/write-manifest! stage-manifest manifest-path)
        {:manifest stage-manifest
         :records enriched-records}))))

;; ============================================================
;; Stage 3: Split
;; ============================================================

(defn split!
  "Stage 3: Cluster-level stratified split.

   Assigns each prompt to exactly one of :train, :dev, :test splits.
   The KEY INVARIANT: no cluster ID appears in more than one split.

   Config map keys:
   :records  — vector of records from Stage 2 (with :cluster-id)
   :data-dir — base data directory (default: 'data')
   :seed     — integer build seed
   :version  — pipeline version string
   :split    — {:train 0.70 :dev 0.15 :test 0.15
                :stratify-by [:intent-label :attack-family :canonical-lang]
                :constraint :cluster-disjoint}

   Returns:
   {:manifest <stage-manifest>
    :records  [<record-with-split> ...]}

   Idempotent: same input + seed produces identical output."
  [{:keys [records data-dir seed version split]
    :or   {data-dir "data" version "0.1.0"}}]
  (let [manifests-dir (str data-dir "/manifests")
        split-dir (str data-dir "/split")
        manifest-path (str manifests-dir "/split-manifest.edn")
        split-file (str split-dir "/split-assignments.edn")
        _ (.mkdirs (io/file manifests-dir))
        _ (.mkdirs (io/file split-dir))
        ;; Perform cluster-disjoint split
        split-config (or split {:train 0.70 :dev 0.15 :test 0.15
                                :stratify-by [:intent-label :attack-family :canonical-lang]
                                :constraint :cluster-disjoint})
        expected-config-hash (sha256-string
                               (pr-str {:split split-config
                                        :seed seed
                                        :version version}))
        cached-manifest (when (.exists (io/file manifest-path))
                          (manifest/read-manifest manifest-path))]
    (if (and cached-manifest
             (= expected-config-hash (:config-hash cached-manifest))
             (.exists (io/file split-file)))
      (let [split-data (clojure.edn/read-string (slurp split-file))
            split-by-sid (into {}
                               (map (fn [{:keys [source-id split cluster-id]}]
                                      [source-id {:split split :cluster-id cluster-id}]))
                               split-data)
            split-records (mapv (fn [record]
                                  (if-let [{:keys [split cluster-id]} (get split-by-sid (:source-id record))]
                                    (cond-> record
                                      split (assoc :split split)
                                      (some? cluster-id) (assoc :cluster-id (long cluster-id)))
                                    record))
                                records)]
        {:manifest cached-manifest
         :records split-records})
      (let [split-records (splitter/split-clusters records split-config seed)
            ;; Verify disjointness invariant
            disjointness (splitter/verify-disjointness split-records)
            _ (when-not (:passed disjointness)
                (throw (ex-info "FATAL: cluster leakage detected — this is a bug in the splitter"
                                {:leaks (:leaks disjointness)})))
            ;; Write split assignments as EDN
            split-data (mapv #(select-keys % [:source-id :cluster-id :split]) split-records)
            _ (spit split-file (pr-str split-data))
            ;; Checksums and manifest
            split-checksum (sha256-file split-file)
            checksums {"split/split-assignments.edn" split-checksum}
            embed-manifest-path (str manifests-dir "/embed-cluster-manifest.edn")
            input-hash (if (.exists (io/file embed-manifest-path))
                         (:output-hash (manifest/read-manifest embed-manifest-path))
                         (sha256-string "no-embed-cluster-manifest"))
            output-hash (sha256-string (pr-str (into (sorted-map) checksums)))
            stage-manifest (manifest/create-stage-manifest
                             {:stage :split
                              :version version
                              :seed seed
                              :input-hash input-hash
                              :output-hash output-hash
                              :artifact-count (count split-records)
                              :config-hash expected-config-hash
                              :checksums checksums})]
        (manifest/write-manifest! stage-manifest manifest-path)
        {:manifest stage-manifest
         :records split-records}))))
