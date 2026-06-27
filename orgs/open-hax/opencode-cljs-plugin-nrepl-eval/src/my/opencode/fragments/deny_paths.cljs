(ns my.opencode.fragments.deny-paths)

(defn ^:private contains-any? [s parts]
  (some (fn [p] (.includes s p)) parts))

(defn fragment
  "Deny reads when output.args.filePath contains any of the substrings."
  [substrings]
  {:hooks
   {"tool.execute.before"
    (fn [_ctx input output]
      (when (= "read" (.-tool input))
        (let [fp (aget (.-args output) "filePath")]
          (when (and fp (contains-any? fp substrings))
            (throw (js/Error. (str "Denied reading file: " fp)))))))}}})
