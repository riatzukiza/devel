(ns pm2-clj.dsl
  (:require [clojure.string :as str]))

;; Sentinel used to remove keys during deep merge
(def remove ::remove)

(defn- app
  "Create/normalize an app entry.
   (app \"api\" {:script \"dist/api.js\" ...})
   (app {:name \"api\" :script ...})"
  ([name opts]
   (when-not (and (string? name) (not (str/blank? name)))
     (throw (ex-info "app name must be a non-empty string" {:name name})))
   (when-not (map? opts)
     (throw (ex-info "app opts must be a map" {:opts opts})))
   (assoc opts :name name))
  ([m]
   (when-not (map? m)
     (throw (ex-info "app expects a map" {:value m})))
   (when-not (string? (:name m))
     (throw (ex-info "app map must include :name string" {:app m})))
   m))

(defn remove-app
  "Marks an app for removal when merged by name."
  [name]
  {:name name :pm2-clj/remove true})

(defn apps
  "Returns a partial ecosystem map containing apps."
  [& xs]
  {:apps (vec (map (fn [x] (if (string? x) (throw (ex-info "apps expects app maps, not strings" {:value x})) x)) xs))})

(defn- deploy
  "Returns a partial ecosystem map containing deploy config."
  [m]
  (when-not (map? m)
    (throw (ex-info "deploy expects a map" {:value m})))
  {:deploy m})

(defn- profile
  "Defines a profile override."
  [k & parts]
  (when-not (keyword? k)
    (throw (ex-info "profile key must be a keyword" {:key k})))
  {:profiles {k (apply merge parts)}})

(defn- profiles
  "Convenience wrapper to group multiple (profile ...) blocks."
  [& ps]
  (apply merge ps))

(defn- compose
  "Compose multiple ecosystem fragments into one."
  [& parts]
  (reduce (fn [acc part]
            (cond
              (nil? part) acc
              (map? part) (merge acc part)
              :else (throw (ex-info "compose expects maps" {:value part}))))
          {}
          parts))

(defn- ecosystem
  "Alias for compose; useful for readability."
  [& parts]
  (apply compose parts))

;; include is injected by the wrapper at evaluation time.
(defn- include
  [& _]
  (throw (ex-info "include is only available when evaluating via pm2-clj wrapper" {})))