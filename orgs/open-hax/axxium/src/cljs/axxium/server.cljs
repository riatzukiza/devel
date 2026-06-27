(ns axxium.server
  "Axxium HTTP server.
   Fastify-based, serving the identity provider API and portal."
  (:require [axxium.config :as cfg]
            [axxium.db :as db]
            [axxium.routes.auth :as auth-routes]
            [axxium.routes.actor :as actor-routes]
            [axxium.routes.health :as health-routes]
            ["fastify" :default Fastify]
            ["@fastify/cors" :default fastifyCors]
            ["@fastify/cookie" :default fastifyCookie]
            ["@fastify/static" :default fastifyStatic]
            ["node:path" :as path]))

(defn- create-app
  "Create and configure the Fastify application.
   Returns a promise that resolves with the configured app."
  []
  (let [app (Fastify #js {:logger true})]
    (-> (.register app fastifyCors
                   #js {:origin true
                        :credentials true
                        :methods #js ["GET" "POST" "PUT" "DELETE" "OPTIONS"]
                        :allowedHeaders #js ["Authorization" "Content-Type" "X-Requested-With"]})
        (.then (fn [_] (.register app fastifyCookie)))
        (.then (fn [_] app)))))

(defn- register-routes!
  "Register all API routes on the app."
  [app]
  (health-routes/register-health-routes! app)
  (auth-routes/register-auth-routes! app)
  (actor-routes/register-actor-routes! app))

(defn- register-static!
  "Register static file serving for the portal."
  [app]
  (.register app fastifyStatic
             #js {:root (.resolve path "resources" "public")
                  :prefix "/portal/"}))

(defn start!
  "Start the Axxium server.
   Initializes database schema and starts listening."
  []
  (println "Starting Axxium identity kernel...")
  (-> (db/init-schema!)
      (.then (fn [_]
               (println "Database schema initialized")
               (create-app)))
      (.then (fn [app]
               (register-routes! app)
               (register-static! app)
               (.listen app
                        #js {:port (cfg/get-in-config [:axxium/port])
                             :host (cfg/get-in-config [:axxium/host])})))
      (.then (fn [address]
               (println (str "Axxium listening on " address))
               (println (str "Portal: " (cfg/get-in-config [:axxium/public-base-url]) "/portal/index.html"))))
      (.catch (fn [err]
                (println "Failed to start Axxium:" (.-message err))
                (println "Error stack:" (.-stack err))
                (js/process.exit 1)))))

;; Entry point for shadow-cljs :init-fn
;; (start!) is called automatically by shadow-cljs
