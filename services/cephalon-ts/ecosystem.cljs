;; PM2 Ecosystem Configuration for Cephalon
;; Usage: clobber start ecosystem.cljs

{:apps
 [{:name "cephalon"
   :script "./dist/main.js"
   :cwd "/home/err/devel/services/cephalon"
   :env {:NODE_ENV "production"}
   :autorestart true
   :max-restarts 5
   :min-uptime "10s"
   :log-date-format "YYYY-MM-DD HH:mm:ss Z"
   :error-file "./logs/cephalon-error.log"
   :out-file "./logs/cephalon-out.log"
   :merge-logs true
   :kill-timeout 5000}]}
