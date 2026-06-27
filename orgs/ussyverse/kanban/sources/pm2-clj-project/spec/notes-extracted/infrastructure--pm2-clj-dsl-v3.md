---
title: "New higher-level forms"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-v3.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# New higher-level forms

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-v3.md`
- Category: `infrastructure`

## Draft Requirements
- **App proto**: `(def-app :api base ...opts)`
- **Profile proto**: `(def-profile :prod base ...fragments)`
- **Mixin proto**: `(def-mixin :node ...opts)` (reusable patch blob for apps/profiles/stacks)
- **Stack proto**: `(def-stack :core base ...fragments)` (reusable ecosystem composition)
- **Anonymous mixins**: `(mixin :cwd "." :env {...})`
- **Combine mixins**: `(mix node logging metrics)`
- **Override an app by name only**: `(app :api :instances 2)` → `{:name "api" :instances 2}`
- **Patch every app in a fragment**: `(each {:env {...}} (apps api worker))`
- **Name scoping**: `(scope "svc")` as a mixin; app names become `svc-api`, `svc-worker`, etc.
- Deep merges app maps.
- If override app has :pm2-clj/remove true => app is removed."
- i/remove removes keys

## Summary Snippets
- **Note (2026-02-03):** This document is historical. The current workflow uses `ecosystems/*.cljs` with `npx shadow-cljs release clobber` and `pm2 start ecosystem.config.cjs`. `pm2-clj` and `.pm2.edn` are legacy.
- Alright — next pass: **make protos more powerful**, add a **mixin** and **stack** layer, and add a few **“I mean what I say” sugar forms** so you stop writing the same boilerplate everywhere.

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
