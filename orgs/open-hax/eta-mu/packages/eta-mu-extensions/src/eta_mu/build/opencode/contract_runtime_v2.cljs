(ns eta-mu.build.opencode.contract-runtime-v2
  (:require [eta-mu.extensions.contract-runtime-v2 :as ext]
            [eta-mu.opencode :as oc]
            ["@opencode-ai/plugin" :refer [tool]]))

(defn ^:export init [input options]
  ((oc/build-plugin ext/contract-runtime-v2 tool) input options))
