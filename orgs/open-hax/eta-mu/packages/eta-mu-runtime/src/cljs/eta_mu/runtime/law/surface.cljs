(ns eta-mu.runtime.law.surface)

(def surface-command-schema
  [:enum :version])

(def surface-command-input-schema
  [:map
   [:command surface-command-schema]
   [:value [:string {:min 1}]]])

(def surface-command-result-schema
  [:map
   [:command surface-command-schema]
   [:stdout string?]
   [:exit-code [:int {:min 0 :max 255}]]])
