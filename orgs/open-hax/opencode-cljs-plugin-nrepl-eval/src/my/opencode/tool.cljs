(ns my.opencode.tool
  (:require ["@opencode-ai/plugin" :as plugin]
            [my.opencode.schema :as schema]))

(def ^:private plugin-tool
  (or (some-> plugin (aget "tool"))
      (some-> plugin (aget "default") (aget "tool"))
      (fn [definition] definition)))

(defn deftool
  [{:keys [description args execute]}]
  (plugin-tool
   #js {:description description
        :args (schema/object (or args {}))
        :execute (fn [js-args ctx]
                   (execute js-args ctx))}))
