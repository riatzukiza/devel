(ns promethean-frontend
  (:require [clobber.macro]))

(clobber.macro/defapp "frontend-main"
  {:script "shadow-cljs"
   :cwd "./orgs/riatzukiza/promethean/packages/frontend"
   :interpreter "node"
   :interpreter_args "--max-old-space-size=4096"
   :watch false
   :max_memory_restart "1G"
   :env {:NODE_ENV (clobber.macro/env-var :NODE_ENV "development")
         :PORT (clobber.macro/env-var :PORT "3000")}
   :env_production {:NODE_ENV "production"}
   :log_date_format "YYYY-MM-DD HH:mm:ss Z"
   :error_file "./logs/main-error.log"
   :out_file "./logs/main-out.log"
   :log_file "./logs/main-combined.log"
   :time true})

(clobber.macro/defapp "frontend-pantheon"
  {:script "vite"
   :args "--port 3001 --host 0.0.0.0"
   :cwd "./orgs/riatzukiza/promethean/packages/frontend"
   :interpreter "node"
   :interpreter_args "--max-old-space-size=4096"
   :watch false
   :max_memory_restart "1G"
   :env {:NODE_ENV (clobber.macro/env-var :NODE_ENV "development")
         :PORT (clobber.macro/env-var :PORT "3001")}
   :env_production {:NODE_ENV "production"}
   :log_date_format "YYYY-MM-DD HH:mm:ss Z"
   :error_file "./logs/pantheon-error.log"
   :out_file "./logs/pantheon-out.log"
   :log_file "./logs/pantheon-combined.log"
   :time true})

(clobber.macro/ecosystem-output)
