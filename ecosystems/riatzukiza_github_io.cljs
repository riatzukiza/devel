(ns riatzukiza-github-io
  (:require [clobber.macro]))

(clobber.macro/defapp "riatzukiza.github.io-dev-server"
  {:script "npm"
   :cwd "."
   :args ["run" "dev:server"]
   :interpreter "none"
   :watch ["./inc" "./dev/server.sibilant" "./server"]
   :log_file "./logs/dev-server.log"
   :error_file "./logs/dev-server-error.log"
   :log_date_format "YYYY-MM-DD HH:mm:ss Z"})

(clobber.macro/defapp "riatzukiza.github.io-dev-watch"
  {:script "npm"
   :cwd "."
   :args ["run" "dev:watch"]
   :interpreter "none"
   :watch ["./inc/"]
   :log_file "./logs/dev-watch.log"
   :error_file "./logs/dev-watch-error.log"
   :log_date_format "YYYY-MM-DD HH:mm:ss Z"})

(clobber.macro/ecosystem)
