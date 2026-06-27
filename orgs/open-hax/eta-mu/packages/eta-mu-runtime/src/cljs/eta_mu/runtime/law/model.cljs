(ns eta-mu.runtime.law.model
  (:require [eta-mu.runtime.law.content-part :as content]))

(def thinking-level-schema
  [:enum :minimal :low :medium :high :xhigh])

(def provider-schema [:string {:min 1}])
(def api-schema [:string {:min 1}])

(def model-cost-schema
  [:map
   [:input [:and number? [:>= 0]]]
   [:output [:and number? [:>= 0]]]
   [:cache-read [:and number? [:>= 0]]]
   [:cache-write [:and number? [:>= 0]]]])

(def model-candidate-schema
  [:map
   [:id [:string {:min 1}]]
   [:name [:string {:min 1}]]
   [:api api-schema]
   [:provider provider-schema]
   [:base-url [:string {:min 1}]]
   [:reasoning boolean?]
   [:input [:vector content/input-modality-schema]]
   [:cost model-cost-schema]
   [:context-window [:int {:min 1}]]
   [:max-tokens [:int {:min 1}]]
   [:headers {:optional true} map?]
   [:compat {:optional true} any?]])

(def model-requirements-schema
  [:map
   [:inputs {:optional true} [:vector content/input-modality-schema]]
   [:reasoning-required {:optional true} boolean?]
   [:min-context-window {:optional true} [:int {:min 1}]]])
