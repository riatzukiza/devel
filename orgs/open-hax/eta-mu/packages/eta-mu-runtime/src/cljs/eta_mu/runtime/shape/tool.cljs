(ns eta-mu.runtime.shape.tool)

(defn descriptor-from-external
  [descriptor]
  (cond-> {:name (:name descriptor)
           :description (:description descriptor)
           :parameters (or (:parameters descriptor) {})
           :enabled (if (contains? descriptor :enabled)
                      (:enabled descriptor)
                      true)}
    (contains? descriptor :metadata) (assoc :metadata (:metadata descriptor))))

(defn descriptor->external
  [descriptor]
  (cond-> {:name (:name descriptor)
           :description (:description descriptor)
           :parameters (:parameters descriptor)
           :enabled (:enabled descriptor)}
    (contains? descriptor :metadata) (assoc :metadata (:metadata descriptor))))
