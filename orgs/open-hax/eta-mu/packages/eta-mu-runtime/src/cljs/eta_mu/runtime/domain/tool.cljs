(ns eta-mu.runtime.domain.tool
  (:require [eta-mu.runtime.law.core :as law]
            [eta-mu.runtime.law.tool :as tool-law]))

(defn create-tool-descriptor
  [descriptor]
  (law/validate! tool-law/tool-descriptor-schema
                 (merge {:enabled true
                         :parameters {}}
                        descriptor)
                 "tool descriptor"))

(defn compose-tool-descriptors
  [descriptor-groups]
  (let [descriptors (map create-tool-descriptor (mapcat identity descriptor-groups))]
    (->> descriptors
         (reduce (fn [acc descriptor]
                   (if (contains? (:seen acc) (:name descriptor))
                     acc
                     {:seen (conj (:seen acc) (:name descriptor))
                      :items (conj (:items acc) descriptor)}))
                 {:seen #{} :items []})
         :items)))
