(ns promptbench.metrics.coverage
  "Coverage metrics: taxonomy-coverage, transform-coverage-matrix, language-coverage,
   source-contribution analysis, and transform-gap-analysis.

   All metrics operate on sequences of record maps loaded from parquet files.
   No pipeline state required — computable from dataset metadata alone.

   See spec §7.1 for coverage metric definitions."
  (:require [clojure.string :as str]
            [promptbench.metrics.core :as metrics]
            [promptbench.taxonomy.registry :as taxonomy]
            [promptbench.transform.registry :as transforms]))

;; ============================================================
;; taxonomy-coverage
;; ============================================================

(defn taxonomy-coverage
  "Compute proportion of leaf attack families with at least :min-count prompts.

   dataset — seq of maps with :attack-family key
   params  — {:min-count int} (default 10)

   Returns {:coverage ratio, :missing [families below threshold]}"
  [dataset params]
  (let [min-count (get params :min-count 10)
        ;; All registered families are leaf families
        all-fams (sort (keys (taxonomy/all-families)))
        ;; Count prompts per family
        family-counts (reduce (fn [acc record]
                                (let [fam (:attack-family record)]
                                  (if fam
                                    (update acc fam (fnil inc 0))
                                    acc)))
                              {}
                              dataset)
        ;; Find covered families
        covered (filter #(>= (get family-counts % 0) min-count) all-fams)
        missing (remove (set covered) all-fams)]
    {:coverage (if (pos? (count all-fams))
                 (/ (count covered) (count all-fams))
                 0)
     :missing (vec missing)}))

;; ============================================================
;; transform-coverage-matrix
;; ============================================================

(defn transform-coverage-matrix
  "Build a family × transform coverage matrix from a dataset.

   dataset — seq of maps with :attack-family and :variant-type keys
             (typically variant records)

   Returns: {family-kw {transform-kw count ...} ...}
   One entry per registered family, counts for each registered transform
   (zero if no variants exist)."
  [dataset]
  (let [all-fams (sort (keys (taxonomy/all-families)))
        all-xforms (sort (keys (transforms/all-transforms)))
        ;; Count (family, transform) pairs
        counts (reduce (fn [acc record]
                         (let [fam (:attack-family record)
                               xform (:variant-type record)]
                           (if (and fam xform)
                             (update-in acc [fam xform] (fnil inc 0))
                             acc)))
                       {}
                       dataset)
        ;; Build zero-filled matrix
        zero-row (zipmap all-xforms (repeat 0))]
    (into {}
          (map (fn [family-name]
                 [family-name
                  (merge zero-row (select-keys (get counts family-name {})
                                               all-xforms))]))
          all-fams)))

;; ============================================================
;; language-coverage
;; ============================================================

(defn language-coverage
  "Compute language × split × label distribution.

   dataset — seq of maps with :canonical-lang, :split, :intent-label keys

   Returns nested map: {lang {split {label count}}}"
  [dataset]
  (reduce (fn [acc record]
            (let [lang (:canonical-lang record)
                  split (:split record)
                  label (:intent-label record)]
              (if (and lang split label)
                (update-in acc [lang split label] (fnil inc 0))
                acc)))
          {}
          dataset))

;; ============================================================
;; Source Contribution Analysis
;; ============================================================

(defn source-contribution
  "Compute the coverage contribution of a specific set of sources.

   Compares taxonomy-coverage with all records vs. records excluding
   the specified sources. Returns a map showing the coverage delta
   and which families are uniquely contributed by those sources.

   dataset      — seq of prompt record maps with :attack-family and :source keys
   source-names — set of source dataset keywords to analyze (e.g. #{:curated-persona-injections})
   params       — {:min-count int} (default 10)

   Returns:
     {:coverage-with    ratio  ;; coverage including the analyzed sources
      :coverage-without ratio  ;; coverage excluding the analyzed sources
      :coverage-delta   number ;; difference (with - without)
      :uniquely-contributed-families [kw ...]  ;; families that drop below threshold without these sources}"
  [dataset source-names params]
  (let [cov-with (taxonomy-coverage dataset params)
        ;; Filter out records from the specified sources
        without-records (remove (fn [record]
                                 (contains? source-names
                                            (get-in record [:source :dataset])))
                                dataset)
        cov-without (taxonomy-coverage without-records params)
        ;; Families that are covered with sources but missing without
        newly-missing (remove (set (:missing cov-with))
                              (:missing cov-without))]
    {:coverage-with (:coverage cov-with)
     :coverage-without (:coverage cov-without)
     :coverage-delta (- (double (:coverage cov-with))
                        (double (:coverage cov-without)))
     :uniquely-contributed-families (vec (sort newly-missing))}))

;; ============================================================
;; Transform Gap Analysis with Affinity Justification
;; ============================================================

(defn transform-gap-analysis
  "Identify transform coverage gaps per family with affinity-based justification.

   For each registered family, checks which transforms have zero variants
   in the dataset and cross-references with the family's registered
   transform affinities. Transforms with :none affinity are excluded
   from gap analysis (they are intentionally not applied).

   variants — seq of variant record maps with :attack-family and :variant-type keys

   Returns: {family-kw [{:transform kw
                          :affinity  kw
                          :justification string
                          :priority boolean} ...] ...}
   where :priority is true for :high affinity gaps."
  [variants]
  (let [all-fams (taxonomy/all-families)
        all-xforms (sort (keys (transforms/all-transforms)))
        ;; Count (family, transform) pairs in the variant dataset
        covered-pairs (reduce (fn [acc record]
                                (let [fam (:attack-family record)
                                      xform (:variant-type record)]
                                  (if (and fam xform)
                                    (update acc [fam xform] (fnil inc 0))
                                    acc)))
                              {}
                              variants)]
    (into {}
          (map (fn [[family-name family-data]]
                 (let [affinities (:transforms family-data)
                       gaps (into []
                                  (comp
                                    ;; Only consider registered transforms
                                    (filter (fn [xform]
                                              (let [aff (get-in affinities [xform :affinity] :none)]
                                                ;; Exclude :none affinity — those are intentionally skipped
                                                (not= aff :none))))
                                    ;; Find those with zero coverage
                                    (filter (fn [xform]
                                              (zero? (get covered-pairs [family-name xform] 0))))
                                    ;; Build gap entry with affinity and justification
                                    (map (fn [xform]
                                           (let [aff-data (get affinities xform)
                                                 affinity (get aff-data :affinity :none)
                                                 note (get aff-data :note "No justification available")]
                                             {:transform     xform
                                              :affinity      affinity
                                              :justification note
                                              :priority      (= :high affinity)}))))
                                  all-xforms)]
                   [family-name gaps])))
          all-fams)))

;; ============================================================
;; Formatting: Transform Gap Analysis
;; ============================================================

(defn format-gap-analysis-markdown
  "Format transform gap analysis as a Markdown report.

   gap-analysis — map from transform-gap-analysis

   Returns a Markdown string with one section per family showing gaps,
   affinity levels, and justification notes."
  [gap-analysis]
  (let [sb (StringBuilder.)]
    (.append sb "## Transform Gap Analysis\n\n")
    (if (every? (fn [[_fam gaps]] (empty? gaps)) gap-analysis)
      (.append sb "No transform gaps detected — all applicable transforms are covered.\n")
      (doseq [[family gaps] (sort-by key gap-analysis)]
        (when (seq gaps)
          (.append sb (str "### " (name family) "\n\n"))
          (.append sb "| Transform | Affinity | Priority | Justification |\n")
          (.append sb "|-----------|----------|----------|---------------|\n")
          (doseq [gap (sort-by (fn [g] [(not (:priority g)) (name (:transform g))]) gaps)]
            (.append sb (str "| " (name (:transform gap))
                             " | " (name (:affinity gap))
                             " | " (if (:priority gap) "⚠ YES" "no")
                             " | " (:justification gap)
                             " |\n")))
          (.append sb "\n"))))
    (.toString sb)))

;; ============================================================
;; Formatting: Source Contribution Analysis
;; ============================================================

(defn format-source-contribution-markdown
  "Format source contribution analysis as a Markdown report.

   contribution — map from source-contribution
   source-names — set of source names that were analyzed

   Returns a Markdown string showing coverage delta and uniquely contributed families."
  [contribution source-names]
  (let [sb (StringBuilder.)
        fmt (fn [pattern & args] (apply clojure.core/format pattern args))]
    (.append sb "## Source Contribution Analysis\n\n")
    (.append sb (str "**Analyzed sources:** "
                     (str/join ", " (sort (map name source-names)))
                     "\n\n"))
    (.append sb (str "| Metric | Value |\n"))
    (.append sb (str "|--------|-------|\n"))
    (.append sb (str "| Coverage with sources | "
                     (fmt "%.1f%%" (* 100.0 (double (:coverage-with contribution))))
                     " |\n"))
    (.append sb (str "| Coverage without sources | "
                     (fmt "%.1f%%" (* 100.0 (double (:coverage-without contribution))))
                     " |\n"))
    (.append sb (str "| Coverage Δ (delta) | "
                     (if (pos? (:coverage-delta contribution)) "+" "")
                     (fmt "%.1f%%" (* 100.0 (:coverage-delta contribution)))
                     " |\n"))
    (.append sb "\n")
    (when (seq (:uniquely-contributed-families contribution))
      (.append sb "**Uniquely contributed families:**\n\n")
      (doseq [fam (:uniquely-contributed-families contribution)]
        (.append sb (str "- " (name fam) "\n")))
      (.append sb "\n"))
    (.toString sb)))

;; ============================================================
;; Registration — register all coverage metrics with def-metric
;; ============================================================

(defn register-coverage-metrics!
  "Register all coverage metrics in the metrics registry.
   Call after taxonomy and transform registries are populated."
  []
  (metrics/register-metric! :taxonomy-coverage
    {:description "Proportion of leaf attack families with at least N prompts"
     :params      {:min-count {:type :int :default 10}}
     :compute     (fn [dataset params]
                    (taxonomy-coverage dataset params))})

  (metrics/register-metric! :transform-coverage-matrix
    {:description "Family × Transform coverage matrix"
     :compute     (fn [dataset _params]
                    (transform-coverage-matrix dataset))})

  (metrics/register-metric! :language-coverage
    {:description "Language × Split × Label distribution"
     :compute     (fn [dataset _params]
                    (language-coverage dataset))}))
