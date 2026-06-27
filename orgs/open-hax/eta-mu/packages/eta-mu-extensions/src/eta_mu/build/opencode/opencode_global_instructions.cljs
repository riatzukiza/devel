(ns eta-mu.build.opencode.opencode-global-instructions
  (:require [eta-mu.extensions.opencode-global-instructions :as ext]
            [eta-mu.opencode :as oc]
            ["@opencode-ai/plugin" :refer [tool]]))

(defn ^:export init [input options]
  ((oc/build-plugin ext/opencode-global-instructions tool) input options))
