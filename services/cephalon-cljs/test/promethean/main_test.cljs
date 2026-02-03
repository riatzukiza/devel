;; ============================================================================
;; Tests for promethean.main core loop
;; ============================================================================

(ns promethean.main-test
  (:require [cljs.test :refer-macros [deftest is testing]]
            [promethean.ecs.world :as world]
            [promethean.main :as main]
            [promethean.ecs.tick :as tick]))

(deftest run-loop!-processes-events-and-effects
  (testing "run-loop! moves events-out to events-in, clears queues, and calls tick"
    (let [original-set-interval js/setInterval
          captured-callback (atom nil)
          captured-delay (atom nil)
          captured-args (atom nil)
          world-atom (atom (-> (world/empty-world)
                               (assoc :events-in [:old-event])
                               (assoc :events-out [{:event/id "evt-1"}])
                               (assoc :effects [:old-effect])))
          now-times (atom [100 250])]
      (try
        (set! js/setInterval
              (fn [callback delay]
                (reset! captured-callback callback)
                (reset! captured-delay delay)
                :interval-id))
        (with-redefs [main/now-ms (fn []
                                    (let [t (first @now-times)]
                                      (swap! now-times rest)
                                      t))
                      tick/tick (fn [dt systems w]
                                  (reset! captured-args {:dt dt :systems systems :world w})
                                  (assoc w :tick-called true))]
          (main/run-loop! world-atom [:sys-a :sys-b] {:tick-ms 123})
          (@captured-callback))
        (is (= 123 @captured-delay) "Uses the provided tick interval")
        (is (= 150 (:dt @captured-args)) "Computes dt from now-ms values")
        (is (= [:sys-a :sys-b] (:systems @captured-args)) "Passes systems to tick")
        (is (= [{:event/id "evt-1"}] (:events-in (:world @captured-args)))
            "Moves events-out into events-in")
        (is (= [] (:events-out (:world @captured-args)))
            "Clears events-out before tick")
        (is (= [] (:effects (:world @captured-args)))
            "Clears effects before tick")
        (is (true? (:tick-called @world-atom))
            "Uses tick return value to update the world")
        (finally
          (set! js/setInterval original-set-interval))))))
