(ns my.opencode.entry
  (:require [my.opencode.dsl :refer-macros [defplugin init hook tools]]
            [my.opencode.tool :as t]
            [my.opencode.fragments.permission-store :as perm-store]
            [my.opencode.fragments.shell-guard :as shell-guard]
            [my.opencode.fragments.deny-paths :as deny-paths]
            [my.opencode.fragments.trace :as trace]
            [my.opencode.fragments.lsp-delim-guard :as lsp-guard]))

(def hello-tool
  (t/deftool
   {:description "Say hello"
    :args {:name [:string {:min 1 :max 64}]}
    :execute (fn [args _ctx]
               (str "Hello " (.-name args) "!"))}))

(defplugin plugin*
  (init
   (fn [ctx]
     (when-let [client (.-client ctx)]
       (-> client .-app
           (.log #js {:service "cljs-plugin"
                      :level "info"
                      :message "Init"})))
     nil))

  (perm-store/fragment)

  ;; deny sensitive reads
  (deny-paths/fragment ["/.env" ".env" ".pem" "id_rsa" "secrets"])

  ;; gate dangerous shell commands behind permission
  (shell-guard/fragment)

  ;; trace tool timing
  (trace/fragment)

  ;; LSP diagnostics delimiter guard (preferred signal)
  (lsp-guard/fragment {:max 12})

  ;; global event stream (hook key is `event`)
  (hook "event"
        (fn [_ctx payload]
          (when (= "session.created" (.. payload -event -type))
            (js/console.log "[plugin] session created"))))

  (tools {"hello" hello-tool}))

;; Named export (OpenCode loads plugin functions from module exports)
(def ^:export MyPlugin plugin*)
