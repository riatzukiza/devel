(ns eta-mu.runtime.law.state
  (:require [eta-mu.runtime.law.candidate :as candidate]
            [eta-mu.runtime.law.types :as types]))

(def eta-belief-schema
  [:map
   [:urgency types/unit-interval-schema]
   [:ambiguity types/unit-interval-schema]
   [:social-friction types/unit-interval-schema]
   [:deploy-risk types/unit-interval-schema]
   [:review-debt types/unit-interval-schema]
   [:drift types/unit-interval-schema]
   [:crust types/unit-interval-schema]
   [:bloom-need types/unit-interval-schema]
   [:user-intent-confidence types/unit-interval-schema]])

(def breath-episode-schema
  [:map
   [:id [:string {:min 1}]]
   [:opened-at [:string {:min 1}]]
   [:last-activity-at [:string {:min 1}]]
   [:activity-scalar types/unit-interval-schema]
   [:pending-commit boolean?]])

(def eta-mu-state-schema
  [:map
   [:belief eta-belief-schema]
   [:panels [:vector types/panel-name-schema]]
   [:proposed-moves [:vector candidate/mu-candidate-schema]]
   [:current-episode breath-episode-schema]])
