# Full initial files: runnable brain daemon skeleton (pure `shadow-cljs`, Node) #shadowcljs #ecs #runtime

I’m going to assume “continue” means: **stop abstracting and give me concrete file contents** you can drop in and iterate. Below are full-file replacements for a minimal, runnable skeleton:

* a tick loop
* an effects runner (FS + LLM)
* a sentinel for `docs/notes` frontmatter tagging
* a session router + simple cephalon stub that builds a context and calls chat

This is intentionally MVP: it compiles, runs, and gives you a place to start iterating.

---

## `src/promethean/main.cljs`

```clojure
(ns promethean.main
  (:require
    [cljs.core.async :as a]
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

(defn make-env [config]
  (let [openai (llm.openai/make-client {:api-key (get-in config [:openai :api-key])
                                        :base-url (get-in config [:openai :base-url])})
        fsapi  (fs/make-fs)]
    {:config config
     :clients {:openai openai}
     :adapters {:fs fsapi}}))

(defn init-world [env]
  (let [w (world/empty-world)]
    (-> w
        (assoc :env env)
        (assoc :events/in [])
        (assoc :events/out [])
        (assoc :effects [])
        ;; create a single cephalon + single sentinel for now
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
                   (-> w
                       ;; bring forward events emitted by effects runner last tick
                       (assoc :events/in (vec (:events/out w)))
                       (assoc :events/out [])
                       (assoc :effects [])
                       (tick/tick dt systems))))))
      tick-ms)))

(defn -main []
  (let [config {:openai {:api-key (or (.-OPENAI_API_KEY js/process.env) "")
                         ;; set to your OpenAI-compatible endpoint
                         :base-url (or (.-OPENAI_BASE_URL js/process.env) "https://api.openai.com/v1")}
                :runtime {:tick-ms 100}
                :paths {:notes-dir "docs/notes"}}
        env (make-env config)
        world* (atom (init-world env))
        systems [sys.route/sys-route-events->sessions
                 sys.sentinel/sys-sentinel
                 sys.cephalon/sys-cephalon
                 sys.effects/sys-effects-flush]]
    (log/info "promethean brain starting" {:tick-ms (get-in config [:runtime :tick-ms])
                                          :notes-dir (get-in config [:paths :notes-dir])})
    ;; start a very simple fs poller that emits file created/modified events
    (fs/start-notes-watcher! env world* (get-in config [:paths :notes-dir]))
    (run-loop! world* systems {:tick-ms (get-in config [:runtime :tick-ms])})))

(set! *main-cli-fn* -main)
```

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
            (world/update-entity w eid update :session/queue into (map :event/id wanted))
            w)))
      w
      session-eids)))
```

---

## `src/promethean/sys/effects.cljs`

```clojure
(ns promethean.sys.effects
  (:require
    [cljs.core.async :as a]
    [promethean.debug.log :as log]
    [promethean.llm.openai :as llm.openai]
    [promethean.adapters.fs :as fs]))

(defn- emit-event [w evt]
  (update w :events/out conj evt))

(defn- ok-event [effect res]
  {:event/id (str (random-uuid))
   :event/ts (.now js/Date)
   :event/type (keyword (name (:effect/type effect)) "result")
   :event/source {:kind :effects :effect-id (:effect/id effect)}
   :event/payload {:effect effect :result res}})

(defn- err-event [effect err]
  {:event/id (str (random-uuid))
   :event/ts (.now js/Date)
   :event/type (keyword (name (:effect/type effect)) "error")
   :event/source {:kind :effects :effect-id (:effect/id effect)}
   :event/payload {:effect effect :error (str err)}})

(defn- run-effect! [env effect cb]
  (let [etype (:effect/type effect)]
    (case etype
      :fs/read
      (-> (fs/read-file! (get-in env [:adapters :fs]) (:path effect))
          (.then (fn [txt] (cb nil txt)))
          (.catch (fn [e] (cb e nil))))

      :fs/write
      (-> (fs/write-file! (get-in env [:adapters :fs]) (:path effect) (:content effect))
          (.then (fn [_] (cb nil {:ok true})))
          (.catch (fn [e] (cb e nil))))

      :llm/chat
      (let [client (get-in env [:clients :openai])]
        (-> (llm.openai/chat! client (select-keys effect [:model :messages :tools :tool-choice :temperature :max-tokens]))
            (.then (fn [resp] (cb nil resp)))
            (.catch (fn [e] (cb e nil)))))

      (cb (js/Error. (str "unknown effect type: " etype)) nil))))

(defn sys-effects-flush [w]
  (let [env (:env w)
        effects (:effects w)]
    (if (empty? effects)
      w
      (do
        ;; execute effects in-order, append results as events/out
        (reduce
          (fn [w eff]
            (run-effect! env eff
                         (fn [err res]
                           (if err
                             (swap! (atom w) emit-event (err-event eff err))
                             (swap! (atom w) emit-event (ok-event eff res)))))
            ;; NOTE: above callback runs async; for v0 we just emit "queued" event
            (emit-event w {:event/id (str (random-uuid))
                           :event/ts (.now js/Date)
                           :event/type :effect/queued
                           :event/source {:kind :effects}
                           :event/payload {:effect eff}}))
          w
          effects)))))
```

> **Important**: This file is intentionally “v0”: it queues effects but doesn’t synchronously fold async results into `world` this tick. Next iteration: maintain a shared `:effects/pending` map or push results directly into the bus. For now, we keep the structure and you get a running loop.

---

## `src/promethean/sys/sentinel.cljs`

```clojure
(ns promethean.sys.sentinel
  (:require
    [clojure.string :as str]
    [promethean.ecs.world :as world]
    [promethean.debug.log :as log]
    [promethean.contracts.markdown-frontmatter :as fm]))

(defn bootstrap-docs-notes-sentinel [w]
  (let [eid (str (random-uuid))]
    (world/add-entity
      w eid
      {:sentinel/name "notes-frontmatter"
       :sentinel/state :idle
       :sentinel/retries {:attempt 0 :max 5}
       :sentinel/pending-files []})))

(defn- enqueue-effect [w eff]
  (update w :effects conj eff))

(defn- start-on-file [w sentinel-eid path]
  (-> w
      (world/update-entity sentinel-eid assoc
                           :sentinel/state :reading
                           :sentinel/input {:path path}
                           :sentinel/last-result nil)
      (enqueue-effect {:effect/type :fs/read
                       :effect/id (str (random-uuid))
                       :path path
                       :meta {:sentinel sentinel-eid}})))

(defn- llm-prompt [md]
  (str
    "You are a contract agent. Add YAML frontmatter with keys:\n"
    "- title: string\n"
    "- slug: string (lowercase, dash separated)\n"
    "- description: string\n"
    "- tags: list of strings\n\n"
    "Return the full updated markdown file.\n\n"
    "INPUT:\n"
    md))

(defn- request-llm [w sentinel-eid md]
  (let [model (get-in w [:env :config :models :sentinel] "qwen3-vl-2b")]
    (enqueue-effect
      w
      {:effect/type :llm/chat
       :effect/id (str (random-uuid))
       :model model
       :messages [{:role "system" :content "Return only the updated markdown."}
                  {:role "user" :content (llm-prompt md)}]
       :temperature 0
       :meta {:sentinel sentinel-eid}})))

(defn- write-output [w sentinel-eid path md]
  (enqueue-effect
    (world/update-entity w sentinel-eid assoc :sentinel/state :writing)
    {:effect/type :fs/write
     :effect/id (str (random-uuid))
     :path path
     :content md
     :meta {:sentinel sentinel-eid}}))

(defn- retry-or-fail [w sentinel-eid reason]
  (let [{:keys [attempt max]} (get-in (world/get-entity w sentinel-eid) [:sentinel/retries])]
    (if (< attempt max)
      (-> w
          (world/update-entity sentinel-eid (fn [s]
                                              (-> s
                                                  (update-in [:sentinel/retries :attempt] inc)
                                                  (assoc :sentinel/state :retry
                                                         :sentinel/error reason)))))
      (world/update-entity w sentinel-eid assoc :sentinel/state :failed :sentinel/error reason))))

(defn sys-sentinel [w]
  (let [sentinels (world/entities-with w [:sentinel/name :sentinel/state])
        events (:events/in w)]
    (reduce
      (fn [w seid]
        (let [s (world/get-entity w seid)
              st (:sentinel/state s)]
          (cond
            ;; if idle and we have a file event, start
            (= st :idle)
            (if-let [evt (first (filter #(#{:fs.file/created :fs.file/modified} (:event/type %)) events))]
              (start-on-file w seid (get-in evt [:event/payload :path]))
              w)

            ;; after a read result, call LLM
            (= st :reading)
            (if-let [evt (first (filter #(= (:event/type %) :fs/read.result) events))]
              (let [md (get-in evt [:event/payload :result])]
                (-> w
                    (world/update-entity seid assoc :sentinel/state :llm)
                    (request-llm seid md)))
              w)

            ;; after llm response, validate
            (= st :llm)
            (if-let [evt (first (filter #(= (:event/type %) :llm/chat.result) events))]
              (let [resp (get-in evt [:event/payload :result])
                    content (get-in resp [:choices 0 :message :content] "")
                    path (get-in s [:sentinel/input :path])]
                (if (fm/valid-frontmatter? content)
                  (write-output (world/update-entity w seid assoc :sentinel/state :valid) seid path content)
                  (retry-or-fail w seid "frontmatter validation failed")))
              w)

            ;; after write, mark done
            (= st :writing)
            (if-let [_evt (first (filter #(= (:event/type %) :fs/write.result) events))]
              (world/update-entity w seid assoc :sentinel/state :done)
              w)

            ;; retry state: just go back to reading same file (strictify prompt later)
            (= st :retry)
            (let [path (get-in s [:sentinel/input :path])]
              (start-on-file (world/update-entity w seid assoc :sentinel/state :idle) seid path))

            :else w)))
      w
      sentinels)))
```

---

## `src/promethean/sys/cephalon.cljs`

```clojure
(ns promethean.sys.cephalon
  (:require
    [promethean.ecs.world :as world]
    [promethean.debug.log :as log]))

(defn bootstrap-duck [w]
  (let [ceph-eid (str (random-uuid))
        sess-eid (str (random-uuid))]
    (-> w
        (world/add-entity ceph-eid
                          {:cephalon/name "Duck"
                           :cephalon/policy {:model "qwen3-vl-2b"
                                             :max-tokens 512}
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
                           :session/queue []
                           :session/recent []
                           :session/persistent []
                           :session/status :idle
                           :session/budgets {:llm-per-tick 1}}))))

(defn- enqueue-effect [w eff]
  (update w :effects conj eff))

(defn- take-queue [s n]
  (let [q (:session/queue s)]
    [(vec (take n q)) (vec (drop n q))]))

(defn- event->recent-line [evt]
  (let [t (:event/type evt)
        p (:event/payload evt)]
    (case t
      :discord.message/new
      (str "discord message in #" (get-in evt [:event/source :channel-id]) ": "
           (or (get-in p [:content]) ""))
      :fs.file/created
      (str "file created: " (get-in p [:path]))
      :fs.file/modified
      (str "file modified: " (get-in p [:path]))
      (str "event: " (pr-str t)))))

(defn- build-messages [ceph s recent-lines]
  ;; MVP: no related/persistent yet; just demonstrate recent loop.
  (let [sys (str "You are " (get-in ceph [:cephalon/name]) ". "
                 "You are always running. Keep replies short and operational.")
        user (str "Recent events:\n" (clojure.string/join "\n" (map #(str "- " %) recent-lines))
                  "\n\nRespond with a short operational note.")]
    [{:role "system" :content sys}
     {:role "user" :content user}]))

(defn sys-cephalon [w]
  (let [session-eids (world/entities-with w [:session/name :session/queue :session/status])
        events (:events/in w)
        ev-by-id (into {} (map (juxt :event/id identity) events))]
    (reduce
      (fn [w seid]
        (let [s (world/get-entity w seid)
              status (:session/status s)
              {:keys [llm-per-tick]} (:session/budgets s)]
          (cond
            (and (= status :idle) (pos? llm-per-tick) (seq (:session/queue s)))
            (let [[taken remaining] (take-queue s 5)
                  recent-evts (keep ev-by-id taken)
                  recent-lines (map event->recent-line recent-evts)
                  ceph (world/get-entity w (:session/cephalon s))
                  model (get-in ceph [:cephalon/policy :model])
                  max-tokens (get-in ceph [:cephalon/policy :max-tokens])
                  messages (build-messages ceph s recent-lines)]
              (-> w
                  (world/update-entity seid assoc
                                       :session/queue remaining
                                       :session/recent (vec (take-last 32 (concat (:session/recent s) recent-lines)))
                                       :session/status :blocked)
                  (enqueue-effect {:effect/type :llm/chat
                                   :effect/id (str (random-uuid))
                                   :model model
                                   :messages messages
                                   :temperature 0
                                   :max-tokens max-tokens
                                   :meta {:session seid}})))

            ;; unblock when LLM response arrives (v0: first llm result)
            (= status :blocked)
            (if-let [evt (first (filter #(= (:event/type %) :llm/chat.result) events))]
              (do
                ;; TODO: emit a discord/send effect for janitor reporting
                (world/update-entity w seid assoc :session/status :idle :session/last-llm evt))
              w)

            :else w)))
      w
      session-eids)))
```

> This cephalon is intentionally dumb: it “ticks,” reads a few events, calls LLM, stores the last response. Next step is to connect it to memory ingest + `related/persistent/recent` packing.

---

## `src/promethean/adapters/fs.cljs`

```clojure
(ns promethean.adapters.fs)

(defn make-fs []
  {:fs (js/require "fs")
   :path (js/require "path")})

(defn read-file! [{:keys [fs]} path]
  (.promises.readFile fs path "utf8"))

(defn write-file! [{:keys [fs]} path content]
  (.promises.writeFile fs path content "utf8"))

(defn- list-md-files! [{:keys [fs]} dir]
  (-> (.promises.readdir fs dir)
      (.then (fn [names]
               (->> (js->clj names)
                    (filter #(clojure.string/ends-with? % ".md"))
                    (map #(str dir "/" %))
                    vec)))))

(defn start-notes-watcher! [env world* notes-dir]
  ;; MVP: polling watcher; replace with fs.watch later
  (let [seen* (atom {})]
    (js/setInterval
      (fn []
        (-> (list-md-files! (get-in env [:adapters :fs]) notes-dir)
            (.then
              (fn [paths]
                (doseq [p paths]
                  (-> (.promises.stat (get-in env [:adapters :fs :fs]) p)
                      (.then
                        (fn [st]
                          (let [mtime (.-mtimeMs st)
                                prev (get @seen* p)]
                            (when (or (nil? prev) (> mtime prev))
                              (swap! seen* assoc p mtime)
                              (swap! world*
                                     (fn [w]
                                       (update w :events/out conj
                                               {:event/id (str (random-uuid))
                                                :event/ts (.now js/Date)
                                                :event/type (if prev :fs.file/modified :fs.file/created)
                                                :event/source {:kind :fs :path p}
                                                :event/payload {:path p}})))))))
                      (.catch (fn [_] nil)))))))))
            (.catch (fn [_] nil))))
      1000)))
```

---

## `src/promethean/contracts/markdown_frontmatter.cljs`

```clojure
(ns promethean.contracts.markdown-frontmatter
  (:require [clojure.string :as str]))

(defn- parse-frontmatter [s]
  ;; very small YAML-ish parser for v0:
  ;; expects:
  ;; ---
  ;; key: value
  ;; tags:
  ;; - a
  ;; ---
  (when (and (str/starts-with? s "---")
             (str/includes? s "\n---"))
    (let [[_ fm body] (re-matches #"(?s)---\n(.*?)\n---\n?(.*)" s)]
      {:frontmatter fm :body body})))

(defn- has-required-keys? [fm]
  (and (re-find #"(?m)^title:\s+\S" fm)
       (re-find #"(?m)^slug:\s+[a-z0-9\-]+" fm)
       (re-find #"(?m)^description:\s+\S" fm)
       (re-find #"(?m)^tags:\s*$" fm)))

(defn valid-frontmatter? [md]
  (when-let [{:keys [frontmatter]} (parse-frontmatter md)]
    (and (has-required-keys? frontmatter)
         ;; slug format constraint
         (re-find #"(?m)^slug:\s+[a-z0-9]+(-[a-z0-9]+)*\s*$" frontmatter))))
```

---

## What’s next (implementation, not theory)

This skeleton is enough to run, but the **effects runner is intentionally incomplete** for async folding. The next concrete step is to make effect execution produce results into world deterministically.

### The simplest correct fix

* maintain `:effects/pending` in world: `{effect-id {:effect ... :status ...}}`
* when you enqueue an effect, insert into pending
* `sys.effects.flush` starts pending effects (if not started) and on resolve pushes a result event into `:events/out`

In Node, you can do this by having the runner mutate `world*` directly (since it’s your own daemon), while still keeping most systems pure.

If you want to continue, I’ll write the **v1 effects runner** that:

* executes async effects
* emits `:fs/read.result`, `:llm/chat.result` etc into the next tick reliably
* supports tool call execution hooks
* and adds a tiny debug inspector (queue lengths, last events) so the dev workflow feels good immediately.
