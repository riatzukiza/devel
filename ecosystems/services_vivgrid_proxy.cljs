(ns services-vivgrid-proxy
  (:require [clobber.macro]))

(clobber.macro/defapp "vivgrid-openai-proxy"
  {:script "node"
   :cwd "./services/vivgrid-openai-proxy"
   :args ["--env-file-if-exists=.env" "dist/main.js"]
   :interpreter "/usr/bin/env"
   :env {:NODE_ENV "production"
          :PROXY_HOST "0.0.0.0"
          :PROXY_PORT "8787"
          :UPSTREAM_BASE_URL "https://api.vivgrid.com"
          :UPSTREAM_CHAT_COMPLETIONS_PATH "/v1/chat/completions"
          :UPSTREAM_MESSAGES_PATH "/v1/messages"
          :UPSTREAM_MESSAGES_MODEL_PREFIXES "claude-"
          :UPSTREAM_RESPONSES_PATH "/v1/responses"
          :UPSTREAM_RESPONSES_MODEL_PREFIXES "gpt-,glm-"
          :VIVGRID_KEYS_FILE "./keys.json"
          :VIVGRID_MODELS_FILE "./models.json"
         :VIVGRID_KEY_RELOAD_MS "5000"
         :VIVGRID_KEY_COOLDOWN_MS "30000"
         :UPSTREAM_REQUEST_TIMEOUT_MS "180000"}
   :autorestart true
   :watch false
   :error_file "./logs/vivgrid-openai-proxy-error.log"
   :out_file "./logs/vivgrid-openai-proxy-out.log"
   :log_file "./logs/vivgrid-openai-proxy.log"
   :time true
   :kill_timeout 5000
   :restart_delay 5000
   :max_restarts 10
   :min_uptime 10000})
