(ns eta-mu.runtime.law.tool)

(def tool-descriptor-schema
  [:map
   [:name [:string {:min 1}]]
   [:description [:string {:min 1}]]
   [:parameters map?]
   [:enabled boolean?]
   [:metadata {:optional true} any?]])
