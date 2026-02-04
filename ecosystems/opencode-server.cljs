(ns ecosystem
  (:require [clobber.macro]))
(clobber.macro/defapp "devel/opencode"
  {:script "bunx"
   :cwd "."
   :args ["opencode-ai@latest"
          "web"
          "--port"
          "4096"
          "--hostname"
          "0.0.0.0"]
   :env {:NODE_ENV "production"}
   :instances 1
   :interpreter "/usr/bin/env"
   :autorestart true
   :watch false
   :error_file "./logs/opencode-server-error.log"
   :out_file "./logs/opencode-server-out.log"
   :log_file "./logs/opencode-server.log"
   :time true
   :kill_timeout 5000
   :restart_delay 5000
   :max_restarts 10
   :min_uptime 10000})
