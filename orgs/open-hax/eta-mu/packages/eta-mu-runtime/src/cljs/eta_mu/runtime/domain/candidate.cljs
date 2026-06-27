(ns eta-mu.runtime.domain.candidate
  (:require [eta-mu.runtime.law.candidate :as candidate-law]
            [eta-mu.runtime.law.core :as law]))

(defn candidate-priority
  "Return the baseline priority for a candidate kind."
  [kind]
  (case kind
    :defer 1.0
    :request-human-attention 0.95
    :request-evidence 0.92
    :comment 0.82
    :summary 0.8
    :noop 0.1
    0.5))

(defn candidate-score
  "Return the sort score used by cheap-candidate ranking."
  [candidate]
  (+ (:confidence candidate) (candidate-priority (:kind candidate))))

(defn create-candidate
  "Create a candidate with the current eta-mu id format."
  [context index candidate]
  (let [kind-name (some-> (:kind candidate) name)]
    (law/validate! candidate-law/mu-candidate-schema
                   (assoc candidate
                          :id (str (:repo context)
                                   ":"
                                   (:trigger context)
                                   ":"
                                   kind-name
                                   ":"
                                   (inc index)))
                   "mu candidate")))
