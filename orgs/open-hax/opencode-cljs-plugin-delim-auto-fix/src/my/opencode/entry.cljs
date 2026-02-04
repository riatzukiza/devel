(ns my.opencode.entry
  (:require [my.opencode.dsl :refer-macros [init tools]]
            [my.opencode.spec :as spec]
            [my.opencode.runtime :as runtime]
            [my.opencode.tool :as t]
            [my.opencode.fragments.permission-store :as perm-store]
            [my.opencode.fragments.trace :as trace]
            [my.opencode.gate :as gate]
            [my.opencode.delims :as delims]))

(def delim-auto-fix-tool
  (t/deftool
   {:description "Diagnose and auto-fix delimiter mistakes"
    :args {:code [:string {:min 1}]
           :diagnostic [:string {:optional true}]
           :maxFixes [:number {:default 5}]}
    :execute (fn [args ctx]
               (gate/require!
                ctx
                {:kind :delim
                 :tool "delim/auto-fix"
                 :detail "Auto-fix delimiter issues"})
               (let [code (.-code args)
                     max-fixes (.-maxFixes args)
                     diagnostic (.-diagnostic args)
                     result (delims/auto-fix code max-fixes)
                     summary (if diagnostic
                               (str (:summary result) "; diagnostic: " diagnostic)
                               (:summary result))]
                 (assoc result :summary summary)))}))

(def plugin-spec
  (spec/merge-specs
   (init
    (fn [ctx]
      (when-let [client (.-client ctx)]
        (-> client .-app
            (.log #js {:service "delim-auto-fix"
                       :level "info"
                       :message "Init"})))
      nil))

   (perm-store/fragment)

   ;; trace tool timing
   (trace/fragment)

   (tools {"delim/auto-fix" delim-auto-fix-tool})))

;; Named export (OpenCode loads plugin functions from module exports)
(def ^:export MyPlugin
  (runtime/build-plugin plugin-spec))
