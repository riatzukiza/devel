(ns promethean.tools.def-tool)

(defmacro ^{:clj-kondo/lint-as 'clojure.core/def} def-tool
  [id {:keys [description inputSchema] :as meta} impl-fn]
  `(def ~id
     (merge
       {:tool/name ~(name id)
        :tool/description ~description
        :tool/inputSchema ~inputSchema
        :tool/impl ~impl-fn}
       (dissoc ~meta :description :inputSchema))))
