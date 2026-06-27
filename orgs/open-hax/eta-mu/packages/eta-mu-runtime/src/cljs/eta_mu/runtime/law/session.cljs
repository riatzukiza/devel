(ns eta-mu.runtime.law.session
  (:require [eta-mu.runtime.law.message :as message]))

(def session-context-schema
  [:map
   [:session-id [:string {:min 1}]]
   [:cwd [:string {:min 1}]]
   [:messages [:vector message/agent-message-schema]]
   [:active-tool-names [:vector [:string {:min 1}]]]
   [:metadata map?]
   [:created-at message/timestamp-schema]
   [:updated-at message/timestamp-schema]])
