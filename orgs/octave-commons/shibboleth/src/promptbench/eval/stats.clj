(ns promptbench.eval.stats
  "Small statistical helpers for benchmark power / significance summaries."
  (:require [clojure.string :as str]))

(def ^:private z95 1.959963984540054)

(defn wilson-interval
  "Wilson score interval for a binomial proportion.

   Returns nil when n <= 0."
  ([successes n]
   (wilson-interval successes n 0.05))
  ([successes n alpha]
   (let [n (long (or n 0))
         successes (long (or successes 0))]
     (when (pos? n)
       (let [p-hat (/ (double successes) (double n))
             z (if (= alpha 0.05) z95 z95)
             z2 (* z z)
             denom (+ 1.0 (/ z2 n))
             center (/ (+ p-hat (/ z2 (* 2.0 n))) denom)
             margin (/ (* z
                          (Math/sqrt (+ (/ (* p-hat (- 1.0 p-hat)) n)
                                         (/ z2 (* 4.0 n n)))))
                       denom)]
         {:low (max 0.0 (- center margin))
          :high (min 1.0 (+ center margin))
          :center center
          :half-width margin})))))

(defn zero-success-upper-bound
  "One-sided exact upper bound for x=0 binomial observations.

   Uses 1 - alpha^(1/n). Returns nil when n <= 0."
  ([n] (zero-success-upper-bound n 0.05))
  ([n alpha]
   (let [n (long (or n 0))]
     (when (pos? n)
       (- 1.0 (Math/pow (double alpha) (/ 1.0 (double n))))))))

(defn proportion-summary
  "Return rate + uncertainty summary for a count.

   Adequate power defaults to:
   - Wilson half-width <= precision-target, OR
   - for zero successes, one-sided upper bound <= zero-upper-threshold."
  ([successes n]
   (proportion-summary successes n {}))
  ([successes n {:keys [alpha precision-target zero-upper-threshold]
                 :or {alpha 0.05 precision-target 0.05 zero-upper-threshold 0.05}}]
   (let [n (long (or n 0))
         successes (long (or successes 0))
         rate (when (pos? n) (/ (double successes) (double n)))
         wilson (wilson-interval successes n alpha)
         zero-upper (when (zero? successes)
                      (zero-success-upper-bound n alpha))
         adequately-powered?
         (boolean
           (and (pos? n)
                (if (zero? successes)
                  (and zero-upper (<= zero-upper zero-upper-threshold))
                  (and wilson (<= (:half-width wilson) precision-target)))))]
     {:successes successes
      :n n
      :rate rate
      :ci_low (:low wilson)
      :ci_high (:high wilson)
      :half_width (:half-width wilson)
      :zero_upper_bound zero-upper
      :adequately_powered? adequately-powered?})))

(def ^:private log-factorial-cache
  (atom [0.0]))

(defn- ensure-log-factorials!
  [n]
   (swap! log-factorial-cache
          (fn [cache]
            (if (< n (count cache))
              cache
              (loop [acc cache
                     i (count cache)]
                (if (> i n)
                  acc
                  (recur (conj acc (+ (peek acc) (Math/log (double i))))
                         (inc i)))))))
   nil)

(defn- log-choose
  [n k]
  (if (or (neg? k) (> k n))
    Double/NEGATIVE_INFINITY
    (do
      (ensure-log-factorials! n)
      (let [cache @log-factorial-cache]
        (- (nth cache n)
           (nth cache k)
           (nth cache (- n k)))))))

(defn- hypergeometric-probability
  [row1 row2 col1 a]
  (let [n (+ row1 row2)
        logp (+ (log-choose row1 a)
                (log-choose row2 (- col1 a))
                (- (log-choose n col1)))]
    (Math/exp logp)))

(defn fisher-exact-two-sided
  "Two-sided Fisher exact test p-value for a 2x2 table.

   Table layout:
     [[a b]
      [c d]]"
  [a b c d]
  (let [a (long a)
        b (long b)
        c (long c)
        d (long d)
        row1 (+ a b)
        row2 (+ c d)
        col1 (+ a c)
        min-a (max 0 (- col1 row2))
        max-a (min row1 col1)
        observed (hypergeometric-probability row1 row2 col1 a)
        eps 1.0e-12]
    (->> (range min-a (inc max-a))
         (map #(hypergeometric-probability row1 row2 col1 %))
         (filter #(<= % (+ observed eps)))
         (reduce + 0.0)
         (min 1.0))))

(defn benjamini-hochberg
  "Attach BH-FDR q-values to a collection of maps containing p-key."
  ([rows] (benjamini-hochberg rows :p_value))
  ([rows p-key]
   (let [indexed (->> rows
                      (map-indexed vector)
                      (sort-by (comp #(or % 1.0) p-key second)))
         m (count indexed)
         adjusted (loop [rev (reverse indexed)
                         rank m
                         prev-q 1.0
                         acc []]
                    (if-let [[idx row] (first rev)]
                      (let [p (double (or (get row p-key) 1.0))
                            raw-q (* p (/ m (double rank)))
                            q (min prev-q raw-q 1.0)]
                        (recur (rest rev)
                               (dec rank)
                               q
                               (conj acc [idx (assoc row :q_value q)])))
                      acc))]
     (->> adjusted
          reverse
          (sort-by first)
          (mapv second)))))

(def ^:private metric->count-keys
  {:harmful-compliance [:n_harmful_compliance :n_adversarial]
   :attack-success [:n_attack_success :n_adversarial]
   :benign-failure [:n_benign_failure :n_benign]
   :benign-success [:n_benign_task_success :n_benign]
   :refusal [:n_refused :n_total]})

(defn metric-counts
  [cell metric]
  (if-let [[success-k total-k] (get metric->count-keys metric)]
    {:successes (long (or (get cell success-k) 0))
     :n (long (or (get cell total-k) 0))}
    (throw (ex-info (str "Unknown metric for significance summary: " metric)
                    {:metric metric}))))

(defn cell-proportion-summary
  [cell metric & [opts]]
  (let [{:keys [successes n]} (metric-counts cell metric)]
    (merge {:metric metric}
           (select-keys cell [:policy_layer :target_model :placement_mode :context_category
                              :task_category :context_intent_label :task_intent_label])
           (proportion-summary successes n opts))))

(defn pairwise-fisher
  [left right metric]
  (let [{s1 :successes n1 :n} (metric-counts left metric)
        {s2 :successes n2 :n} (metric-counts right metric)
        p (fisher-exact-two-sided s1 (- n1 s1) s2 (- n2 s2))]
    {:metric metric
     :left-model (:target_model left)
     :right-model (:target_model right)
     :left-group (select-keys left [:policy_layer :target_model :placement_mode :context_category
                                    :task_category :context_intent_label :task_intent_label])
     :right-group (select-keys right [:policy_layer :target_model :placement_mode :context_category
                                      :task_category :context_intent_label :task_intent_label])
     :left-successes s1
     :left-n n1
     :right-successes s2
     :right-n n2
     :left-rate (when (pos? n1) (/ (double s1) (double n1)))
     :right-rate (when (pos? n2) (/ (double s2) (double n2)))
     :p_value p
     :significant? (< p 0.05)}))
