(ns promptbench.verification.checks
  "Individual verification checks for the post-build verification suite.

   Each check is a function that accepts dataset data and returns
   {:passed bool :detail ...} where detail contains specifics about failures.

   Check types:
   - Fatal: cluster-disjoint-splits, variant-split-consistency, duplicate-detection
   - Non-fatal: label-distribution-sane

   See spec §6.2 for the verification suite definition."
  (:require [clojure.set :as set]))

;; ============================================================
;; cluster-disjoint-splits (FATAL)
;; ============================================================

(defn cluster-disjoint-splits
  "Verify that no non-noise cluster ID appears in more than one split.

   Noise points (cluster_id = -1) are excluded from this check since
   they are treated as singleton clusters.

   records — vector of maps with :cluster-id and :split

   Returns {:passed bool :detail [...leaks]}"
  [records]
  (let [non-noise (remove #(= -1 (:cluster-id %)) records)
        ;; Build map of split -> set of cluster IDs
        split-clusters (reduce
                         (fn [m r]
                           (update m (:split r) (fnil conj #{}) (:cluster-id r)))
                         {}
                         non-noise)
        splits (vec (sort-by str (keys split-clusters)))
        leaks (for [i (range (count splits))
                    j (range (inc i) (count splits))
                    :let [s1 (nth splits i)
                          s2 (nth splits j)
                          shared (set/intersection
                                   (get split-clusters s1 #{})
                                   (get split-clusters s2 #{}))]
                    :when (seq shared)]
                {:splits [s1 s2]
                 :shared-clusters (vec (sort shared))})]
    {:passed (empty? leaks)
     :detail (vec leaks)}))

;; ============================================================
;; variant-split-consistency (FATAL)
;; ============================================================

(defn variant-split-consistency
  "Verify that every variant's :split matches its source prompt's :split.

   prompts  — vector of prompt records with :source-id and :split
   variants — vector of variant records with :source-id, :variant-id, and :split

   Returns {:passed bool :detail [...mismatches]}"
  [prompts variants]
  (let [;; Build lookup: source-id -> split
        source-splits (into {} (map (juxt :source-id :split)) prompts)
        mismatches (into []
                         (keep
                           (fn [v]
                             (let [expected-split (get source-splits (:source-id v))
                                   actual-split (:split v)]
                               (when (and expected-split
                                          (not= expected-split actual-split))
                                 {:variant-id (:variant-id v)
                                  :source-id (:source-id v)
                                  :expected-split expected-split
                                  :actual-split actual-split}))))
                         variants)]
    {:passed (empty? mismatches)
     :detail mismatches}))

;; ============================================================
;; duplicate-detection (FATAL)
;; ============================================================

(defn duplicate-detection
  "Detect within-split duplicates by canonical-hash.

   Records with the same :canonical-hash within the same :split
   are considered duplicates. Same hash across different splits is OK.

   records — vector of maps with :canonical-hash and :split

   Returns {:passed bool :detail [...duplicates]}"
  [records]
  (let [;; Group by (split, canonical-hash) and find duplicates
        by-split-hash (group-by (juxt :split :canonical-hash) records)
        duplicates (into []
                         (keep
                           (fn [[[split hash] recs]]
                             (when (> (count recs) 1)
                               {:split split
                                :canonical-hash hash
                                :count (count recs)
                                :source-ids (mapv :source-id recs)})))
                         (sort-by key by-split-hash))]
    {:passed (empty? duplicates)
     :detail duplicates}))

;; ============================================================
;; label-distribution-sane (NON-FATAL)
;; ============================================================

(defn label-distribution-sane
  "Check that label distribution is not extremely skewed.

   Computes the maximum proportion of any single label across
   all records. If any label represents more than 80% of the data,
   the check fails.

   records — vector of maps with :intent-label

   Returns {:passed bool :detail {:max-skew float :distribution {...}}}"
  [records]
  (let [total (count records)
        freqs (frequencies (map :intent-label records))
        max-proportion (if (pos? total)
                         (/ (double (apply max (vals freqs))) total)
                         0.0)
        distribution (into (sorted-map)
                           (map (fn [[label cnt]]
                                  [label {:count cnt
                                          :proportion (if (pos? total)
                                                        (/ (double cnt) total)
                                                        0.0)}]))
                           freqs)]
    {:passed (< max-proportion 0.80)
     :detail {:max-skew max-proportion
              :distribution distribution}}))
