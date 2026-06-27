(ns eta-mu.runtime.extern.process
  (:require [eta-mu.runtime.extern.js :as extern-js]
            [eta-mu.runtime.law.boundary :as boundary-law]
            [eta-mu.runtime.law.core :as law]))

(defn- process-handle
  []
  (.-process js/globalThis))

(defn argv
  []
  (if-let [process (process-handle)]
    (extern-js/array->clj-vector (.-argv process))
    []))

(defn cwd
  []
  (if-let [process (process-handle)]
    (if-let [cwd-fn (.-cwd process)]
      (cwd-fn)
      ".")
    "."))

(defn env
  []
  (if-let [process (process-handle)]
    (->> (js/Object.entries (or (.-env process) #js {}))
         array-seq
         (map (fn [entry] [(aget entry 0) (aget entry 1)]))
         (into {}))
    {}))

(defn snapshot
  []
  (law/validate! boundary-law/process-snapshot-schema
                 {:argv (argv)
                  :cwd (cwd)
                  :env (env)}
                 "process snapshot"))
