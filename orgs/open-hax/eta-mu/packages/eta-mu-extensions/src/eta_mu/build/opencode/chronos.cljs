(ns eta-mu.build.opencode.chronos
  (:require [eta-mu.extensions.chronos :as ext]
            [eta-mu.opencode :as oc]
            ["@opencode-ai/plugin" :refer [tool]]))

(defn ^:export init [input options]
  ((oc/build-plugin ext/chronos tool) input options))
