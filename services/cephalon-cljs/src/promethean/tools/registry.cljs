(ns promethean.tools.registry)

(defn make-registry
  []
  {:tools/by-name {}})

(defn register-tool
  [registry tool]
  (assoc-in registry [:tools/by-name (:tool/name tool)] tool))

(defn register-tools
  [registry tools]
  (reduce register-tool registry tools))

(defn get-tool
  [registry tool-name]
  (get-in registry [:tools/by-name tool-name]))

(defn list-tools
  [registry]
  (vals (:tools/by-name registry)))
