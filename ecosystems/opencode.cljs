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

(clobber.macro/defapp "opencode-indexer"
  {:script "pnpm"
   :cwd "./services/opencode-indexer"
   :args ["run" "dev"]
   :interpreter "/usr/bin/env"
   :env {:NODE_ENV "production"
         :OPENCODE_BASE_URL "http://localhost:4096"
         :CHROMA_URL "http://localhost:8000"
         :CHROMA_COLLECTION "opencode_messages_v1"
         :LEVEL_DIR "./.reconstitute/level"
         :OLLAMA_URL "http://localhost:11434"
         :OLLAMA_EMBED_MODEL "qwen3-embedding:0.6b"
         :OLLAMA_NUM_CTX "32768"
         :BATCH_SIZE "32"
         :EMBED_TTL_MS "2592000000"}
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
