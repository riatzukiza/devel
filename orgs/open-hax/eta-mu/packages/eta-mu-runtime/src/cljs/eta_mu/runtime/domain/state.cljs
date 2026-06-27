(ns eta-mu.runtime.domain.state
  (:require [eta-mu.runtime.law.core :as law]
            [eta-mu.runtime.law.state :as state-law]))

(defn clamp-unit
  "Clamp a numeric value into the unit interval."
  [value]
  (-> value
      (max 0)
      (min 1)))

(def default-eta-belief
  {:urgency 0
   :ambiguity 0.25
   :social-friction 0
   :deploy-risk 0
   :review-debt 0
   :drift 0
   :crust 0
   :bloom-need 0.25
   :user-intent-confidence 0.5})

(defn create-belief
  "Create an eta-mu belief map from internal kebab-case overrides."
  ([]
   (create-belief {}))
  ([overrides]
   (let [belief (reduce-kv
                  (fn [acc key default-value]
                    (assoc acc key (clamp-unit (get overrides key default-value))))
                  {}
                  default-eta-belief)]
     (law/validate! state-law/eta-belief-schema belief "belief"))))

(defn create-breath-episode
  "Create a breath episode. The caller owns time selection."
  ([id now]
   (create-breath-episode id now false 0))
  ([id now pending-commit activity-scalar]
   (law/validate! state-law/breath-episode-schema
                  {:id id
                   :opened-at now
                   :last-activity-at now
                   :activity-scalar (clamp-unit activity-scalar)
                   :pending-commit (boolean pending-commit)}
                  "breath episode")))

(defn create-state
  "Create an eta-mu runtime state. The caller must supply :now for dynamic time."
  ([]
   (create-state {:now "1970-01-01T00:00:00.000Z"}))
  ([options]
   (let [now (:now options)
         state {:belief (create-belief (:belief options))
                :panels (vec (or (:panels options) [:field :movement]))
                :proposed-moves (vec (or (:proposed-moves options) []))
                :current-episode (create-breath-episode
                                   (or (:current-episode-id options) "episode:bootstrap")
                                   now
                                   (boolean (:pending-commit options))
                                   (or (:activity-scalar options) 0))}]
     (law/validate! state-law/eta-mu-state-schema state "state"))))
