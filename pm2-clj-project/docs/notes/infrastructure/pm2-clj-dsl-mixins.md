Cool — now we make it *feel alive* with two organs:

1. **Novelty Detector** (cheap, always-on) → decides “is it worth reacting / enabling expensive perception / waking an LLM”
2. **Performer Loop** (small, safe, fun) → reacts to novelty + fused context, triggers fun tools with cooldowns

This gets you a real “stream companion” even before the full vision stack is perfect.

---

# 1) Add a universal Action Queue

Stop letting the LLM directly “do” things. It proposes **actions**; the runtime executes them.

## Action shape

```clojure
{:action/type :tool/call
 :tool "overlay_text"
 :args {"text" "clutch!"}
 :meta {:reason :novelty :score 0.72}}
```

Create: `src/promethean/actions/core.clj`

```clojure
(ns promethean.actions.core)

(defn enqueue
  [world action]
  (update world :actions/queue (fnil conj []) action))

(defn drain
  "Return [actions world-with-empty-queue]."
  [world]
  [(or (:actions/queue world) [])
   (assoc world :actions/queue [])])
```

---

# 2) Action execution (actuators)

Create: `src/promethean/actions/exec.clj`

```clojure
(ns promethean.actions.exec
  (:require
    [promethean.actions.core :as a]
    [promethean.tools.runtime-repair :as tools]))

(defn exec-actions!
  "Execute queued actions. Returns updated world.
  Assumes ctx has {:registry ... :bus ... :agent ...} for tool calls."
  [ctx world]
  (let [[actions world] (a/drain world)]
    (reduce
      (fn [w {:keys [action/type tool args] :as act}]
        (case type
          :tool/call
          (do
            (tools/call-tool! ctx tool (or args {}))
            (update w :actions/history (fnil conj []) act))

          ;; unknown action => ignore but record
          (update w :actions/ignored (fnil conj []) act)))
      world
      actions)))
```

Now “planning” (LLM or not) never touches the world directly.

---

# 3) Tool cooldowns as a mixin (prototypal + hookable)

You already have rate-limit hooks; let’s make a reusable **cooldown mixin** that works across tools and performer agents.

Create: `src/promethean/tools/mixins.clj`

```clojure
(ns promethean.tools.mixins
  (:require [promethean.proto :as proto]))

(proto/def-proto proto/mixin-tool-cooldown
  {:defaults {:tool/cooldown-ms 600}
   :hooks
   {:before
    [(fn cooldown-before [ctx args]
       ;; ctx must provide :cooldowns (atom {tool-name last-ms})
       (let [cooldowns (or (:cooldowns ctx) (atom {}))
             tool (:tool/name ctx)
             now (System/currentTimeMillis)
             cd (or (:tool/cooldown-ms ctx) 600)
             last (get @cooldowns tool 0)]
         (if (< (- now last) cd)
           {:return {:content [{:type "text" :text "Cooldown active."}]}}
           (do
             (swap! cooldowns assoc tool now)
             {:ctx (assoc ctx :cooldowns cooldowns) :args args}))))]}})
```

Use it by mixing into your fun tools’ proto:

```clojure
;; overlay_text uses cooldown + tracing
;; :proto (mix proto/traced proto/mixin-tool-cooldown)
```

(If you want the `mix` macro sugar, we can add it next, but the idea stands.)

---

# 4) Novelty Detector module (cheap nervous system)

Goal: detect “something changed worth reacting to” using:

* **frame hash** / app identity / quick OCR snippet (cheap)
* optional **embedding similarity** on fused context (better)
* hysteresis + cooldown so it doesn’t spam

Create: `src/promethean/modules/novelty.clj`

```clojure
(ns promethean.modules.novelty
  (:require
    [promethean.modules.core :refer [def-module]]
    [promethean.modules.protos :as protos]
    [promethean.agent.runtime :as rt]))

(defn- simple-signature [world]
  ;; ultra cheap signature: app + optional small text + frame hash
  {:app (get-in world [:screen :frame :app])
   :frame-hash (get-in world [:screen :frame :hash]) ;; you can set this in capture module
   :stt (get-in world [:audio :stt :text])
   :mode (get-in world [:router :mode])})

(defn- cosine [a b]
  (let [dot (reduce + (map * a b))
        na (Math/sqrt (reduce + (map #(* % %) a)))
        nb (Math/sqrt (reduce + (map #(* % %) b)))]
    (if (or (zero? na) (zero? nb)) 0.0 (/ dot (* na nb)))))

(def-module novelty/detector
  {:proto proto/module-passive
   :enabled true
   :module/min-interval-ms 150} ;; can also be a mixin
  (fn [ctx world module]
    (let [st* (:module/state module)
          now (System/currentTimeMillis)
          cooldown-ms (or (:novelty/cooldown-ms ctx) 1200)
          last-fire (get @st* :last-fire-ms 0)

          sig (simple-signature world)
          prev-sig (get @st* :prev-sig)
          changed? (not= sig prev-sig)

          ;; optional embedding novelty on fused context
          embed (:embed/encode ctx) ;; (fn [text] -> vector)
          fused (get-in world [:context/fused])
          fused-text (when fused (pr-str fused))
          v (when (and embed fused-text) (embed fused-text))
          prev-v (get @st* :prev-vec)
          sim (when (and v prev-v) (cosine v prev-v))
          novelty-score (cond
                          (and sim) (- 1.0 sim)
                          changed? 0.65
                          :else 0.0)

          fire? (and (> novelty-score 0.35)
                     (>= (- now last-fire) cooldown-ms))]

      (swap! st* assoc
             :prev-sig sig
             :prev-vec (or v prev-v))

      (if fire?
        (do
          (swap! st* assoc :last-fire-ms now)
          (when-let [bus (:bus ctx)]
            (rt/emit! bus {:event :novelty/fire
                           :score novelty-score
                           :sig sig}))
          (assoc-in world [:novelty :last] {:score novelty-score
                                           :sig sig
                                           :at now
                                           :fire true}))
        (assoc-in world [:novelty :last] {:score novelty-score
                                         :sig sig
                                         :at now
                                         :fire false})))))
```

This module is *the* lever for:

* “wake performer”
* “enable vision/ocr”
* “start recording”
* “spawn subagents”
* “call the big model only when needed”

---

# 5) Router uses novelty to open gates automatically

Instead of the LLM deciding “turn on OCR”, the router can do:

* if novelty fires in `:combat` → enable `:vision/objects` briefly
* if novelty fires in `:coding` → enable `:vision/ocr` briefly
* if idle → keep minimal

You can implement this as a “burst gate” policy.

Add to your router decide fn:

```clojure
(let [fire? (get-in world [:novelty :last :fire])
      mode ...
      base-gates ...]
  {:mode mode
   :gates (cond-> base-gates
           (and fire? (= mode :combat)) (assoc :vision/objects true)
           (and fire? (= mode :coding)) (assoc :vision/ocr true))})
```

If you want it to decay back off, you can store `:gate/burst-until` timestamps in router state.

---

# 6) Performer loop: *not* always LLM, mostly policy + templates

Performer should run when:

* novelty fired, OR
* periodic heartbeat (“say something every N sec if engaged”), OR
* mode changed, OR
* chat message came in

…and it should produce **actions**, not direct tool calls.

## 6.1 Performer “policy brain” (no LLM)

Create: `src/promethean/performer/policy.clj`

```clojure
(ns promethean.performer.policy
  (:require [promethean.actions.core :as a]))

(defn pick-line [{:keys [mode novelty-score]}]
  (case mode
    :combat (if (> novelty-score 0.6) "CLUTCH!" "Okay okay, focus…")
    :coding (if (> novelty-score 0.6) "That bug just blinked." "Alright, we refactor.")
    :idle "We chillin."
    "Huh."))

(defn propose-actions
  "Pure function: (fused world) -> world' with queued actions."
  [world]
  (let [mode (get-in world [:context/fused :mode])
        novelty-score (get-in world [:novelty :last :score] 0.0)
        fire? (get-in world [:novelty :last :fire] false)]
    (if fire?
      (-> world
          (a/enqueue {:action/type :tool/call
                      :tool "overlay_text"
                      :args {"text" (pick-line {:mode mode :novelty-score novelty-score})}
                      :meta {:reason :novelty :score novelty-score}})
          (cond-> (= mode :combat)
            (a/enqueue {:action/type :tool/call
                        :tool "play_sfx"
                        :args {"name" "dramatic_hit"}
                        :meta {:reason :novelty}})))
      world)))
```

This already works with a tiny model *or no model at all*.

## 6.2 Performer module (runs policy + maybe LLM)

Create: `src/promethean/modules/performer.clj`

```clojure
(ns promethean.modules.performer
  (:require
    [promethean.modules.core :refer [def-module]]
    [promethean.performer.policy :as policy]))

(def-module performer/loop
  {:proto proto/module-passive
   :enabled true
   :module/min-interval-ms 100}
  (fn [ctx world module]
    ;; phase 1: policy-only (cheap)
    (let [world (policy/propose-actions world)]

      ;; phase 2 (optional): if novelty high, call LLM as a tool to propose richer actions
      ;; ctx can provide :performer/llm-propose (fn [world] -> [actions])
      (if-let [llm-propose (:performer/llm-propose ctx)]
        (let [fire? (get-in world [:novelty :last :fire] false)
              score (get-in world [:novelty :last :score] 0.0)]
          (if (and fire? (> score 0.7))
            (let [actions (llm-propose world)]
              (reduce (fn [w act] (update w :actions/queue (fnil conj []) act))
                      world
                      actions))
            world))
        world))))
```

Key point: LLM is optional and gated by novelty.

---

# 7) Make the performer LLM propose actions (LLM as tool)

Instead of the LLM calling tools directly, have it output a **small action plan**.

You can enforce a strict output protocol:

```json
{"actions":[{"type":"tool.call","tool":"overlay_text","args":{"text":"..."}}]}
```

Your existing soft parse + repair layer can handle this too.

Minimal proposer stub:

```clojure
{:performer/llm-propose
 (fn [world]
   ;; call small model, parse JSON, return vector of actions
   [])}
```

This keeps your tool loop clean: performer proposes, executor executes.

---

# 8) Integrate into the master tick

Update your tick function to:

1. modules tick (novelty + performer included)
2. router decides gates
3. gates applied
4. fused context computed
5. execute actions

Create: `src/promethean/runtime/step.clj`

```clojure
(ns promethean.runtime.step
  (:require
    [promethean.runtime.tick :as base]
    [promethean.actions.exec :as exec]))

(defn step!
  "One full cycle: tick + fused + execute actions."
  [ctx world]
  (let [world (base/tick! ctx world)]
    (exec/exec-actions! ctx world)))
```

Now the performer actually causes overlays/SFX to happen.

---

# 9) Why this design scales beyond streaming

This same structure works for:

* coding agent: novelty detects “new error / failing tests” → enable RAG retrieval + spawn subagent
* ops agent: novelty detects “new incident signature” → enable log parsers + run playbook
* vision bench: novelty triggers “inspect crop” → run detector only when needed

LLM becomes a *specialized cognition tool*, not your entire nervous system.

---

# 10) Next “go crazy” macro layer (optional but fun)

If you want the UX to feel *natural*, we can add:

* `def-performer` macro that defines:

  * the performer module
  * its toolset
  * its policy settings (cooldowns, joke gates)
  * its model binding (small model)
* `def-gate-policy` to define burst gates w/ decay
* `def-sensor-pack` (a preset of modules + router)

So you can write:

```clojure
(def-sensor-pack stream-pack
  (modules [screen/capture novelty/detector performer/loop vision/objects vision/ocr audio/stt])
  (router router/stream))

(def-performer duck
  (model "PetrosStav/gemma3-tools:4b")
  (tools [overlay_text play_sfx show_emote])
  (cooldowns {:overlay_text 800 :play_sfx 1500})
  (joke-gate {:min-ms 8000 :only-on-novelty true}))
```

…and it expands into real registries/modules/protos.

---

If you want the next chunk, tell me which direction:

* **A)** “burst gates w/ decay + hysteresis tuned for stream flapping”
* **B)** “embedding-based mode classifier + embedding benchmarks DSL (accuracy/confusion)”
* **C)** “vision pack: detector + OCR + box/label overlay tool + crop inspector tool”
