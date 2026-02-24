# v2 wiring: effect-id routing + Discord adapter + session queue stores full events #shadowcljs #ecs #effects #discord

This pass makes the runtime *stop guessing* which result belongs to whom:

* every async effect has an `:effect/id`
* Sentinel + Session store `:*/awaiting` = that id
* they only accept `*.result` / `*.error` events whose `:effect-id` matches
* session queues store **full event maps** (not ids), so events don’t “evaporate” after a tick

Also included: a minimal Discord adapter (receive + send) and `:discord/send` effect support.

> Full-file replacements below (no diffs).

---

## `src/promethean/sys/route.cljs`

```clojure
(ns promethean.sys.route
  (:require [promethean.ecs.world :as world]))

(defn- matches-filter? [evt flt]
  (and (= (:event/type evt) (:event/type flt))
       (or (nil? (:discord/channel-id flt))
           (= (get-in evt [:event/source :channel-id])
              (:discord/channel-id flt)))))

(defn- session-wants? [session evt]
  (let [subs (:session/subscriptions session)
        filters (get-in subs [:filters] [])]
    (some #(matches-filter? evt %) filters)))

(defn sys-route-events->sessions [w]
  (let [session-eids (world/entities-with w [:session/name :session/subscriptions :session/queue])
        events (:events/in w)]
    (reduce
      (fn [w eid]
        (let [s (world/get-entity w eid)
              wanted (filter #(session-wants? s %) events)]
          (if (seq wanted)
            ;; IMPORTANT: store full events (not ids)
            (world/update-entity w eid update :session/queue into (vec wanted))
            w)))
      w
      session-eids)))
```

---

## `src/promethean/sys/effects.cljs`

```clojure
(ns promethean.sys.effects
  (:require
    [promethean.debug.log :as log]
    [promethean.llm.openai :as llm.openai]
    [promethean.adapters.fs :as fs]
    [promethean.adapters.discord :as discord]))

(defn now-ms [] (.now js/Date))

(defn- effect->evt-type [etype suffix]
  (let [ns (or (namespace etype) "effect")
        nm (name etype)]
    (keyword ns (str nm "." suffix))))

(defn- make-event [{:keys [type source payload]}]
  {:event/id (str (random-uuid))
   :event/ts (now-ms)
   :event/type type
   :event/source source
   :event/payload payload})

(defn- append-event! [world* evt]
  (swap! world* update :events/out conj evt))

(defn- assoc-pending! [world* effect-id m]
  (swap! world* assoc-in [:effects/pending effect-id] m))

(defn- update-pending! [world* effect-id f & args]
  (apply swap! world* update-in [:effects/pending effect-id] f args))

(defn- bump-stat! [world* k]
  (swap! world* update-in [:effects/stats k] (fnil inc 0)))

(defn- promise-timeout [p timeout-ms]
  (if (and timeout-ms (pos? timeout-ms))
    (js/Promise.race
      #js [p
           (js/Promise.
             (fn [_resolve reject]
               (js/setTimeout
                 (fn []
                   (reject (js/Error. (str "effect timeout after " timeout-ms "ms"))))
                 timeout-ms)))])
    p))

(defn- run-effect-promise! [env effect]
  (let [etype (:effect/type effect)]
    (case etype
      :fs/read
      (fs/read-file! (get-in env [:adapters :fs]) (:path effect))

      :fs/write
      (fs/write-file! (get-in env [:adapters :fs]) (:path effect) (:content effect))

      :llm/chat
      (let [client (get-in env [:clients :openai])]
        (llm.openai/chat! client (select-keys effect
                                              [:model :messages :tools :tool-choice :temperature :max-tokens])))

      :discord/send
      (discord/send-message! (get-in env [:adapters :discord])
                             (:channel-id effect)
                             (:content effect))

      (js/Promise.reject (js/Error. (str "unknown effect type: " (pr-str etype)))))))

(defn- start-effect! [env world* effect]
  (let [cfg (get-in env [:config :runtime :effects] {})
        timeout-ms (get cfg :timeout-ms 60000)
        effect-id (:effect/id effect)
        etype (:effect/type effect)
        started-ts (now-ms)]

    ;; mark running in the authoritative world
    (update-pending! world* effect-id
                     (fn [m]
                       (-> m
                           (assoc :status :running
                                  :started-ts started-ts)
                           (update :effect merge effect))))

    (bump-stat! world* :started)

    (-> (run-effect-promise! env effect)
        (promise-timeout timeout-ms)
        (.then
          (fn [res]
            (let [evt (make-event
                        {:type (effect->evt-type etype "result")
                         :source {:kind :effects :effect-id effect-id}
                         :payload {:effect-id effect-id
                                   :effect effect
                                   :result (js->clj res :keywordize-keys true)}})]
              (update-pending! world* effect-id assoc :status :done :done-ts (now-ms))
              (bump-stat! world* :done)
              (append-event! world* evt)
              nil)))
        (.catch
          (fn [err]
            (let [evt (make-event
                        {:type (effect->evt-type etype "error")
                         :source {:kind :effects :effect-id effect-id}
                         :payload {:effect-id effect-id
                                   :effect effect
                                   :error (str err)}})]
              (update-pending! world* effect-id assoc :status :failed :done-ts (now-ms) :error (str err))
              (bump-stat! world* :failed)
              (append-event! world* evt)
              nil))))))

(defn- inflight-count [pending]
  (reduce (fn [n [_ v]] (if (= :running (:status v)) (inc n) n))
          0
          pending))

(defn- queued-entries [pending]
  (->> pending
       (keep (fn [[id v]] (when (= :queued (:status v)) [id v])))
       (sort-by (fn [[id v]]
                  [(get v :enqueued-ts 0) id]))))

(defn- prune-completed [pending retain]
  (let [retain (or retain 500)
        completed (->> pending
                       (filter (fn [[_id v]] (#{:done :failed} (:status v))))
                       (sort-by (fn [[_id v]] (:done-ts v)) >))
        keep-ids (into #{} (map first) (take retain completed))]
    (reduce (fn [m [id v]]
              (if (or (#{:running :queued} (:status v))
                      (contains? keep-ids id))
                (assoc m id v)
                m))
            {}
            pending)))

(defn- enqueue-pending [w effects]
  (reduce
    (fn [w eff]
      (let [eid (:effect/id eff)]
        (if (get-in w [:effects/pending eid])
          w
          (assoc-in w [:effects/pending eid]
                    {:effect (assoc eff :effect/enqueued-ts (now-ms))
                     :status :queued
                     :enqueued-ts (now-ms)}))))
    w
    effects))

(defn sys-effects-flush [w]
  (let [env (:env w)
        world* (get-in env [:runtime :world*])
        cfg (get-in env [:config :runtime :effects] {})
        max-inflight (get cfg :max-inflight 4)
        retain (get cfg :retain-completed 500)

        w1 (enqueue-pending w (:effects w))
        pending1 (:effects/pending w1)

        pending2 (prune-completed pending1 retain)
        w2 (assoc w1 :effects/pending pending2)

        inflight (inflight-count pending2)
        capacity (max 0 (- max-inflight inflight))
        to-start (take capacity (queued-entries pending2))

        ;; mark running in returned world deterministically
        w3 (reduce
             (fn [w [id v]]
               (assoc-in w [:effects/pending id]
                         (assoc v :status :running :started-ts (now-ms))))
             w2
             to-start)]

    ;; start async work (writes results into world* :events/out)
    (when (and world* (seq to-start))
      (doseq [[id v] to-start]
        (start-effect! env world* (:effect v))))

    w3))
```

---

## `src/promethean/sys/sentinel.cljs`

```clojure
(ns promethean.sys.sentinel
  (:require
    [promethean.ecs.world :as world]
    [promethean.contracts.markdown-frontmatter :as fm]))

(defn bootstrap-docs-notes-sentinel [w]
  (let [eid (str (random-uuid))]
    (world/add-entity
      w eid
      {:sentinel/name "notes-frontmatter"
       :sentinel/state :idle
       :sentinel/retries {:attempt 0 :max 5}
       :sentinel/input nil
       :sentinel/awaiting nil
       :sentinel/error nil})))

(defn- enqueue-effect [w eff]
  (update w :effects conj eff))

(defn- find-awaiting [events etype awaiting-id]
  (first
    (filter
      (fn [evt]
        (and (= (:event/type evt) etype)
             (= (get-in evt [:event/payload :effect-id]) awaiting-id)))
      events)))

(defn- retry-or-fail [w sentinel-eid reason]
  (let [{:keys [attempt max]} (get-in (world/get-entity w sentinel-eid) [:sentinel/retries])]
    (if (< attempt max)
      (-> w
          (world/update-entity sentinel-eid
                               (fn [s]
                                 (-> s
                                     (update-in [:sentinel/retries :attempt] inc)
                                     (assoc :sentinel/state :retry
                                            :sentinel/error reason
                                            :sentinel/awaiting nil)))))
      (world/update-entity w sentinel-eid assoc
                           :sentinel/state :failed
                           :sentinel/error reason
                           :sentinel/awaiting nil))))

(defn- llm-prompt [md attempt]
  (str
    "You are a contract agent. Add YAML frontmatter with keys:\n"
    "- title: string\n"
    "- slug: string (lowercase, dash separated)\n"
    "- description: string\n"
    "- tags: list of strings\n\n"
    "Return the full updated markdown file.\n\n"
    (when (pos? attempt)
      (str "NOTE: You previously failed validation. Ensure frontmatter matches requirements exactly.\n\n"))
    "INPUT:\n"
    md))

(defn- start-read [w sentinel-eid path]
  (let [effect-id (str (random-uuid))]
    (-> w
        (world/update-entity sentinel-eid assoc
                             :sentinel/state :reading
                             :sentinel/input {:path path}
                             :sentinel/awaiting effect-id
                             :sentinel/error nil)
        (enqueue-effect {:effect/type :fs/read
                         :effect/id effect-id
                         :path path
                         :meta {:sentinel sentinel-eid}}))))

(defn- start-llm [w sentinel-eid md]
  (let [effect-id (str (random-uuid))
        model (get-in w [:env :config :models :sentinel] "qwen3-vl-2b")
        attempt (get-in (world/get-entity w sentinel-eid) [:sentinel/retries :attempt] 0)]
    (-> w
        (world/update-entity sentinel-eid assoc :sentinel/state :llm :sentinel/awaiting effect-id)
        (enqueue-effect {:effect/type :llm/chat
                         :effect/id effect-id
                         :model model
                         :messages [{:role "system" :content "Return only the updated markdown file. No commentary."}
                                    {:role "user" :content (llm-prompt md attempt)}]
                         :temperature 0
                         :meta {:sentinel sentinel-eid}}))))

(defn- start-write [w sentinel-eid path md]
  (let [effect-id (str (random-uuid))]
    (-> w
        (world/update-entity sentinel-eid assoc :sentinel/state :writing :sentinel/awaiting effect-id)
        (enqueue-effect {:effect/type :fs/write
                         :effect/id effect-id
                         :path path
                         :content md
                         :meta {:sentinel sentinel-eid}}))))

(defn sys-sentinel [w]
  (let [sentinels (world/entities-with w [:sentinel/name :sentinel/state])
        events (:events/in w)]
    (reduce
      (fn [w seid]
        (let [s (world/get-entity w seid)
              st (:sentinel/state s)
              awaiting (:sentinel/awaiting s)]
          (cond
            ;; idle: respond to fs events
            (= st :idle)
            (if-let [evt (first (filter #(#{:fs.file/created :fs.file/modified} (:event/type %)) events))]
              (start-read w seid (get-in evt [:event/payload :path]))
              w)

            ;; reading: wait for matching fs/read result or error
            (= st :reading)
            (cond
              (find-awaiting events :fs/read.error awaiting)
              (retry-or-fail w seid "fs/read failed")

              (let [evt (find-awaiting events :fs/read.result awaiting)]
                (when evt
                  (let [md (get-in evt [:event/payload :result])]
                    (start-llm (world/update-entity w seid assoc :sentinel/awaiting nil) seid md))))

              :else w)

            ;; llm: wait for matching llm/chat result or error
            (= st :llm)
            (cond
              (find-awaiting events :llm/chat.error awaiting)
              (retry-or-fail w seid "llm/chat failed")

              (let [evt (find-awaiting events :llm/chat.result awaiting)]
                (when evt
                  (let [resp (get-in evt [:event/payload :result])
                        content (get-in resp [:choices 0 :message :content] "")
                        path (get-in s [:sentinel/input :path])]
                    (if (fm/valid-frontmatter? content)
                      (start-write (world/update-entity w seid assoc :sentinel/awaiting nil) seid path content)
                      (retry-or-fail w seid "frontmatter validation failed"))))

              :else w)

            ;; writing: wait for matching fs/write result or error
            (= st :writing)
            (cond
              (find-awaiting events :fs/write.error awaiting)
              (retry-or-fail w seid "fs/write failed")

              (find-awaiting events :fs/write.result awaiting)
              (world/update-entity w seid assoc :sentinel/state :done :sentinel/awaiting nil)

              :else w)

            ;; retry: re-read same file
            (= st :retry)
            (let [path (get-in s [:sentinel/input :path])]
              (start-read (world/update-entity w seid assoc :sentinel/state :idle) seid path))

            :else w)))
      w
      sentinels)))
```

---

## `src/promethean/sys/cephalon.cljs`

```clojure
(ns promethean.sys.cephalon
  (:require
    [clojure.string :as str]
    [promethean.ecs.world :as world]))

(defn bootstrap-duck [w]
  (let [ceph-eid (str (random-uuid))
        sess-eid (str (random-uuid))]
    (-> w
        (world/add-entity ceph-eid
                          {:cephalon/name "Duck"
                           :cephalon/policy {:model "qwen3-vl-2b"
                                             :max-tokens 512
                                             ;; where janitor reports go by default:
                                             :report-channel-id "450688080542695436"}
                           :cephalon/shared-state {}
                           :cephalon/sessions #{sess-eid}})
        (world/add-entity sess-eid
                          {:session/name "janitor"
                           :session/cephalon ceph-eid
                           :session/circuit :c1-survival
                           :session/focus "mvp janitor"
                           :session/subscriptions
                           {:hard-locked true
                            :filters [{:event/type :discord.message/new :discord/channel-id "343299242963763200"}
                                      {:event/type :discord.message/new :discord/channel-id "450688080542695436"}
                                      {:event/type :discord.message/new :discord/channel-id "343179912196128792"}
                                      {:event/type :discord.message/new :discord/channel-id "367156652140658699"}]}
                           :session/queue []        ;; stores full events now
                           :session/recent []       ;; ring buffer of strings
                           :session/persistent []
                           :session/status :idle
                           :session/awaiting nil
                           :session/budgets {:llm-per-tick 1}}))))

(defn- enqueue-effect [w eff]
  (update w :effects conj eff))

(defn- take-queue [s n]
  (let [q (:session/queue s)]
    [(vec (take n q)) (vec (drop n q))]))

(defn- find-awaiting [events etype awaiting-id]
  (first
    (filter
      (fn [evt]
        (and (= (:event/type evt) etype)
             (= (get-in evt [:event/payload :effect-id]) awaiting-id)))
      events)))

(defn- event->recent-line [evt]
  (let [t (:event/type evt)]
    (case t
      :discord.message/new
      (let [p (:event/payload evt)]
        (str "discord[" (get-in evt [:event/source :channel-id]) "] "
             (when (get p :author-bot) "[bot] ")
             (subs (or (get p :content) "") 0 (min 300 (count (or (get p :content) ""))))))

      :fs.file/created  (str "file created: " (get-in evt [:event/payload :path]))
      :fs.file/modified (str "file modified: " (get-in evt [:event/payload :path]))
      (str "event: " (pr-str t)))))

(defn- build-messages [ceph recent-lines]
  (let [sys (str "You are " (:cephalon/name ceph) ". "
                 "You are always running. Keep replies short and operational. "
                 "If you see repeated bot spam, summarize it as a family pattern.")
        user (str "Recent events:\n"
                  (str/join "\n" (map #(str "- " %) recent-lines))
                  "\n\nRespond with:\n"
                  "1) one-line status\n2) bullet list of any spam families or duplicates you noticed\n"
                  "3) one recommended action")]
    [{:role "system" :content sys}
     {:role "user" :content user}]))

(defn sys-cephalon [w]
  (let [session-eids (world/entities-with w [:session/name :session/status :session/queue])
        events (:events/in w)]
    (reduce
      (fn [w seid]
        (let [s (world/get-entity w seid)
              status (:session/status s)
              awaiting (:session/awaiting s)
              ceph (world/get-entity w (:session/cephalon s))
              {:keys [llm-per-tick]} (:session/budgets s)]

          (cond
            ;; start a brain step if idle and queued
            (and (= status :idle) (pos? llm-per-tick) (seq (:session/queue s)))
            (let [[taken remaining] (take-queue s 8)
                  recent-lines (map event->recent-line taken)
                  model (get-in ceph [:cephalon/policy :model])
                  max-tokens (get-in ceph [:cephalon/policy :max-tokens])
                  effect-id (str (random-uuid))
                  messages (build-messages ceph recent-lines)]
              (-> w
                  (world/update-entity seid assoc
                                       :session/queue remaining
                                       :session/recent (vec (take-last 48 (concat (:session/recent s) recent-lines)))
                                       :session/status :blocked
                                       :session/awaiting effect-id)
                  (enqueue-effect {:effect/type :llm/chat
                                   :effect/id effect-id
                                   :model model
                                   :messages messages
                                   :temperature 0
                                   :max-tokens max-tokens
                                   :meta {:session seid}})))

            ;; blocked: wait only for our effect-id
            (= status :blocked)
            (cond
              (find-awaiting events :llm/chat.error awaiting)
              (world/update-entity w seid assoc :session/status :idle :session/awaiting nil)

              (let [evt (find-awaiting events :llm/chat.result awaiting)]
                (when evt
                  (let [resp (get-in evt [:event/payload :result])
                        content (get-in resp [:choices 0 :message :content] "")
                        report-chan (get-in ceph [:cephalon/policy :report-channel-id])
                        send-id (str (random-uuid))]
                    (-> w
                        (world/update-entity seid assoc :session/status :idle :session/awaiting nil :session/last-llm evt)
                        ;; send report (fire-and-forget)
                        (enqueue-effect {:effect/type :discord/send
                                         :effect/id send-id
                                         :channel-id report-chan
                                         :content (str "**janitor report**\n" content)
                                         :meta {:session seid}})))))

              :else w)

            :else w)))
      w
      session-eids)))
```

---

## `src/promethean/adapters/discord.cljs`

```clojure
(ns promethean.adapters.discord)

(defn now-ms [] (.now js/Date))

(defn make-discord [{:keys [token]}]
  ;; Uses discord.js if available; otherwise send-only via fetch could be added.
  (let [discord (js/require "discord.js")
        Client (.-Client discord)
        GatewayIntentBits (.-GatewayIntentBits discord)
        client (new Client
                    (clj->js {:intents #js [(.-Guilds GatewayIntentBits)
                                           (.-GuildMessages GatewayIntentBits)
                                           ;; requires privileged intent enabled in the bot settings
                                           (.-MessageContent GatewayIntentBits)]})))]
    {:token token
     :discord discord
     :client client
     :ready? (atom false)}))

(defn start-discord! [{:keys [client token ready?]} world*]
  (when (and token (not= "" token))
    (.on client "ready"
         (fn []
           (reset! ready? true)
           (swap! world* update :events/out conj
                  {:event/id (str (random-uuid))
                   :event/ts (now-ms)
                   :event/type :discord/client.ready
                   :event/source {:kind :discord}
                   :event/payload {:ok true}})))
    (.on client "messageCreate"
         (fn [msg]
           (let [channel-id (some-> msg .-channelId str)
                 author (.-author msg)
                 author-id (some-> author .-id str)
                 author-bot (boolean (.-bot author))
                 content (or (some-> msg .-content str) "")
                 msg-id (some-> msg .-id str)]
             (swap! world* update :events/out conj
                    {:event/id (str (random-uuid))
                     :event/ts (now-ms)
                     :event/type :discord.message/new
                     :event/source {:kind :discord
                                    :channel-id channel-id
                                    :author-id author-id
                                    :message-id msg-id}
                     :event/payload {:content content
                                     :author-id author-id
                                     :author-bot author-bot
                                     :message-id msg-id}}))))
    (.login client token)))

(defn send-message! [{:keys [client ready?]} channel-id content]
  (if (and client @ready?)
    (-> (.fetch (.-channels client) channel-id)
        (.then (fn [ch] (.send ch content))))
    (js/Promise.reject (js/Error. "discord client not ready"))))
```

---

## `src/promethean/main.cljs` (wire Discord adapter)

```clojure
(ns promethean.main
  (:require
    [promethean.ecs.world :as world]
    [promethean.ecs.tick :as tick]
    [promethean.sys.route :as sys.route]
    [promethean.sys.sentinel :as sys.sentinel]
    [promethean.sys.cephalon :as sys.cephalon]
    [promethean.sys.effects :as sys.effects]
    [promethean.debug.log :as log]
    [promethean.llm.openai :as llm.openai]
    [promethean.adapters.fs :as fs]
    [promethean.adapters.discord :as discord]))

(defn now-ms [] (.now js/Date))

(defn make-env [config world*]
  (let [openai (llm.openai/make-client {:api-key (get-in config [:openai :api-key])
                                        :base-url (get-in config [:openai :base-url])})
        fsapi  (fs/make-fs)
        disc   (discord/make-discord {:token (get-in config [:discord :bot-token])})]
    {:config config
     :runtime {:world* world*}
     :clients {:openai openai}
     :adapters {:fs fsapi
                :discord disc}}))

(defn init-world [env]
  (-> (world/empty-world)
      (assoc :env env
             :events/in []
             :events/out []
             :effects []
             :effects/pending {}
             :effects/stats {:started 0 :done 0 :failed 0})
      (sys.cephalon/bootstrap-duck)
      (sys.sentinel/bootstrap-docs-notes-sentinel)))

(defn run-loop! [world* systems {:keys [tick-ms]}]
  (let [last* (atom (now-ms))]
    (js/setInterval
      (fn []
        (let [t (now-ms)
              dt (- t @last*)]
          (reset! last* t)
          (swap! world*
                 (fn [w]
                   (let [incoming (:events/out w)]
                     (-> w
                         (assoc :events/in (vec incoming))
                         (assoc :events/out [])
                         (assoc :effects [])
                         (tick/tick dt systems)))))))
      tick-ms)))

(defn -main []
  (let [config {:openai {:api-key (or (.-OPENAI_API_KEY js/process.env) "")
                         :base-url (or (.-OPENAI_BASE_URL js/process.env) "https://api.openai.com/v1")}
                :discord {:bot-token (or (.-DISCORD_BOT_TOKEN js/process.env) "")}
                :runtime {:tick-ms 100
                          :effects {:max-inflight 6
                                    :timeout-ms 60000
                                    :retain-completed 500}}
                :paths {:notes-dir "docs/notes"}
                :models {:sentinel "qwen3-vl-2b"}}

        world* (atom nil)
        env (make-env config world*)
        w0 (init-world env)]

    (reset! world* w0)

    (let [systems [sys.route/sys-route-events->sessions
                   sys.sentinel/sys-sentinel
                   sys.cephalon/sys-cephalon
                   sys.effects/sys-effects-flush]]

      (log/info "promethean brain starting"
                {:tick-ms (get-in config [:runtime :tick-ms])
                 :notes-dir (get-in config [:paths :notes-dir])
                 :discord? (not= "" (get-in config [:discord :bot-token]))})

      ;; adapters push events into :events/out
      (fs/start-notes-watcher! env world* (get-in config [:paths :notes-dir]))
      (discord/start-discord! (get-in env [:adapters :discord]) world*)

      (run-loop! world* systems {:tick-ms (get-in config [:runtime :tick-ms])}))))

(set! *main-cli-fn* -main)
```

---

## What you have now

* Sentinel + Cephalon can safely run concurrently without stealing each other’s async responses.
* Effects are fully async-safe (results always come back as events with `:effect-id`).
* Sessions receive real Discord events (if bot token + intents are enabled).
* Janitor posts to channel `450688080542695436` by default (override by changing `:cephalon/policy`).

---

## Next implementation step (the “real” Promethean feel)

Right now the cephalon is still “just chatting about recent events.”

Next is to wire the memory pipeline + eidolon retrieval:

1. `sys.memory.ingest` — create memories for events, dedupe discord, derive nexus keys
2. `sys.eidolon.search` — vector seeds + daimoi expansion → `related`
3. Replace `build-messages` to assemble:

   * `[...related ...persistent ...recent]`

If you say “continue”, I’ll drop in the next full files:

* `src/promethean/memory/normalize.cljs`
* `src/promethean/memory/dedupe.cljs` (discord message-id + content hash)
* `src/promethean/eidolon/nexus_keys.cljs` (typed key derivation)
* `src/promethean/eidolon/daimoi.cljs` (neighbors from a simple in-memory nexus index)
