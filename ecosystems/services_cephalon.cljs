(ns services-cephalon
  (:require [clobber.macro]))

(clobber.macro/defapp "cephalon"
  {:script "./dist/main.js"
   :cwd "./services/cephalon-cljs"
   :env {:NODE_ENV "production"}
   :autorestart true
   :max-restarts 5
   :min_uptime "10s"
   :log_date_format "YYYY-MM-DD HH:mm:ss Z"
   :error_file "./logs/cephalon-error.log"
   :out_file "./logs/cephalon-out.log"
   :merge_logs true
   :kill_timeout 5000
   :env_file nil})


(clobber.macro/defapp "duck-cephalon-ui"
  {:script "npm"
   :cwd "./packages/cephalon-ts/src/ui"
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

(clobber.macro/ecosystem-output)
