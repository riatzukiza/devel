(ns promethean.bridge.cephalon-ts
  (:require [clojure.string :as str]))

(defonce *app (atom nil))

(defn- env [k]
  (let [v (aget (.-env js/process) k)]
    (when (and v (not= v "")) v)))

(defn- normalize-bot-id [bot-id]
  (let [normalized (-> (or bot-id "duck")
                       str
                       str/trim
                       str/lower-case
                       (str/replace #"[\s_]+" "-"))]
    (case normalized
      "open-hax" "openhax"
      "openhax" "openhax"
      "open-skull" "openskull"
      "openskull" "openskull"
      "error-bot" "error"
      "discord-error-bot" "error"
      "janitor-duck" "janitor"
      "janitorduck" "janitor"
      "" "duck"
      normalized)))

(defn- bot-token-env [bot-id]
  (case (normalize-bot-id bot-id)
    "duck" "DUCK_DISCORD_TOKEN"
    "openhax" "OPENHAX_DISCORD_TOKEN"
    "openskull" "OPEN_SKULL_DISCORD_TOKEN"
    "error" "DISCORD_ERROR_BOT_TOKEN"
    "janitor" "JANITOR_DISCORD_TOKEN"
    (str (-> (normalize-bot-id bot-id)
             (str/replace #"-" "_")
             str/upper-case)
         "_DISCORD_TOKEN")))

(defn- resolve-bot-id [config]
  (normalize-bot-id (or (:bot-id config)
                        (:botId config)
                        (:bot_id config)
                        (env "CEPHALON_BOT_ID")
                        (env "BOT_ID")
                        (env "CEPHALON_NAME")
                        "duck")))

(defn- resolve-discord-token [config]
  (or (:discord-token config)
      (:discordToken config)
      (env "DISCORD_BOT_TOKEN")
      (env (bot-token-env (resolve-bot-id config)))
      (env "DISCORD_TOKEN")
      (env "DUCK_DISCORD_TOKEN")))

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
     (let [bot-id (resolve-bot-id config)
           token (resolve-discord-token config)
           config (cond-> config
                    bot-id (assoc :bot-id bot-id)
                    token (assoc :discord-token token))]
       (if (not token)
         (do
           (js/console.warn (str "[cephalon-cljs] " (bot-token-env bot-id) "/DISCORD_TOKEN not set; TS Cephalon not started"))
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
