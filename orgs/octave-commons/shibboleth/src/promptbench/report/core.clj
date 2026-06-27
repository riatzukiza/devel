(ns promptbench.report.core
  "Distribution report generation.

   Provides functions for computing and formatting distribution reports:
   - label-distribution: per-split label counts with correct sums
   - language-attack-family-matrix: language × attack_family cross-tabulation

   All functions operate on sequences of record maps (prompt records).

   See spec §7.1 for coverage metric definitions and validation contract
   VAL-METRIC-004 for expected behavior."
  (:require [clojure.string :as str]))

;; ============================================================
;; Label Distribution
;; ============================================================

(defn label-distribution
  "Compute label distribution per-split.

   For each split, returns a map of intent-label -> count.
   Sums per split equal the number of records in that split.

   records — seq of maps with :split and :intent-label keys

   Returns: {split-kw {label-kw count ...} ...}"
  [records]
  (reduce (fn [acc record]
            (let [split (:split record)
                  label (:intent-label record)]
              (if (and split label)
                (update-in acc [split label] (fnil inc 0))
                acc)))
          {}
          records))

;; ============================================================
;; Language × Attack Family Matrix
;; ============================================================

(defn language-attack-family-matrix
  "Compute language × attack_family cross-tabulation matrix.

   For each language in the dataset, returns a map of attack-family -> count.
   Missing combinations are filled with 0 to ensure complete dimensions.

   records — seq of maps with :canonical-lang and :attack-family keys

   Returns: {lang-kw {family-kw count ...} ...}
   Each row has entries for all families appearing in the dataset."
  [records]
  (let [;; Collect all families present in the dataset
        all-families (into (sorted-set)
                           (keep :attack-family)
                           records)
        ;; Count occurrences of each (language, family) pair
        counts (reduce (fn [acc record]
                         (let [lang (:canonical-lang record)
                               family (:attack-family record)]
                           (if (and lang family)
                             (update-in acc [lang family] (fnil inc 0))
                             acc)))
                       {}
                       records)
        ;; Fill missing combinations with 0
        zero-row (zipmap all-families (repeat 0))]
    (into (sorted-map)
          (map (fn [[lang row]]
                 [lang (merge zero-row row)]))
          counts)))

;; ============================================================
;; Report Formatting
;; ============================================================

(defn format-label-distribution-markdown
  "Format label distribution as a Markdown table.

   Returns a string with one table per split."
  [distribution]
  (str/join
    "\n\n"
    (for [[split labels] (sort-by key distribution)]
      (let [total (reduce + (vals labels))
            header (str "### Split: " (name split) " (total: " total ")\n\n"
                        "| Label | Count | Proportion |\n"
                        "|-------|-------|------------|\n")
            rows (str/join
                   "\n"
                   (for [[label cnt] (sort-by key labels)]
                     (let [pct (if (pos? total) (format "%.1f%%" (* 100.0 (/ cnt total))) "0.0%")]
                       (str "| " (name label) " | " cnt " | " pct " |"))))]
        (str header rows)))))

(defn format-matrix-markdown
  "Format language × attack_family matrix as a Markdown table."
  [matrix]
  (if (empty? matrix)
    "No data available."
    (let [;; Collect all family columns from all rows
          all-families (into (sorted-set)
                             (mapcat (comp keys val))
                             matrix)
          header (str "| Language | "
                      (str/join " | " (map name all-families))
                      " | Total |\n"
                      "|---------|"
                      (str/join "|" (repeat (count all-families) "-------"))
                      "|-------|\n")
          rows (str/join
                 "\n"
                 (for [[lang row] (sort-by key matrix)]
                   (let [counts (map #(get row % 0) all-families)
                         total (reduce + counts)]
                     (str "| " (name lang) " | "
                          (str/join " | " counts)
                          " | " total " |"))))]
      (str header rows))))
