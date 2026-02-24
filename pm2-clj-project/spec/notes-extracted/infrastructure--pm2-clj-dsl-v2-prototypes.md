---
title: "Goals"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-v2-prototypes.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Goals

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-v2-prototypes.md`
- Category: `infrastructure`

## Draft Requirements
- **Write ecosystem configs in CLJS DSL files** (readable, composable, versionable).
- **Compose multiple ecosystem fragments** (services, groups, profiles).
- **Clean overrides** via **profiles** (`:dev`, `:test`, `:staging`, `:prod`) + optional CLI `--set/--unset`.
- **Legacy:** `pm2-clj` was a pass-through to PM2, translating DSL → a temp `ecosystem.config.cjs`.
- **Legacy canonical format:** `.pm2.edn` (no longer used).
- **Legacy CLI:** `clobber` previously wrapped `pm2-clj`.
- **Legacy bins:** `pm2-clj`, `clobber`.
- Maps merge **deeply**.
- `:apps` merges **by `:name`** (per-app overrides are deep-merged).
- Vectors (other than `:apps`) default to **replacement**.
- You can remove:
- a **key** with sentinel `pm2-clj.dsl/remove`

## Summary Snippets
- **Note (2026-02-03):** This document is historical. The current workflow uses `ecosystems/*.cljs` with `npx shadow-cljs release clobber` and `pm2 start ecosystem.config.cjs`. `pm2-clj` and `.pm2.edn` are legacy.
- * **Write ecosystem configs in CLJS DSL files** (readable, composable, versionable). * **Compose multiple ecosystem fragments** (services, groups, profiles). * **Clean overrides** via **profiles** (`:dev`, `:test`, `:staging`, `:prod`) + optional CLI `--set/--unset`. * **Legacy:** `pm2-clj` was a pass-through to PM2, translating DSL → a temp `ecosystem.config.cjs`. * **Legacy canonical format:** `.pm2.edn` (no longer used). * **Legacy CLI:** `clobber` previously wrapped `pm2-clj`. * **Legacy bins:** `pm2-clj`, `clobber`.

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
