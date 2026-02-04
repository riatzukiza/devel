;; Ecosystem: cephalon.cljs
;; - :script paths resolve relative to :cwd; keep build outputs in sync
;; - Rebuild PM2 config with: pnpm generate-ecosystem

(ns cephalon
  (:require [clobber.macro]))

;; Cephalon - "always-running mind" with vector memory, persistent memory, and event subscriptions
;; TypeScript implementation: services/cephalon-ts
;; ClojureScript implementation: services/cephalon-cljs


(clobber.macro/defapp "duck-cephalon-ui"
  {:script "npm"
   :cwd "./packages/cephalon-ts/src/ui"
   :args ["run" "dev" "--" "--host" "0.0.0.0" "--port" "5173"]
   :env {:NODE_ENV "development"}
   :autorestart true
   :max-restarts 3
   :min-uptime "5s"
   :log-date-format "YYYY-MM-DD HH:mm:ss Z"
   :error-file "./logs/cephalon-ui-error.log"
   :out-file "./logs/cephalon-ui-out.log"
   :merge-logs true
   :kill-timeout 5000})

(clobber.macro/defapp "duck-cephalon-cljs"
  {:script "node"
   :cwd "./services/cephalon-cljs"
   :args ["dist/cephalon.js"]
   :env {:NODE_ENV "production"
         :NODE_OPTIONS "--enable-source-maps"
         :DUCK_DISCORD_TOKEN (clobber.macro/env-var :DUCK_DISCORD_TOKEN "")}
   :autorestart true
   :max-restarts 5
   :min-uptime "10s"
   :log-date-format "YYYY-MM-DD HH:mm:ss Z"
   :error-file "./logs/cephalon-cljs-error.log"
   :out-file "./logs/cephalon-cljs-out.log"
   :merge-logs true
   :kill-timeout 5000})

(clobber.macro/defapp "duck-io"
  {:script "node"
   :cwd "./orgs/octave-commons/cephalon-clj/cephalon-clj-discord-io"
   :args ["dist/duck.cjs"]
   :interpreter "none"
   :out-file "logs/pm2/duck-io.out.log"
   :error-file "logs/pm2/duck-io.err.log"
   :log-date-format "YYYY-MM-DD HH:mm:ss"
   :env {:WS_PORT "8787"}})

(clobber.macro/defapp "duck-brain"
  {:script "clojure"
   :cwd "./orgs/octave-commons/cephalon-clj/cephalon-clj-brain"
   :args ["-M" "-m" "cephalon.brain.main"]
   :interpreter "none"
   :out-file "logs/pm2/duck-brain.out.log"
   :error-file "logs/pm2/duck-brain.err.log"
   :log-date-format "YYYY-MM-DD HH:mm:ss"
   :env {:DISCORD_IO_WS "ws://127.0.0.1:8787/ws"
         :OLLAMA_MODEL "qwen3-vl:2b-thinking-bf16"
         :OLLAMA_BASE_URL "http://127.0.0.1:11434"
         :DUCK_ADMIN_WS_PORT "8788"
         :DISCORD_TOKEN "${DUCK_DISCORD_TOKEN:-${DISCORD_TOKEN:-}}"}})

(clobber.macro/defapp "duck-ui"
  {:script "clojure"
   :cwd "./orgs/octave-commons/cephalon-clj/cephalon-clj-brain"
   :args ["-M:ui"]
   :interpreter "none"
   :out-file "logs/pm2/duck-ui.out.log"
   :error-file "logs/pm2/duck-ui.err.log"
   :log-date-format "YYYY-MM-DD HH:mm:ss"
   :env {:DUCK_ADMIN_WS_URL "ws://127.0.0.1:8788"}})
