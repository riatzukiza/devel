(ns eta-mu.build.opencode.task-timing
  (:require [eta-mu.extensions.task-timing :as ext]
            [eta-mu.opencode :as oc]
            ["@opencode-ai/plugin" :refer [tool]]))

(defn ^:export init [input options]
  ((oc/build-plugin ext/task-timing tool) input options))
