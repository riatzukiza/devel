(ns eta-mu.runtime.domain.surface
  (:require [eta-mu.runtime.law.core :as law]
            [eta-mu.runtime.law.surface :as surface-law]))

(defn create-command-result
  "Create a pure command result for a user-facing eta-mu surface path."
  [input]
  (let [input (law/validate! surface-law/surface-command-input-schema input "surface command input")
        result {:command (:command input)
                :stdout (:value input)
                :exit-code 0}]
    (law/validate! surface-law/surface-command-result-schema result "surface command result")))
