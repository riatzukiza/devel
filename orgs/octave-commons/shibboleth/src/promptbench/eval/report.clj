(ns promptbench.eval.report
  "Small reporting helpers for new-pattern promptbench runs."
  (:require [clojure.edn :as edn]
            [clojure.java.io :as io]
            [promptbench.eval.stats :as stats]))

(defn load-metrics
  [run-dir]
  (edn/read-string (slurp (str run-dir "/metrics.edn"))))

(defn summarize-by
  [metrics ks]
  (->> metrics
       (group-by (apply juxt ks))
       (map (fn [[k rows]]
              (let [n-total (reduce + (map #(long (or (:n_total %) 0)) rows))
                    n-errors (reduce + (map #(long (or (:n_errors %) 0)) rows))
                    n-adversarial (reduce + (map #(long (or (:n_adversarial %) 0)) rows))
                    n-benign (reduce + (map #(long (or (:n_benign %) 0)) rows))
                    n-harmful-compliance (reduce + (map #(long (or (:n_harmful_compliance %) 0)) rows))
                    n-benign-failure (reduce + (map #(long (or (:n_benign_failure %) 0)) rows))
                    n-benign-task-success (reduce + (map #(long (or (:n_benign_task_success %) 0)) rows))
                    asr (when (pos? n-adversarial)
                          (/ (double n-harmful-compliance) (double n-adversarial)))
                    fpr (when (pos? n-benign)
                          (/ (double n-benign-failure) (double n-benign)))
                    benign-task-success-rate (when (pos? n-benign)
                                               (/ (double n-benign-task-success) (double n-benign)))]
                {:group k
                 :cells (count rows)
                 :n_total n-total
                 :n_errors n-errors
                 :n_adversarial n-adversarial
                 :n_benign n-benign
                 :n_harmful_compliance n-harmful-compliance
                 :n_benign_failure n-benign-failure
                 :n_benign_task_success n-benign-task-success
                 :asr asr
                 :fpr fpr
                 :benign_task_success_rate benign-task-success-rate})))
       (sort-by :group)
       vec))

(defn group-proportion-summaries
  [metrics ks metric & [opts]]
  (->> (summarize-by metrics ks)
       (mapv (fn [row]
               (merge row
                      (stats/cell-proportion-summary
                        {:policy_layer nil
                         :target_model nil
                         :placement_mode nil
                         :context_category nil
                         :task_category nil
                         :context_intent_label nil
                         :task_intent_label nil
                         :n_harmful_compliance (:n_harmful_compliance row)
                         :n_attack_success (:n_harmful_compliance row)
                         :n_adversarial (:n_adversarial row)
                         :n_benign_failure (:n_benign_failure row)
                         :n_benign_task_success (:n_benign_task_success row)
                         :n_benign (:n_benign row)
                         :n_refused 0
                         :n_total (:n_total row)}
                        metric
                        opts))))))

(defn print-summary
  [run-dir]
  (let [metrics (load-metrics run-dir)
        groups (summarize-by metrics [:target_model :placement_mode :context_intent_label :task_intent_label])]
    (doseq [{:keys [group n_total n_errors asr fpr benign_task_success_rate]} groups]
      (println {:group group
                :n_total n_total
                :n_errors n_errors
                :asr asr
                :fpr fpr
                :benign_task_success_rate benign_task_success_rate}))
    groups))
