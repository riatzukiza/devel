(ns promethean.test-runner
  (:require [clojure.test :as t]
            [promethean.contracts.event-envelope-test]
            [promethean.contracts.memory-record-test]
            [promethean.openplanner.client-test]
            [promethean.runtime.eventbus-test]
            [promethean.runtime.eidolon-test]))

(defn -main [& _]
  (let [{:keys [fail error]}
        (t/run-tests 'promethean.contracts.event-envelope-test
                     'promethean.contracts.memory-record-test
                     'promethean.openplanner.client-test
                     'promethean.runtime.eventbus-test
                     'promethean.runtime.eidolon-test)]
    (when (pos? (+ fail error))
      (System/exit 1))))
