(ns eta-mu.build.opencode.receipt-river
  (:require [eta-mu.extensions.receipt-river :as ext]
            [eta-mu.opencode :as oc]
            ["@opencode-ai/plugin" :refer [tool]]))

(defn ^:export init [input options]
  ((oc/build-plugin ext/receipt-river tool) input options))
