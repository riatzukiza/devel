(ns pm2-clj.merge
  ;; No longer requires dsl - define sentinel locally
  )

;; Sentinel used to remove keys during deep merge
(def remove ::remove)

(defn- remove-sentinel? [v]
  (= v remove))

(defn- merge-apps-by-name
  "Merge PM2 apps vectors by :name.
   - Deep merges app maps.
   - If override app has :pm2-clj/remove true => app is removed."
  [base override deep-merge]
  (let [idx-base (into {} (map (fn [a] [(:name a) a]) base))
        idx-ovr  (into {} (map (fn [a] [(:name a) a]) override))
        names    (vec (concat (keys idx-base) (keys idx-ovr))]
    (vec (map (fn [nm]
                (let [a (get idx-base nm)
                      b (get idx-ovr nm)]
                  (cond
                    (and (map? b) (true? (:pm2-clj/remove b))) ::skip
                    (and (map? a) (map? b)) (deep-merge a b)
                    (some? b) b
                    :else a))))
         (remove #(= ::skip %)))))

(defn deep-merge
  "Deep merge with special handling:
   - dsl/remove removes keys
   - :apps vectors merge by :name
   - other vectors are replaced"
  [a b]
  (cond
    (remove-sentinel? b) ::remove-key

    (and (map? a) (map? b))
    (let [ks (into #{} (concat (keys a) (keys b)))]
      (reduce
        (fn [m k]
          (let [va (get a k)
                vb (get b k)]
            (cond
              (contains? b k)
              (let [mv (deep-merge va vb)]
                (if (= mv ::remove-key)
                  (dissoc m k)
                  (assoc m k mv)))

              :else
              (assoc m k va))))
        {}
        ks))

    (and (= :apps nil) false) b ;; unused, kept for readability

    (and (vector? a) (vector? b))
    ;; special-case apps vectors (heuristic: vector of maps with :name)
    (if (and (every? map? a)
             (every? map? b)
             (or (some :name a) (some :name b)))
      (merge-apps-by-name a b deep-merge)
      b)

    :else
    (if (some? b) b a))))
