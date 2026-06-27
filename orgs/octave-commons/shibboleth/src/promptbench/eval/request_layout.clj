(ns promptbench.eval.request-layout
  "Pure request-composition helpers for the next promptbench evaluation layer.

   These helpers separate:
   - context prompt
   - task prompt
   - placement mode

   They are intended to become the request-shaping spine for future runner work." 
  (:require [clojure.string :as str]
            [promptbench.util.crypto :as crypto]))

(def ^:private supported-placement-modes-set
  #{:direct-user :system-context :developer-context})

(defn supported-placement-modes
  []
  supported-placement-modes-set)

(defn normalize-placement-mode
  [mode]
  (let [m (cond
            (keyword? mode) mode
            (string? mode) (keyword mode)
            :else mode)]
    (when-not (contains? supported-placement-modes-set m)
      (throw (ex-info (str "Unsupported placement mode: " mode)
                      {:mode mode
                       :supported supported-placement-modes-set})))
    m))

(defn build-messages
  "Compose request messages from base system prompt + optional context + task.

   placement modes:
   - :direct-user        => base system + user task
   - :system-context     => base system + extra system context + user task
   - :developer-context  => base system + developer context + user task" 
  [{:keys [base-system-prompt context-prompt task-prompt placement-mode]}]
  (let [placement-mode (normalize-placement-mode placement-mode)
        base-system-prompt (some-> base-system-prompt str/trim not-empty)
        context-prompt (some-> context-prompt str/trim not-empty)
        task-prompt (or (some-> task-prompt str/trim not-empty) "")]
    (vec
      (concat
        (when base-system-prompt
          [{:role "system" :content base-system-prompt}])
        (case placement-mode
          :direct-user []
          :system-context (when context-prompt [{:role "system" :content context-prompt}])
          :developer-context (when context-prompt [{:role "developer" :content context-prompt}]))
        [{:role "user" :content task-prompt}]))))

(defn compose-eval-case
  "Return a normalized composed eval case.

   Expected keys:
   - :context-id (optional)
   - :task-id
   - :context-intent-label (optional)
   - :task-intent-label
   - :context-role (optional metadata)
   - :language
   - :suite
   - :split
   - :base-system-prompt
   - :context-prompt
   - :task-prompt
   - :placement-mode" 
  [{:keys [context-id task-id context-intent-label task-intent-label context-role
           language suite split placement-mode base-system-prompt context-prompt task-prompt
           context-category task-category context-source-dataset task-source-dataset]
    :as m}]
  (let [placement-mode (normalize-placement-mode placement-mode)
        overall-intent (if (or (= "adversarial" context-intent-label)
                               (= "adversarial" task-intent-label))
                         "adversarial"
                         "benign")
        messages (build-messages {:base-system-prompt base-system-prompt
                                  :context-prompt context-prompt
                                  :task-prompt task-prompt
                                  :placement-mode placement-mode})]
    {:case_id (crypto/sha256-id
                (pr-str {:context-id context-id
                         :task-id task-id
                         :placement-mode placement-mode
                         :language language
                         :suite suite
                         :split split}))
     :context_id context-id
     :task_id task-id
     :placement_mode (name placement-mode)
     :case_key (or task-id (:context-id m) (name placement-mode))
     :intent_label overall-intent
     :context_role context-role
     :context_category context-category
     :task_category task-category
     :context_source_dataset context-source-dataset
     :task_source_dataset task-source-dataset
     :context_intent_label context-intent-label
     :task_intent_label task-intent-label
     :language language
     :suite suite
     :split split
     :text task-prompt
     :messages messages
     :context_prompt_hash (when context-prompt (crypto/sha256-id context-prompt))
     :task_prompt_hash (crypto/sha256-id (or task-prompt ""))
     :request_hash (crypto/sha256-id (pr-str messages))}))
