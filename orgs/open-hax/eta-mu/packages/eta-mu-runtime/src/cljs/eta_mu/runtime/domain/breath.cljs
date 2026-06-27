(ns eta-mu.runtime.domain.breath
  (:require [eta-mu.runtime.domain.planner :as planner]
            [eta-mu.runtime.law.core :as law]
            [eta-mu.runtime.law.planning :as planning-law]))

(defn recommend
  "Recommend whether the current breath episode should commit."
  ([context]
   (recommend context nil))
  ([context actions]
   (let [context (law/validate! planning-law/eta-mu-planning-context-schema context "planning context")
         actions (or actions (planner/rank-cheap-candidates context))
         has-meaningful-movement (some #(not= :noop (:kind %)) actions)
         recommendation (cond
                          (:pending-commit context)
                          {:should-commit true
                           :reason "Episode is already marked pending commit."}

                          (and (:quiet-window-detected context) has-meaningful-movement)
                          {:should-commit true
                           :reason "Quiet window detected after meaningful movement planning."}

                          :else
                          {:should-commit false
                           :reason "Continue sensing; breath boundary has not been justified yet."})]
     (law/validate! planning-law/breath-recommendation-schema recommendation "breath recommendation"))))
