(ns my.opencode.spec
  (:require [my.opencode.compose :as comp]))

(defn empty-spec []
  {:init  (fn [_ctx] nil)
   :hooks {}
   :tools {}
   :extra {}})

(defn normalize-spec [m]
  (let [m (or m {})]
    {:init  (or (:init m) (fn [_ctx] nil))
     :hooks (or (:hooks m) {})
     :tools (or (:tools m) {})
     :extra (or (:extra m) {})}))

(defn merge-spec [a b]
  (let [a (normalize-spec a)
        b (normalize-spec b)]
    {:init  (comp/chain2 (:init a) (:init b))
     :hooks (comp/merge-hooks (:hooks a) (:hooks b))
     :tools (comp/merge-tools (:tools a) (:tools b))
     :extra (comp/merge-extra (:extra a) (:extra b))}))

(defn merge-specs
  [& specs]
  (reduce merge-spec (empty-spec) specs))
