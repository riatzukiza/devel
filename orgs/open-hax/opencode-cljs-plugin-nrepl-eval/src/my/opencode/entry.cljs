(ns my.opencode.entry
  (:require-macros [my.opencode.dsl.macros :refer [init tools]])
  (:require [my.opencode.spec :as spec]
            [my.opencode.runtime :as runtime]
            [my.opencode.tool :as t]
            [my.opencode.fragments.permission-store :as perm-store]
            [my.opencode.fragments.trace :as trace]
            [my.opencode.gate :as gate]
            [my.opencode.nrepl :as nrepl]))

(def nrepl-eval-tool
  (t/deftool
   {:description "Evaluate Clojure code via nREPL"
    :args {:code [:string {:min 1}]
           :host [:string {:default "127.0.0.1"}]
           :port [:number {:optional true}]
           :session [:string {:optional true}]
           :ns [:string {:optional true}]
           :timeoutMs [:number {:default 8000}]}
    :execute (fn [args ctx]
               (gate/require!
                ctx
                {:kind :nrepl
                 :tool "nrepl/eval"
                 :detail "Evaluate Clojure code via nREPL"})
               (nrepl/eval! args ctx))}))

(def plugin-spec
  (spec/merge-specs
   (init
    (fn [ctx]
      (when-let [client (.-client ctx)]
        (-> client .-app
            (.log #js {:service "nrepl-eval"
                       :level "info"
                       :message "Init"})))
      nil))

   (perm-store/fragment)

   ;; trace tool timing
   (trace/fragment)

   (tools {"nrepl/eval" nrepl-eval-tool})))

;; Named export (OpenCode loads plugin functions from module exports)
(def ^:export MyPlugin
  (runtime/build-plugin plugin-spec))
