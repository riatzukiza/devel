(ns eta-mu.runtime.facade
  (:require [eta-mu.runtime.domain.breath :as breath]
            [eta-mu.runtime.domain.envelope :as envelope]
            [eta-mu.runtime.domain.message :as message]
            [eta-mu.runtime.domain.model :as model]
            [eta-mu.runtime.domain.planner :as planner]
            [eta-mu.runtime.domain.session :as session]
            [eta-mu.runtime.domain.state :as state]
            [eta-mu.runtime.domain.surface :as surface]
            [eta-mu.runtime.domain.tool :as tool]
            [eta-mu.runtime.extern.js :as host]
            [eta-mu.runtime.extern.time :as extern-time]
            [eta-mu.runtime.shape.compat :as compat]
            [eta-mu.runtime.shape.message :as message-shape]
            [eta-mu.runtime.shape.model :as model-shape]
            [eta-mu.runtime.shape.session :as session-shape]
            [eta-mu.runtime.shape.surface :as surface-shape]
            [eta-mu.runtime.shape.tool :as tool-shape]))

(defn- now-iso
  []
  (extern-time/now-iso))

(defn- js-value
  [value]
  (host/value->clj value))

(defn- js-map
  [value]
  (host/object->clj value))

(defn- timestamp-ms
  [value]
  (extern-time/timestamp-ms value))

(defn- ->js
  [value]
  (host/clj->value value))

(defn create-eta-belief
  "JS facade for createEtaBelief."
  ([]
   (create-eta-belief nil))
  ([overrides]
   (-> overrides
       js-map
       compat/belief-from-external
       state/create-belief
       compat/belief->external
       ->js)))

(defn create-breath-episode
  "JS facade for createBreathEpisode."
  ([id]
   (create-breath-episode id (now-iso) false 0))
  ([id now]
   (create-breath-episode id now false 0))
  ([id now pending-commit activity-scalar]
   (-> (state/create-breath-episode id now pending-commit (or activity-scalar 0))
       compat/breath-episode->external
       ->js)))

(defn create-eta-mu-state
  "JS facade for createEtaMuState."
  ([]
   (create-eta-mu-state nil))
  ([options]
   (let [options (js-map options)
         options (cond-> options
                   (not (contains? options :now))
                   (assoc :now (now-iso)))]
     (-> options
         compat/state-options-from-external
         state/create-state
         compat/state->external
         ->js))))

(defn select-panels-from-context
  "JS facade for selectPanelsFromContext."
  [context]
  (let [panels (-> context
                   js-map
                   compat/planning-context-from-external
                   planner/select-panels)]
    (->js (mapv compat/panel->external panels))))

(defn rank-cheap-mu-candidates
  "JS facade for rankCheapMuCandidates."
  [context]
  (let [candidates (-> context
                       js-map
                       compat/planning-context-from-external
                       planner/rank-cheap-candidates)]
    (->js (mapv compat/candidate->external candidates))))

(defn recommend-breath
  "JS facade for recommendBreath."
  ([context]
   (recommend-breath context nil))
  ([context actions]
   (let [context (-> context js-map compat/planning-context-from-external)
         actions (when actions
                   (mapv compat/candidate-from-external (host/value->clj actions)))]
     (-> context
         (breath/recommend actions)
         compat/breath-recommendation->external
         ->js))))

(defn create-action-batch
  "JS facade for createActionBatch."
  [context]
  (-> context
      js-map
      compat/planning-context-from-external
      envelope/create-action-batch
      compat/action-batch->external
      ->js))

(defn create-text-content
  "JS facade for createTextContent."
  [text]
  (-> text
      message/create-text-content
      message-shape/content->external
      ->js))

(defn create-image-content
  "JS facade for createImageContent."
  [data mime-type]
  (-> (message/create-image-content data mime-type)
      message-shape/content->external
      ->js))

(defn create-audio-content
  "JS facade for createAudioContent."
  ([data mime-type]
   (create-audio-content data mime-type nil))
  ([data mime-type format]
   (-> (message/create-audio-content data mime-type (some-> format keyword))
       message-shape/content->external
       ->js)))

(defn create-bash-execution-message
  "JS facade for createBashExecutionMessage."
  [options]
  (let [options (js-map options)
        message (-> (assoc options :role "bashExecution")
                    message-shape/message-from-external
                    (assoc :timestamp (timestamp-ms (:timestamp options)))
                    message/create-bash-execution-message)]
    (-> message message-shape/message->external ->js)))

(defn create-custom-message
  "JS facade for createCustomMessage."
  ([custom-type content display]
   (create-custom-message custom-type content display nil nil))
  ([custom-type content display details]
   (create-custom-message custom-type content display details nil))
  ([custom-type content display details timestamp]
   (let [content (if (string? content)
                   content
                   (mapv message-shape/content-from-external (js-value content)))
         details (some-> details js-value)]
     (-> (message/create-custom-message custom-type content display details (timestamp-ms timestamp))
         message-shape/message->external
         ->js))))

(defn create-branch-summary-message
  "JS facade for createBranchSummaryMessage."
  [summary from-id timestamp]
  (-> (message/create-branch-summary-message summary from-id (timestamp-ms timestamp))
      message-shape/message->external
      ->js))

(defn create-compaction-summary-message
  "JS facade for createCompactionSummaryMessage."
  [summary tokens-before timestamp]
  (-> (message/create-compaction-summary-message summary tokens-before (timestamp-ms timestamp))
      message-shape/message->external
      ->js))

(defn convert-to-llm-messages
  "JS facade for convertToLlmMessages."
  [messages]
  (->> (js-value messages)
       (mapv message-shape/message-from-external)
       message/convert-to-llm
       (mapv message-shape/message->external)
       ->js))

(defn create-tool-descriptor
  "JS facade for createToolDescriptor."
  [descriptor]
  (-> descriptor
      js-map
      tool-shape/descriptor-from-external
      tool/create-tool-descriptor
      tool-shape/descriptor->external
      ->js))

(defn compose-tool-descriptors
  "JS facade for composeToolDescriptors."
  [descriptor-groups]
  (let [groups (->> (js-value descriptor-groups)
                    (mapv #(mapv tool-shape/descriptor-from-external %)))]
    (->> groups
         tool/compose-tool-descriptors
         (mapv tool-shape/descriptor->external)
         ->js)))

(defn select-compatible-models
  "JS facade for selectCompatibleModels."
  [models requirements]
  (let [models (mapv model-shape/model-from-external (js-value models))
        requirements (model-shape/requirements-from-external (js-map requirements))]
    (->> (model/select-compatible-models models requirements)
         (mapv model-shape/model->external)
         ->js)))

(defn create-session-context
  "JS facade for createSessionContext."
  [context]
  (let [context (js-map context)
        now (timestamp-ms (:updatedAt context))]
    (-> context
        (update :createdAt #(or % now))
        (update :updatedAt #(or % now))
        session-shape/context-from-external
        session/create-session-context
        session-shape/context->external
        ->js)))

(defn create-surface-command-result
  "JS facade for createSurfaceCommandResult."
  [input]
  (-> input
      js-map
      surface-shape/command-input-from-external
      surface/create-command-result
      surface-shape/command-result->external
      ->js))
