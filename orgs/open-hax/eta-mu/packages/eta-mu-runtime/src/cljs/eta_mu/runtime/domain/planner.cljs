(ns eta-mu.runtime.domain.planner
  (:require [clojure.string :as str]
            [eta-mu.runtime.domain.candidate :as candidate]
            [eta-mu.runtime.law.core :as law]
            [eta-mu.runtime.law.planning :as planning-law]))

(defn- push-panel
  [panels panel]
  (if (some #{panel} panels)
    panels
    (conj panels panel)))

(defn select-panels
  "Select visible eta-mu panels from a normalized planning context."
  [context]
  (let [context (law/validate! planning-law/eta-mu-planning-context-schema context "planning context")
        belief (:belief context)]
    (cond-> [:field :movement]
      (or (>= (:review-debt belief) 0.4)
          (>= (:deploy-risk belief) 0.4)
          (>= (:drift belief) 0.45)
          (pos? (:unresolved-review-threads context))
          (seq (:failing-checks context)))
      (push-panel :truth)

      (or (>= (:urgency belief) 0.6)
          (>= (:drift belief) 0.55))
      (push-panel :trajectory)

      (or (>= (:ambiguity belief) 0.55)
          (>= (:drift belief) 0.6))
      (push-panel :memory)

      (or (:quiet-window-detected context)
          (:pending-commit context))
      (push-panel :breath))))

(defn- add-candidate
  [candidates context candidate]
  (conj candidates (candidate/create-candidate context (count candidates) candidate)))

(defn rank-cheap-candidates
  "Rank cheap eta-mu movement candidates for a normalized planning context."
  [context]
  (let [context (law/validate! planning-law/eta-mu-planning-context-schema context "planning context")
        belief (:belief context)
        candidates (cond-> []
                     (seq (:failing-checks context))
                     (add-candidate context
                                    {:kind :comment
                                     :target (:target context)
                                     :reason (str "Checks failing: " (str/join ", " (:failing-checks context)))
                                     :confidence (max 0.7 (:deploy-risk belief))
                                     :cost-class :cheap
                                     :reversibility :easy
                                     :needs-proof false})

                     (or (pos? (:unresolved-review-threads context))
                         (>= (:review-debt belief) 0.4))
                     (add-candidate context
                                    {:kind :summary
                                     :target (:target context)
                                     :reason "Review debt should be surfaced before movement continues."
                                     :confidence (max 0.72 (:review-debt belief))
                                     :cost-class :cheap
                                     :reversibility :easy
                                     :needs-proof false})

                     (>= (:ambiguity belief) 0.65)
                     (add-candidate context
                                    {:kind :request-evidence
                                     :target (:target context)
                                     :reason "Ambiguity is still too high to justify stronger movement."
                                     :confidence (max 0.78 (:ambiguity belief))
                                     :cost-class :cheap
                                     :reversibility :easy
                                     :needs-proof false})

                     (or (:has-pending-human-attention context)
                         (>= (:social-friction belief) 0.7))
                     (add-candidate context
                                    {:kind :request-human-attention
                                     :target (:target context)
                                     :reason "Social friction is high enough that explicit human attention is justified."
                                     :confidence (max 0.76 (:social-friction belief))
                                     :cost-class :cheap
                                     :reversibility :easy
                                     :needs-proof false})

                     (>= (:deploy-risk belief) 0.75)
                     (add-candidate context
                                    {:kind :defer
                                     :target (:target context)
                                     :reason "Deploy risk is too high for forward motion right now."
                                     :confidence (:deploy-risk belief)
                                     :cost-class :cheap
                                     :reversibility :easy
                                     :needs-proof false}))
        candidates (if (seq candidates)
                     candidates
                     [(candidate/create-candidate context 0
                                                  {:kind :noop
                                                   :target (:target context)
                                                   :reason "No cheap movement is justified yet; continue sensing the field."
                                                   :confidence 0.9
                                                   :cost-class :cheap
                                                   :reversibility :easy
                                                   :needs-proof false})])]
    (->> candidates
         (sort-by candidate/candidate-score >)
         vec)))
