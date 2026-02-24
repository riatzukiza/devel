# v1 effects runner: async-safe results, `:effects/pending`, inflight limits (pure `shadow-cljs`) #shadowcljs #ecs #effects

This iteration makes effects “real”:

* effects get **deduped + tracked** in `:effects/pending`
* runner starts up to **N inflight** effects per tick
* when an effect resolves, it **pushes a `*.result` / `*.error` event** back into the world (via `world*`)
* systems (Sentinel/Cephalon) can now reliably react to `:fs/read.result`, `:llm/chat.result`, etc.

This keeps your simulation/game-loop vibe while still using the OpenAI SDK under the hood (and later you can add Discord effects the same way).

---

## `src/promethean/main.cljs` (updated to wire `world*` into `env`)

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
    [promethean.adapters.fs :as fs]))

(defn now-ms [] (.now js/Date))

(defn make-env [config world*]
  (let [openai (llm.openai/make-client {:api-key (get-in config [:openai :api-key])
                                        :base-url (get-in config [:openai :base-url])})
        fsapi  (fs/make-fs)]
    {:config config
     :runtime {:world* world*}
     :clients {:openai openai}
     :adapters {:fs fsapi}}))

(defn init-world [env]
  (let [w (world/empty-world)]
    (-> w
        (assoc :env env)
        (assoc :events/in [])
        (assoc :events/out [])
        (assoc :effects [])
        (assoc :effects/pending {})   ;; NEW
        (assoc :effects/stats {:started 0 :done 0 :failed 0})
        ;; bootstrap one cephalon + one sentinel for now
        (sys.cephalon/bootstrap-duck)
        (sys.sentinel/bootstrap-docs-notes-sentinel))))

(defn run-loop! [world* systems {:keys [tick-ms]}]
  (let [last* (atom (now-ms))]
    (js/setInterval
      (fn []
        (let [t (now-ms)
              dt (- t @last*)]
          (reset! last* t)
          (swap! world*
                 (fn [w]
                   ;; drain events/out -> events/in atomically
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
                :runtime {:tick-ms 100
                          :effects {:max-inflight 4
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
                 :max-inflight (get-in config [:runtime :effects :max-inflight])})

      ;; MVP: polling watcher; emits fs events into :events/out
      (fs/start-notes-watcher! env world* (get-in config [:paths :notes-dir]))

      (run-loop! world* systems {:tick-ms (get-in config [:runtime :tick-ms])}))))

(set! *main-cli-fn* -main)
```

---

## `src/promethean/sys/effects.cljs` (v1 async runner)

```clojure
(ns promethean.sys.effects
  (:require
    [promethean.debug.log :as log]
    [promethean.llm.openai :as llm.openai]
    [promethean.adapters.fs :as fs]))

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
                 (fn [] (reject (js/Error. (str "effect timeout after " timeout-ms "ms"))))
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

      ;; future: :discord/send, :mem/put, :vector/upsert, etc
      (js/Promise.reject (js/Error. (str "unknown effect type: " (pr-str etype)))))))

(defn- start-effect! [env world* effect]
  (let [cfg (get-in env [:config :runtime :effects] {})
        timeout-ms (get cfg :timeout-ms 60000)
        effect-id (:effect/id effect)
        etype (:effect/type effect)
        started-ts (now-ms)]

    (assoc-pending! world* effect-id {:effect effect
                                     :status :running
                                     :enqueued-ts (or (:effect/enqueued-ts effect) started-ts)
                                     :started-ts started-ts})

    (bump-stat! world* :started)

    (-> (run-effect-promise! env effect)
        (promise-timeout timeout-ms)
        (.then
          (fn [res]
            (let [evt (make-event {:type (effect->evt-type etype "result")
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
            (let [evt (make-event {:type (effect->evt-type etype "error")
                                   :source {:kind :effects :effect-id effect-id}
                                   :payload {:effect-id effect-id
                                             :effect effect
                                             :error (str err)}})]
              (update-pending! world* effect-id assoc :status :failed :done-ts (now-ms) :error (str err))
              (bump-stat! world* :failed)
              (append-event! world* evt)
              nil))))))

(defn- inflight-count [pending]
  (reduce (fn [n [_ v]]
            (if (= :running (:status v)) (inc n) n))
          0
          pending))

(defn- queued-effects [pending]
  ;; returns pending entries in stable start order
  (->> pending
       (keep (fn [[_id v]]
               (when (= :queued (:status v))
                 v)))
       (sort-by (fn [{:keys [enqueued-ts effect]}]
                  [enqueued-ts (:effect/id effect)]))))

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
  ;; Move effects into :effects/pending as :queued (dedupe by effect/id).
  (let [pending (:effects/pending w)]
    (reduce
      (fn [w eff]
        (let [eid (:effect/id eff)]
          (if (get pending eid)
            w
            (assoc-in w [:effects/pending eid]
                      {:effect (assoc eff :effect/enqueued-ts (now-ms))
                       :status :queued
                       :enqueued-ts (now-ms)}))))
      w
      effects)))

(defn sys-effects-flush [w]
  (let [env (:env w)
        world* (get-in env [:runtime :world*])
        cfg (get-in env [:config :runtime :effects] {})
        max-inflight (get cfg :max-inflight 4)
        retain (get cfg :retain-completed 500)

        ;; step 1: enqueue this tick's effects into pending
        w1 (enqueue-pending w (:effects w))
        pending1 (:effects/pending w1)

        ;; step 2: prune old completed entries (bounded memory)
        pending2 (prune-completed pending1 retain)
        w2 (assoc w1 :effects/pending pending2)

        ;; step 3: start queued effects up to inflight limit
        inflight (inflight-count pending2)
        capacity (max 0 (- max-inflight inflight))
        to-start (take capacity (queued-effects pending2))]

    (when (and world* (seq to-start))
      ;; mark them running in the WORLD (return value) first for determinism,
      ;; then fire async start that will emit result/error events.
      (doseq [{:keys [effect]} to-start]
        ;; mark as running in returned world
        (let [eid (:effect/id effect)]
          (set! w2 (assoc-in w2 [:effects/pending eid] {:effect effect
                                                       :status :running
                                                       :enqueued-ts (get-in w2 [:effects/pending eid :enqueued-ts])
                                                       :started-ts (now-ms)}))
          ;; also start real async execution which writes back to world*
          (start-effect! env world* effect))))

    w2))
```

### Notes on this runner

* It **does not block ticks**.
* Results appear as events like:

  * `:fs/read.result`
  * `:fs/write.result`
  * `:llm/chat.result`
  * and matching `*.error` events
* It is **bounded** (`retain-completed`) so `:effects/pending` doesn’t grow forever.

---

## `src/promethean/debug/log.cljs` (minimal logger)

```clojure
(ns promethean.debug.log)

(defn info [msg data]
  (.log js/console (str "[INFO] " msg) (clj->js data)))

(defn warn [msg data]
  (.warn js/console (str "[WARN] " msg) (clj->js data)))

(defn error [msg data]
  (.error js/console (str "[ERROR] " msg) (clj->js data)))
```

---

## What this unlocks immediately

Your existing `sys.sentinel` and `sys.cephalon` logic can now *actually* observe:

* `:fs/read.result` → sentinel calls LLM
* `:llm/chat.result` → sentinel validates and writes
* `:fs/write.result` → sentinel marks done
* cephalon can “block” until `:llm/chat.result` arrives

Next step is to make results **routed** (by `:meta`), so one LLM response doesn’t accidentally unblock the wrong session/sentinel. The runner already includes `:effect-id` and the original `:effect` in the event payload—so the clean follow-up is:

* store `:awaiting/effect-id` on the session/sentinel entity
* only accept result events whose `:effect-id` matches

If you say “continue” again, I’ll implement that routing + add a `:discord/send` effect (same pattern as FS/LLM), so the janitor session can publish reports.
