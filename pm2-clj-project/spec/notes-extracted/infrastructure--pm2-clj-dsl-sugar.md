---
title: "Next sugar layer"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-sugar.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Next sugar layer

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-sugar.md`
- Category: `infrastructure`

## Draft Requirements
- **`with`**: extend a proto with *multiple* patches/mixins at once
- **`on` / `where`**: patch **selected apps** using *names OR app-protos*
- **`tiers` / `merge-tiers` / `matrix*`**: build reusable *mode→patch* maps and apply them to app sets
- **`group`**: prefix/scoping + services in one shot
- **quality mixins**: `env`, `port`, `cluster`, `fork`, `node-args`, `log-format`, `merge-logs`
- proto -> realized app map
- map -> returned
- (app proto :watch true)
- (app :api :instances 2) => {:name \"api\" :instances 2}"
- patch is a map/mixin/proto => applied as minimal overrides to *all* apps in frag
- patch is an ecosystem fragment => composed as-is into that profile
- **`group*` with nested groups**

## Summary Snippets
- You’ve got the “proto core” already. The next jump is making **selection**, **generation**, and **reuse** feel effortless while staying **100% first-class + prototypal**.
- * **`with`**: extend a proto with *multiple* patches/mixins at once `(with api (env {...}) (cluster) {:max_memory_restart "512M"})`

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
