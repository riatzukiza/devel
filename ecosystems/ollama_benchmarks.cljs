(ns ollama-benchmarks
  (:require [clobber.macro :refer [defapp ecosystem-output]]))

(clobber.macro/defapp "ollama-benchmarks-basic"
  {:script "bb"
   :cwd "."
   :args ["bench_ollama.clj"
           "--config"
           "config.dev.edn"
           "--out-dir"
           "reports-dev"
           "-n"
           "1"]
   :interpreter "none"
   :out_file "logs/pm2/basic.out.log"
   :error_file "logs/pm2/basic.err.log"
   :log_date_format "YYYY-MM-DD HH:mm:ss"
   :autorestart false})

(clobber.macro/defapp "ollama-benchmarks-tools"
  {:script "bb"
   :cwd "."
   :args ["bench_tools.clj"
           "--config"
           "config.tools.edn"
           "--tools"
           "my_bench_tools.clj"
           "--out-dir"
           "reports-tools"
           "-n"
           "1"]
   :interpreter "none"
   :out_file "logs/pm2/tools.out.log"
   :error_file "logs/pm2/tools.err.log"
   :log_date_format "YYYY-MM-DD HH:mm:ss"
   :autorestart false})

(clobber.macro/defapp "ollama-benchmarks-tool-calling"
  {:script "bb"
   :cwd "."
   :args ["bench_tool_calling.clj"
           "--model"
           "qwen3:4b"
           "--tools"
           "my_bench_tools.clj"
           "--out-dir"
           "reports-tool-calling"
           "-n"
           "1"]
   :interpreter "none"
   :out_file "logs/pm2/tool-calling.out.log"
   :error_file "logs/pm2/tool-calling.err.log"
   :log_date_format "YYYY-MM-DD HH:mm:ss"
   :autorestart false})

(clobber.macro/defapp "ollama-benchmarks-dev"
  {:script "bb"
   :cwd "."
   :args ["bench_ollama.clj"
           "--config"
           "config.dev.edn"
           "--out-dir"
           "reports-dev"
           "-n"
           "1"]
   :interpreter "none"
   :watch ["." "config.dev.edn"]
   :ignore_watch ["node_modules" "logs" ".clj-kondo" ".cpcache" "target" "classes" "reports" "reports-dev"]
   :watch_delay 1000
   :out_file "logs/pm2/dev.out.log"
   :error_file "logs/pm2/dev.err.log"
   :log_date_format "YYYY-MM-DD HH:mm:ss"
   :autorestart true})

(clobber.macro/ecosystem-output)
