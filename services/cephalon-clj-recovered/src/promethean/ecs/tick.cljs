(ns promethean.ecs.tick)

(defn tick [dt systems w]
  ;; dt in ms
  (let [w (assoc w :time/dt dt
                   :time/ts (.now js/Date))]
    (reduce (fn [w sys] (sys w)) w systems)))
