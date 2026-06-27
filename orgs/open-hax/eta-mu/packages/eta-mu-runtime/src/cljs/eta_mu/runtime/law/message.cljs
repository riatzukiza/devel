(ns eta-mu.runtime.law.message
  (:require [eta-mu.runtime.law.content-part :as content]))

(def timestamp-schema [:int {:min 0}])

(def role-schema
  [:enum :user :assistant :tool-result :bash-execution :custom :branch-summary :compaction-summary])

(def usage-cost-schema
  [:map
   [:input [:and number? [:>= 0]]]
   [:output [:and number? [:>= 0]]]
   [:cache-read [:and number? [:>= 0]]]
   [:cache-write [:and number? [:>= 0]]]
   [:total [:and number? [:>= 0]]]])

(def usage-schema
  [:map
   [:input [:int {:min 0}]]
   [:output [:int {:min 0}]]
   [:cache-read [:int {:min 0}]]
   [:cache-write [:int {:min 0}]]
   [:total-tokens [:int {:min 0}]]
   [:cost usage-cost-schema]])

(def stop-reason-schema
  [:enum :stop :length :tool-use :error :aborted])

(def user-message-schema
  [:map
   [:role [:= :user]]
   [:content [:or string? [:vector {:min 1} content/input-content-schema]]]
   [:timestamp timestamp-schema]])

(def assistant-message-schema
  [:map
   [:role [:= :assistant]]
   [:content [:vector content/assistant-content-schema]]
   [:api [:string {:min 1}]]
   [:provider [:string {:min 1}]]
   [:model [:string {:min 1}]]
   [:response-id {:optional true} [:string {:min 1}]]
   [:usage usage-schema]
   [:stop-reason stop-reason-schema]
   [:error-message {:optional true} [:string {:min 1}]]
   [:timestamp timestamp-schema]])

(def tool-result-message-schema
  [:map
   [:role [:= :tool-result]]
   [:tool-call-id [:string {:min 1}]]
   [:tool-name [:string {:min 1}]]
   [:content [:vector content/input-content-schema]]
   [:details {:optional true} any?]
   [:is-error boolean?]
   [:timestamp timestamp-schema]])

(def bash-execution-message-schema
  [:map
   [:role [:= :bash-execution]]
   [:command [:string {:min 1}]]
   [:output string?]
   [:exit-code {:optional true} [:maybe int?]]
   [:cancelled boolean?]
   [:truncated boolean?]
   [:full-output-path {:optional true} [:string {:min 1}]]
   [:timestamp timestamp-schema]
   [:exclude-from-context {:optional true} boolean?]])

(def custom-message-schema
  [:map
   [:role [:= :custom]]
   [:custom-type [:string {:min 1}]]
   [:content [:or string? [:vector {:min 1} content/input-content-schema]]]
   [:display boolean?]
   [:details {:optional true} any?]
   [:timestamp timestamp-schema]])

(def branch-summary-message-schema
  [:map
   [:role [:= :branch-summary]]
   [:summary [:string {:min 1}]]
   [:from-id [:string {:min 1}]]
   [:timestamp timestamp-schema]])

(def compaction-summary-message-schema
  [:map
   [:role [:= :compaction-summary]]
   [:summary [:string {:min 1}]]
   [:tokens-before [:int {:min 0}]]
   [:timestamp timestamp-schema]])

(def agent-message-schema
  [:or user-message-schema
   assistant-message-schema
   tool-result-message-schema
   bash-execution-message-schema
   custom-message-schema
   branch-summary-message-schema
   compaction-summary-message-schema])

(def llm-message-schema
  [:or user-message-schema assistant-message-schema tool-result-message-schema])
