(ns promethean.main
  "Cephalon main entry point — canonical CLJS runtime."
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
    [promethean.llm.turn-processor :as turn-processor]
    [promethean.adapters.fs :as fs]
    [promethean.adapters.discord :as discord]
    [promethean.memory.store :as mem.store]
    [promethean.memory.mongodb-store :as mongodb]
    [promethean.eidolon.nexus-index :as nexus.store]
    [promethean.eidolon.vector-store :as vec.store]
    [promethean.circuits.octave :as circuits]
    [promethean.runtime.scheduler :as scheduler]
    [promethean.tools.registry :as tool-registry]
    [promethean.tools.executor :as tool-executor]
    [promethean.tools.memory :as tools.memory]
    [promethean.tools.web :as tools.web]
    [promethean.tools.discord :as tools.discord]
    [promethean.bridge.cephalon-ts :as cephalon-ts]))

;; Forward declarations
(declare bootstrap-circuits handle-circuit-tick!)

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
                         :retain-completed 600}
               :enable-circuits (not= "false" (or (.-CEPHALON_ENABLE_CIRCUITS js/process.env) "true"))}
     :paths {:notes-dir "docs/notes"}
     :models {:sentinel "qwen3-vl-2b"
              :embedding "qwen3-embedding"}}))

;; ============================================================================
;; Tools Registry Setup
;; ============================================================================

(defn setup-tools-registry [env]
  (let [registry (tool-registry/make-registry)
        deps {:memory-store (get-in env [:stores :mem])
              :discord-adapter (get-in env [:adapters :discord])
              :fs-adapter (get-in env [:adapters :fs])}
        ;; Register tools directly - they're defined with def-tool
        registry (tool-registry/register-tools registry
                  [tools.memory/memory-lookup
                   tools.memory/memory-pin
                   tools.memory/memory-recent
                   tools.web/web-fetch
                   tools.web/web-search
                   tools.web/github-search])]
    (tool-executor/make-executor registry deps)))

;; ============================================================================
;; Environment
;; ============================================================================

(defn make-env [config world*]
  (let [openai (llm.openai/make-client {:api-key (get-in config [:openai :api-key])
                                        :base-url (get-in config [:openai :base-url])})
        fsapi  (fs/make-fs)
        disc   (discord/make-discord {:token (get-in config [:discord :bot-token])})
        
        ;; Determine if MongoDB should be used
        mongo-uri (or (.-MONGODB_URI js/process.env)
                      (.-CEPHALON_MONGODB_URI js/process.env))
        mongo-db (or (.-CEPHALON_MONGODB_DB js/process.env)
                     (.-MONGODB_DB js/process.env)
                     "cephalon")
        mongo-collection (or (.-CEPHALON_MONGODB_COLLECTION js/process.env)
                             "memories")
        
        ;; Create stores (use MongoDB if configured, otherwise in-memory)
        stores (if mongo-uri
                 {:mem (mongodb/make-mongodb-store {:uri mongo-uri
                                                    :database mongo-db
                                                    :collection mongo-collection})
                  :nexus (nexus.store/make-index)
                  :vectors (vec.store/make-store)}
                 {:mem (mem.store/make-store)
                  :nexus (nexus.store/make-index)
                  :vectors (vec.store/make-store)})
        
        ;; Setup tools
        tool-executor (setup-tools-registry {:stores stores
                                             :adapters {:fs fsapi :discord disc}})
        
        ;; Create turn processor
        turn-proc (turn-processor/make-turn-processor
                    openai
                    tool-executor
                    (:mem stores)
                    nil ;; event bus TODO
                    config)
        
        ;; Create scheduler
        sched (scheduler/make-scheduler)
        
        ;; Resolve circuits
        resolved-circuits (circuits/resolve-all-circuits (.-env js/process.env))]
    
    ;; Return environment map
    {:config config
     :runtime {:scheduler sched}
     :circuits {:all resolved-circuits}
     :processors {:turn turn-proc}
     :stores stores
     :clients {:openai openai}
     :adapters {:fs fsapi :discord disc}
     :tool-executor tool-executor}))

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
             :effects/stats {:started 0 :done 0 :failed 0}
             :circuits/scheduler (get-in env [:runtime :scheduler]))
      (bootstrap-circuits env)
      (sys.cephalon/bootstrap-duck)
      (sys.sentinel/bootstrap-docs-notes-sentinel)))

;; ============================================================================
;; Bootstrap Circuits
;; ============================================================================

(defn bootstrap-circuits [env]
  (let [circuits (get-in env [:circuits :all])
        scheduler (get-in env [:runtime :scheduler])]
    (reduce
      (fn [w circuit]
        (let [session-id (:circuit/id circuit)]
          ;; Create session entity for each circuit
          (world/add-entity w session-id
            {:session/id session-id
             :session/name session-id
             :session/circuit circuit
             :session/status :idle
             :session/queue []
             :session/recent []
             :session/persona (:circuit/persona circuit)
             :session/system-prompt (:circuit/system-prompt circuit)
             :session/developer-prompt (:circuit/developer-prompt circuit)
             :session/tool-permissions (:circuit/tool-permissions circuit)
             :session/model (:circuit/model circuit)
             :session/priority-class (:circuit/priority-class circuit)})))
      (world/empty-world)
      circuits)))

;; ============================================================================
;; Circuit Tick Handler
;; ============================================================================

(defn handle-circuit-tick! [env world* circuit-id]
  (let [scheduler (get-in env [:runtime :scheduler])
        turn-proc (get-in env [:processors :turn])
        session (world/get-entity @world* circuit-id)
        circuit (:session/circuit session)
        interval-ms (:circuit/interval-ms circuit)
        callback (fn [cid]
                  (log/info "Circuit tick" {:circuit cid})
                  (let [event {:event/id (str (random-uuid))
                               :event/ts (.now js/Date)
                               :event/type :circuit.tick
                               :event/source {:kind :circuit :circuit-id cid}
                               :event/payload {:circuit-id cid
                                               :tick-number (inc (get @scheduler :tick-number 0))}}]
                    ;; Route to session queue
                    (swap! world* update-in [:entities cid :session/queue] conj event)
                    ;; Trigger turn processor if session is idle
                    (when (= :idle (:session/status (world/get-entity @world* cid)))
                      (turn-processor/process-turn turn-proc session event))))]
    ;; Schedule next tick
    (scheduler/schedule-circuit! scheduler circuit-id callback interval-ms interval-ms)))

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
                    (tick/tick dt systems w1)))))
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
                               {:error (.-message err)}))))))))

(defn -main []
  (let [config (make-config)
        world* (atom nil)]
    (-> (make-env config world*)
        (.then
          (fn [env]
            ;; Initialize MongoDB if configured
            (let [mongo-store (get-in env [:stores :mem])
                  init-promise (if (and mongo-store (.-initialize mongo-store))
                                 (mongodb/initialize mongo-store)
                                 (js/Promise.resolve nil))]
              (-> init-promise
                  (.then
                    (fn [_]
                      (reset! world* (init-world env))
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
                                   :embedding-model (get-in config [:models :embedding])
                                   :circuits-enabled (get-in config [:runtime :enable-circuits])})
                        (fs/start-notes-watcher! env world* (get-in config [:paths :notes-dir]))
                        (discord/start-discord! (get-in env [:adapters :discord]) world*)
                        (when (get-in config [:runtime :enable-circuits])
                          (let [scheduler (get-in env [:runtime :scheduler])
                                circuits (get-in env [:circuits :all])
                                bot-id (get-in config [:discord :bot-id])]
                            (doseq [circuit circuits]
                              (let [cid (:circuit/id circuit)
                                    interval-ms (:circuit/interval-ms circuit)
                                    initial-delay (scheduler/resolve-initial-delay-ms
                                                    {:bot-id bot-id
                                                     :session-id cid
                                                     :interval-ms interval-ms
                                                     :max-jitter-ms 30000})]
                                (scheduler/schedule-circuit! scheduler cid
                                                              (partial handle-circuit-tick! env world*)
                                                              initial-delay
                                                              interval-ms)))))
                        (start-ts-bridge! config)
                        (run-loop! world* systems {:tick-ms (get-in config [:runtime :tick-ms])}))))
                  (.catch
                    (fn [err]
                      (log/error "Failed to initialize" {:error (str err)})))))))
        (.catch
          (fn [err]
            (log/error "Failed to create environment" {:error (str err)}))))))

(set! *main-cli-fn* -main)
