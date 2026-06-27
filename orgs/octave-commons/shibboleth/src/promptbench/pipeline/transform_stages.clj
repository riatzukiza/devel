(ns promptbench.pipeline.transform-stages
  "Stages 4-6: Transform integration into pipeline.

   Stage 4 (Tier-1 MT): Generate MT variants for 10 tier-1 languages
   for families with high MT affinity.

   Stage 5 (Tier-2 MT): Generate MT variants for tier-2 languages,
   gated by :tier2 flag in pipeline config.

   Stage 6 (Eval Suites): Generate eval suites (code-mix, homoglyph,
   exhaustion) for test split only by default.

   All stages are idempotent and write manifests per spec §5.3.
   Variant records maintain source_id lineage and split inheritance."
  (:require [promptbench.transform.core :as transform]
            [promptbench.taxonomy.registry :as taxonomy]
            [promptbench.pipeline.manifest :as manifest]
            [promptbench.util.crypto :as crypto]
            [clojure.edn :as edn]
            [clojure.java.io :as io]))

;; ============================================================
;; Language tier definitions (spec §4.2)
;; ============================================================

(def tier-1-languages
  "Tier-1 MT target languages: high-affinity families."
  [:es :fr :zh :ar :ja :hi :ru :pt :de :ko])

(def tier-2-languages
  "Tier-2 MT target languages: gated by --tier2 flag."
  [:tl :sw :ur :bn :th :vi :id :tr :fa :he])

;; ============================================================
;; Affinity helpers
;; ============================================================

(defn- family-has-high-mt-affinity?
  "Check if an attack family has :high affinity for the :mt transform.
   Returns true if the family is registered and has :high MT affinity."
  [family-name]
  (when-let [family-data (taxonomy/get-family family-name)]
    (= :high (get-in family-data [:transforms :mt :affinity]))))

(defn- resolve-eval-transforms
  "Resolve which eval transforms to apply for a family based on its
   affinity settings and the pipeline config's :transforms map.

   Derives the available eval transform set from the pipeline config
   (excluding :tier-1-mt and :tier-2-mt which are MT stage configs)
   instead of hardcoding {:code-mix {} :homoglyph {} :exhaustion {}}.

   Uses taxonomy/resolve-transforms for affinity-driven selection.
   Returns a sorted vector of transform keywords to apply."
  [family-name transforms-config seed]
  (when-let [family-data (taxonomy/get-family family-name)]
    (let [;; Derive eval transform set from config, excluding MT stage configs
          eval-transforms (dissoc transforms-config :tier-1-mt :tier-2-mt)]
      (taxonomy/resolve-transforms
        family-data
        eval-transforms
        {:seed seed}))))

;; ============================================================
;; MT variant generation (shared by stage 4 and 5)
;; ============================================================

(defn- mt-scope
  "Resolve MT selection scope.

   Supported values:
   - :high-affinity (default)
   - :all" 
  [mt-config]
  (let [s (:scope mt-config)]
    (cond
      (nil? s) :high-affinity
      (keyword? s) s
      (string? s) (keyword s)
      :else :high-affinity)))

(defn- mt-eligible-record?
  "Return true if this record should receive MT variants under mt-config." 
  [record mt-config]
  (case (mt-scope mt-config)
    :all true
    :high-affinity (family-has-high-mt-affinity? (:attack-family record))
    ;; default
    (family-has-high-mt-affinity? (:attack-family record))))

(defn- mt-config->xform-config
  "Build the per-execution config map passed to the :mt transform." 
  [mt-config lang]
  (cond-> {:target-lang lang}
    (:engine mt-config) (assoc :engine (:engine mt-config))
    (:proxy-url mt-config) (assoc :proxy-url (:proxy-url mt-config))
    (:max-tokens mt-config) (assoc :max-tokens (:max-tokens mt-config))
    (:max_tokens mt-config) (assoc :max_tokens (:max_tokens mt-config))))

(defn- generate-mt-variants
  "Generate MT variants for a set of languages.

   Selection:
   - default (backcompat): only records whose family has :high :mt affinity
   - when mt-config contains {:scope :all}: translate ALL prompts (B-mode)

   Supports true resumability when `resume` is provided:
   - writes per-language chunk files under :chunk-base
   - skips existing chunk files on restart
   - writes chunks atomically (tmp -> rename)

   Returns a vector of variant records." 
  [records languages seed mt-config resume]
  (let [batch-size (max 1 (long (or (:batch-size mt-config) 1)))
        eligible-records (filter #(mt-eligible-record? % mt-config)
                                 (sort-by :source-id records))
        langs (vec (sort languages))
        chunk-base (:chunk-base resume)
        log-fn (:log-fn resume)
        log! (fn [s]
               (when log-fn
                 (log-fn s)))]

    ;; Legacy behavior (kept for very small runs / tests)
    (if (and (nil? chunk-base) (= 1 batch-size))
      (into []
            (mapcat
              (fn [record]
                (mapv
                  (fn [lang]
                    (let [config (mt-config->xform-config mt-config lang)
                          result (transform/execute-transform :mt (:canonical-text record) config seed)
                          source {:source-id (:source-id record)
                                  :text      (:canonical-text record)
                                  :split     (:split record)}]
                      (-> (transform/make-variant-record
                            source :mt
                            [{:transform :mt :config config}]
                            seed
                            (:text result)
                            [(:metadata result)])
                          (assoc :attack-family (:attack-family record)
                                 :canonical-lang (:canonical-lang record)
                                 :language lang))))
                  langs))
              eligible-records))

      ;; Chunked/resumable path (also works when batch-size=1)
      (let [mt-batch! (requiring-resolve 'promptbench.transform.mt/translate-batch-via-proxy)
            chunks (vec (partition-all batch-size eligible-records))
            total-chunks (max 1 (count chunks))
            total-records (count eligible-records)
            start-ms (System/currentTimeMillis)
            max-toks  (long (or (:max-tokens mt-config)
                                (:max_tokens mt-config)
                                8192))
            approx-tokens (fn [texts]
                            (let [n (reduce + 0 (map (comp count #(or % "")) texts))
                                  approx (long (Math/ceil (/ (double n) 4.0)))]
                              (+ approx 512)))
            proxy-opts (cond-> []
                         (:proxy-url mt-config) (conj :proxy-url (:proxy-url mt-config))
                         (:engine mt-config)    (conj :model (name (:engine mt-config)))
                         (:max-tokens mt-config) (conj :max-tokens (:max-tokens mt-config))
                         (:max_tokens mt-config) (conj :max-tokens (:max_tokens mt-config)))]

        (letfn [(spit-atomic! [path content]
                  (let [tmp (str path ".tmp." (System/nanoTime))
                        ftmp (io/file tmp)
                        f (io/file path)]
                    (.mkdirs (.getParentFile f))
                    (spit tmp content)
                    (when-not (.renameTo ftmp f)
                      (io/copy ftmp f)
                      (.delete ftmp))
                    path))

                (chunk-path [lang idx]
                  (when chunk-base
                    (str chunk-base "/" (name lang) "/" (format "%06d.edn" (long idx)))))

                (read-chunk! [path]
                  (try
                    (edn/read-string (slurp path))
                    (catch Exception _e
                      ;; corrupted chunk: delete and recompute
                      (try (.delete (io/file path)) (catch Exception _ nil))
                      nil)))

                (merge-outs [a b]
                  {:texts (into (:texts a) (:texts b))
                   :metas (into (:metas a) (:metas b))})

                (single-out [config record]
                  (let [res (transform/execute-transform
                              :mt (:canonical-text record)
                              (assoc config
                                     :retry-max (:retry-max mt-config)
                                     :retry-backoff-ms (:retry-backoff-ms mt-config)
                                     :throttle-ms (:throttle-ms mt-config))
                              seed)]
                    {:texts [(:text res)]
                     :metas [(:metadata res)]}))

                (translate-records [config lang batch]
                  (let [batch (vec batch)
                        n     (count batch)]
                    (cond
                      (zero? n) {:texts [] :metas []}
                      (= 1 n)   (single-out config (first batch))

                      :else
                      (let [in-texts (mapv :canonical-text batch)
                            est     (long (approx-tokens in-texts))]
                        (if (> est max-toks)
                          (let [mid   (quot n 2)
                                left  (subvec batch 0 mid)
                                right (subvec batch mid)]
                            (merge-outs (translate-records config lang left)
                                        (translate-records config lang right)))
                          (try
                            (let [resp (apply mt-batch!
                                              (concat
                                                [in-texts lang seed]
                                                proxy-opts
                                                (when-let [rm (:retry-max mt-config)]
                                                  [:retry-max rm])
                                                (when-let [rb (:retry-backoff-ms mt-config)]
                                                  [:retry-backoff-ms rb])
                                                (when-let [tm (:throttle-ms mt-config)]
                                                  [:throttle-ms tm])))
                                  out-texts (:texts resp)
                                  meta      (:metadata resp)]
                              (when-not (= (count out-texts) n)
                                (throw (ex-info "MT batch translation returned wrong length"
                                                {:type :proxy-error
                                                 :expected n
                                                 :actual (count out-texts)
                                                 :target-lang lang})))
                              {:texts out-texts
                               :metas (vec (repeat n meta))})
                            (catch clojure.lang.ExceptionInfo e
                              (let [data (ex-data e)]
                                (if (= :proxy-error (:type data))
                                  (let [mid   (quot n 2)
                                        left  (subvec batch 0 mid)
                                        right (subvec batch mid)]
                                    (merge-outs (translate-records config lang left)
                                                (translate-records config lang right)))
                                  (throw e))))
                            (catch Exception _e
                              (let [mid   (quot n 2)
                                    left  (subvec batch 0 mid)
                                    right (subvec batch mid)]
                                (merge-outs (translate-records config lang left)
                                            (translate-records config lang right))))))))))

                (compute-chunk-variants [config lang batch]
                  (let [{:keys [texts metas]} (translate-records config lang batch)
                        batch* (vec batch)]
                    (mapv
                      (fn [record out-text meta]
                        (let [source {:source-id (:source-id record)
                                      :text      (:canonical-text record)
                                      :split     (:split record)}]
                          (-> (transform/make-variant-record
                                source :mt
                                [{:transform :mt :config config}]
                                seed
                                out-text
                                [meta])
                              (assoc :attack-family (:attack-family record)
                                     :canonical-lang (:canonical-lang record)
                                     :language lang))))
                      batch*
                      texts
                      metas)))

                (get-chunk-variants! [config lang idx batch]
                  (if-let [p (chunk-path lang idx)]
                    (if (.exists (io/file p))
                      (or (read-chunk! p)
                          (let [vs (compute-chunk-variants config lang batch)]
                            (spit-atomic! p (pr-str vs))
                            vs))
                      (let [vs (compute-chunk-variants config lang batch)]
                        (spit-atomic! p (pr-str vs))
                        vs))
                    ;; no chunk-base: compute in-memory only
                    (compute-chunk-variants config lang batch)))]

          ;; Accumulate all variants deterministically
          (loop [langs* langs
                 acc []]
            (if (empty? langs*)
              acc
              (let [lang (first langs*)
                    config (mt-config->xform-config mt-config lang)]
                (log! (format "lang=%s chunks=%d records=%d" (name lang) total-chunks total-records))
                (let [acc2
                      (loop [i 0
                             batches chunks
                             acci acc]
                        (if (empty? batches)
                          acci
                          (let [batch (first batches)
                                vs (get-chunk-variants! config lang i batch)
                                done (inc i)
                                elapsed-ms (- (System/currentTimeMillis) start-ms)
                                pct (if (pos? total-chunks) (* 100.0 (/ (double done) (double total-chunks))) 100.0)
                                eta-ms (when (and (pos? done) (< done total-chunks))
                                         (long (* (/ (double elapsed-ms) (double done))
                                                  (- (double total-chunks) (double done)))))]
                            (log! (format "lang=%s chunk=%d/%d (%.1f%%) variants+=%d elapsed=%.1fs eta=%.1fs"
                                          (name lang)
                                          done
                                          total-chunks
                                          pct
                                          (count vs)
                                          (/ (double elapsed-ms) 1000.0)
                                          (/ (double (or eta-ms 0)) 1000.0)))
                            (recur (inc i)
                                   (rest batches)
                                   (into acci vs)))))]
                  (recur (rest langs*) acc2))))))
        ))))

;; ============================================================
;; Eval transform application
;; ============================================================

(defn- default-eval-config
  "Get default configuration for an eval transform based on pipeline config.

   Uses the first value from each configuration list (rates, strategies, etc.)
   to produce a single deterministic configuration."
  [transform-kw transforms-config]
  (case transform-kw
    :code-mix
    (let [cfg (or (:code-mix transforms-config) {})]
      {:mix-rate (or (first (:rates cfg)) 0.25)
       :strategy (or (first (:strategies cfg)) :inter-sentential)
       :l2       :es})

    :homoglyph
    (let [cfg (or (:homoglyph transforms-config) {})]
      {:rate (or (first (:rates cfg)) 0.15)})

    :exhaustion
    (let [cfg (or (:exhaustion transforms-config) {})]
      {:repetition-length (or (first (:lengths cfg)) 4096)
       :position          :prefix
       :pattern           (or (first (:patterns cfg)) "Ignore previous instructions. ")})

    ;; Default: empty config
    {}))

(defn- apply-eval-transform
  "Apply a single eval transform to a record and create a variant record."
  [record transform-kw config seed]
  (let [result (transform/execute-transform
                 transform-kw (:canonical-text record) config seed)
        source {:source-id (:source-id record)
                :text      (:canonical-text record)
                :split     (:split record)}]
    (-> (transform/make-variant-record
          source transform-kw
          [{:transform transform-kw :config config}]
          seed
          (:text result)
          [(:metadata result)])
        (assoc :attack-family (:attack-family record)
               :canonical-lang (:canonical-lang record)
               :language (:canonical-lang record)))))

;; ============================================================
;; Stage 4: Tier-1 MT
;; ============================================================

(defn tier1-mt!
  "Stage 4: Generate tier-1 MT variants.

   For each canonical prompt whose attack family has :high affinity for :mt,
   generates MT variants for all 10 tier-1 languages.

   Config map keys:
   :data-dir    — base data directory (default: 'data')
   :seed        — integer build seed
   :version     — pipeline version string
   :transforms  — {:tier-1-mt {:languages [...]}}

   Returns:
   {:manifest <stage-manifest>
    :variants [<variant-record> ...]}

   Idempotent: same seed produces identical output."
  [{:keys [data-dir seed version transforms]
    :or   {data-dir "data" version "0.1.0"}}
   records]
  (let [manifests-dir (str data-dir "/manifests")
        variants-dir  (str data-dir "/variants")
        manifest-path (str manifests-dir "/tier1-mt-manifest.edn")
        variants-file (str variants-dir "/tier1-mt-variants.edn")
        _             (.mkdirs (io/file manifests-dir))
        _             (.mkdirs (io/file variants-dir))
        tier1-config  (or (:tier-1-mt transforms) {})
        languages     (vec (sort (or (:languages tier1-config) tier-1-languages)))
        expected-config-hash
        (crypto/sha256-string
          (pr-str {:tier-1-mt (assoc tier1-config :languages languages)
                   :seed seed
                   :version version}))
        cached-manifest (when (.exists (io/file manifest-path))
                          (manifest/read-manifest manifest-path))]
    (if (and cached-manifest
             (= expected-config-hash (:config-hash cached-manifest))
             (.exists (io/file variants-file)))
      {:manifest cached-manifest
       :variants (edn/read-string (slurp variants-file))}
      (let [chunk-base (str variants-dir "/chunks/tier1-mt/" expected-config-hash)
            log-fn (when (:progress tier1-config)
                     (fn [s]
                       (binding [*out* *err*]
                         (println (str "[" (java.time.Instant/now) "] tier1-mt " s)))))
            variants (generate-mt-variants records languages seed tier1-config
                                           {:chunk-base chunk-base
                                            :log-fn log-fn})
            ;; Write variants to disk
            _             (spit variants-file (pr-str variants))
            ;; Compute checksums
            variant-checksum (crypto/sha256-file variants-file)
            checksums        {"variants/tier1-mt-variants.edn" variant-checksum}
            ;; Chain input hash from split manifest
            split-manifest-path (str manifests-dir "/split-manifest.edn")
            input-hash (if (.exists (io/file split-manifest-path))
                         (:output-hash (manifest/read-manifest split-manifest-path))
                         (crypto/sha256-string "no-split-manifest"))
            output-hash (crypto/sha256-string (pr-str (into (sorted-map) checksums)))
            stage-manifest (manifest/create-stage-manifest
                             {:stage          :tier1-mt
                              :version        version
                              :seed           seed
                              :input-hash     input-hash
                              :output-hash    output-hash
                              :artifact-count (count variants)
                              :config-hash    expected-config-hash
                              :checksums      checksums})]
        (manifest/write-manifest! stage-manifest manifest-path)
        {:manifest stage-manifest
         :variants variants}))))

;; ============================================================
;; Stage 5: Tier-2 MT
;; ============================================================

(defn tier2-mt!
  "Stage 5: Generate tier-2 MT variants.

   Gated by the :tier2 flag in config. When false or absent, produces
   zero variants but still writes a valid stage manifest.

   Config map keys:
   :data-dir    — base data directory (default: 'data')
   :seed        — integer build seed
   :version     — pipeline version string
   :tier2       — boolean flag; when true, tier-2 variants are generated
   :transforms  — {:tier-2-mt {:languages [...]}}

   Returns:
   {:manifest <stage-manifest>
    :variants [<variant-record> ...]}

   Idempotent: same seed produces identical output."
  [{:keys [data-dir seed version transforms tier2]
    :or   {data-dir "data" version "0.1.0"}}
   records]
  (let [manifests-dir (str data-dir "/manifests")
        variants-dir  (str data-dir "/variants")
        manifest-path (str manifests-dir "/tier2-mt-manifest.edn")
        variants-file (str variants-dir "/tier2-mt-variants.edn")
        _             (.mkdirs (io/file manifests-dir))
        _             (.mkdirs (io/file variants-dir))
        tier2-config  (or (:tier-2-mt transforms) {})
        languages     (vec (sort (or (:languages tier2-config) tier-2-languages)))
        expected-config-hash
        (crypto/sha256-string
          (pr-str {:tier-2-mt (assoc tier2-config :languages languages)
                   :tier2     (boolean tier2)
                   :seed      seed
                   :version   version}))
        cached-manifest (when (.exists (io/file manifest-path))
                          (manifest/read-manifest manifest-path))]
    (if (and cached-manifest
             (= expected-config-hash (:config-hash cached-manifest))
             (.exists (io/file variants-file)))
      {:manifest cached-manifest
       :variants (edn/read-string (slurp variants-file))}
      (let [chunk-base (str variants-dir "/chunks/tier2-mt/" expected-config-hash)
            log-fn (when (:progress tier2-config)
                     (fn [s]
                       (binding [*out* *err*]
                         (println (str "[" (java.time.Instant/now) "] tier2-mt " s)))))
            variants      (if tier2
                            (generate-mt-variants records languages seed tier2-config
                                                  {:chunk-base chunk-base
                                                   :log-fn log-fn})
                            [])
            ;; Write variants to disk
            _             (spit variants-file (pr-str variants))
            ;; Compute checksums
            variant-checksum (crypto/sha256-file variants-file)
            checksums        {"variants/tier2-mt-variants.edn" variant-checksum}
            ;; Chain input hash from tier1-mt manifest
            tier1-manifest-path (str manifests-dir "/tier1-mt-manifest.edn")
            input-hash (if (.exists (io/file tier1-manifest-path))
                         (:output-hash (manifest/read-manifest tier1-manifest-path))
                         (crypto/sha256-string "no-tier1-mt-manifest"))
            output-hash (crypto/sha256-string (pr-str (into (sorted-map) checksums)))
            stage-manifest (manifest/create-stage-manifest
                             {:stage          :tier2-mt
                              :version        version
                              :seed           seed
                              :input-hash     input-hash
                              :output-hash    output-hash
                              :artifact-count (count variants)
                              :config-hash    expected-config-hash
                              :checksums      checksums})]
        (manifest/write-manifest! stage-manifest manifest-path)
        {:manifest stage-manifest
         :variants variants}))))

;; ============================================================
;; Stage 6: Eval Suites
;; ============================================================

(defn eval-suites!
  "Stage 6: Generate eval suite variants.

   Applies code-mix, homoglyph, and exhaustion transforms to records
   based on attack family affinity. By default, applies only to
   records in the :test split.

   Config map keys:
   :data-dir    — base data directory (default: 'data')
   :seed        — integer build seed
   :version     — pipeline version string
   :transforms  — {:code-mix {...} :homoglyph {...} :exhaustion {...}}
   :suites      — {:scope :test-only | :all}

   Returns:
   {:manifest <stage-manifest>
    :variants [<variant-record> ...]}

   Idempotent: same seed produces identical output."
  [{:keys [data-dir seed version transforms suites]
    :or   {data-dir "data" version "0.1.0"}}
   records]
  (let [manifests-dir (str data-dir "/manifests")
        variants-dir  (str data-dir "/variants")
        manifest-path (str manifests-dir "/eval-suites-manifest.edn")
        variants-file (str variants-dir "/eval-suite-variants.edn")
        _             (.mkdirs (io/file manifests-dir))
        _             (.mkdirs (io/file variants-dir))
        scope         (or (:scope suites) :test-only)
        expected-config-hash
        (crypto/sha256-string
          (pr-str {:transforms transforms
                   :suites     suites
                   :seed       seed
                   :version    version}))
        cached-manifest (when (.exists (io/file manifest-path))
                          (manifest/read-manifest manifest-path))]
    (if (and cached-manifest
             (= expected-config-hash (:config-hash cached-manifest))
             (.exists (io/file variants-file)))
      {:manifest cached-manifest
       :variants (edn/read-string (slurp variants-file))}
      (let [;; Filter records by scope
            scoped-records (case scope
                             :test-only (filter #(= :test (:split %)) records)
                             :all       records
                             ;; Default to test-only for unknown scope values
                             (filter #(= :test (:split %)) records))
            ;; For each record, resolve and apply eval transforms via affinity
            variants
            (into []
                  (mapcat
                    (fn [record]
                      (let [applicable (resolve-eval-transforms
                                         (:attack-family record) transforms seed)]
                        (when (seq applicable)
                          (mapv
                            (fn [transform-kw]
                              (apply-eval-transform
                                record
                                transform-kw
                                (default-eval-config transform-kw transforms)
                                seed))
                            (sort applicable))))))
                  (sort-by :source-id scoped-records))
            ;; Write variants to disk
            _             (spit variants-file (pr-str variants))
            ;; Compute checksums
            variant-checksum (crypto/sha256-file variants-file)
            checksums        {"variants/eval-suite-variants.edn" variant-checksum}
            ;; Chain input hash from tier2-mt manifest
            tier2-manifest-path (str manifests-dir "/tier2-mt-manifest.edn")
            input-hash (if (.exists (io/file tier2-manifest-path))
                         (:output-hash (manifest/read-manifest tier2-manifest-path))
                         (crypto/sha256-string "no-tier2-mt-manifest"))
            output-hash (crypto/sha256-string (pr-str (into (sorted-map) checksums)))
            stage-manifest (manifest/create-stage-manifest
                             {:stage          :eval-suites
                              :version        version
                              :seed           seed
                              :input-hash     input-hash
                              :output-hash    output-hash
                              :artifact-count (count variants)
                              :config-hash    expected-config-hash
                              :checksums      checksums})]
        (manifest/write-manifest! stage-manifest manifest-path)
        {:manifest stage-manifest
         :variants variants}))))
