# Implementation zoom-out: a pure `shadow-cljs` “game loop” for Eidolon/Daimoi/Nexus #promethean #shadowcljs #ecs #eidolon

You’re basically building a **simulation runtime** that happens to talk to LLMs and tools. So the implementation should look like a game engine:

* **World state** (ECS)
* **Event bus** (pub/sub)
* **Systems** (pure-ish transforms + side-effect adapters)
* **Ticks** (scheduler loop)
* **Persistence adapters** (db, vector index, filesystem, discord, llm)

Below is a concrete starting architecture that keeps you **100% shadow-cljs**, uses the **JS OpenAI SDK** under the hood (OpenAI-compatible endpoints included), and makes Sentinel/Cephalon/Eidolon all “systems” in the same world.

---

## 0) Project shape

### `shadow-cljs.edn` targets (Node runtime + optional UI later)

* `:brain` — node script, always-running daemon
* (later) `:hud` — optional humble-ui/laterna TUI/GUI target (separate concern)

### Suggested tree

```
brain/
  shadow-cljs.edn
  package.json
  src/promethean/
    main.cljs

    ecs/
      world.cljs
      ids.cljs
      query.cljs
      tick.cljs

    bus/
      core.cljs
      filters.cljs

    llm/
      openai.cljs
      tools.cljs
      schema.cljs

    memory/
      model.cljs
      normalize.cljs
      tags.cljs
      dedupe.cljs
      store.cljs
      usage.cljs

    eidolon/
      field_digest.cljs
      nexus_keys.cljs
      nexus_index.cljs
      daimoi.cljs
      embedding_jobs.cljs
      compaction.cljs

    runtimes/
      cephalon.cljs
      sentinel.cljs
      olympia.cljs
      opencode.cljs

    adapters/
      fs.cljs
      discord.cljs
      clock.cljs
      mongo.cljs        ;; optional
      vector.cljs       ;; optional

    contracts/
      markdown_frontmatter.cljs
      validators.cljs

    debug/
      log.cljs
      tap.cljs
      inspector.cljs
```

---

## 1) ECS core (minimal, works now, scalable later)

Start with the “simple ECS” you can evolve into archetypes later:

* Entity = `eid` (uuid/string)
* Components = maps on that entity
* World = atom `{::entities {eid {::compA {...} ::compB {...}}} ::time ...}`

### `ecs/world.cljs`

```clojure
(ns promethean.ecs.world)

(defn empty-world []
  {:entities {}
   :time-ms 0
   :tick 0})

(defn add-entity [w eid comps]
  (assoc-in w [:entities eid] comps))

(defn update-entity [w eid f & args]
  (apply update-in w [:entities eid] f args))

(defn remove-entity [w eid]
  (update w :entities dissoc eid))

(defn get-entity [w eid]
  (get-in w [:entities eid]))

(defn has-comp? [w eid k]
  (contains? (get-entity w eid) k))

(defn entities-with [w ks]
  (->> (:entities w)
       (keep (fn [[eid comps]]
               (when (every? #(contains? comps %) ks)
                 eid)))))
```

That’s enough to model:

* sessions
* memories
* embedding jobs
* sentinels
* nexus keys
* daimoi walkers

---

## 2) Event bus (pub/sub with filters)

You want:

* hard-locked events (system/admin)
* configurable subscriptions per session
* filters (channels, tool names, tags, etc.)

### `bus/core.cljs` (simple, core.async)

```clojure
(ns promethean.bus.core
  (:require [cljs.core.async :as a]))

(defn make-bus []
  {:in (a/chan 1024)
   :out (a/mult (a/chan 1024))})

(defn publish! [{:keys [in]} evt]
  (a/put! in evt))

(defn tap! [{:keys [out]} ch]
  (a/tap out ch))

(defn start-bus-loop! [{:keys [in out]}]
  (let [src (a/chan 1024)]
    (a/go-loop []
      (when-some [evt (a/<! in)]
        (a/>! src evt)
        (recur)))
    ;; mult must be attached to src
    (a/pipe src (.-ch out)) ;; (shadow note: easiest is to build mult from src directly)
    {:src src}))
```

> Implementation note: easiest is: create `src` channel, create `(a/mult src)`, and have `publish!` write to `src`. Keep it simple in v0.

---

## 3) LLM calls: JS OpenAI SDK as a thin sugar layer

You want OpenAI-compatible calls without binding your architecture to one provider. So:

* One wrapper module around the OpenAI SDK
* You pass `baseURL` and `apiKey` and it works for OpenAI **or** local vLLM/OpenRouter/etc.
* Tools are your own registry; you translate to OpenAI tool schema when needed.

### `llm/openai.cljs`

```clojure
(ns promethean.llm.openai)

(defn make-client [{:keys [api-key base-url]}]
  ;; npm: openai
  (let [OpenAI (js/require "openai")]
    (new OpenAI (clj->js {:apiKey api-key
                          :baseURL base-url}))))

(defn chat! [client {:keys [model messages tools tool-choice temperature max-tokens]}]
  (-> (.create (.-chat.completions client)
               (clj->js (cond-> {:model model
                                 :messages messages}
                          tools (assoc :tools tools)
                          tool-choice (assoc :tool_choice tool-choice)
                          (some? temperature) (assoc :temperature temperature)
                          max-tokens (assoc :max_tokens max-tokens))))
      (.then (fn [resp] (js->clj resp :keywordize-keys true)))))

(defn embed! [client {:keys [model input]}]
  (-> (.create (.-embeddings client)
               (clj->js {:model model :input input}))
      (.then (fn [resp] (js->clj resp :keywordize-keys true)))))
```

This is intentionally boring. All the “nice sugar” lives **above** it:

* tool registry
* message packing `[...related ...persistent ...recent]`
* deterministic prompt templates (field digest, circuits)

---

## 4) Data model: events → memories → embeddings → nexus keys

### 4.1 Events (immutable, append-only)

Event shape (store + bus):

```clojure
{:event/id "uuid"
 :event/ts  1706730000000
 :event/type :discord.message/new
 :event/source {:kind :discord :channel-id "367156652140658699" :author-id "..."}
 :event/payload {...}}
```

### 4.2 Memories (indexable LLM messages + metadata)

Memory shape:

```clojure
{:memory/id "uuid"
 :memory/ts 1706730000000
 :memory/kind :discord|:tool|:system|:summary|:aggregate
 :memory/role :user|:assistant|:tool|:system|:developer
 :memory/text "..."
 :memory/meta {...}            ;; tool name, path, url, chan id, etc
 :memory/tags [...]
 :memory/nexus-keys [...]
 :memory/lifecycle {:deleted false :pinned false :replaced-by nil}
 :memory/usage {:included-total 0 :included-decay 0.0}}
```

**Key implementation move:** treat “LLM message objects” as *one view* over memory. Internally, memory is the canonical record.

---

## 5) Eidolon as ECS systems (the “game loop”)

### Entities you’ll want immediately

* `Cephalon` entity

  * components: `:cephalon/name`, `:cephalon/policy`, `:cephalon/shared-state`
* `Session` entities (facets/aspects)

  * components: `:session/name`, `:session/subscriptions`, `:session/queue`, `:session/focus`, `:session/circuit`
* `Memory` entities (optional mirror of db records)

  * components: `:memory/*` (or just keep memory in external store and cache ids in world)
* `EmbeddingJob` entities

  * components: `:job/type`, `:job/priority`, `:job/status`, `:job/dedupe-key`
* `Sentinel` entities

  * components: `:sentinel/contract`, `:sentinel/state`, `:sentinel/retries`
* `NexusKey` entities (optional, you can keep nexus index as a store)
* `Daimoi` entities (walkers)

  * components: `:daimoi/budget`, `:daimoi/state`, `:daimoi/seed-set`

### Systems (run each tick, deterministic ordering)

1. ingest adapters (discord/fs/clock) → publish events
2. event router → enqueue into subscribed session queues
3. memory pipeline (dedupe → tags → nexus keys → store memory)
4. eidolon indexing (update nexus index, schedule embeddings)
5. session scheduler (fair queue across sessions, tool budget)
6. cephalon step (build context → LLM call → tool calls → new events)
7. sentinel step (contracts, validation, retries)
8. olympia sampling (stats, benchmark tasks)
9. maintenance (embedding workers, outbox drains, compaction plan/commit)

---

## 6) The tick loop (game-style)

### `ecs/tick.cljs`

```clojure
(ns promethean.ecs.tick)

(defn run-systems [w systems]
  (reduce (fn [w sys] (sys w)) w systems))

(defn tick [w dt-ms systems]
  (-> w
      (update :time-ms + dt-ms)
      (update :tick inc)
      (run-systems systems)))
```

### `main.cljs` (daemon)

* create `world*` atom
* start adapters (discord/fs watcher) that publish into the bus
* run `setInterval` tick at e.g. 50–200ms
* when debug enabled: tap world snapshots / events

---

## 7) Subscription model (your hard-locked Discord channels)

Represent subscriptions as data in the Session entity:

```clojure
{:session/subscriptions
 {:hard-locked true
  :filters
  [{:event/type :discord.message/new
    :discord/channel-id "343299242963763200"}
   {:event/type :discord.message/new
    :discord/channel-id "450688080542695436"}
   {:event/type :discord.message/new
    :discord/channel-id "343179912196128792"}
   {:event/type :discord.message/new
    :discord/channel-id "367156652140658699"}]}}
```

Then your router system does:

* for each incoming event:

  * test against each session’s filters
  * enqueue into `:session/queue`

Deterministic + debuggable.

---

## 8) Sentinel contract execution (your `docs/notes` workflow)

This is a clean early “vertical slice” because it hits:

* filesystem watcher
* tool calls (read/write)
* LLM call
* validator
* retries
* memory + eidolon ingestion

### Sentinel state machine component

```clojure
{:sentinel/state :pending|:running|:validating|:retry|:done|:failed
 :sentinel/retries {:attempt 0 :max 5}
 :sentinel/input {:path "docs/notes/2026-01-31-...md"}
 :sentinel/output {:path "...same..." :schema :frontmatter/v1}}
```

### Contract validator (frontmatter)

Keep it deterministic:

* parse YAML frontmatter
* assert required keys exist
* `slug` matches regex
* `tags` is list of strings
* write back with stable ordering

A sentinel only “succeeds” when validator passes.

---

## 9) Where the ECS meets persistence

Start dev-mode with in-memory stores, but design interfaces as protocols so you can swap in Mongo/vector index later.

### Store protocols (sketch)

* `MemoryStore`

  * `put-memory!`, `get-memory`, `query-by-ids`, `mark-deleted!`, `inc-usage!`
* `NexusIndex`

  * `upsert-key!`, `neighbors`, `degree`
* `VectorIndex`

  * `upsert-vector!`, `search`, `delete-vector!`
* `Outbox`

  * `enqueue!`, `drain!`

In ECS terms:

* Systems call store protocols
* Stores emit events (success/fail) back onto the bus when useful

---

## 10) Dev workflow (debug-first, “running instance of promethean”)

### Recommended loop

* `shadow-cljs watch brain`
* connect a CLJS node repl from Emacs
* enable:

  * event tap stream
  * system timing stats per tick
  * “world diff” logs for key components only (avoid spam)

### Debug knobs you’ll want on day 1

* tick rate
* per-system duration
* queue lengths per session
* event ingest rates per channel
* embedding backlog size
* outbox oldest age

These become your first “Olympia metrics” too.

---

## What I’d implement first (vertical slices, in order)

1. **ECS + tick loop + debug stats** (no LLM yet)
2. **Event bus + session subscriptions** (route events into queues)
3. **Discord adapter** (subscribe to those 4 channels, publish events) — using Discord gateway
4. **Memory pipeline**: dedupe exact + tag rules + nexus key derivation + memory store
5. **Sentinel: docs/notes frontmatter contract** (fs watcher + LLM + validator + retry)
6. **LLM wrapper** using OpenAI SDK (pointed at any baseURL)
7. **Eidolon basics**: canonical embeddings + minimal vector search + `related` assembly
8. **Daimoi walkers** (nexus expansion)
9. **Compaction + summaries** (cluster by spam family and by file path)

That gets you an always-running Promethean instance that does real work and produces real memories.

---

If you want, I can go one layer deeper next and write the **exact component keys + system function signatures** for:

* `cephalon.step` (context assembly → chat call → tool calls → new events)
* `sentinel.step` (contract runner loop)
* `memory.ingest` (dedupe/tags/nexus)
* `eidolon.search` (canonical + eidolon lanes + daimoi merge)

…and keep it all in pure `shadow-cljs` CLJS with Node interop.
