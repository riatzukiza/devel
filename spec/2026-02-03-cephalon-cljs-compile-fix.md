---
uuid: 082147de-b6b4-49bf-8cad-bd00077056cc
title: "Cephalon CLJS Compile Fix"
slug: 2026-02-03-cephalon-cljs-compile-fix
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T07:24:44.248935Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Cephalon CLJS Compile Fix

## Context
- Build fails with an unmatched delimiter error in `services/cephalon-cljs/src/promethean/main.cljs`.

## Requirements
- Fix delimiter mismatch so the file parses.
- Ensure `world/add-entity` is called with the correct arity.
- Keep behavior the same aside from the minimal fix.

## Files
- `services/cephalon-cljs/src/promethean/main.cljs:42`
- `services/cephalon-cljs/src/promethean/main.cljs:156`

## Existing Issues / PRs
- Issues: not checked (no repo mapping identified for `services/cephalon-cljs`).
- PRs: not checked.

## Definition of Done
- `clojure -M:shadow release cephalon` succeeds in `services/cephalon-cljs`.
- No syntax errors from clj-kondo on `services/cephalon-cljs/src/promethean/main.cljs`.

## Change Log
- 2026-02-03: Fix delimiter balance and use `world/add-entity` with the correct arity in `init-world`.
