# Cephalon TS Implementation Surfaces

## Purpose

Name the files that actually define the current TypeScript cephalon, and distinguish canonical seams from experimental carryovers.

## Runtime entrypoints

### `src/cli.ts`
Minimal executable wrapper around `createCephalonApp`.

Use it when you want:
- one process
- one chosen bot identity
- graceful startup and shutdown

### `src/app.ts`
Preferred assembly seam for the package.

It currently owns:
- bot/token resolution
- policy loading
- memory-store choice
- LLM + tool executor + turn processor wiring
- session creation from the eight-circuit manifest
- Discord/IRC integrations
- mind helpers (`LocalMindGraph`, `RssPoller`, `EidolonFieldState`, `PromptFieldEngine`, `CephalonMindQueue`)
- temporal scheduling for circuit ticks
- Memory UI startup

### `src/hive-cli.ts` and `src/cephalon-hive.ts`
Higher-level multi-bot orchestration path.

These files matter when the question is not “run one cephalon” but “run the hive of cephalons with multiple identities.”

### `src/main.ts`
Legacy / experimental standalone runtime path.

Important because it still contains:
- a `CephalonControlPlane`
- an older conversational tick loop
- evidence about how the runtime evolved before the newer assembly path stabilized

## Orchestration surfaces

### `src/circuits.ts`
The package’s clearest doctrine manifest.

It defines:
- eight circuits
- their loop intervals
- model selection logic
- tool permissions
- public vs control vs architectural roles

### `src/sessions/manager.ts`
Runtime session scheduling and routing.

### `src/llm/turn-processor.ts`
Where context, model call, tool loop, and output production braid together.

### `src/llm/tools/registry.ts` and `src/llm/tools/*`
The executable tool surface.

Load-bearing tool areas include:
- Discord discovery/output
- browser actions
- desktop capture
- web fetch/search
- vision inspection
- memory lookup/pin
- mind proposal / prompt governance tools

### `src/runtime/temporal.ts`
The explicit temporal scheduling contract.

Why it matters:
- it moves the package away from ad-hoc “setInterval mind” behavior and toward typed scheduled ticks

## Integrations

### `src/discord/*`
Primary social ingress/egress layer.

### `src/irc/*`
Alternative room surface for the same head runtime.

### `src/openplanner/client.ts`
Bridge into planner/state infrastructure when configured.

### `src/ui/*` and `src/ui/server.ts`
Memory UI and runtime inspection surface.

## Mind-side helpers inside the TS package

### `src/mind/local-mind-graph.ts`
Message/link/asset graph trace for the head's short-horizon local topology.

`src/mind/graph-weaver.ts` now exists only as a deprecated compatibility shim so the external workbench keeps the Graph-Weaver name.

### `src/mind/eidolon-field.ts`
Eight-dimension field weather derived from live message content.

### `src/mind/prompt-field.ts`
Prompt overlay / field-evolution surface.

### `src/mind/integration-queue.ts`
Cross-circuit proposal queue.

### `src/mind/rss-poller.ts`
Feed ingestion that thickens the cephalon’s attention surface.

## Persistence surfaces

### `src/core/memory-store.ts`
In-memory baseline.

### `src/core/mongodb-memory-store.ts`
Persistent runtime path.

### `src/core/memory-compactor.ts`
Summary/compaction path that tries to keep long-running memory usable.

### `src/contracts/memory-record.ts`
Boundary adapter for canonical cross-strata memory records.

Why it matters:
- it lets TS normalize its own memory shape and also ingest legacy CLJS/CLJ-style records at the boundary
- it is the memory-side analogue of the event-envelope adapter

## Current tensions

### 1. `app.ts` vs `main.ts`
The package still contains two partially-overlapping truths:
- `app.ts` is the cleaner multi-circuit service seam
- `main.ts` still carries useful control-plane and legacy-loop experiments

### 2. service runtime vs doctrine runtime
The package runs well as a service, but the doctrinal language for “head of the agent system” still lives partly outside it.

### 3. local mind helpers vs extracted sibling repos
The package contains graph/field/prompt helpers that may eventually migrate or align more tightly with sibling repos.

## Practical reading advice

If you only have one hour, read in this order:
1. `src/app.ts`
2. `src/circuits.ts`
3. `src/runtime/control-plane.ts`
4. `src/llm/turn-processor.ts`
5. `src/mind/*`
6. `src/main.ts` only after the newer seam makes sense
