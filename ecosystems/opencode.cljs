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
            :OPENCODE_INDEXER_MODE "historical-backfill"
            :OPENCODE_BASE_URL "http://localhost:4096"
            :OPENPLANNER_URL "http://127.0.0.1:7777"
            :OPENPLANNER_API_KEY "change-me"
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

(clobber.macro/defapp "mcp-fs-oauth-stable"
  {:script "bun"
   :cwd "./services/mcp-fs-oauth"
   :args ["run" "start:stable"]
   :interpreter "/usr/bin/env"
    :env {:PORT "3001"
          :PUBLIC_BASE_URL "https://err-stealth-16-ai-studio-a1vgg.tailbe888a.ts.net"
          :AUTH_LOGIN_PROVIDER "github"
          :OWNER_PASSWORD "change-me"
          :STORAGE_MODE "local"

          :LOCAL_ROOT "/home/err/devel"
           :AUTO_APPROVE "true"}
   :autorestart true
   :watch false
   :error_file "./logs/mcp-fs-oauth-stable-error.log"
   :out_file "./logs/mcp-fs-oauth-stable-out.log"
   :log_file "./logs/mcp-fs-oauth-stable.log"
   :time true
   :kill_timeout 5000
   :restart_delay 5000
   :max_restarts 5
   :min_uptime 10000})

(clobber.macro/defapp "mcp-fs-oauth-dev"
  {:script "bun"
   :cwd "./services/mcp-fs-oauth"
   :args ["run" "dev:proxy"]
   :interpreter "/usr/bin/env"
    :env {:PORT "3002"
          :PUBLIC_BASE_URL "https://err-stealth-16-ai-studio-a1vgg.tailbe888a.ts.net"
          :AUTH_LOGIN_PROVIDER "github"
          :OWNER_PASSWORD "change-me"
          :STORAGE_MODE "local"

          :LOCAL_ROOT "/home/err/devel"
          :AUTO_APPROVE "true"}
   :autorestart true
   :watch false
   :error_file "./logs/mcp-fs-oauth-dev-error.log"
   :out_file "./logs/mcp-fs-oauth-dev-out.log"
   :log_file "./logs/mcp-fs-oauth-dev.log"
   :time true
   :kill_timeout 5000
   :restart_delay 1000
   :max_restarts 20
   :min_uptime 2000})

(clobber.macro/defapp "api-gateway"
  {:script "node"
   :cwd "./services/api-gateway"
   :args ["dist/main.js"]
   :interpreter "/usr/bin/env"
   :env {:NODE_ENV "production"
         :API_GATEWAY_PORT "8788"
         :API_GATEWAY_HOST "0.0.0.0"
         :OAUTH_ENABLED "true"
          :ALLOWED_HOSTS "localhost,127.0.0.1,.tailbe888a.ts.net"
          :MCP_FS_OAUTH_URL "http://127.0.0.1:3001"
          :MCP_FS_OAUTH_DEV_URL "http://127.0.0.1:3002"
          :OAUTH_ISSUER "https://err-stealth-16-ai-studio-a1vgg.tailbe888a.ts.net"}
   :autorestart true
   :watch false
   :error_file "./logs/api-gateway-error.log"
   :out_file "./logs/api-gateway-out.log"
   :log_file "./logs/api-gateway.log"
   :time true
   :kill_timeout 5000
   :restart_delay 5000
   :max_restarts 10
   :min_uptime 10000})

(clobber.macro/ecosystem-output)
