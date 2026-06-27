(ns eta-mu.runtime.domain.model
  (:require [eta-mu.runtime.law.core :as law]
            [eta-mu.runtime.law.model :as model-law]))

(defn supports-inputs?
  [model required-inputs]
  (let [supported (set (:input model))]
    (every? supported required-inputs)))

(defn- estimated-output-cost
  [model]
  (get-in model [:cost :output] ##Inf))

(defn- estimated-input-cost
  [model]
  (get-in model [:cost :input] ##Inf))

(defn select-compatible-models
  [models requirements]
  (let [requirements (law/validate! model-law/model-requirements-schema
                                    (merge {:inputs [:text]
                                            :reasoning-required false
                                            :min-context-window 1}
                                           requirements)
                                    "model requirements")
        required-inputs (set (:inputs requirements))]
    (->> models
         (map #(law/validate! model-law/model-candidate-schema % "model candidate"))
         (filter #(supports-inputs? % required-inputs))
         (filter #(or (not (:reasoning-required requirements)) (:reasoning %)))
         (filter #(>= (:context-window %) (:min-context-window requirements)))
         (sort-by (juxt estimated-output-cost estimated-input-cost :id))
         vec)))
