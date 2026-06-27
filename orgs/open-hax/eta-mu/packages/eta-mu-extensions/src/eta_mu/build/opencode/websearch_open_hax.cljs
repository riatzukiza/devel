(ns eta-mu.build.opencode.websearch-open-hax
  (:require [eta-mu.extensions.websearch-open-hax :as ext]
            [eta-mu.opencode :as oc]
            ["@opencode-ai/plugin" :refer [tool]]))

(defn ^:export init [input options]
  ((oc/build-plugin ext/websearch-open-hax tool) input options))
