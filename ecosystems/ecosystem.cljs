;; Ecosystem: ecosystem.cljs
;; - :script paths resolve relative to :cwd; keep them in sync with builds
;; - Rebuild PM2 config with: pnpm generate-ecosystem

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

;; (clobber.macro/defapp "duck-ui"
;;   {:cwd "./orgs/octave-commons/cephalon-clj/cephalon-clj-brain"
;;    :script "clojure"
;;    :args ["-M:ui"]
;;    :interpreter "none"
;;    :out_file "logs/pm2/duck-ui.out.log"
;;    :error_file "logs/pm2/duck-ui.err.log"
;;    :log_date_format "YYYY-MM-DD HH:mm:ss"
;;    :env {:DUCK_ADMIN_WS_URL "ws://127.0.0.1:8788"}})

;; (clobber.macro/defprofile :dev
;;    {:apps [
;;            {:name "duck-ui-dev"
;;             :cwd "./orgs/octave-commons/cephalon-clj/cephalon-clj-brain"
;;             :script "clojure"
;;             :args ["-M:ui"]
;;             :interpreter "none"
;;             :out_file "logs/pm2/duck-ui.dev.out.log"
;;             :error_file "logs/pm2/duck-ui.dev.err.log"
;;             :log_date_format "YYYY-MM-DD HH:mm:ss"
;;             :env {:DUCK_ADMIN_WS_URL "ws://127.0.0.1:8788"}}]})

(clobber.macro/ecosystem-output)
