(ns promethean.test-runner
  (:require [cljs.test :refer [run-tests]]
            [promethean.main-test]
            [promethean.init-world-test]
            [promethean.rpc.envelope-test]))

(defn -main
  []
  (run-tests 'promethean.main-test
             'promethean.init-world-test
             'promethean.rpc.envelope-test))

(set! *main-cli-fn* -main)
