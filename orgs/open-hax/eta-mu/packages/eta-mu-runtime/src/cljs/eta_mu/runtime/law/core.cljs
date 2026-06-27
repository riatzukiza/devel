(ns eta-mu.runtime.law.core
  (:require [malli.core :as m]
            [malli.error :as me]))

(defn valid?
  "Return true when value satisfies schema."
  [schema value]
  (m/validate schema value))

(defn explain
  "Return a human-oriented explanation map for value against schema."
  [schema value]
  (some-> (m/explain schema value)
          (me/humanize)))

(defn validate!
  "Return value when schema-valid, otherwise throw an ex-info with schema errors."
  [schema value label]
  (if (valid? schema value)
    value
    (throw (ex-info (str "Invalid eta-mu runtime " label)
                    {:label label
                     :errors (explain schema value)
                     :value value}))))
