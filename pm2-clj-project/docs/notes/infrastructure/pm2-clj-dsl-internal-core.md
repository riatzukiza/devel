Alright. Now we stop thinking “agent = LLM + tool loop” and build the *actual organism*:

* **Sensors** (passive modules) produce structured state
* **Router** decides what sensors are on and what gets summarized
* **Actuators** (tools) act on the world
* **LLM is a tool** used by the orchestrator (optionally multiple tiers)
* **Benchmarks test the whole machine**, not just tool calls

Below is the next chunk: a **Context Router MVP + module DSL + gating + fused context + scenario benchmarks** — all using your **prototype/mixin/hook** style so it stays composable.

---

# 1) The runtime “organism loop”

One tick = one nervous system cycle:

```clojure
(tick)
  world-state := modules(passive).tick(world-state)
  gates       := router.decide(world-state)
  modules     := apply-gates(modules, gates)
  fused       := summarizer(world-state, gates)
  actions     := agent.decide(fused)   ;; llm tool-call loop *optional*
  world-state := apply-actions(world-state, actions)
```

This is the core pattern you’ll reuse for:

* live streaming performer
* coding assistant
* benchmark playback runner

---

# 2) New primitive: `def-module`

Modules are long-lived, passive processors.

## 2.1 Module shape

A module instance looks like:

```clojure
{:module/id        :vision.objects
 :module/proto     proto/module-passive
 :module/enabled?  (atom true)
 :module/state     (atom {})
 :module/tick      (fn [ctx world module] world')}
```

* **enabled?** is controlled by the router (gates)
* **state** stores internal memory (frame history, last output, etc.)
* **tick** reads inputs, updates world

## 2.2 Module DSL

Create `src/promethean/modules/core.clj`

```clojure
(ns promethean.modules.core
  (:require [promethean.proto :as proto]
            [promethean.agent.runtime :as rt]))

(defonce ^:private *modules (atom {}))

(defn register-module! [m]
  (swap! *modules assoc (:module/id m) m)
  m)

(defn get-module [id] (get @*modules id))
(defn list-modules [] (vals @*modules))

(defn enable! [m] (reset! (:module/enabled? m) true) m)
(defn disable! [m] (reset! (:module/enabled? m) false) m)

(defn module-enabled? [m]
  (true? @(:module/enabled? m)))

(defn- wrap-tick
  "Apply proto hooks around module tick.
  Signature: (tick ctx world module) -> world'"
  [around base]
  (reduce (fn [f mw] ((mw f))) base around))

(defn materialize-module [m]
  (let [p (proto/materialize (:module/proto m))
        hooks (:proto/hooks p)
        around (:around hooks)
        base (:module/tick m)]
    (assoc m :module/tick* (wrap-tick around base))))

(defmacro def-module
  "Define a passive module.

  (def-module vision/objects
    {:proto proto/module-passive
     :enabled true}
    (fn [ctx world module] ...))"
  [id {:keys [proto enabled] :as meta} tick-fn]
  `(do
     (def ~id
       (register-module!
         (materialize-module
           (merge
             {:module/id ~(keyword (name id))
              :module/proto ~proto
              :module/enabled? (atom ~(if (contains? meta :enabled) enabled true))
              :module/state (atom {})}
             ~meta
             {:module/tick ~tick-fn}))))
     ~id))

(defn tick-modules!
  "Run all enabled modules once."
  [{:keys [bus] :as ctx} world]
  (reduce
    (fn [w m]
      (if (module-enabled? m)
        (do
          (when bus
            (rt/emit! bus {:event :module/tick :module (:module/id m)}))
          ((:module/tick* m) ctx w m))
        w))
    world
    (list-modules)))
```

---

# 3) Module prototypes + mixins (budget, rate, trace)

Create `src/promethean/modules/protos.clj`

```clojure
(ns promethean.modules.protos
  (:require [promethean.proto :as proto]))

(proto/def-proto proto/module-passive
  {:defaults {:module/role :passive}
   :hooks {:around []}})

(proto/def-proto proto/mixin-module-trace
  {:hooks
   {:around
    [(fn mod-trace [next]
       (fn [ctx world module]
         (let [t0 (System/nanoTime)]
           (try
             (let [w2 (next ctx world module)
                   dt (/ (- (System/nanoTime) t0) 1e6)
                   emit (:trace/emit ctx)]
               (when emit
                 (emit {:event :module/done
                        :module (:module/id module)
                        :ms dt}))
               w2)
             (catch Throwable t
               (when-let [emit (:trace/emit ctx)]
                 (emit {:event :module/error
                        :module (:module/id module)
                        :err (.getMessage t)}))
               (throw t))))))]}})

(proto/def-proto proto/mixin-module-rate-limit
  {:defaults {:module/min-interval-ms 100}
   :hooks
   {:around
    [(fn rate-limit [next]
       (let [last* (atom 0)]
         (fn [ctx world module]
           (let [now (System/currentTimeMillis)
                 min-ms (or (:module/min-interval-ms module) 100)]
             (if (< (- now @last*) min-ms)
               world
               (do (reset! last* now)
                   (next ctx world module)))))))]}})
```

You can attach these mixins to module prototypes the same way you’ve been doing with tools.

---

# 4) The Context Router MVP (embedding-driven gating)

This is the “brainstem”:

* reads cheap signals
* decides which gates are ON/OFF
* prevents flapping via hysteresis
* writes `:gates/...` into world state

## 4.1 Gate shape

```clojure
{:gates
 {:screen/capture true
  :vision/objects true
  :vision/ocr false
  :audio/stt true}}
```

## 4.2 Router DSL

Create `src/promethean/router/core.clj`

```clojure
(ns promethean.router.core
  (:require [promethean.agent.runtime :as rt]))

(defonce ^:private *routers (atom {}))

(defn register-router! [r]
  (swap! *routers assoc (:router/id r) r)
  r)

(defn get-router [id] (get @*routers id))

(defmacro def-router
  "Define a router.

  (def-router router/stream
    {:cooldown-ms 2000
     :initial-gates {...}}
    (fn [ctx world] {:mode :combat :gates {...}}))"
  [id {:keys [cooldown-ms initial-gates] :as meta} decide-fn]
  `(do
     (def ~id
       (register-router!
         (merge
           {:router/id ~(keyword (name id))
            :router/cooldown-ms ~(or cooldown-ms 1000)
            :router/last-change-ms (atom 0)
            :router/state (atom {:mode nil
                                 :gates ~(or initial-gates {})})}
           ~meta
           {:router/decide ~decide-fn})))
     ~id))

(defn- stable?
  [router now]
  (let [last @(:router/last-change-ms router)
        cd (:router/cooldown-ms router)]
    (>= (- now last) cd)))

(defn apply-router!
  "Compute new gates+mode, apply with hysteresis."
  [{:keys [bus] :as ctx} router world]
  (let [now (System/currentTimeMillis)
        {:keys [mode gates]} ((:router/decide router) ctx world)
        prev @(:router/state router)
        next {:mode mode :gates gates}]
    (if (or (= prev next) (not (stable? router now)))
      (do
        ;; keep previous if flapping
        (assoc world :router prev))
      (do
        (reset! (:router/last-change-ms router) now)
        (reset! (:router/state router) next)
        (when bus
          (rt/emit! bus {:event :router/change
                         :router (:router/id router)
                         :mode mode
                         :gates gates}))
        (assoc world :router next)))))
```

---

# 5) Turn gates into module enable/disable

Now the router output can control modules automatically.

Create `src/promethean/modules/gates.clj`

```clojure
(ns promethean.modules.gates
  (:require [promethean.modules.core :as mods]))

(defn gate->module-id
  "Convention: gate keys map to module ids by keyword prefix.
  Example: :vision/objects gate controls module :vision.objects"
  [gate-k]
  (keyword (clojure.string/replace (name gate-k) "/" ".")))

(defn apply-gates!
  "Enable/disable modules based on gates map."
  [gates]
  (doseq [[gate-k on?] gates]
    (let [mid (gate->module-id gate-k)
          m (mods/get-module mid)]
      (when m
        (if on?
          (mods/enable! m)
          (mods/disable! m)))))
  true)
```

This makes gating “automatic physiology”.

---

# 6) Fused context (what agents see)

The LLM (or any planner module) shouldn’t see raw world dumps.

It sees a **summary** produced by a dedicated summarizer module.

Create `src/promethean/context/fuse.clj`

```clojure
(ns promethean.context.fuse)

(defn fuse
  "Create minimal agent-facing context from world."
  [world]
  (let [mode (get-in world [:router :mode])
        objects (get-in world [:vision :objects] [])
        text (get-in world [:vision :text] [])
        stt (get-in world [:audio :stt :text])]
    {:mode mode
     :salient
     (cond-> []
       (seq objects)
       (conj {:type :vision/objects
              :count (count objects)
              :top (take 5 objects)})

       (seq text)
       (conj {:type :vision/text
              :top (take 5 text)})

       (seq stt)
       (conj {:type :audio/stt
              :text stt}))}))
```

Now every agent tier can share the same fused schema, even if they differ in power.

---

# 7) Minimal passive module examples (stubs you can swap out later)

## 7.1 Screen capture module

```clojure
(ns promethean.modules.screen
  (:require [promethean.modules.core :refer [def-module]]
            [promethean.modules.protos :as protos]))

(def-module screen/capture
  {:proto proto/module-passive
   :enabled true}
  (fn [ctx world module]
    ;; stub: ctx supplies :screen/get-frame
    (if-let [get-frame (:screen/get-frame ctx)]
      (let [frame (get-frame)]
        (assoc-in world [:screen :frame] frame))
      world)))
```

## 7.2 Object detector module

```clojure
(ns promethean.modules.vision
  (:require [promethean.modules.core :refer [def-module]]))

(def-module vision/objects
  {:proto proto/module-passive
   :enabled false}
  (fn [ctx world module]
    ;; stub: ctx supplies :vision/detect
    (if-let [detect (:vision/detect ctx)]
      (let [frame (get-in world [:screen :frame])
            objs (when frame (detect frame))]
        (assoc-in world [:vision :objects] (or objs [])))
      world)))
```

## 7.3 OCR module

```clojure
(def-module vision/ocr
  {:proto proto/module-passive
   :enabled false}
  (fn [ctx world module]
    (if-let [ocr (:vision/ocr ctx)]
      (let [frame (get-in world [:screen :frame])
            txt (when frame (ocr frame))]
        (assoc-in world [:vision :text] (or txt [])))
      world)))
```

---

# 8) Router decision function: embedding classifier + policy

Now we connect your **embedding idea**:

> classify as requiring sight and just enable it

Router can do:

* compute embedding of cheap “hint text”
* choose mode
* gates follow mode

### Router example (simple rule + embedding hook)

```clojure
(ns promethean.routers.stream
  (:require [promethean.router.core :refer [def-router]]))

(def-router router/stream
  {:cooldown-ms 1500
   :initial-gates {:screen/capture true
                   :audio/stt true
                   :vision/objects false
                   :vision/ocr false}}
  (fn [ctx world]
    ;; cheap hints
    (let [app (get-in world [:screen :frame :app])
          stt (get-in world [:audio :stt :text] "")
          hint (str app "\n" stt)

          ;; embedding classifier optional
          classify (:embed/classify ctx) ;; (fn [text] -> {:mode kw :confidence n})
          cls (when classify (classify hint))
          mode (or (:mode cls)
                   (cond
                     (re-find #"code|vscode|clojure|typescript" (clojure.string/lower-case hint)) :coding
                     (re-find #"hp|ammo|enemy|boss" (clojure.string/lower-case hint)) :combat
                     :else :idle))

          gates (case mode
                  :coding {:screen/capture true
                           :audio/stt true
                           :vision/objects false
                           :vision/ocr true}

                  :combat {:screen/capture true
                           :audio/stt true
                           :vision/objects true
                           :vision/ocr false}

                  :idle   {:screen/capture true
                           :audio/stt true
                           :vision/objects false
                           :vision/ocr false}

                  ;; default
                  {:screen/capture true
                   :audio/stt true})]
      {:mode mode
       :gates gates})))
```

The *same router* can later grow into:

* hysteresis based on confidence
* budget-aware gating
* per-scene tool cooldowns
* privacy policy

---

# 9) The master loop: “tick once”

Create `src/promethean/runtime/tick.clj`

```clojure
(ns promethean.runtime.tick
  (:require
    [promethean.modules.core :as mods]
    [promethean.router.core :as router]
    [promethean.modules.gates :as gates]
    [promethean.context.fuse :as fuse]))

(defn tick!
  "One cycle of the machine."
  [{:keys [router-id] :as ctx} world]
  (let [r (router/get-router router-id)

        ;; 1) passive modules run with current gates
        world (mods/tick-modules! ctx world)

        ;; 2) router decides
        world (router/apply-router! ctx r world)

        ;; 3) apply gates to modules
        _ (gates/apply-gates! (get-in world [:router :gates]))

        ;; 4) fused context
        fused (fuse/fuse world)]
    (assoc world :context/fused fused)))
```

This is the “proper cohesive system” you’re asking for.

LLMs are now optional: you can have:

* a non-LLM planner module
* an LLM orchestrator tool
* a performer agent that only reacts to fused context

---

# 10) Scenario benchmarks (system-level, not LLM-only)

Now we can benchmark:

* “does router enable vision when needed?”
* “does it avoid flapping?”
* “does OCR only turn on during coding?”
* “does performer say something when mode changes?”

## 10.1 Scenario DSL

Create `src/promethean/bench/scenario_dsl.clj`

```clojure
(ns promethean.bench.scenario-dsl)

(defmacro expect [type & kvs]
  `(merge {:expect/type ~type} ~(apply hash-map kvs)))

(defmacro step [id & {:as m}]
  `(merge {:step/id ~id} ~m))

(defmacro def-scenario [id & steps]
  `(def ~id
     {:scenario/id ~(name id)
      :scenario/steps ~(vec steps)}))
```

## 10.2 Example scenario

```clojure
(ns promethean.benchmarks.router_scenarios
  (:require [promethean.bench.scenario-dsl :refer [def-scenario step expect]]))

(def-scenario router/combat
  (step "idle"
    :world {:screen {:frame {:app "Desktop"}}
            :audio {:stt {:text ""}}}
    :expects [(expect :mode :is :idle)
              (expect :gate :key :vision/objects :is false)])

  (step "combat-hint"
    :world {:screen {:frame {:app "Game"}}
            :audio {:stt {:text "oh no boss fight"}}
            :vision {}}
    :expects [(expect :mode :is :combat)
              (expect :gate :key :vision/objects :is true)
              (expect :gate :key :vision/ocr :is false)]))
```

Now your benchmark runner can replay steps through `tick!` and verify gating correctness **without any LLM involved**.

That’s the “LLM is a tool” philosophy in executable form.

---

# 11) Embedding benchmarks + DSL syntax (router-focused)

You said:

> Let's set up embedding model benchmarks and DSL syntax

This is where embeddings shine **outside RAG**:

* classify “mode”
* novelty detection (“something changed worth reacting to”)
* similarity routing (“this looks like coding context, enable OCR”)
* memory retrieval (“this matches a previous bug”)

### Embedding bench DSL (minimal)

```clojure
(def-embed-bench mode-classifier
  (dataset "stream_modes"
    (example {:text "VSCode editing a clojure file"} :label :coding)
    (example {:text "HP low enemy on screen"} :label :combat)
    (example {:text "just chatting"} :label :idle))
  (metric :accuracy)
  (metric :confusion-matrix))
```

If you want, I’ll generate the full macro set + runner that outputs JSONL into `reports/embeddings/...`.

---

# 12) Putting it all together: your “Swiss army knife” architecture

You now have:

### Passive modules (optimized ML)

* object detectors
* CRNN OCR
* STT / VAD
* embedding classifier
* file watchers
* log parsers

### Router (policy + budget + hysteresis)

* enables “sight recording”
* enables OCR only when needed
* enables object detection in combat
* controls what the agent sees

### Agents / Tools (actuation + narration)

* performer agent (small)
* coding agent (medium)
* orchestrator agent (big)
* MCP tools (Serena etc.)
* overlay/SFX tools

### Benchmarks

* router scenarios
* module latency/quality
* tool calling correctness
* end-to-end “stream show” scenarios

This is a cohesive AI system, not an LLM toy.

---

If you want the next jump, I’ll implement **two concrete things that make the system feel alive immediately**:

1. **Novelty Detector module** (cheap): triggers “react!” only when something changes
2. **Performer agent loop** that consumes `:context/fused` and only uses fun tools with cooldowns

That gives you a real streaming entertainer even before full vision is wired up.
