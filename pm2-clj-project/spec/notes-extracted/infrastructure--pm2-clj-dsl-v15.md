---
title: "DSL: first-class prototypes + sugar"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-v15.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# DSL: first-class prototypes + sugar

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-v15.md`
- Category: `infrastructure`

## Draft Requirements
- `def-app` → returns an **app prototype value**
- `def-profile` → returns a **profile prototype value**
- `extends` → prototypal extension (`base → derived`) via deep merge
- `app` → instantiate a proto (optionally with inline overrides)
- `apps` → accepts app protos *or* plain app maps
- `profiles` → accepts profile protos *or* `profile` fragments
- `compose` → accepts ecosystem fragments *and* protos directly (extra sugar)
- app proto → treated like `(apps (app proto))`
- profile proto → treated like `(profiles proto)`
- app proto (optionally with inline overrides)
- app map (passed through)
- name + opts (creates app map)

## Summary Snippets
- Yep — you can get the verbosity way down *and* keep everything first-class by introducing **prototype values** for apps/profiles + a couple of “definition helpers” that build those prototypes.
- Below is a concrete design + full-file replacements for the core DSL + evaluator tweaks to support `import` (so prototypes can live in separate files and still be reusable/extendable).

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
