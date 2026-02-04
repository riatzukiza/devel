;; Ecosystem: promethean.cljs
;; - :script paths resolve relative to :cwd; verify build outputs
;; - Rebuild PM2 config with: pnpm generate-ecosystem

(ns promethean
  (:require [clobber.macro]))

(clobber.macro/defapp "mcp-dev"
  {:script "pnpm"
   :cwd "."
   :args ["--filter" "@promethean-os/mcp" "dev"]
   :interpreter "/usr/bin/env"
   :out_file "./logs/promethean-mcp-dev-out.log"
   :error_file "./logs/promthean-mcp-dev-err.log"
   :merge_logs true
   :instances 1
   :autorestart true
   :restart_delay 10000
   :env_file "./.env"
   :kill_timeout 10000
   :env {:PM2_PROCESS_NAME "promethean-mcp-dev"
         :MCP_USER_ROLE "developer"
         :ENABLE_OAUTH "true"}})

(clobber.macro/defapp "autocommit"
  {:script "pnpm"
   :cwd "."
   :args ["autocommit"
          "--path"
          "../"
          "--debounce-ms"
          "10000"
          "--model"
          "gpt-oss:20b-cloud"
          "--base-url"
          "http://localhost:11434"]
   :env {:OPENAI_BASE_URL "http://localhost:11434"
         :AUTOCOMMIT_MODEL "error/qwen3:4b-instruct-100k"
         :NODE_ENV "production"}
   :instances 1
   :interpreter "/usr/bin/env"
   :autorestart true
   :watch ["./packages/autocommit/dist"]
   :error_file "./logs/autocommit-error.log"
   :out_file "./logs/autocommit-out.log"
   :log_file "./logs/autocommit.log"
   :time true
   :kill_timeout 5000
   :restart_delay 5000
   :max_restarts 10
   :min_uptime 10000
   :env_file nil})

(clobber.macro/defapp "knowledge-graph-ui"
  {:script "pnpm"
   :cwd "."
   :args ["--filter" "@promethean-os/knowledge-graph-ui" "dev"]
   :env {:NODE_ENV "development"}
   :instances 1
   :interpreter "/usr/bin/env"
   :autorestart true
   :watch false
   :out_file "./logs/knowledge-graph-ui-out.log"
   :error_file "./logs/knowledge-graph-ui-err.log"
   :merge_logs true
   :kill_timeout 10000
   :restart_delay 5000
   :env_file nil})

(clobber.macro/defapp "knowledge-graph-graphql"
  {:script "pnpm"
   :cwd "."
   :args ["--filter" "@promethean-os/knowledge-graph" "serve:graphql"]
   :env {:NODE_ENV "production"
         :KG_RELATED_TOPN "5"
         :KG_RELATED_TTL_MS "604800000"
         :KG_RELATED_CACHE "./.cache/knowledge-graph/embeddings"}
   :instances 1
   :interpreter "/usr/bin/env"
   :autorestart true
   :watch false
   :out_file "./logs/knowledge-graph-graphql-out.log"
   :error_file "./logs/knowledge-graph-graphql-err.log"
   :merge_logs true
   :kill_timeout 10000
   :restart_delay 5000
   :env_file nil})

(clobber.macro/ecosystem)
