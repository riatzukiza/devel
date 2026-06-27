---
uuid: "orgs-open-hax-eta-mu-kanban-orgs-open-hax-eta-mu-specs-eta-mu-pi-absorption-md"
title: "Eta-mu Pi Absorption"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:29:39.346Z"
source: "orgs/open-hax/eta-mu/specs/eta-mu-pi-absorption.md"
category: "specs"
---

> Source: `orgs/open-hax/eta-mu/specs/eta-mu-pi-absorption.md`
> Migrated-to-kanban: `orgs/open-hax/eta-mu/kanban/eta-mu-pi-absorption.md`

# Eta-mu Pi Absorption

## Intent

Eta-mu owns the agent runtime stack by absorbing the Pi monorepo packages into this pnpm workspace first, without an immediate import-level rebrand.

The initial rule is: keep the absorbed package names stable (`@mariozechner/*`) so the code keeps working, then layer eta-mu-branded distro packages on top.

## Phase 1: Absorb without rebrand

Source: `/home/err/devel/orgs/badlogic/pi-mono/packages/`
Destination: `/home/err/devel/orgs/open-hax/eta-mu/packages/`

Absorbed packages:

- `packages/agent` → `@open-hax/eta-mu-agent-core`
- `packages/ai` → `@open-hax/eta-mu-ai`
- `packages/coding-agent` → `@open-hax/eta-mu-cli`
- `packages/mom` → `@mariozechner/pi-mom`
- `packages/pods` → `@mariozechner/pi`
- `packages/tui` → `@open-hax/eta-mu-tui`
- `packages/web-ui` → `@mariozechner/pi-web-ui`

Internal dependencies between absorbed packages use `workspace:*`.

## Phase 2: Eta-mu runtime package

Eta-mu intentionally ships one user-facing runtime package:

- `packages/coding-agent` → `@open-hax/eta-mu-cli`, owning the `eta-mu` and `pi` binaries plus SDK/runtime exports.

Removed the separate SDK barrel and thin CLI wrapper packages so a runtime change cannot be published without the built-in tools that eta-mu needs by default.

`@open-hax/eta-mu-extensions` declares the built-in tool manifest consumed by `@open-hax/eta-mu-cli`, including Receipt River, Session Mycology, contract runtime, OPMF contract gate, global instructions, graph memory, image render, web search, Chronos, and custom providers.

## Next functional divergence

The first deliberate runtime divergence should be first-class audio input support:

1. Add an `audio` content part type alongside text/image.
2. Persist audio parts in session messages.
3. Preserve audio parts through context construction.
4. Serialize audio parts in provider adapters that support them.
5. Patch Proxx request schemas/routing to accept and forward audio.
6. Simplify Knoxx agent code to depend on eta-mu SDK/runtime instead of owning contract and agent infrastructure locally.

## Packaging caveat

`workspace:*` is correct inside this monorepo. Before npm publishing, run `npm pack --dry-run` and inspect dependency rewriting for all public eta-mu wrapper packages.
