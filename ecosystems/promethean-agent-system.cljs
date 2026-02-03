(ns promethean-agent-system
  (:require [clobber.macro]))

(clobber.macro/defapp "promethean-agent-system-demo"
  {:script "clojure"
   :cwd "."
   :args ["-M" "-e" "(require 'promethean.demo) (promethean.demo/run!)"]
   :interpreter "none"
   :out_file "logs/pm2/demo.out.log"
   :error_file "logs/pm2/demo.err.log"
   :log_date_format "YYYY-MM-DD HH:mm:ss"
   :autorestart false})

(clobber.macro/defapp "promethean-agent-system-dev"
  {:script "clojure"
   :cwd "."
   :args ["-M" "-e" "(require 'promethean.demo) (promethean.demo/run!)"]
   :interpreter "none"
   :watch ["src" "deps.edn"]
   :ignore_watch ["node_modules"
                 "logs"
                 ".clj-kondo"
                 ".cpcache"
                 "target"
                 "classes"]
   :watch_delay 1000
   :out_file "logs/pm2/dev.out.log"
   :error_file "logs/pm2/dev.err.log"
   :log_date_format "YYYY-MM-DD HH:mm:ss"
   :autorestart true})

(clobber.macro/ecosystem)
