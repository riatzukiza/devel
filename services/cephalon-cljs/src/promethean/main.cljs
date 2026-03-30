(ns promethean.main
  "Cephalon main entry point"
  (:require
    [clojure.string :as str]
    [source-map-support :refer [install]]
    [promethean.ecs.world :as world]
    [promethean.ecs.tick :as tick]
    [promethean.sys.route :as sys.route]
    [promethean.sys.memory :as sys.memory]
    [promethean.sys.eidolon :as sys.eidolon]
    [promethean.sys.eidolon-vectors :as sys.eidolon-vectors]
    [promethean.sys.sentinel :as sys.sentinel]
    [promethean.sys.cephalon :as sys.cephalon]
    [promethean.sys.effects :as sys.effects]
    [promethean.debug.log :as log]
    [promethean.llm.openai :as llm.openai]
    [promethean.adapters.fs :as fs]
    [promethean.adapters.discord :as discord]
    [promethean.memory.store :as mem.store]
    [promethean.eidolon.nexus-index :as nexus.store]
    [promethean.eidolon.vector-store :as vec.store]
    [promethean.bridge.cephalon-ts :as cephalon-ts]))

;; Enable source map support for better stack traces
(when-not (exists? js/window)
  (install)
  (set! js/window (js-obj)))

;; ============================================================================
;; Configuration
;; ============================================================================

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

(defn- resolve-bot-id []
  (normalize-bot-id (or (env "CEPHALON_BOT_ID")
                        (env "BOT_ID")
                        (env "CEPHALON_NAME")
                        "duck")))

(defn- resolve-discord-token [bot-id]
  (or (env "DISCORD_BOT_TOKEN")
      (env (bot-token-env bot-id))
      (env "DISCORD_TOKEN")
      (env "DUCK_DISCORD_TOKEN")
      ""))

(defn make-config
  []
  (let [bot-id (resolve-bot-id)]
    {:openai {:api-key (or (.-OPENAI_API_KEY js/process.env) "")
              :base-url (or (.-OPENAI_BASE_URL js/process.env) "https://api.openai.com/v1")}
     :discord {:bot-id bot-id
               :bot-token (resolve-discord-token bot-id)}
     :runtime {:tick-ms 100
               :start-ts-bridge (= "true" (or (.-CEPHALON_TS_BRIDGE js/process.env) "false"))
               :effects {:max-inflight 8
                         :timeout-ms 60000
                         :retain-completed 600}}
     :paths {:notes-dir "docs/notes"}
     :models {:sentinel "qwen3-vl-2b"
              :embedding "qwen3-embedding"}}))

;; ============================================================================
;; Environment
;; ============================================================================

(defn make-env [config world*]
  (let [openai (llm.openai/make-client {:api-key (get-in config [:openai :api-key])
                                        :base-url (get-in config [:openai :base-url])})
        fsapi  (fs/make-fs)
        disc   (discord/make-discord {:token (get-in config [:discord :bot-token])})
        stores {:mem (mem.store/make-store)
                :nexus (nexus.store/make-index)
                :vectors (vec.store/make-store)}]
    {:config config
     :runtime {:world* world*}
     :clients {:openai openai}
     :adapters {:fs fsapi :discord disc}
     :stores stores}))

;; ============================================================================
;; Initialize World
;; ============================================================================

(defn init-world [env]
  (-> (world/empty-world)
      (assoc :env env
             :events-in []
             :events-out []
             :effects []
             :effects/pending {}
             :effects/stats {:started 0 :done 0 :failed 0})
      (sys.cephalon/bootstrap-duck)
      (sys.sentinel/bootstrap-docs-notes-sentinel)))

;; ============================================================================
;; Systems
;; ============================================================================

(defn now-ms [] (.now js/Date))

(defn run-loop! [world* systems {:keys [tick-ms]}]
  (let [last* (atom (now-ms))]
    (js/setInterval
      (fn []
        (let [t (now-ms)
              dt (- t @last*)]
          (reset! last* t)
          (swap! world*
                  (fn [w]
                    (let [incoming (:events-out w)
                          w1 (-> w
                                 (assoc :events-in (vec incoming))
                                 (assoc :events-out [])
                                 (assoc :effects []))]
                      (tick/tick dt systems w1))))))
      tick-ms)))

(defn start-ts-bridge!
  [config]
  (when (true? (get-in config [:runtime :start-ts-bridge]))
    (let [discord-token (get-in config [:discord :bot-token])
          bot-id (get-in config [:discord :bot-id])]
      (-> (cephalon-ts/create-cephalon-app!
            {:botId bot-id
             :discordToken (when (seq discord-token) discord-token)
             :enableProactiveLoop true
             :tickIntervalMs (get-in config [:runtime :tick-ms])})
          (.then (fn [app]
                   (log/info "TypeScript Cephalon app created" {})
                   (aset js/window "cephalon_app" app)
                   (cephalon-ts/start-cephalon! app)))
          (.catch (fn [err]
                    (log/error "Failed to start TypeScript Cephalon"
                               {:error (.-message err)})))))))

(defn -main []
  (let [config (make-config)
        world* (atom nil)
        env (make-env config world*)
        w0 (init-world env)]

    (reset! world* w0)

    (let [systems [sys.route/sys-route-events->sessions
                   sys.memory/sys-memory-ingest
                   sys.eidolon/sys-eidolon-index
                   sys.eidolon-vectors/sys-eidolon-vectors
                   sys.sentinel/sys-sentinel
                   sys.cephalon/sys-cephalon
                   sys.effects/sys-effects-flush]]

      (log/info "promethean brain starting"
                {:tick-ms (get-in config [:runtime :tick-ms])
                 :notes-dir (get-in config [:paths :notes-dir])
                 :bot-id (get-in config [:discord :bot-id])
                 :discord? (not= "" (get-in config [:discord :bot-token]))
                 :embedding-model (get-in config [:models :embedding])})

      (fs/start-notes-watcher! env world* (get-in config [:paths :notes-dir]))
      (discord/start-discord! (get-in env [:adapters :discord]) world*)

      (start-ts-bridge! config)
      (run-loop! world* systems {:tick-ms (get-in config [:runtime :tick-ms])}))))

(set! *main-cli-fn* -main)
