(ns promptbench.pipeline.splitter
  "Cluster-level split with invariants.

   Implements cluster-disjoint stratified splitting for pipeline Stage 3.
   The KEY INVARIANT: no cluster ID appears in more than one split.

   Noise points (cluster_id=-1) are treated as singleton clusters,
   each assigned to exactly one split independently.

   Stratification dimensions: :intent-label, :attack-family, :canonical-lang."
  (:require [clojure.set :as set])
  (:import [java.util Random]))

;; ============================================================
;; Deterministic Random
;; ============================================================

(defn- make-rng
  "Create a java.util.Random with the given seed."
  ^Random [^long seed]
  (Random. seed))

(defn- shuffle-with-rng
  "Deterministically shuffle a collection using the given RNG."
  [coll ^Random rng]
  (let [arr (java.util.ArrayList. (vec coll))]
    (java.util.Collections/shuffle arr rng)
    (vec arr)))

;; ============================================================
;; Cluster Grouping
;; ============================================================

(defn- group-by-cluster
  "Group records by cluster-id. Noise points (cluster_id=-1) each become
   their own singleton group with unique synthetic cluster IDs."
  [records]
  (let [groups (group-by :cluster-id records)
        noise-records (get groups -1 [])
        real-groups (dissoc groups -1)
        ;; Assign each noise point a unique synthetic cluster ID
        ;; Use negative IDs starting from -2 to avoid collision
        noise-groups (into {}
                          (map-indexed
                            (fn [idx r]
                              [(- -2 idx) [r]])
                            ;; Sort noise records deterministically by source-id
                            (sort-by :source-id noise-records)))]
    (merge real-groups noise-groups)))

;; ============================================================
;; Stratification Key
;; ============================================================

(defn- stratification-key
  "Compute a stratification key for a cluster based on the majority
   labels of its records across the given dimensions."
  [records stratify-dims]
  (mapv (fn [dim]
          (let [vals (map #(get % dim) records)
                freqs (frequencies vals)]
            (key (apply max-key val (sort-by key freqs)))))
        stratify-dims))

;; ============================================================
;; Stratified Split
;; ============================================================

(defn- assign-splits
  "Given cluster groups, assign each cluster to a split while maintaining
   approximate target proportions and stratification.

   Returns a map of cluster-id -> split-keyword."
  [cluster-groups target-proportions stratify-dims ^Random rng]
  (let [;; Compute total record count
        total-records (reduce + (map count (vals cluster-groups)))
        ;; Compute stratification key for each cluster
        cluster-strat (into {}
                           (map (fn [[cid records]]
                                  [cid (stratification-key records stratify-dims)])
                                cluster-groups))
        ;; Group clusters by stratification key
        strat-groups (group-by (fn [[cid _]] (get cluster-strat cid))
                               (sort-by key cluster-groups))
        ;; Split names in priority order
        split-names [:train :dev :test]
        ;; Track current counts per split
        split-counts (atom {:train 0 :dev 0 :test 0})
        ;; Assignments
        assignments (atom {})]
    ;; Process each stratum
    (doseq [[_strat-key clusters] (sort-by key strat-groups)]
      (let [;; Shuffle clusters within stratum for randomness
            shuffled-clusters (shuffle-with-rng clusters rng)]
        (doseq [[cid records] shuffled-clusters]
          (let [n (count records)
                ;; Pick the split that is most under-target
                best-split
                (first
                  (sort-by
                    (fn [s]
                      (let [current (get @split-counts s 0)
                            target (* (get target-proportions s) total-records)]
                        (- current target)))
                    split-names))]
            (swap! assignments assoc cid best-split)
            (swap! split-counts update best-split + n)))))
    @assignments))

;; ============================================================
;; Public API
;; ============================================================

(defn split-clusters
  "Perform cluster-level stratified split on records.

   records — vector of maps, each with at least :cluster-id and fields
             specified in stratify-by.
   config — split configuration:
     :train, :dev, :test — target proportions (should sum to 1.0)
     :stratify-by — vector of keywords for stratification dimensions
     :constraint — must be :cluster-disjoint
   seed — integer seed for deterministic assignment

   Returns records with :split key added.

   INVARIANT: No cluster ID appears in more than one split."
  [records config seed]
  (let [{:keys [train dev test stratify-by]} config
        target-proportions {:train (or train 0.70)
                            :dev   (or dev 0.15)
                            :test  (or test 0.15)}
        stratify-dims (or stratify-by [:intent-label :attack-family :canonical-lang])
        rng (make-rng seed)
        ;; Group records by cluster, treating noise as singletons
        cluster-groups (group-by-cluster records)
        ;; Assign clusters to splits
        cluster-assignments (assign-splits cluster-groups target-proportions stratify-dims rng)]
    ;; Pre-compute noise-groups map once (source-id -> synthetic-cluster-id)
    ;; to avoid O(n^2) re-computation inside the mapv loop
    (let [noise-groups (into {}
                            (map-indexed
                              (fn [idx nr]
                                [(:source-id nr) (- -2 idx)])
                              (sort-by :source-id
                                       (filter #(= -1 (:cluster-id %)) records))))]
      ;; Apply split assignments to records
      (mapv (fn [r]
              (let [cid (:cluster-id r)]
                (if (= cid -1)
                  ;; Noise point: look up pre-computed synthetic cluster id
                  (let [synthetic-cid (get noise-groups (:source-id r))]
                    (assoc r :split (get cluster-assignments synthetic-cid)))
                  ;; Regular cluster: look up assignment
                  (assoc r :split (get cluster-assignments cid)))))
            records))))

(defn verify-disjointness
  "Verify that no real cluster ID appears in more than one split.
   Noise points (cluster_id=-1) are excluded from this check since
   they are treated as singleton clusters and may appear in multiple splits.

   Returns {:passed bool :leaks []} with any leaked cluster IDs."
  [records]
  (let [;; Only check non-noise clusters for disjointness
        non-noise-records (remove #(= -1 (:cluster-id %)) records)
        split-clusters (reduce (fn [m r]
                                 (update m (:split r) (fnil conj #{}) (:cluster-id r)))
                               {}
                               non-noise-records)
        splits (vec (keys split-clusters))
        leaks (for [i (range (count splits))
                    j (range (inc i) (count splits))
                    :let [s1 (nth splits i)
                          s2 (nth splits j)
                          shared (set/intersection
                                   (get split-clusters s1 #{})
                                   (get split-clusters s2 #{}))]
                    :when (seq shared)]
                {:splits [s1 s2] :shared-clusters shared})]
    {:passed (empty? leaks)
     :leaks (vec leaks)}))
