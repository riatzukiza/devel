(ns eta-mu.runtime.domain.session
  (:require [eta-mu.runtime.law.core :as law]
            [eta-mu.runtime.law.message :as message-law]
            [eta-mu.runtime.law.session :as session-law]))

(defn create-session-context
  [options]
  (law/validate! session-law/session-context-schema
                 (merge {:messages []
                         :active-tool-names []
                         :metadata {}}
                        options)
                 "session context"))

(defn append-message
  [session message]
  (let [message (law/validate! message-law/agent-message-schema message "agent message")]
    (law/validate! session-law/session-context-schema
                   (update session :messages conj message)
                   "session context")))
