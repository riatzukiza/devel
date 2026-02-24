(ns gates-of-aker
  (:require [clobber.macro]))

(clobber.macro/defapp "gates-of-aker-backend"
  {:script "clojure"
   :cwd "./orgs/octave-commons/gates-of-aker/backend"
   :args ["-M:server"]
   :interpreter "/usr/bin/env"
   :env {:PORT "3000"
         :NREPL_PORT "7888"}
   :instances 1
   :autorestart true
   :watch false
   :error_file "./logs/gates-of-aker-backend-error.log"
   :out_file "./logs/gates-of-aker-backend-out.log"
   :log_file "./logs/gates-of-aker-backend.log"
   :time true
   :kill_timeout 5000
   :restart_delay 5000
   :max_restarts 10
   :min_uptime 10000})

(clobber.macro/defapp "gates-of-aker-web"
  {:script "npm"
   :cwd "./orgs/octave-commons/gates-of-aker"
   :args ["run" "dev" "--prefix" "web"]
   :interpreter "/usr/bin/env"
   :env {:PORT "5173"
         :VITE_BACKEND_ORIGIN "http://localhost:3000"}
   :instances 1
   :autorestart true
   :watch false
   :error_file "./logs/gates-of-aker-web-error.log"
   :out_file "./logs/gates-of-aker-web-out.log"
   :log_file "./logs/gates-of-aker-web.log"
   :time true
   :kill_timeout 5000
   :restart_delay 5000
   :max_restarts 10
   :min_uptime 10000})
