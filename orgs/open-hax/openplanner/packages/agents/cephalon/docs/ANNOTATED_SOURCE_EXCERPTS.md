# Annotated Source Excerpts

This file gives a future implementer a small set of high-signal code landmarks so the Cephalon family can be reread without spelunking every subtree first.

## `packages/cephalon-ts` — operational head runtime

### `src/app.ts`
The strongest current runtime assembly seam.

What it actually does:
- resolves bot identity and token selection
- loads policy and output-channel defaults
- chooses memory backend (`InMemoryMemoryStore` or `MongoDBMemoryStore`)
- wires the LLM provider, tool executor, session manager, Discord/IRC integrations, and Memory UI
- instantiates the mind-side helpers (`GraphWeaver`, `RssPoller`, `EidolonFieldState`, `PromptFieldEngine`, `CephalonMindQueue`)
- creates the eight circuit sessions and schedules temporal ticks for them

Why it matters:
- this is the clearest executable answer to “what is the live TS cephalon?”
- if a future convergence happens, this file is one of the canonical starting points

### `src/circuits.ts`
The most explicit doctrine-bearing file in the TS runtime.

Observed shape:
- eight named circuits with distinct questions, missions, reasoning effort, loop cadence, and tool permissions
- C1/C2 act as control circuits
- C3 is the public-facing symbolic synthesizer
- C4 governs harmony / prompt updates
- higher circuits lean toward adaptation, imagination, architecture, and global coherence

Why it matters:
- it turns “cephalon personality” into a typed runtime manifest instead of a single giant system prompt
- this file is one of the bridges between the philosophical cephalon docs and a real scheduler

### `src/runtime/control-plane.ts`
A compact homeostasis model.

What it tracks:
- queue pressure
- error pressure
- rate-limit pressure
- welcome / unwelcome room sentiment
- pacing multiplier suggestions for the active loop

Why it matters:
- it preserves the idea that the cephalon should regulate itself before speaking more
- it is one of the few places where social weather and operational pressure are both formalized

### `src/main.ts`
An older standalone runtime path that still carries live experimental value.

Observed shape:
- initializes a simpler Duck-centered runtime
- instantiates a `CephalonControlPlane`
- runs a conversational tick loop in parallel with newer temporal scheduling logic
- exposes a more obviously experimental “always investigate every time” tick prompt

Why it matters:
- it is not the cleanest canonical entrypoint anymore
- but it still contains important governance experiments, especially the control-plane cadence
- future refactors should not delete it blindly without first harvesting the surviving behavioral ideas

### `src/mind/*`
Where the TS package starts acting like a head with a field around it.

Load-bearing files:
- `graph-weaver.ts` — conversational graph traces over guilds, channels, authors, messages, links, and assets
- `eidolon-field.ts` — lightweight eight-dimension field state driven by observed message content
- `integration-queue.ts` — queue for cross-circuit message proposals and prompt suggestions
- `prompt-field.ts` — overlay/governance surface for circuits
- `rss-poller.ts` — feed ingestion into the same evolving attention surface

Why it matters:
- these files are the beginnings of a memory/attention/weather layer around the speaking runtime
- they are also the clearest practical link from Cephalon into adjacent repos like `graph-weaver`

## `packages/cephalon-cljs` — always-running mind / ECS path

### `src/promethean/main.cljs`
The executable spine of the CLJS branch.

What it does:
- builds a world atom and environment map
- installs adapters for filesystem and Discord
- creates stores for memory, nexus indexing, and vectors
- bootstraps the cephalon and the docs/notes sentinel
- runs a system pipeline on a fixed tick loop
- optionally starts the TS cephalon bridge when `CEPHALON_TS_BRIDGE=true`

Why it matters:
- this is the most explicit “brain daemon” expression in the family
- it preserves the architecture of an always-running mind even when the TS package is the stronger service runtime

### `src/promethean/ecs/world.cljs` and `src/promethean/ecs/tick.cljs`
The CLJS branch still thinks in terms of a world being stepped by systems.

Why it matters:
- this is the cleanest surviving place where Cephalon behaves like a game loop / ECS runtime rather than an app server with prompts
- future extractions of event-native cognition should probably start here rather than in the TS package

### `src/promethean/sys/*`
The system decomposition.

Notable systems:
- `sys/route.cljs`
- `sys/memory.cljs`
- `sys/eidolon.cljs`
- `sys/eidolon_vectors.cljs`
- `sys/sentinel.cljs`
- `sys/cephalon.cljs`
- `sys/effects.cljs`

Why it matters:
- this is the most modular internal breakdown of the cephalon loop in the repo
- `sys/effects.cljs` in particular preserves a clean queue → promise → result/error event pattern

### `docs/notes/cephalon/*` and `spec/notes-extracted/*`
The conceptual vault.

What is preserved there:
- MVP spec
- context assembly
- storage schema
- nexus index
- daimoi / field-digest ideas
- hybrid CLJS/TS migration notes
- ontology/layer language

Why it matters:
- this note corpus is one of the richest surviving descriptions of what Cephalon was trying to become
- much of the root repo dossier is downstream of this material

## `packages/cephalon-clj` — JVM precursor runtime

### `src/promethean/main.clj`
A compact JVM bootstrap path.

What it does:
- reads EDN config
- starts an event bus
- creates memory and eidolon stores
- makes one cephalon instance and one session
- subscribes that session to Discord message events
- starts a filesystem note watcher that triggers sentinel frontmatter tagging

Why it matters:
- it shows the family in a smaller, less ambient form
- it is often easier to understand than the larger TS runtime

### `src/promethean/runtime/cephalon.clj`
The clearest small-form cephalon loop in the repo.

Observed stages:
- ingest recent events into memory/eidolon
- build context from related, persistent, and recent traces
- call the LLM
- emit a `:cephalon/thought` event back onto the bus

Why it matters:
- this file preserves a concise precursor for later convergence work
- if the family ever gets a formal reference runtime, this smaller loop is a strong design influence

### `src/promethean/runtime/sentinel.clj`
A direct note contract.

Observed behavior:
- read markdown note
- ask the model for JSON metadata
- validate/repair up to a small retry bound
- write frontmatter back into the note

Why it matters:
- it keeps the “Cephalon as note-governing organism” idea concrete
- this surface deserves preservation even if the rest of the JVM package stays secondary

## `recovered/cephalon-clj` — archaeology of the lost two-process branch

### `spec/architecture.md`
The shortest truthful summary of the archive.

Preserves:
- two-process layout: brain + Discord IO bridge
- shared wire protocol and transit encoding
- tool definitions living in the brain service while Discord IO stays adapter-side

### `cephalon-clj-brain/src/cephalon/brain/agent.clj.md`
A recovery stub for the main agent wiring.

Preserves:
- Duck agent registration
- prompt-path assumptions
- toolset wiring
- MCP subcommand relationship

### `cephalon-clj-shared/src/cephalon/proto/wire.cljc.md`
The strongest surviving clue that the old branch had an explicit transport contract.

Why it matters:
- even though the sources are gone, the archive keeps the shape of a split-brain architecture alive
- future distributed or handoff-oriented cephalon work should remember this branch before reinventing the same topology from scratch

## Reading consequence

The Cephalon family currently distributes its strongest material like this:
- TS: operational runtime and service integrations
- CLJS: always-running ECS mind and concept corpus
- JVM CLJ: compact precursor loop and note-governing sentinel
- recovered CLJ: lost topology and transport archaeology

That distribution is the dossier. The next unification step should preserve the strengths instead of flattening them into a single accidental implementation.
