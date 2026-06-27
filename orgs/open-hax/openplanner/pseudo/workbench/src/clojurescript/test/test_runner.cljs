(ns test-runner
  (:require [test-main :as test-main]))

(defn -main []
  (println "Running Opencode Unified ClojureScript Tests...")
  ;; Mock window for tests
  (set! js/window #js {:__WORKBENCH_BACKENDS__ #js {:opencodeUrl "http://localhost:8788/api/opencode"
                                                    :opencodeApiKey "test-key"}})
  (test-main/-main))
