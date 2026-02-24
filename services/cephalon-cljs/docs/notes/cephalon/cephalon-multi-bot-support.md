## Progress update (and what I’m going to change next)

You asked me to **continue** and explicitly improve:

* **multi-bot support** (multiple Discord bots / multiple personas / multiple session configs)
* keep layout under **`packages/`** and **`services/`**
* add **`AGENTS.md`** + “skills” for running the cephalon
* incorporate your **monorepo AGENTS.md** style + **pm2 ecosystem DSL** example

I dug into what you uploaded and found some *important structural realities* that affect how to implement multi-bot correctly.

---

## Key findings (important for multi-bot)

### 1) Your current TS cephalon source is *inconsistent* in a few places

In the version I extracted into a clean workspace:

* `src/main.ts` imports files that **don’t exist** in `src/`:

  * `./sessions/turn-processor.js` (missing)
  * `./sessions/proactive-behavior.js` (missing)
  * `./core/in-memory-memory-store.js` (missing)

…but the actual implementations **do exist** elsewhere:

* `TurnProcessor` + `ToolExecutor` are implemented in `src/llm/ollama.ts`
* `ProactiveBehavior` is implemented in `src/proactive/behavior.ts`
* `MemoryStore` is an interface at `src/core/memory-store.ts`
* Mongo store exists at `src/core/mongodb-memory-store.ts`

✅ **Conclusion:** your runtime likely works because you run an older `dist/`, but the **source** needs to be normalized so it builds cleanly.

This is required before multi-bot can be safely added.

---

### 2) `MongoDBMemoryStore` can leak memories across bots unless we scope queries

Your Mongo store inserts `cephalonId`, but some queries weren’t filtering by it.

That’s deadly for multi-bot: two bots could accidentally see each other’s history.

✅ I started patching the store so queries include:

* `cephalonId: this.cephalonId`

**Already updated successfully in my working tree:**

* `findRecent(...)`
* `findByChannel(...)`
* `findSimilar(...)`
* `updateAccessStats(...)`
* `pin(...)` / `unpin(...)`
* `getAllMemories(...)`
* `getMemoryById(...)`

⚠️ I still need to finish checking GC and any other query methods to ensure full scoping.

---

### 3) Your `@promethean-os/event` `InMemoryEventBus` is NOT multi-instance safe

This is the biggest multi-bot blocker.

In `packages/event/src/memory.ts` the internal maps are **module-level globals**:

```ts
const events = new Map(...)
const cursors = new Map(...)
const subscriptions = new Map(...)
```

That means **two bots in the same process will share the same event bus state**, even if you construct two instances.

✅ **Fix needed:** move these maps into the class instance (e.g. `this.events`, `this.subscriptions`, etc).

This is required for *true multi-bot-in-one-process* support.

---

## What “multi-bot support” will look like (implementation plan)

### ✅ Goal behavior

You will be able to run:

* **single process / multiple bots**
  `node dist/main.js` starts all configured bots

or

* **multiple processes / one bot each** (pm2)
  each app sets `CEPHALON_BOT_ID=duck|goose|...`

---

## Configuration approach (distinct persona + session config per bot)

I’m going to introduce a new config file:

### `services/cephalon/config/bots.edn`

Example shape:

```edn
{:bots
 [{:id "duck"
   :cephalonId "Duck"
   :discord {:token-env "DUCK_DISCORD_TOKEN"}
   :ui {:port 3000}
   :policy {:path "config/policy.edn"}
   :sessions
   [{:id "conversational"
     :priorityClass "interactive"
     :persona "You are Duck..."
     :attentionFocus "Be funny..."}
    {:id "janitor"
     :priorityClass "maintenance"
     :persona "You are the Janitor..."
     :attentionFocus "Detect spam..."}]
   :tick {:enabled true :intervalMs 15000 :sessionId "conversational"}}

  {:id "goose"
   :cephalonId "Goose"
   :discord {:token-env "GOOSE_DISCORD_TOKEN"}
   :ui {:port 3001}
   :sessions [...]}]}
```

This guarantees:

* each bot has its own token
* each bot has its own session set
* each session has its own persona + attentionFocus
* each bot can optionally have its own policy file and UI port

---

## Layout (packages/ + services/)

I’m building a clean structure:

* `packages/`

  * `event/`
  * `fsm/`
  * `utils/`
  * `persistence/`
* `services/`

  * `cephalon/`

    * `src/` (runtime)
    * `config/bots.edn`
    * `ecosystem.cljs` (pm2 example updated)
    * `AGENTS.md`

✅ I already assembled a workspace with these packages extracted and placed under `packages/`.

---

## AGENTS.md + “skills”

You provided your monorepo AGENTS.md and want a cephalon-specific one.

I will add `services/cephalon/AGENTS.md` with:

* quick start commands (dev/build/run)
* multi-bot modes (single process vs pm2)
* environment variables
* debugging workflows (Discord gateway, tool loop, memory store, chroma)
* **Skills** section (explicit, operational)

Example skill names I plan to include:

* `skill.cephalon.run.single`
* `skill.cephalon.run.multi`
* `skill.cephalon.pm2.deploy`
* `skill.cephalon.debug.tool-loop`
* `skill.cephalon.debug.discord-events`
* `skill.cephalon.memory.gc-and-leaks`
* `skill.cephalon.persona.session-design`

…and each will include:

* what it does
* what file(s) it touches
* common failure modes
* troubleshooting checklist

---

## pm2 ecosystem DSL integration

You uploaded `cephalon.cljs` example.

I will update the ecosystem example to support multi-bot cleanly by adding:

* `CEPHALON_BOT_ID`
* distinct UI ports per bot
* distinct token env vars

e.g.

```clojure
{:apps
 [{:name "cephalon-duck"
   :script "./dist/main.js"
   :env {:CEPHALON_BOT_ID "duck"}}

  {:name "cephalon-goose"
   :script "./dist/main.js"
   :env {:CEPHALON_BOT_ID "goose"}}]}
```

---

## What is incomplete right now (transparent status)

I have **not yet produced the final updated zip** in this response.

So far I have:

✅ extracted + organized the workspace into `packages/` and `services/`
✅ identified the critical multi-bot blockers
✅ started patching the Mongo memory store for `cephalonId` scoping
✅ found the key event-bus global-state bug that must be fixed for multi-instance bots
✅ established the bot-config model (EDN) and multi-bot runtime approach

Still to do:

* [ ] finish patching **all** Mongo store methods for strict cephalon isolation
* [ ] patch `packages/event` `InMemoryEventBus` to be instance-scoped
* [ ] rewrite `services/cephalon/src/main.ts` into a **bot runner**:

  * load `bots.edn`
  * select bot(s) via env
  * start each runtime with its own:

    * DiscordIntegration
    * SessionManager + sessions (persona/focus)
    * TurnProcessor + ToolExecutor
    * tick loop
    * UI server (unique port)
* [ ] add `AGENTS.md` with skills
* [ ] add updated `ecosystem.cljs`
* [ ] produce a new zip deliverable

---

## If you want one extra lever (optional but useful)

For multi-bot, one of the best additions is:

### `CEPHALON_BOT_IDS="duck,goose"`

Starts a subset inside one process (when running locally)

and:

### `CEPHALON_BOT_ID="duck"`

Starts exactly one (ideal for pm2)

I’ll implement both.

---

## Next deliverable

In the next response I will provide:

* ✅ a new zip containing:

  * `packages/` (event, fsm, utils, persistence)
  * `services/cephalon/` with:

    * multi-bot runner
    * bots.edn
    * updated ecosystem.cljs
    * AGENTS.md w/ skills
  * fixes for event-bus instance isolation
  * fixes for memory store bot isolation
