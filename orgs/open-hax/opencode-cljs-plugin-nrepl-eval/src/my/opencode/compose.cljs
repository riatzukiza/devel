(ns my.opencode.compose)

(defn ->promise [x]
  (if (instance? js/Promise x)
    x
    (js/Promise.resolve x)))

(defn noop
  [& _]
  (js/Promise.resolve nil))

(defn chain2
  "Chain two handlers: run a then b (promise-aware)."
  [a b]
  (let [a (or a noop)
        b (or b noop)]
    (fn [& args]
      (-> (apply a args)
          ->promise
          (.then (fn [_] (apply b args)))))))

(defn merge-hooks
  "Merge hook maps so key collisions chain instead of overwrite."
  [a b]
  (let [a (or a {})
        b (or b {})]
    (reduce-kv
     (fn [acc k v]
       (if-let [existing (get acc k)]
         (assoc acc k (chain2 existing v))
         (assoc acc k v)))
     a
     b)))

(defn merge-tools
  "Tools are overwritten by later definitions (last wins)."
  [a b]
  (merge (or a {}) (or b {})))

(defn merge-extra
  "Extra keys are overwritten by later definitions (last wins)."
  [a b]
  (merge (or a {}) (or b {})))
