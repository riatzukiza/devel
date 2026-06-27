(ns vexx.server
  (:require [ring.adapter.jetty :as jetty]
            [ring.middleware.cors :refer [wrap-cors]]
            [ring.middleware.params :refer [wrap-params]]
            [reitit.ring :as ring]
            [reitit.ring.middleware.muuntaja :as muuntaja]
            [muuntaja.core :as m]
            [vexx.api.routes :as routes]
            [vexx.config :as config])
  (:gen-class))

(def app
  (ring/ring-handler
   (ring/router
    routes/routes
    {:data {:muuntaja m/instance
            :middleware [muuntaja/format-middleware]}})
   (ring/create-default-handler)))

(defn wrap-logging
  [handler]
  (fn [request]
    (let [start (System/nanoTime)
          response (handler request)
          elapsed (/ (- (System/nanoTime) start) 1e6)]
      (printf "[%s] %s %s -> %d (%.1fms)%n"
              (java.time.LocalDateTime/now)
              (:request-method request)
              (:uri request)
              (:status response)
              elapsed)
      (flush)
      response)))

(def wrapped-app
  (-> app
      wrap-logging
      wrap-params
      (wrap-cors :access-control-allow-origin [#".*"]
                 :access-control-allow-methods [:get :post :options]
                 :access-control-allow-headers ["Content-Type" "Authorization"])))

(defn -main
  [& _args]
  (let [cfg (config/config)]
    (println "Starting vexx...")
    (println (str "Config: " (dissoc cfg :api-key)))
    (println (str "Server running on http://" (:host cfg) ":" (:port cfg)))
    (jetty/run-jetty #'wrapped-app {:host (:host cfg)
                                    :port (:port cfg)
                                    :join? true})))
