(ns eta-mu.build.opencode.bootstrap
  (:require [eta-mu.extensions.bootstrap :as ext]
            [eta-mu.opencode :as oc]
            ["@opencode-ai/plugin" :refer [tool]]))

(defn ^:export init [input options]
  ((oc/build-plugin ext/bootstrap tool) input options))
