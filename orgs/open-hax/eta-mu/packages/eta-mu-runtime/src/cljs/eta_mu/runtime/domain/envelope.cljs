(ns eta-mu.runtime.domain.envelope
  (:require [eta-mu.runtime.domain.breath :as breath]
            [eta-mu.runtime.domain.planner :as planner]
            [eta-mu.runtime.law.core :as law]
            [eta-mu.runtime.law.planning :as planning-law]))

(defn create-action-batch
  "Create an auditable eta-mu action batch from a normalized planning context."
  [context]
  (let [context (law/validate! planning-law/eta-mu-planning-context-schema context "planning context")
        actions (planner/rank-cheap-candidates context)
        panels (planner/select-panels context)
        recommendation (breath/recommend context actions)
        batch {:kind planning-law/action-batch-version
               :repo (:repo context)
               :trigger (:trigger context)
               :summary (:summary context)
               :panels panels
               :belief (:belief context)
               :actions actions
               :breath recommendation}]
    (law/validate! planning-law/eta-mu-action-batch-schema batch "action batch")))
