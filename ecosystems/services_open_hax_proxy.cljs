(ns services-open-hax-proxy
  (:require [clobber.macro]))

(clobber.macro/defapp "open-hax-openai-proxy"
  {:script "node"
   :cwd "./services/open-hax-openai-proxy"
   :args ["--env-file-if-exists=.env" "dist/main.js"]
   :interpreter "/usr/bin/env"
   :env {:NODE_ENV "production"
          :PROXY_HOST "0.0.0.0"
          :PROXY_PORT "8789"
          :UPSTREAM_PROVIDER_ID "vivgrid"
          :UPSTREAM_FALLBACK_PROVIDER_IDS "ollama-cloud"
          :UPSTREAM_BASE_URL "https://api.vivgrid.com"
          :UPSTREAM_PROVIDER_BASE_URLS "vivgrid=https://api.vivgrid.com,ollama-cloud=https://ollama.com"
          :OPENAI_PROVIDER_ID "openai"
          :OPENAI_BASE_URL "https://chatgpt.com/backend-api"
          :OLLAMA_BASE_URL "http://ollama:11434"
          :UPSTREAM_CHAT_COMPLETIONS_PATH "/v1/chat/completions"
          :OPENAI_CHAT_COMPLETIONS_PATH "/codex/responses/compact"
          :UPSTREAM_MESSAGES_PATH "/v1/messages"
          :UPSTREAM_MESSAGES_MODEL_PREFIXES "claude-"
          :UPSTREAM_MESSAGES_INTERLEAVED_THINKING_BETA "interleaved-thinking-2025-05-14"
          :UPSTREAM_RESPONSES_PATH "/v1/responses"
          :OPENAI_RESPONSES_PATH "/codex/responses"
          :UPSTREAM_RESPONSES_MODEL_PREFIXES "gpt-"
          :OPENAI_MODEL_PREFIXES "openai/,openai:"
          :OLLAMA_CHAT_PATH "/api/chat"
          :OLLAMA_MODEL_PREFIXES "ollama/,ollama:"
          :PROXY_KEYS_FILE "./keys.json"
          :PROXY_MODELS_FILE "./models.json"
          :PROXY_KEY_RELOAD_MS "5000"
          :PROXY_KEY_COOLDOWN_MS "30000"
          :PROXY_AUTH_TOKEN "change-me-open-hax-proxy-token"
          :UPSTREAM_REQUEST_TIMEOUT_MS "180000"}
   :autorestart true
   :watch false
   :error_file "./logs/open-hax-openai-proxy-error.log"
   :out_file "./logs/open-hax-openai-proxy-out.log"
   :log_file "./logs/open-hax-openai-proxy.log"
   :time true
   :kill_timeout 5000
   :restart_delay 5000
   :max_restarts 10
   :min_uptime 10000})

(clobber.macro/defapp "open-hax-openai-proxy-web"
  {:script "pnpm"
   :cwd "./services/open-hax-openai-proxy"
   :args ["web:dev" "--" "--host" "0.0.0.0" "--port" "5174"]
   :interpreter "node"
   :env {:NODE_ENV "development"}
   :autorestart true
   :watch false
   :error_file "./logs/open-hax-openai-proxy-web-error.log"
   :out_file "./logs/open-hax-openai-proxy-web-out.log"
   :log_file "./logs/open-hax-openai-proxy-web.log"
   :time true
   :kill_timeout 5000
   :restart_delay 5000
   :max_restarts 10
   :min_uptime 10000})
