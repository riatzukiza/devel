(ns voxx.main
  "Main entry point for the Voxx voice gateway Clojure service."
  (:require [clojure.tools.logging :as log]
            [ring.adapter.jetty :refer [run-jetty]]
            [voxx.service :as svc]
            [voxx.handler :as handler])
  (:gen-class))

(defn -main
  "Start the Voxx voice gateway."
  [& _args]
  (let [service (svc/create-service)
        settings (:settings service)
        app (handler/create-app service)
        host (:host settings)
        port (:port settings)]
    (log/info "Starting Voxx voice gateway on" (str host ":" port))
    (log/info "TTS backends:" (voxx.config/preferred-tts-backends settings))
    (log/info "STT enabled:" (:stt-enabled settings))
    (log/info "API key required:" (not (clojure.string/blank? (:api-key settings))))
    (run-jetty app {:host host :port port :join? true})))
