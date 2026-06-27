(ns eta-mu.build.opencode-global-instructions
  (:require [eta-mu.extensions.opencode-global-instructions :as ext]))

(defn- tool-parameters->schema [params]
  (when params
    (let [required (->> params
                        (remove (fn [[_ spec]] (:optional spec)))
                        (map (comp name key))
                        vec)
          properties (into {}
                           (map (fn [[k spec]]
                                  [(name k) (dissoc spec :optional)]))
                           params)
          schema (cond-> {:type "object"
                          :properties properties
                          :additionalProperties false}
                   (seq required) (assoc :required required))]
      (clj->js schema))))

(defn ^:export init [pi]
  (let [spec ext/opencode-global-instructions]
    (when-let [init-fn (:init spec)] (init-fn pi))
    (doseq [cmd (:commands spec)]
      (.call (aget pi "registerCommand") pi (:name cmd)
             #js {:description (:description cmd) :handler (:handler cmd)}))
    (doseq [tool (:tools spec)]
      (.call (aget pi "registerTool") pi
             #js {:name        (:name tool)
                  :label       (:label tool)
                  :description (:description tool)
                  :parameters  (tool-parameters->schema (:parameters tool))
                  :execute     (:execute tool)}))
    (doseq [evt (:events spec)]
      (.call (aget pi "on") pi (:event evt) (:handler evt)))
    nil))
