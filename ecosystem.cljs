(ns devel.ecosystem
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
   :error_file "/home/err/devel/promethean/logs/opencode-server-error.log"
   :out_file "/home/err/devel/promethean/logs/opencode-server-out.log"
   :log_file "/home/err/devel/promethean/logs/opencode-server.log"
   :time true
   :kill_timeout 5000
   :restart_delay 5000
   :max_restarts 10
   :min_uptime 10000})

(clobber.macro/defapp "duck-io"
  {:cwd "./orgs/octave-commons/cephalon-clj/cephalon-clj-discord-io"
   :script "node"
   :args ["dist/duck.cjs"]
   :interpreter "none"
   :out_file "logs/pm2/duck-io.out.log"
   :error_file "logs/pm2/duck-io.err.log"
   :log_date_format "YYYY-MM-DD HH:mm:ss"
   :env {:WS_PORT "8787"}})

(clobber.macro/defapp "duck-brain"
  {:cwd "./orgs/octave-commons/cephalon-clj/cephalon-clj-brain"
   :script "clojure"
   :args ["-M" "-m" "cephalon.brain.main"]
   :interpreter "none"
   :out_file "logs/pm2/duck-brain.out.log"
   :error_file "logs/pm2/duck-brain.err.log"
   :log_date_format "YYYY-MM-DD HH:mm:ss"
   :env {:DISCORD_IO_WS "ws://127.0.0.1:8787/ws"
         :OLLAMA_MODEL "qwen3-vl:2b-thinking-bf16"
         :OLLAMA_BASE_URL "http://127.0.0.1:11434"
         :DUCK_ADMIN_WS_PORT "8788"
         :DISCORD_TOKEN "${DUCK_DISCORD_TOKEN:-${DISCORD_TOKEN:-}}"}})

(clobber.macro/defapp "duck-ui"
  {:cwd "./orgs/octave-commons/cephalon-clj/cephalon-clj-brain"
   :script "clojure"
   :args ["-M:ui"]
   :interpreter "none"
   :out_file "logs/pm2/duck-ui.out.log"
   :error_file "logs/pm2/duck-ui.err.log"
   :log_date_format "YYYY-MM-DD HH:mm:ss"
   :env {:DUCK_ADMIN_WS_URL "ws://127.0.0.1:8788"}})

(clobber.macro/defprofile :dev
  {:apps [
          {:name "duck-io-compiler-dev"
           :cwd "./orgs/octave-commons/cephalon-clj/cephalon-clj-discord-io"
           :script "npx"
           :args ["shadow-cljs" "watch" "duck"]
           :interpreter "none"
           :watch ["src" "shadow-cljs.edn"]
           :ignore_watch ["node_modules"
                          "logs"
                          ".shadow-cljs"
                          "dist"]
           :watch_delay 1000
           :out_file "logs/pm2/duck-io.dev.compiler.out.log"
           :error_file "logs/pm2/duck-io.dev.compiler.err.log"
           :log_date_format "YYYY-MM-DD HH:mm:ss"}
          
          {:name "duck-io-dev"
           :cwd "./orgs/octave-commons/cephalon-clj/cephalon-clj-discord-io"
           :script "node"
           :args ["dist/duck.cjs"]
           :interpreter "none"
           :watch ["dist/duck.cjs"]
           :ignore_watch ["node_modules"
                          "logs"
                          ".shadow-cljs"]
           :watch_delay 1000
           :out_file "logs/pm2/duck-io.dev.out.log"
           :error_file "logs/pm2/duck-io.dev.err.log"
           :log_date_format "YYYY-MM-DD HH:mm:ss"
           :env {:WS_PORT "8787"
                 :NODE_OPTIONS "--dns-result-order=ipv4first"}}
          
          {:name "duck-brain-dev"
           :cwd "./orgs/octave-commons/cephalon-clj/cephalon-clj-brain"
           :script "clojure"
           :args ["-Sdeps"
                  "{:deps {octave-commons/promethean-agent-system {:local/root \"../../promethean-agent-system\"}}}"
                  "-M"
                  "-m"
                  "cephalon.brain.main"]
           :interpreter "none"
           :watch ["src" "deps.edn"]
           :ignore_watch ["node_modules"
                          "logs"
                          ".clj-kondo"
                          ".cpcache"
                          "target"
                          "classes"]
           :watch_delay 1000
           :out_file "logs/pm2/duck-brain.dev.out.log"
           :error_file "logs/pm2/duck-brain.dev.err.log"
           :log_date_format "YYYY-MM-DD HH:mm:ss"
           :env {:DISCORD_IO_WS "ws://127.0.0.1:8787/ws"
                 :OLLAMA_MODEL "qwen3-vl:2b-thinking-bf16"
                 :OLLAMA_BASE_URL "http://127.0.0.1:11434"
                 :OLLAMA_TIMEOUT_MS "600000"
                 :DUCK_DEBUG "true"
                 :DUCK_LOOP_ENABLED "true"}}
          
          {:name "duck-ui-dev"
           :cwd "./orgs/octave-commons/cephalon-clj/cephalon-clj-brain"
           :script "clojure"
           :args ["-M:ui"]
           :interpreter "none"
           :out_file "logs/pm2/duck-ui.dev.out.log"
           :error_file "logs/pm2/duck-ui.dev.err.log"
           :log_date_format "YYYY-MM-DD HH:mm:ss"
           :env {:DUCK_ADMIN_WS_URL "ws://127.0.0.1:8788"}}]})

(clobber.macro/ecosystem-output)
