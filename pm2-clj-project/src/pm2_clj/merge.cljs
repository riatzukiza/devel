(ns pm2-clj.merge)

(def remove ::remove)

(defn- remove-sentinel? [v]
  (= v remove))

(defn- merge-apps-by-name
  [base override deep-merge]
  (let [idx-base (into {} (map (fn [a] [(:name a) a]) base))
        idx-ovr  (into {} (map (fn [a] [(:name a) a]) override))
        names    (vec (concat (keys idx-base) (keys idx-ovr)))]
    (vec (remove (fn [x] (= x ::skip))
                 (map (fn [nm]
                        (let [a (get idx-base nm)
                              b (get idx-ovr nm)]
                          (cond
                            (and (map? b) (true? (:pm2-clj/remove b))) ::skip
                            (and (map? a) (map? b)) (deep-merge a b)
                            (some? b) b
                            :else a)))
                      names)))))

(defn deep-merge
  [a b]
  (cond
    (remove-sentinel? b) ::remove-key

    (and (map? a) (map? b))
    (let [ks (into #{} (concat (keys a) (keys b)))]
      (reduce (fn [m k]
                (let [va (get a k)
                      vb (get b k)]
                  (cond
                    (contains? b k)
                    (let [mv (deep-merge va vb)]
                      (if (= mv ::remove-key)
                        (dissoc m k)
                        (assoc m k mv)))
                    :else (assoc m k va))))
              {} ks))

    (and (vector? a) (vector? b))
    (if (and (every? map? a)
             (every? map? b)
             (or (some :name a) (some :name b)))
      (merge-apps-by-name a b deep-merge)
      b)

    :else (if (some? b) b a)))
