(ns promethean.ecs.tick)

(defn tick [dt systems world]
  (let [world' (-> world
                   (assoc :time-ms (+ (:time-ms world) dt))
                   (assoc :time/dt dt)
                   (assoc :time/ts (.now js/Date)))]
    (if (empty? systems)
      world'
              (reduce (fn [w system]
                        (try
                          (system w)
                          (catch js/Error _ w)))
                      world'
                      systems))))
