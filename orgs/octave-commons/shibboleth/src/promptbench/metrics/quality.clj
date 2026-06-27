(ns promptbench.metrics.quality
  "Quality metrics: cluster-leakage-rate, semantic-diversity, transform-fidelity.

   All metrics operate on sequences of record maps loaded from parquet files.
   No pipeline state required — computable from dataset metadata alone.

   See spec §7.2 for quality metric definitions."
  (:require [promptbench.metrics.core :as metrics]
            [clojure.set :as set]
            [clojure.string :as str]))

;; ============================================================
;; cluster-leakage-rate
;; ============================================================

(defn cluster-leakage-rate
  "Compute cluster leakage rate — should always be 0.0 on valid build.

   Measures proportion of non-noise clusters that appear in multiple splits.
   Noise points (cluster-id = -1) are excluded.

   dataset — seq of maps with :cluster-id and :split

   Returns {:rate double, :leaks [{:cluster-id int :splits [kw ...]} ...]}"
  [dataset]
  (let [non-noise (remove #(= -1 (:cluster-id %)) dataset)
        ;; Build map of cluster-id -> set of splits
        cluster-splits (reduce (fn [acc record]
                                 (let [cid (:cluster-id record)
                                       split (:split record)]
                                   (if (and cid split)
                                     (update acc cid (fnil conj #{}) split)
                                     acc)))
                               {}
                               non-noise)
        ;; Find clusters in multiple splits
        leaky (into []
                    (comp (filter (fn [[_cid splits]] (> (count splits) 1)))
                          (map (fn [[cid splits]]
                                 {:cluster-id cid
                                  :splits (vec (sort-by str splits))})))
                    (sort-by key cluster-splits))
        total-clusters (count cluster-splits)]
    {:rate (if (pos? total-clusters)
             (double (/ (count leaky) total-clusters))
             0.0)
     :leaks leaky}))

;; ============================================================
;; semantic-diversity — cosine distance helpers
;; ============================================================

(defn- dot-product
  "Compute dot product of two vectors."
  [a b]
  (reduce + (map * a b)))

(defn- magnitude
  "Compute L2 magnitude of a vector."
  [v]
  (Math/sqrt (reduce + (map #(* % %) v))))

(defn- cosine-similarity
  "Compute cosine similarity between two vectors."
  [a b]
  (let [mag-a (magnitude a)
        mag-b (magnitude b)]
    (if (or (zero? mag-a) (zero? mag-b))
      0.0
      (/ (dot-product a b) (* mag-a mag-b)))))

(defn- cosine-distance
  "Compute cosine distance (1 - cosine similarity) between two vectors."
  [a b]
  (- 1.0 (cosine-similarity a b)))

(defn- mean-pairwise-cosine-distance
  "Compute mean pairwise cosine distance for a collection of embedding vectors."
  [embeddings]
  (let [n (count embeddings)]
    (if (<= n 1)
      0.0
      (let [pairs (for [i (range n)
                        j (range (inc i) n)]
                    (cosine-distance (nth embeddings i) (nth embeddings j)))
            num-pairs (count pairs)]
        (if (pos? num-pairs)
          (/ (reduce + pairs) num-pairs)
          0.0)))))

(defn semantic-diversity
  "Compute per-split mean pairwise cosine distance.

   dataset — seq of maps with :split and :embedding keys
             (:embedding is a numeric vector)

   Returns: {split-kw mean-cosine-distance ...}"
  [dataset]
  (let [;; Only include records with embeddings
        with-embeddings (filter :embedding dataset)
        ;; Group by split
        by-split (group-by :split with-embeddings)]
    (into {}
          (map (fn [[split records]]
                 [split (mean-pairwise-cosine-distance
                          (mapv :embedding records))]))
          (sort-by key by-split))))

;; ============================================================
;; transform-fidelity — BLEU and chrF
;; ============================================================

(defn- ngrams
  "Extract character or word n-grams from a string.
   mode — :word for word n-grams, :char for character n-grams"
  [text n mode]
  (let [tokens (case mode
                 :word (str/split (str/trim text) #"\s+")
                 :char (mapv str (seq text)))]
    (if (< (count tokens) n)
      []
      (mapv #(subvec tokens % (+ % n)) (range (- (count tokens) (dec n)))))))

(defn- ngram-counts
  "Count n-grams in a sequence."
  [grams]
  (frequencies grams))

(defn- clipped-count
  "Compute clipped n-gram count: min(candidate count, reference count) for each n-gram."
  [candidate-counts reference-counts]
  (reduce-kv (fn [total gram cnt]
               (+ total (min cnt (get reference-counts gram 0))))
             0
             candidate-counts))

(defn- brevity-penalty
  "Compute BLEU brevity penalty."
  [candidate-len reference-len]
  (if (<= candidate-len 0)
    0.0
    (if (> candidate-len reference-len)
      1.0
      (Math/exp (- 1.0 (/ (double reference-len) (double candidate-len)))))))

(defn bleu-score
  "Compute sentence-level BLEU score between candidate and reference.

   Uses up to 4-gram precision with uniform weights.
   Returns a score in [0.0, 1.0]."
  [candidate reference]
  (let [cand-words (str/split (str/trim candidate) #"\s+")
        ref-words (str/split (str/trim reference) #"\s+")
        cand-len (count cand-words)
        ref-len (count ref-words)
        bp (brevity-penalty cand-len ref-len)
        max-n (min 4 (min cand-len ref-len))]
    (if (<= max-n 0)
      0.0
      (let [precisions (for [n (range 1 (inc max-n))]
                         (let [cand-ngrams (ngrams candidate n :word)
                               ref-ngrams (ngrams reference n :word)
                               cand-counts (ngram-counts cand-ngrams)
                               ref-counts (ngram-counts ref-ngrams)
                               clipped (clipped-count cand-counts ref-counts)
                               total (count cand-ngrams)]
                           (if (pos? total)
                             (/ (double clipped) total)
                             0.0)))
            ;; Filter out zero precisions (log(0) is -Inf)
            nonzero-precs (filter pos? precisions)]
        (if (empty? nonzero-precs)
          0.0
          (* bp (Math/exp (/ (reduce + (map #(Math/log %) nonzero-precs))
                             (count nonzero-precs)))))))))

(defn chrf-score
  "Compute chrF score between candidate and reference.

   Uses character n-grams up to 6-grams with beta=2.
   Returns a score in [0.0, 1.0]."
  [candidate reference]
  (let [beta 2.0
        max-n 6
        precisions-recalls
        (for [n (range 1 (inc max-n))]
          (let [cand-ngrams (ngrams candidate n :char)
                ref-ngrams (ngrams reference n :char)
                cand-counts (ngram-counts cand-ngrams)
                ref-counts (ngram-counts ref-ngrams)
                clipped (clipped-count cand-counts ref-counts)
                cand-total (count cand-ngrams)
                ref-total (count ref-ngrams)
                precision (if (pos? cand-total) (/ (double clipped) cand-total) 0.0)
                recall (if (pos? ref-total) (/ (double clipped) ref-total) 0.0)]
            {:precision precision :recall recall}))]
    (let [avg-precision (if (seq precisions-recalls)
                          (/ (reduce + (map :precision precisions-recalls))
                             (count precisions-recalls))
                          0.0)
          avg-recall (if (seq precisions-recalls)
                       (/ (reduce + (map :recall precisions-recalls))
                          (count precisions-recalls))
                       0.0)]
      (if (and (pos? avg-precision) (pos? avg-recall))
        (let [beta-sq (* beta beta)]
          (/ (* (+ 1.0 beta-sq) avg-precision avg-recall)
             (+ (* beta-sq avg-precision) avg-recall)))
        0.0))))

(defn transform-fidelity
  "Compute BLEU and chrF scores for backtranslated MT variants.

   Backtranslated variants are identified by:
   - :variant-type = :mt
   - :metadata containing :backtranslation key

   The fidelity is measured between the original canonical text
   and the backtranslation.

   prompts  — seq of maps with :source-id and :canonical-text
   variants — seq of maps with :source-id, :variant-type, :metadata

   Returns {:scores [{:source-id str :bleu double :chrf double :target-lang kw} ...]
            :mean-bleu double :mean-chrf double}"
  [prompts variants]
  (let [;; Build source-id -> canonical-text lookup
        source-texts (into {} (map (juxt :source-id :canonical-text)) prompts)
        ;; Filter to backtranslated MT variants only
        backtranslated (filter (fn [v]
                                 (and (= :mt (:variant-type v))
                                      (contains? (:metadata v) :backtranslation)))
                               variants)
        scores (into []
                     (keep (fn [v]
                             (let [original (get source-texts (:source-id v))
                                   backtrans (get-in v [:metadata :backtranslation])]
                               (when (and original backtrans)
                                 {:source-id (:source-id v)
                                  :bleu (bleu-score backtrans original)
                                  :chrf (chrf-score backtrans original)
                                  :target-lang (get-in v [:metadata :target-lang])}))))
                     backtranslated)]
    {:scores scores
     :mean-bleu (if (seq scores) (/ (reduce + (map :bleu scores)) (count scores)) 0.0)
     :mean-chrf (if (seq scores) (/ (reduce + (map :chrf scores)) (count scores)) 0.0)}))

;; ============================================================
;; Registration — register all quality metrics with def-metric
;; ============================================================

(defn register-quality-metrics!
  "Register all quality metrics in the metrics registry."
  []
  (metrics/register-metric! :cluster-leakage-rate
    {:description "Should always be 0.0 — measures split contamination"
     :compute     (fn [dataset _params]
                    (cluster-leakage-rate dataset))
     :assertion   #(= 0.0 (:rate %))})

  (metrics/register-metric! :semantic-diversity
    {:description "Mean pairwise cosine distance within each split"
     :compute     (fn [dataset _params]
                    (semantic-diversity dataset))})

  (metrics/register-metric! :transform-fidelity
    {:description "Backtranslation BLEU/chrF score for MT variants"
     :compute     (fn [dataset _params]
                    ;; Dataset is expected to be a map with :prompts and :variants
                    ;; or a flat sequence. Handle both cases.
                    (if (map? dataset)
                      (transform-fidelity (:prompts dataset) (:variants dataset))
                      (transform-fidelity dataset [])))}))
