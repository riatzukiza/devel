(ns services-mcp
  (:require [clobber.macro]))

(def shared-secret "change-me-mcp-secret")
(def openplanner-api-key "change-me")

(clobber.macro/defapp "janus"
  {:script "node"
   :cwd "./services/janus"
   :args ["dist/main.js"]
   :interpreter "/usr/bin/env"
   :env {:NODE_ENV "production"
          :API_GATEWAY_PORT "8788"
          :API_GATEWAY_HOST "0.0.0.0"
          :OAUTH_ENABLED "true"
          :OPENPLANNER_URL "http://127.0.0.1:7777"
          :OPENPLANNER_API_KEY openplanner-api-key
          :OPENCODE_URL "http://127.0.0.1:4096"
          :ALLOWED_HOSTS "localhost,127.0.0.1,.tailbe888a.ts.net"
           :MCP_FS_OAUTH_URL "http://127.0.0.1:3001"
           :MCP_FS_OAUTH_DEV_URL "http://127.0.0.1:3002"
           :OAUTH_ISSUER "https://err-stealth-16-ai-studio-a1vgg.tailbe888a.ts.net"
           :OAUTH_TOKEN_STRATEGY "opaque"
           :OAUTH_OPAQUE_VERIFIER "redis"
           :OAUTH_REDIS_URL "redis://127.0.0.1:6379"
           :OAUTH_REDIS_PREFIX "oauth-stable"
            :OAUTH_OPAQUE_INTROSPECTION_URL "http://127.0.0.1:3001/internal/oauth/introspect"
            :OAUTH_OPAQUE_SHARED_SECRET shared-secret
           :MCP_SERVICE_URLS "{\"fs-oauth\":\"http://127.0.0.1:3001\",\"files\":\"http://127.0.0.1:4011\",\"mnemosyne\":\"http://127.0.0.1:4011\",\"github\":\"http://127.0.0.1:4012\",\"process\":\"http://127.0.0.1:4013\",\"devtools\":\"http://127.0.0.1:4014\",\"tdd\":\"http://127.0.0.1:4015\",\"sandboxes\":\"http://127.0.0.1:4016\",\"ollama\":\"http://127.0.0.1:4017\",\"exec\":\"http://127.0.0.1:4018\",\"kronos\":\"http://127.0.0.1:4020\"}"
          :MCP_INTERNAL_SHARED_SECRET shared-secret}
   :autorestart true
   :watch false
   :error_file "./logs/janus-error.log"
   :out_file "./logs/janus-out.log"
   :log_file "./logs/janus.log"
   :time true
   :kill_timeout 5000
   :restart_delay 5000
   :max_restarts 10
   :min_uptime 10000})

(clobber.macro/defapp "mcp-fs-oauth-stable"
  {:script "bun"
   :cwd "./services/mcp-fs-oauth"
   :args ["run" "start:stable"]
   :interpreter "/usr/bin/env"
    :env {:PORT "3001"
           :PUBLIC_BASE_URL "https://err-stealth-16-ai-studio-a1vgg.tailbe888a.ts.net"
           :AUTH_LOGIN_PROVIDER "github"
           :OWNER_PASSWORD "change-me"
           :STORAGE_MODE "auto"
           :ALLOW_UNAUTH_LOCAL "true"
           :GITHUB_REPO_OWNER "riatzukiza"
           :GITHUB_REPO_NAME "devel"
           :GITHUB_REPO_BRANCH "device/stealth"
           :REDIS_URL "redis://127.0.0.1:6379"
           :OAUTH_REDIS_PREFIX "oauth-stable"
           :OAUTH_DUCKDB_OWNER "true"
           :OAUTH_DUCKDB_LOCK_TTL_SECONDS "30"
           :MCP_INTERNAL_SHARED_SECRET shared-secret
           :OAUTH_PERSISTENCE_PATH "./data/oauth.db"
           :LOCAL_ROOT "/home/err/devel"
           :OPENPLANNER_API_BASE_URL "http://127.0.0.1:8788/api/openplanner"
           :OPENCODE_API_BASE_URL "http://127.0.0.1:8788/api/opencode"
           :WORKSPACE_API_BASE_URL "http://127.0.0.1:8788/api/workspace"
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
           :STORAGE_MODE "auto"
           :ALLOW_UNAUTH_LOCAL "true"
           :GITHUB_REPO_OWNER "riatzukiza"
           :GITHUB_REPO_NAME "devel"
           :GITHUB_REPO_BRANCH "device/stealth"
           :REDIS_URL "redis://127.0.0.1:6379"
           :OAUTH_REDIS_PREFIX "oauth-dev"
           :OAUTH_DUCKDB_OWNER "false"
           :OAUTH_DUCKDB_LOCK_TTL_SECONDS "30"
           :MCP_INTERNAL_SHARED_SECRET shared-secret
           :OAUTH_PERSISTENCE_PATH "./data/oauth-dev.db"
           :LOCAL_ROOT "/home/err/devel"
           :OPENPLANNER_API_BASE_URL "http://127.0.0.1:8788/api/openplanner"
           :OPENCODE_API_BASE_URL "http://127.0.0.1:8788/api/opencode"
           :WORKSPACE_API_BASE_URL "http://127.0.0.1:8788/api/workspace"
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

(clobber.macro/defapp "kronos"
  {:script "node"
   :cwd "./services/kronos"
   :args ["dist/index.js"]
   :interpreter "/usr/bin/env"
   :env {:PORT "4020"
         :MCP_TRANSPORT "http"
         :NODE_ENV "production"}
   :autorestart true
   :watch false
   :error_file "./logs/kronos-error.log"
   :out_file "./logs/kronos-out.log"
   :log_file "./logs/kronos.log"
   :time true
   :kill_timeout 5000
   :restart_delay 5000
   :max_restarts 10
   :min_uptime 10000})

(clobber.macro/defapp "mnemosyne"
  {:script "node"
   :cwd "./services/mnemosyne"
   :args ["dist/main.js" "--config" "config/mcp-files.json"]
   :interpreter "/usr/bin/env"
   :env {:PORT "4011"
         :MCP_INTERNAL_SHARED_SECRET shared-secret
         :ALLOW_UNAUTH_LOCAL "true"
         :NODE_ENV "production"}
   :autorestart true
   :watch false
   :error_file "./logs/mnemosyne-error.log"
   :out_file "./logs/mnemosyne-out.log"
   :log_file "./logs/mnemosyne.log"
   :time true
   :kill_timeout 5000
   :restart_delay 5000
   :max_restarts 10
   :min_uptime 10000})

(def legacy-mcp-url "http://127.0.0.1:4020")

(clobber.macro/defapp "mcp-github"
  {:script "node"
   :cwd "./services/mcp-github"
   :args ["dist/main.js"]
   :interpreter "/usr/bin/env"
   :env {:PORT "4012"
         :LEGACY_MCP_URL legacy-mcp-url
         :MCP_INTERNAL_SHARED_SECRET shared-secret
         :ALLOW_UNAUTH_LOCAL "true"
         :NODE_ENV "production"}
   :autorestart true
   :watch false
   :error_file "./logs/mcp-github-error.log"
   :out_file "./logs/mcp-github-out.log"
   :log_file "./logs/mcp-github.log"
   :time true})

(clobber.macro/defapp "mcp-process"
  {:script "node"
   :cwd "./services/mcp-process"
   :args ["dist/main.js"]
   :interpreter "/usr/bin/env"
   :env {:PORT "4013"
         :LEGACY_MCP_URL legacy-mcp-url
         :MCP_INTERNAL_SHARED_SECRET shared-secret
         :ALLOW_UNAUTH_LOCAL "true"
         :NODE_ENV "production"}
   :autorestart true
   :watch false
   :error_file "./logs/mcp-process-error.log"
   :out_file "./logs/mcp-process-out.log"
   :log_file "./logs/mcp-process.log"
   :time true})

(clobber.macro/defapp "mcp-devtools"
  {:script "node"
   :cwd "./services/mcp-devtools"
   :args ["dist/main.js"]
   :interpreter "/usr/bin/env"
   :env {:PORT "4014"
         :LEGACY_MCP_URL legacy-mcp-url
         :MCP_INTERNAL_SHARED_SECRET shared-secret
         :ALLOW_UNAUTH_LOCAL "true"
         :NODE_ENV "production"}
   :autorestart true
   :watch false
   :error_file "./logs/mcp-devtools-error.log"
   :out_file "./logs/mcp-devtools-out.log"
   :log_file "./logs/mcp-devtools.log"
   :time true})

(clobber.macro/defapp "mcp-tdd"
  {:script "node"
   :cwd "./services/mcp-tdd"
   :args ["dist/main.js"]
   :interpreter "/usr/bin/env"
   :env {:PORT "4015"
         :LEGACY_MCP_URL legacy-mcp-url
         :MCP_INTERNAL_SHARED_SECRET shared-secret
         :ALLOW_UNAUTH_LOCAL "true"
         :NODE_ENV "production"}
   :autorestart true
   :watch false
   :error_file "./logs/mcp-tdd-error.log"
   :out_file "./logs/mcp-tdd-out.log"
   :log_file "./logs/mcp-tdd.log"
   :time true})

(clobber.macro/defapp "mcp-sandboxes"
  {:script "node"
   :cwd "./services/mcp-sandboxes"
   :args ["dist/main.js"]
   :interpreter "/usr/bin/env"
   :env {:PORT "4016"
         :LEGACY_MCP_URL legacy-mcp-url
         :MCP_INTERNAL_SHARED_SECRET shared-secret
         :ALLOW_UNAUTH_LOCAL "true"
         :NODE_ENV "production"}
   :autorestart true
   :watch false
   :error_file "./logs/mcp-sandboxes-error.log"
   :out_file "./logs/mcp-sandboxes-out.log"
   :log_file "./logs/mcp-sandboxes.log"
   :time true})

(clobber.macro/defapp "mcp-ollama"
  {:script "node"
   :cwd "./services/mcp-ollama"
   :args ["dist/main.js"]
   :interpreter "/usr/bin/env"
   :env {:PORT "4017"
         :LEGACY_MCP_URL legacy-mcp-url
         :MCP_INTERNAL_SHARED_SECRET shared-secret
         :ALLOW_UNAUTH_LOCAL "true"
         :NODE_ENV "production"}
   :autorestart true
   :watch false
   :error_file "./logs/mcp-ollama-error.log"
   :out_file "./logs/mcp-ollama-out.log"
   :log_file "./logs/mcp-ollama.log"
   :time true})

(clobber.macro/defapp "mcp-exec"
  {:script "node"
   :cwd "./services/mcp-exec"
   :args ["dist/main.js"]
   :interpreter "/usr/bin/env"
   :env {:PORT "4018"
         :LEGACY_MCP_URL legacy-mcp-url
         :MCP_INTERNAL_SHARED_SECRET shared-secret
         :ALLOW_UNAUTH_LOCAL "true"
         :NODE_ENV "production"}
   :autorestart true
   :watch false
   :error_file "./logs/mcp-exec-error.log"
   :out_file "./logs/mcp-exec-out.log"
   :log_file "./logs/mcp-exec.log"
   :time true})
