(ns my.opencode.fragments.shell-guard
  (:require [my.opencode.gate :as gate]))

(defn ^:private danger-regexes []
  [(js/RegExp. "rm\\s+-rf" "i")
   (js/RegExp. "dd\\s+if=" "i")
   (js/RegExp. "mkfs\\." "i")
   ;; classic fork bomb pattern
   (js/RegExp. ":\\(\\)\\s*\\{\\s*:\\|:\\s*&\\s*\\}\\s*;:" "i")])

(defn ^:private dangerous? [cmd]
  (boolean (some #(.test % cmd) (danger-regexes))))

(defn fragment []
  {:hooks
   {"tool.execute.before"
    (fn [ctx input output]
      (when (= "shell" (.-tool input))
        (let [cmd (aget (.-args output) "command")]
          (when (and cmd (dangerous? cmd))
            (gate/require! ctx
                           {:kind "danger-shell"
                            :tool "shell"
                            :detail cmd
                            :message (str "Run dangerous shell command?\n" cmd)}))))))}})
