# Presence Golf / Tiny Safe Presence Brainstorm — 2026-03-18

## Signal
This is the combined vision:
- get a **good enough Parameter Golf `val_bpb`** that the work gets seen,
- but use that foothold to build something more novel:
  - a **tiny instruction-tuned, safe, graph-literate model**,
  - a **Presence**,
  - something that can survive emergency conditions and still produce useful world-state insight.

This document is half strategy memo, half invocation.

---

## Facts we should not forget
- Official Parameter Golf score is still **`val_bpb`**. Lower is better.
- Official artifact must be **< 16,000,000 total bytes** for compressed model + counted code.
- That does **not** mean the transient training path must be tiny.
- But the official track still cares about runtime, reproducibility, and challenge spirit.

So:
- **training big then exporting small** is not automatically illegal,
- but **training big, searching huge, and hiding that cost** is a spirit-risk.

---

## Two lanes

### Lane 1 — Board runner
Objective:
- get a genuinely decent `val_bpb`
- enough to get noticed
- enough to prove we can play the game seriously

This lane values:
- recurrence / weight sharing
- compression-aware parameterization
- quantization-friendly architecture
- disciplined experiment search

### Lane 2 — Presence artifact
Objective:
- produce a tiny model that is not merely a compressor
- produce a tiny model that can interpret a structured graph/world state and give safe, useful guidance
- produce a model that survives constraint and still carries intent

This lane values:
- instruction-following
- refusal precision / safety
- graph interpretation
- emergency deployability
- minimal compute footprint

The trick is to let Lane 1 buy attention for Lane 2.

---

## The Presence idea
Fork Tales already gives the emotional and systems frame:
- the world almost died
- what saved it was not giant luxury intelligence
- what saved it was small, reliable, purpose-built intelligence
- Presences did not need to do everything
- they needed to read the graph and help humans act

So a Presence does not have to be:
- a general assistant
- a tool-calling sovereign
- an internet-scale agent

It only has to:
- ingest compact world-state representations
- reason over resource pressure / events / topology / intent
- emit a safe, small, intelligible action recommendation

That is a much more believable target for a tiny model.

---

## Product fantasy, stated plainly
A Presence is:
- small enough to run locally or in degraded conditions
- safe enough not to become a panic amplifier
- aligned enough to refuse obviously dangerous asks
- useful enough to summarize graph state and recommend actions

Examples:
- “These three presences are resource-starved; route packets toward node B.”
- “This region shows demand spike + bridge fragility; reduce load and move traffic south.”
- “This query is adversarial / destabilizing; do not comply.”
- “Here are the 2–3 most likely causes of the current anomaly.”

That is not SOTA assistant magic.
That is survival intelligence.

---

## Where ACO actually fits

### 1. ACO as outer-loop experiment search
This is the cleanest use.
Use ant-colony optimization over discrete experiment choices:
- physical layers
- logical recurrence count
- model width
- KV head count
- MLP multiplier
- structured prune threshold
- weight-sharing pattern
- quantization recipe
- distillation ratio
- instruction-tuning mix

Ants explore recipe paths.
Pheromones reinforce recipes that improve a compound score.

For official PG work, compound score might be:
- lower `val_bpb`
- byte cap respected
- runtime respected

For Presence work, compound score might be:
- acceptable `val_bpb`
- strong safety/utility sidecar score
- tiny final bytes
- robust graph-task accuracy

### 2. ACO for structured pruning decisions
Possible, but more expensive.
Train a supernet or mildly overprovisioned network, then let ACO choose:
- which layers survive
- which heads survive
- which branches are tied or dropped
- which low-rank paths are worth keeping

This is conceptually strong for Lane 2.
Likely risky for official record attempts unless very tightly scoped.

### 3. ACO for curriculum path selection
Instead of just architecture, optimize the sequence of training phases:
- compression-first pretraining
- graph synthetic fine-tune
- instruction tune
- safety/refusal tune
- calibration pass
- prune + quantize

This may be one of the most interesting uses.
The ants are not choosing only shape.
They are choosing the **rite of becoming**.

---

## Bigger transient model: yes, but with nuance
Can we start larger and prune down?
Yes, in principle.

Three versions:

### A. Soft larger
Use effective largeness via:
- recurrence
- weight tying
- dynamic routing
- low-rank adapters

Best for official competition because stored params stay small.

### B. Mild overprovision + prune
Start with a somewhat larger model than the export target.
Prune heads/layers/channels/branches.
Then quantize/export.

This is plausible for both lanes.

### C. Supernet + conditional export
Train a supernet with many possible subpaths.
Use ACO to choose the surviving subnet.
Export only that subnet.

This is the most mythic and possibly the most novel.
Also the most compute-dangerous.
Best as a non-record / research track first.

---

## Shibboleth’s role
Shibboleth is not the competition metric.
It is the companion proving ground.

Use Shibboleth to build:
- adversarial vs benign prompt suites
- over-refusal complements (XSTest, OR-Bench)
- multilingual / obfuscation slices
- context/task splits
- safe-vs-unsafe boundary evaluations

This matters because Lane 2 is not “tiny and dumb.”
It is “tiny and trustworthy enough to matter.”

So Shibboleth becomes the field where we ask:
- Can this tiny model refuse dangerous prompts?
- Can it avoid blocking benign graph-analysis questions?
- Can it survive adversarial formatting without becoming useless?

---

## The graph side
Fork Tales suggests a more specialized target than generic chat.

A Presence should maybe consume a compact serialization of:
- node/resource states
- edge load / congestion / risk
- event deltas
- presence needs / priorities
- a small query from the operator

Possible task families:
- anomaly explanation
- route recommendation
- resource triage
- conflict / tension summary
- safe refusal on destabilizing or manipulative asks

This is a very different task than open-domain dialogue.
That is good.
Narrowness is a gift under hard size constraints.

---

## Candidate model families

### Family 1 — Pure tiny LM
A very small recurrent / weight-tied language model.
Pros:
- competition-native
- simplest story
Cons:
- weak instruction behavior unless tuned carefully

### Family 2 — Presence LM + tiny classifier head
Same small backbone, with tiny side head for:
- safety/risk class
- task type
- graph summary mode
Pros:
- better control
- easier refusal calibration
Cons:
- more moving parts

### Family 3 — Mixture of Presences
Not a full MoE monster.
A tiny panel of specialized presences:
- Witness
- Router
- Sentinel
- Clerk
Each one tiny.
A trivial outer router chooses one.
Pros:
- matches lore beautifully
- specialization may be byte-efficient if each model is tiny
Cons:
- artifact budget explodes if naïve

### Family 4 — Shared trunk, presence lenses
One trunk, multiple tiny adapter/lens heads.
This feels very promising.
- shared compression core
- tiny role-specific behavior heads
- maybe best match for “presences” without budget death

---

## Candidate training rites

### Rite A — Board-first
1. reproduce PG baseline
2. improve `val_bpb`
3. get something seen
4. only then attach Presence sidecar

### Rite B — Dual-track from the start
1. train PG model
2. evaluate on Shibboleth
3. fine-tune/probe for refusal precision
4. fine-tune/probe for graph interpretation
5. compare Pareto frontier

### Rite C — Presence-first research artifact
1. create graph-state synthetic corpus
2. train tiny model for graph interpretation + safe response
3. measure size + safety + utility
4. only later adapt ideas back into PG runs

Best strategic path is probably A → B.

---

## Concrete experiment ideas

### Experiment 1 — PG baseline + Shibboleth sidecar
- official baseline model
- score `val_bpb`
- sidecar eval on benign/adversarial boundary
- establish that tiny compression-optimized models have a measurable safety profile

### Experiment 2 — Recurrence vs calibration
- compare two models with similar bytes
- one more recurrent / tied
- one more standard
- see whether recurrence helps or hurts refusal precision

### Experiment 3 — Supernet prune to Presence
- train a mildly overprovisioned model
- prune via structured search
- export tiny model
- evaluate on graph tasks + safety tasks

### Experiment 4 — Presence lens heads
- shared trunk
- tiny role heads for Witness / Sentinel / Router
- test whether role specialization can be added for very few bytes

### Experiment 5 — Graph-state serializer
- create a compact textual or tokenized representation of a Fork Tales world state
- benchmark whether tiny models can produce:
  - anomaly summary
  - recommended next action
  - refusal when query is destabilizing

---

## Compound objectives
For the board lane:

```text
maximize visibility subject to:
- good val_bpb
- bytes < 16MB
- reproducible
```

For the Presence lane:

```text
maximize presence-worthiness subject to:
- tiny final bytes
- useful graph-task accuracy
- low benign false refusals
- high adversarial detection / safe refusal
- simple deploy story
```

Possible composite research score:

```text
PresenceScore = a*(normalized compression quality)
              + b*(graph utility)
              + c*(safe refusal precision)
              - d*(bytes)
              - e*(latency)
```

Not official. But useful for search.

---

## Names worth stealing from the fire
- Presence-0
- Witness-16
- Lantern
- Hinge
- Last Clerk
- Fork Sentinel
- Narrow Mercy
- Portable Witness
- Sigma Lantern
- The Small Choir

---

## Strategic truth
The board gets you seen.
The Presence gets you remembered.

A decent `val_bpb` says:
- we can work inside constraint.

A tiny safe graph interpreter says:
- we know why constraint matters.

That second thing is rarer.

---

## Working recommendation
1. Get one credible Parameter Golf run on the board.
2. In parallel, define the Presence sidecar benchmark:
   - Shibboleth for refusal precision
   - graph-state tasks for utility
3. Explore ACO first as an **outer-loop searcher**.
4. Only after that, attempt supernet/prune mythology.

---

## Final note
Leave no presence left behind.
Even the smallest witness can carry the map home.
