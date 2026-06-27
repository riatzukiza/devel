(ns promptbench.eval.case-matrix
  "Compose task/context seed datasets into eval-ready case matrices.

   This namespace does not call models. It only builds structured eval cases
   for later runner integration." 
  (:require [promptbench.eval.request-layout :as layout]
            [promptbench.python.parquet :as parquet]))

(def ^:private default-task-path
  "data/task-prompts/seed-v0.1.0/task_prompts.parquet")

(def ^:private default-context-path
  "data/context-prompts/seed-v0.1.0/context_prompts.parquet")

(defn load-task-prompts
  ([] (load-task-prompts default-task-path))
  ([path]
   (parquet/read-parquet path)))

(defn load-context-prompts
  ([] (load-context-prompts default-context-path))
  ([path]
   (parquet/read-parquet path)))

(defn direct-user-cases
  [task-prompts]
  (mapv (fn [task]
          (layout/compose-eval-case
            {:context-id nil
             :task-id (:task_id task)
             :context-intent-label nil
             :task-intent-label (:intent_label task)
             :context-role nil
             :context-category nil
             :task-category (:harm_category task)
             :context-source-dataset nil
             :task-source-dataset (:source_dataset task)
             :language (:language task)
             :suite "task-seed"
             :split "seed"
             :placement-mode :direct-user
             :base-system-prompt nil
             :task-prompt (:canonical_text task)}))
        task-prompts))

(defn paired-context-cases
  "Cross product of contexts × tasks for the requested placement mode.

   This is intentionally simple for now; later runner sampling can thin the matrix." 
  [context-prompts task-prompts placement-mode]
  (mapv (fn [[ctx task]]
          (layout/compose-eval-case
            {:context-id (:context_id ctx)
            :task-id (:task_id task)
             :context-intent-label (:intent_label ctx)
             :task-intent-label (:intent_label task)
             :context-role (:role_channel ctx)
             :context-category (:category ctx)
             :task-category (:harm_category task)
             :context-source-dataset (:source_dataset ctx)
             :task-source-dataset (:source_dataset task)
             :language (:language task)
             :suite "context-task-seed"
             :split "seed"
             :placement-mode placement-mode
             :base-system-prompt nil
             :context-prompt (:canonical_text ctx)
             :task-prompt (:canonical_text task)}))
        (for [ctx context-prompts
              task task-prompts]
          [ctx task])))

(defn build-case-matrix
  ([] (build-case-matrix {}))
  ([{:keys [task-prompts context-prompts placement-modes]
     :or {placement-modes [:direct-user :system-context :developer-context]}}]
   (let [task-prompts (or task-prompts (load-task-prompts))
         context-prompts (or context-prompts (load-context-prompts))
         placement-modes (mapv layout/normalize-placement-mode placement-modes)]
     (reduce (fn [acc mode]
               (assoc acc (name mode)
                      (case mode
                        :direct-user (direct-user-cases task-prompts)
                        :system-context (paired-context-cases
                                          (filterv #(= "system" (:role_channel %)) context-prompts)
                                          task-prompts
                                          mode)
                        :developer-context (paired-context-cases
                                             (filterv #(= "developer" (:role_channel %)) context-prompts)
                                             task-prompts
                                             mode))))
             {}
             placement-modes))))
