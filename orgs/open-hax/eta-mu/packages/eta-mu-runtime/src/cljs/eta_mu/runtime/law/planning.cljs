(ns eta-mu.runtime.law.planning
  (:require [eta-mu.runtime.law.candidate :as candidate]
            [eta-mu.runtime.law.state :as state]
            [eta-mu.runtime.law.types :as types]))

(def action-batch-version "eta-mu-action-batch.v1")

(def eta-mu-planning-context-schema
  [:map
   [:repo [:string {:min 1}]]
   [:trigger [:string {:min 1}]]
   [:target [:string {:min 1}]]
   [:summary [:string {:min 1}]]
   [:belief state/eta-belief-schema]
   [:unresolved-review-threads [:int {:min 0}]]
   [:failing-checks [:vector [:string {:min 1}]]]
   [:has-pending-human-attention boolean?]
   [:quiet-window-detected boolean?]
   [:pending-commit boolean?]
   [:now {:optional true} [:string {:min 1}]]])

(def breath-recommendation-schema
  [:map
   [:should-commit boolean?]
   [:reason [:string {:min 1}]]])

(def eta-mu-action-batch-schema
  [:map
   [:kind [:= action-batch-version]]
   [:repo [:string {:min 1}]]
   [:trigger [:string {:min 1}]]
   [:summary [:string {:min 1}]]
   [:panels [:vector types/panel-name-schema]]
   [:belief state/eta-belief-schema]
   [:actions [:vector candidate/mu-candidate-schema]]
   [:breath breath-recommendation-schema]])
