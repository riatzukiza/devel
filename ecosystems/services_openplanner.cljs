(ns services-openplanner
  (:require [clobber.macro]))

(def openplanner-api-key "change-me")

(clobber.macro/defapp "openplanner"
  {:script "node"
   :args ["--env-file=.env" "dist/main.js"]
   :cwd "./services/openplanner"
   :env {:NODE_ENV "production"
          :OPENPLANNER_PORT 7777
          :OPENPLANNER_API_KEY openplanner-api-key
          :OPENPLANNER_DATA_DIR "./openplanner-lake"
          :CHROMA_URL "http://127.0.0.1:8000"
          :CHROMA_COLLECTION "openplanner_events_v1"}
   :autorestart true
   :max-restarts 10
   :log-date-format "YYYY-MM-DD HH:mm:ss Z"
   :error-file "./logs/openplanner-error.log"
   :out-file "./logs/openplanner-out.log"
   :merge-logs true})
