(ns my.opencode.tool
  (:require ["@opencode-ai/plugin" :refer [tool]]
            [my.opencode.schema :as schema]))

(defn deftool
  [{:keys [description args execute]}]
  (tool
   #js {:description description
        :args (schema/object (or args {}))
        :execute (fn [js-args ctx]
                   (execute js-args ctx))}))
