(ns opencode
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
   :env {:NODE_ENV "production"
         :OPENPLANNER_URL "http://127.0.0.1:7777"
         :OPENPLANNER_API_KEY "change-me"}
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

(clobber.macro/defapp "opencode-indexer"
   {:script "pnpm"
    :cwd "./services/opencode-indexer"
    :args ["run" "dev"]
    :interpreter "/usr/bin/env"
     :env {:NODE_ENV "production"
            :OPENCODE_INDEXER_MODE "historical-backfill"
            :OPENCODE_BASE_URL "http://localhost:4096"
            :OPENPLANNER_URL "http://127.0.0.1:7777"
            :OPENPLANNER_API_KEY "change-me"
            ;; State/cache for incremental backfill
           :LEVEL_DIR "./.reconstitute/level"
           :BATCH_SIZE "32"
            ;; Optional tuning
            :OPENCODE_THROTTLE_MS "200"
            :OPENCODE_CHUNK_INDEXING "1"
            :OPENCODE_CHUNK_TARGET_TOKENS "32000"
            :OPENCODE_CHUNK_OVERLAP_MESSAGES "4"}
    :autorestart false
    :watch false
    :cron_restart "0 * * * *"
    :error_file "./logs/opencode-indexer-error.log"
    :out_file "./logs/opencode-indexer-out.log"
    :log_file "./logs/opencode-indexer.log"
    :time true
    :kill_timeout 300000
    :restart_delay 10000
    :max_restarts 1
    :min_uptime 60000})

(clobber.macro/ecosystem-output)
