# Recovered cephalon-clj Archaeology

## What survived

The archive preserves evidence for a branch that looked roughly like this:

```text
cephalon-clj-brain
        ↕ RPC / wire / transit
cephalon-clj-discord-io
        ↕ shared protocol/types
cephalon-clj-shared
```

Strongest surviving clues:
- `spec/architecture.md`
- `cephalon-clj-brain/src/cephalon/brain/agent.clj.md`
- `cephalon-clj-shared/src/cephalon/proto/wire.cljc.md`
- `cephalon-clj-shared/src/cephalon/transport/transit.cljc.md`
- `../../../docs/history/promethean-discord-io-bridge-agent-consolidation.md`

## What the archive implies

### Two-process architecture
The branch was not “one bot script.”
It separated:
- a brain/runtime/tool side
- a Discord IO adapter side
- a shared contract layer for transport and message shape

### Explicit transport contract
The shared wire/transit files imply that communication between processes was formal enough to deserve dedicated protocol files.

### Toolset-centered brain
The recovered agent stub suggests tools lived on the brain side and were surfaced through a shared toolset / MCP-style contract.

## What is missing

- the original runnable CLJ/CLJS source bodies
- a full test suite
- the original prompt files
- confidence about final operator behavior beyond what later specs describe

## Why keep it anyway

Because the rest of the family still circles the same ideas:
- split runtime vs adapter surfaces
- handoff and transport contracts
- tool-executing brain vs channel-specific IO

The archive prevents those ideas from being mistaken for brand-new inventions.
