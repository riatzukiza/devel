(ns eta-mu.runtime.law.types)

(def unit-interval-schema
  [:and number? [:>= 0] [:<= 1]])

(def panel-name-schema
  [:enum :field :movement :truth :trajectory :breath :memory :cost])

(def cost-class-schema
  [:enum :cheap :medium :expensive])

(def reversibility-schema
  [:enum :easy :moderate :hard])

(def mu-candidate-kind-schema
  [:enum
   :comment
   :summary
   :label
   :issue
   :patch-plan
   :patch
   :reroute
   :defer
   :request-evidence
   :request-human-attention
   :noop])
