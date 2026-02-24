(ns my.opencode.fragments.trace)

(defn now-ms [] (.now js/Date))

(defn fragment []
  (let [starts (atom {})]
    {:hooks
     {"tool.execute.before"
      (fn [ctx input _output]
        (let [id (or (.-id input) (str (random-uuid)))]
          (swap! starts assoc id (now-ms))
          (when-let [client (.-client ctx)]
            (.log (.-app client)
                  #js {:service "cljs-plugin"
                       :level "debug"
                       :message "tool.start"
                       :extra #js {:tool (.-tool input)
                                   :id id}}))))

      "tool.execute.after"
      (fn [ctx input _output]
        (let [id (.-id input)
              t0 (get @starts id)
              dt (when t0 (- (now-ms) t0))]
          (swap! starts dissoc id)
          (when-let [client (.-client ctx)]
            (.log (.-app client)
                  #js {:service "cljs-plugin"
                       :level "debug"
                       :message "tool.done"
                       :extra #js {:tool (.-tool input)
                                   :id id
                                   :ms dt}}))))}}))
