;; Ecosystem: openhax.cljs
;; - Active OpenHax services for PM2 via clobber DSL

(ns openhax
  (:require [clobber.macro]))

(clobber.macro/defapp "open-hax-workbench"
  {:script "bash"
   :args ["-lc" "pnpm build:clojurescript && cp static/index.html public/index.html && python3 -m http.server 8080 -d public"]
   :cwd "orgs/open-hax/workbench"
   :interpreter "/usr/bin/env"
   :exec_mode "fork"
   :instances 1
   :env {:NODE_ENV "development"}
   :max_restarts 5
   :restart_delay 2000
   :autorestart true
   :watch false
   :error_file "./logs/open-hax-workbench-error.log"
   :out_file "./logs/open-hax-workbench-out.log"
   :log_file "./logs/open-hax-workbench.log"
   :time true
   :kill_timeout 5000})
(clobber.macro/defapp "open-hax-workbench-dev"
  {:script "bash"
   :args ["-lc" "pnpm dev"]
   :cwd "orgs/open-hax/workbench"
   :interpreter "/usr/bin/env"
   :exec_mode "fork"
   :instances 1
   :env {:NODE_ENV "development"}
   :max_restarts 5
   :restart_delay 2000
   :autorestart true
   :watch false
   :error_file "./logs/open-hax-workbench-error.log"
   :out_file "./logs/open-hax-workbench-out.log"
   :log_file "./logs/open-hax-workbench.log"
   :time true
   :kill_timeout 5000})

(clobber.macro/ecosystem-output)
