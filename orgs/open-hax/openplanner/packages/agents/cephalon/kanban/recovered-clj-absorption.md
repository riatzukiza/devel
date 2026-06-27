---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-recovered-clj-absorption-md"
title: "Recovered CLJ Absorption Spec"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.914Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/recovered-clj-absorption.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/recovered-clj-absorption.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/recovered-clj-absorption.md`

# Recovered CLJ Absorption Spec

## Purpose

Absorb the lost `cephalon-clj` experiment into the canonical Cephalon repo without pretending the recovered archive is a complete runnable source tree.

## What was recovered

The recovered archive preserves the shape of a two-process design:
- `cephalon-clj-brain`
- `cephalon-clj-discord-io`
- `cephalon-clj-shared`
- `spec/architecture.md`
- MCP/config artifacts

Most recovered source files are `.md` stubs summarizing what session/spec archaeology could still prove.

## Key architectural ideas preserved

### Brain / IO split
- brain owns context, agent/tool loop, MCP surface, and prompt/tool policy
- Discord IO bridge owns Discord-side tool implementations and RPC transport
- shared package owns wire format and transit encoding

### Tooling direction
The recovery docs point toward:
- shared tool DSL
- explicit MCP subcommands
- remote tool wrappers
- a separation between agent runtime and adapter layer

## Absorption strategy

### Preserve as archive
Keep the recovered material under:
- `recovered/cephalon-clj/`

### Translate into live doctrine
Surface the best ideas into:
- root Cephalon specs
- package docs
- future implementation tasks in `cephalon-cljs` / `cephalon-ts`

### Do not lie
Do not present recovered `.md` stubs as if they were fully recovered runnable source code.

## Mapping into current packages

### Likely descendants
- recovered `brain/*` ideas → `packages/cephalon-clj` and `packages/cephalon-ts`
- recovered `discord_io/*` ideas → `packages/cephalon-cljs` adapter/bridge surfaces and TS Discord integrations
- recovered `shared/*` ideas → package-level RPC/envelope contracts

## Done condition for this phase

The archive is absorbed when:
- it lives inside the canonical Cephalon repo
- its relationship to living packages is documented
- old external `recovered/cephalon-clj` path can be removed without losing information
