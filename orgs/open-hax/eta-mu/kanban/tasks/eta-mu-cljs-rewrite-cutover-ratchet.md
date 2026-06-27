---
uuid: "eta-mu-cljs-rewrite-cutover-ratchet"
title: "Eta-mu CLJS Rewrite — Cutover Ratchet"
status: review
priority: P1
labels: ["tasks", "cljs", "rewrite", "cutover", "8sp"]
created_at: "2026-05-29T21:18:48Z"
source: "kanban/epics/eta-mu-cljs-runtime-rewrite.md"
points: 8
category: tasks
---

# Eta-mu CLJS Rewrite — Cutover Ratchet

> Parent epic: `kanban/epics/eta-mu-cljs-runtime-rewrite.md`
> Points: 8

## Purpose

Retire TypeScript/JavaScript runtime slices only after CLJS parity is proven, with no repo-wide destructive cleanup.

## Scope

- path-scoped replacement commits
- package export updates
- obsolete TS deletion after parity
- docs and service runner updates
- red-suite/blocker ledger maintenance

## Work items

- [x] Define the cutover checklist every migrated slice must satisfy.
- [x] Require parity tests before deleting or bypassing TS modules.
- [x] Preserve package names, binary names, and service wiring until explicit compatibility evidence says otherwise.
- [x] Record blockers for historical failures instead of hiding them in broad rewrites.
- [x] Update kanban task status and comments after each verified slice.

## Acceptance criteria

- [x] The first TS slice is deleted or demoted only after CLJS replacement tests pass.
- [x] Package exports and docs point at the CLJS-backed implementation for the migrated slice.
- [x] A rollback path exists for every cutover commit.
- [x] No unrelated workspace dirt is staged or committed as part of cutover work.

## Verification

```bash
git diff --stat
pnpm install --offline --frozen-lockfile
pnpm --dir packages/eta-mu-runtime cljs:verify
pnpm --dir packages/eta-mu-runtime test
pnpm --dir packages/eta-mu-runtime typecheck
pnpm --dir packages/eta-mu-runtime build
node import smoke for @open-hax/eta-mu-runtime default entrypoint from packages/eta-mu-github
pnpm --filter @open-hax/eta-mu-cli test
pnpm test
```

## Cutover checklist

A migrated slice can bypass or demote TypeScript only when:

- CLJS domain/law/shape/facade tests cover the replacement behavior.
- A Node ESM smoke proves the compiled CLJS export is callable.
- The public TypeScript entrypoint still exports the same symbols and declaration types.
- Default package consumers can import the migrated symbols without changing package names.
- A rollback path is a single revert of the cutover wrapper commit, leaving the additive `./cljs` subpath intact.
- CI includes Java 21 anywhere a TypeScript job now indirectly compiles CLJS.

## Notes

Demoted the first TypeScript runtime slice by replacing the default `@open-hax/eta-mu-runtime` state/planner/envelope function bodies with thin TypeScript compatibility wrappers over the compiled CLJS runtime exports. The public package name, default entrypoint, binary/service wiring, and TypeScript declaration surface remain stable. Zod schemas/types stay in TypeScript as compatibility guards while the pure behavior is served by CLJS.
