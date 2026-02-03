(ns cephalon.ecosystem
  (:require [clobber.macro]))

;; Example PM2 ecosystem using clobber.macro/defapp.
;; Run one process per bot (recommended).
;;
;; Each app sets:
;;   - CEPHALON_BOT_ID
;;   - a matching <BOT>_DISCORD_TOKEN (see packages/cephalon-ts/src/config/bots.ts)
;;   - optional persistence + chroma env vars
;;
;; Adjust :cwd for your repo layout.

(def common
  {:script "pnpm"
   :args ["start"]
   :env {:NODE_ENV "production"}
   :autorestart true
   :max-restarts 5
   :min-uptime "10s"
   :log-date-format "YYYY-MM-DD HH:mm:ss Z"
   :merge-logs true
   :kill-timeout 5000})

(clobber.macro/defapp "duck-cephalon"
  (assoc common
         :cwd "./services/cephalon-bot"
         :env (merge (:env common)
                     {:CEPHALON_BOT_ID "duck"})))

(clobber.macro/defapp "janitor-cephalon"
  (assoc common
         :cwd "./services/cephalon-bot"
         :env (merge (:env common)
                     {:CEPHALON_BOT_ID "janitor"})))
