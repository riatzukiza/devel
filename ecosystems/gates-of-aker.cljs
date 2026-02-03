(ns gates-of-aker
  (:require [clobber.macro :refer [defapp ecosystem-output]]))

(clobber.macro/defapp "gates-backend"
  {:script "clojure"
   :cwd "./backend"
   :args ["-M:server"]
   :interpreter "bash"
   :instances 1
   :autorestart true
   :watch ["src" "resources" "dev" "deps.edn"]
   :ignore_watch ["target" "logs"]
   :watch_delay 1000
   :log_file "./logs/backend.log"
   :out_file "./logs/backend-out.log"
   :error_file "./logs/backend-error.log"
   :log_date_format "YYYY-MM-DD HH:mm:ss Z"
   :env {:PORT 3000
           :NODE_ENV "development"}})

(clobber.macro/defapp "gates-frontend"
  {:cwd "./web"
   :script "npm"
   :args ["run" "dev"]
   :interpreter "node"
   :instances 1
   :autorestart true
   :watch ["src" "index.html"]
   :watch_delay 1000
   :log_file "../backend/logs/frontend.log"
   :out_file "../backend/logs/frontend-out.log"
   :error_file "../backend/logs/frontend-error.log"
   :log_date_format "YYYY-MM-DD HH:mm:ss Z"
   :env {:PORT 5173
           :NODE_ENV "development"}})

(clobber.macro/ecosystem-output)
