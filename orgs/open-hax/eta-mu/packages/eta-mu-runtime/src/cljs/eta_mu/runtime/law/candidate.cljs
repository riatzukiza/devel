(ns eta-mu.runtime.law.candidate
  (:require [eta-mu.runtime.law.types :as types]))

(def mu-candidate-schema
  [:map
   [:id [:string {:min 1}]]
   [:kind types/mu-candidate-kind-schema]
   [:target [:string {:min 1}]]
   [:reason [:string {:min 1}]]
   [:confidence types/unit-interval-schema]
   [:cost-class types/cost-class-schema]
   [:reversibility types/reversibility-schema]
   [:needs-proof boolean?]])
