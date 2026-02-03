(ns promethean.bridge.cephalon-ts)

(defonce *app (atom nil))

(defn- env [k]
  (let [v (aget (.-env js/process) k)]
    (when (and v (not= v "")) v)))

(defn- ->js-opts [m]
  (let [m (or m {})
        bot-id (or (:bot-id m) (:botId m) (:bot_id m))
        opts {:botId bot-id
              :cephalonId (or (:cephalon-id m) (:cephalonId m))
              :discordToken (or (:discord-token m) (:discordToken m))
              :mongoUri (or (:mongo-uri m) (:mongoUri m))
              :mongoDbName (or (:mongo-db-name m) (:mongoDbName m))
              :mongoCollectionName (or (:mongo-collection-name m) (:mongoCollectionName m))
              :chromaUrl (or (:chroma-url m) (:chromaUrl m))
              :chromaCollectionName (or (:chroma-collection-name m) (:chromaCollectionName m))
              :memoryUiEnabled (or (:memory-ui-enabled m) (:memoryUiEnabled m))
              :memoryUiPort (or (:memory-ui-port m) (:memoryUiPort m))
              :policyOverrides (or (:policy-overrides m) (:policyOverrides m))
              :sessions (or (:sessions m) nil)
              :tick (or (:tick m) nil)}]
    (clj->js (into {} (remove (fn [[_ v]] (nil? v)) opts)))))

(defn- require-cephalon-ts []
  (js/require "@promethean-os/cephalon-ts"))

(defn create-cephalon-app!
  "Create a new Cephalon application instance."
  [options]
  (let [cephalon (require-cephalon-ts)]
    (.createCephalonApp cephalon (clj->js options))))

(defn start-cephalon!
  "Start a Cephalon application instance."
  [app]
  (.start app))

(defn start!
  ([]
   (start! {}))
  ([config]
   (when-not @*app
     (let [env-token (or (env "DUCK_DISCORD_TOKEN")
                         (env "DISCORD_TOKEN"))
           config (if (and env-token
                           (nil? (:discord-token config))
                           (nil? (:discordToken config)))
                    (assoc config :discord-token env-token)
                    config)
           token (or (:discord-token config) (:discordToken config))]
       (if (not token)
         (do
           (js/console.warn "[cephalon-cljs] DUCK_DISCORD_TOKEN/DISCORD_TOKEN not set; TS Cephalon not started")
           (js/Promise.resolve nil))
          (-> (create-cephalon-app! (->js-opts config))
              (.then (fn [app]
                       (reset! *app app)
                       (.start app)))
             (.catch (fn [err]
                       (js/console.error "[cephalon-cljs] Failed to start TS Cephalon" err)
                       (throw err)))))))))

(defn stop! []
  (when-let [app @*app]
    (-> (.stop app "cljs")
        (.finally (fn [] (reset! *app nil))))))
