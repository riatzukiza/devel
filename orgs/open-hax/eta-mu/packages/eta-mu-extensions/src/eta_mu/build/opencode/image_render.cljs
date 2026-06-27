(ns eta-mu.build.opencode.image-render
  (:require [eta-mu.extensions.image-render :as ext]
            [eta-mu.opencode :as oc]
            ["@opencode-ai/plugin" :refer [tool]]))

(defn ^:export init [input options]
  ((oc/build-plugin ext/image-render tool) input options))
