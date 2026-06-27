(ns eta-mu.runtime.shape.session
  (:require [eta-mu.runtime.shape.message :as message-shape]))

(defn- first-present
  [m keys]
  (when-let [key (first (filter #(contains? m %) keys))]
    (get m key)))

(defn context-from-external
  [context]
  (let [created-at (or (first-present context [:createdAt :created-at]) 0)
        updated-at (or (first-present context [:updatedAt :updated-at]) created-at)]
    {:session-id (or (:sessionId context) (:session-id context))
     :cwd (:cwd context)
     :messages (mapv message-shape/message-from-external (or (:messages context) []))
     :active-tool-names (vec (or (:activeToolNames context) (:active-tool-names context) []))
     :metadata (or (:metadata context) {})
     :created-at created-at
     :updated-at updated-at}))

(defn context->external
  [context]
  {:sessionId (:session-id context)
   :cwd (:cwd context)
   :messages (mapv message-shape/message->external (:messages context))
   :activeToolNames (vec (:active-tool-names context))
   :metadata (:metadata context)
   :createdAt (:created-at context)
   :updatedAt (:updated-at context)})
