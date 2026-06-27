(ns eta-mu.build.opencode.lisp-decomp-nudge
  (:require [eta-mu.extensions.lisp-decomp-nudge :as ext]
            [eta-mu.opencode :as oc]
            ["@opencode-ai/plugin" :refer [tool]]))

(defn ^:export init [input options]
  ((oc/build-plugin ext/lisp-decomp-nudge tool) input options))
