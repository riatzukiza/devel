(ns eta-mu.build.opencode.apply-patch
  (:require [eta-mu.extensions.apply-patch :as ext]
            [eta-mu.opencode :as oc]
            ["@opencode-ai/plugin" :refer [tool]]))

(defn ^:export init [input options]
  ((oc/build-plugin ext/apply-patch tool) input options))
