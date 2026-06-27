# Cephalon JVM CLJ Implementation Surfaces

## Purpose

Document the JVM package as a precursor runtime rather than leaving it as an unexplained skeleton.

## Bootstrap path

### `src/promethean/main.clj`
This is the package’s composition root.

It currently:
- reads EDN config from `resources/config.edn`
- starts the event bus
- creates memory and eidolon stores
- constructs one cephalon instance and one session
- subscribes the session to Discord message events
- starts a notes watcher that routes changed markdown files through the sentinel contract

Why it matters:
- it is the smallest whole-program Cephalon in the repo
- it keeps config, eventing, memory, and note-governance legible

## Runtime loop

### `src/promethean/runtime/cephalon.clj`
The core precursor cephalon loop.

Observed stages:
- subscribe to matching events via the event bus
- remember those events through eidolon/memory
- build context from related, persistent, and recent traces
- call the LLM via the OpenAI-compatible client
- emit a `:cephalon/thought` event with the generated text

Why it matters:
- it is one of the clearest compact expressions of Cephalon as a loop
- it is small enough to reason about without losing the family resemblance

## Sentinel surface

### `src/promethean/runtime/sentinel.clj`
The note-governing path.

Observed behavior:
- reads markdown
- requests JSON metadata from the model
- validates the shape
- rewrites frontmatter into the note
- retries a small number of times before failing

This is a strong candidate for reuse across the larger family.

## Supporting surfaces

### `src/promethean/runtime/eventbus.clj`
Event transport within the precursor runtime.

It now also exposes boundary-edge helpers so JVM CLJ code can:
- ingest canonical event envelopes into the internal bus
- subscribe to canonical event envelopes derived from internal bus events

That makes the precursor runtime a real participant in the shared cross-strata event contract instead of a purely local bus.

### `src/promethean/contracts/memory_record.clj`
Boundary adapter for canonical cross-strata memory records.

Why it matters:
- it converts the older JVM-local memory shape into the canonical boundary record
- it also converts canonical boundary records back into a JVM-local map that legacy runtime code can still consume

### `src/promethean/eidolon/*`
Related-memory and prompt support.

### `src/promethean/memory/*`
Simple memory store surfaces.

### `src/promethean/openplanner/client.clj`
Planner integration seam.

## Test surface

Current tests already exist for:
- `promethean.openplanner.client`
- `promethean.runtime.eidolon`

That makes this package more than a prose stub even if it is not the dominant runtime.
