(ns services-codex-lb
  (:require [clobber.macro]))

(clobber.macro/defapp "codex-lb"
  {:script "docker"
   :args ["compose"
          "-f" "docker-compose.workspace.yml"
          "up"
          "-d"]
   :cwd "./services/codex-lb"
   :interpreter "/usr/bin/env"
   :autorestart false
   :watch false
   :error_file "./logs/codex-lb-error.log"
   :out_file "./logs/codex-lb-out.log"
   :log_file "./logs/codex-lb.log"
   :time true
   :kill_timeout 10000
   :restart_delay 5000
   :max_restarts 3
   :min_uptime 30000})