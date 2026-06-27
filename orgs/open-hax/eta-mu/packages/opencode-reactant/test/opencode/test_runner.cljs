(ns opencode.test-runner
  (:require [cljs.test :as t]
            [opencode.ui.config-test]
            [opencode.ui.core-test]
            [opencode.ui.github-test]
            [opencode.ui.detail-test]))

(defn -main [& _]
  (let [{:keys [fail error]} (t/run-tests 'opencode.ui.config-test
                                          'opencode.ui.core-test
                                          'opencode.ui.github-test
                                          'opencode.ui.detail-test)]
    (when (pos? (+ fail error))
      (.exit js/process 1))))
