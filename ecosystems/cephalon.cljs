(ns cephalon
  (:require [clobber.macro]))

;; Cephalon - "always-running mind" with vector memory, persistent memory, and event subscriptions
;; TypeScript implementation: services/cephalon-ts
;; ClojureScript implementation: services/cephalon-cljs


(clobber.macro/defapp "duck-cephalon-ui"
  {:script "npm"
   :cwd "/home/err/devel/services/cephalon-ts/src/ui"
   :args ["run" "dev" "--" "--host" "0.0.0.0" "--port" "5173"]
   :env {:NODE_ENV "development"}
   :autorestart true
   :max-restarts 3
   :min-uptime "5s"
   :log-date-format "YYYY-MM-DD HH:mm:ss Z"
   :error-file "./logs/cephalon-ui-error.log"
   :out-file "./logs/cephalon-ui-out.log"
   :merge-logs true
   :kill-timeout 5000})

 (clobber.macro/defapp "duck-cephalon-cljs"
  {:script "node"
   :cwd "/home/err/devel/services/cephalon-cljs"
   :args ["dist/cephalon.js"]
   :env {:NODE_ENV "production"
         :DUCK_DISCORD_TOKEN (clobber.macro/env-var :DUCK_DISCORD_TOKEN "")}
   :autorestart true
   :max-restarts 5
   :min-uptime "10s"
   :log-date-format "YYYY-MM-DD HH:mm:ss Z"
   :error-file "./logs/cephalon-cljs-error.log"
   :out-file "./logs/cephalon-cljs-out.log"
   :merge-logs true
   :kill-timeout 5000})
