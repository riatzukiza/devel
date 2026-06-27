(ns eta-mu.build.opencode.custom-providers
  (:require [eta-mu.extensions.custom-providers :as ext]
            [eta-mu.opencode :as oc]
            ["@opencode-ai/plugin" :refer [tool]]))

(defn ^:export init [input options]
  ((oc/build-plugin ext/custom-providers tool) input options))
