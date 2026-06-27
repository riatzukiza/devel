;; Ecosystem: openhax.cljs
;; - :script paths resolve relative to :cwd; verify build outputs
;; - Rebuild PM2 config with: pnpm generate-ecosystem

(ns openhax
  (:require [clobber.macro]))

(clobber.macro/defapp "agentd"
  {:script "dist/index.js"
   :cwd "services/agentd"
   :interpreter "node"
   :exec_mode "fork"
   :instances 1
   :env_file "services/agentd/.env"
   :env {:NODE_ENV "production"
         :WEB_PORT "8787"}
   :max_restarts 5
   :restart_delay 2000
   :autorestart true
   :watch false})

(clobber.macro/defapp "opencode-reactant"
  {:script "pnpm"
   :args "dev"
   :cwd "packages/opencode-reactant"
   :interpreter "none"
   :exec_mode "fork"
   :instances 1
   :env {:NODE_ENV "development"
         :REPO_SLUG "sst/opencode"}
   :max_restarts 5
   :restart_delay 2000
   :autorestart true
   :watch false})

(clobber.macro/ecosystem-output)
