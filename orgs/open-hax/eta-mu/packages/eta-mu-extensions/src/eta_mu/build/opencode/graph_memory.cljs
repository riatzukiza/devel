(ns eta-mu.build.opencode.graph-memory
  (:require [eta-mu.extensions.graph-memory :as ext]
            [eta-mu.opencode :as oc]
            ["@opencode-ai/plugin" :refer [tool]]))

(defn ^:export init [input options]
  ((oc/build-plugin ext/graph-memory tool) input options))
