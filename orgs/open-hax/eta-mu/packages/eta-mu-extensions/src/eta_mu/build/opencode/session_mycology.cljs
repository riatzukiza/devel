(ns eta-mu.build.opencode.session-mycology
  (:require [eta-mu.extensions.session-mycology :as ext]
            [eta-mu.opencode :as oc]
            ["@opencode-ai/plugin" :refer [tool]]))

(defn ^:export init [input options]
  ((oc/build-plugin ext/session-mycology tool) input options))
