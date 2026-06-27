---
title: "Next layer of sugar: *prototypes everywhere* + *selection + generators*"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-prototypes-mixins.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Next layer of sugar: *prototypes everywhere* + *selection + generators*

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-prototypes-mixins.md`
- Category: `infrastructure`

## Draft Requirements
- **`with`** — extend a proto by composing multiple mixins/maps in one go
- **`env`** — a tiny sugar mixin for `:env` patches
- **`on` / `where`** — patch selected apps by name or predicate (minimal override maps)
- **`matrix`** — generate many profiles from the same app-set (dev/test/stage/prod)
- **`services`** — build a bunch of app protos from one base mixin + return a stack proto + a map of app protos
- **`export` / `library` + `--entry`** — put multiple stacks/profiles in one file, select which one to run
- app proto => realized app map (usually not what you want as a patch)
- mixin proto => realized map patch
- profile/stack proto => realized ecosystem map (still a map)"
- proto -> realized app map
- map -> returned
- (app proto :watch true)

## Summary Snippets
- **Note (2026-02-03):** This document is historical. The current workflow uses `ecosystems/*.cljs` with `npx shadow-cljs release clobber` and `pm2 start ecosystem.config.cjs`. `pm2-clj` and `.pm2.edn` are legacy.
- You already have `def-app`, `def-profile`, `def-mixin`, `def-stack`, `extends`, `mix`, `each`, `scope`.

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
