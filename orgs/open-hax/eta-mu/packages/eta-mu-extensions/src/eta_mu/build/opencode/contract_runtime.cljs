(ns eta-mu.build.opencode.contract-runtime
  (:require [eta-mu.extensions.contract-runtime :as ext]
            [eta-mu.opencode :as oc]
            ["@opencode-ai/plugin" :refer [tool]]))

(defn ^:export init [input options]
  ((oc/build-plugin ext/contract-runtime tool) input options))
