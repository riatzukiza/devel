---
uuid: 6b3444b5-6b8f-4a90-b726-d7c065015f82
title: "Configuration Anti-Patterns & Cleanup Plan"
slug: configuration_anti_patterns
status: todo
priority: P2
tags: [configuration, environment, cleanup]
created_at: 2026-02-03
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Configuration Anti-Patterns & Cleanup Plan

## Executive Summary
This document outlines systemic configuration issues identified in the codebase, specifically focusing on environment portability, documentation hygiene, and deprecated API usage.

## 1. Hardcoded Absolute Paths
**Severity:** Critical
**Issue:** The codebase contains over 7,000 references to `/home/err/devel`. While many are in logs or auto-generated files, several exist in source code and configuration.
**Risk:** The code is not portable. It will fail on any other machine or CI environment that doesn't match this specific directory structure.

**Identified Instances:**
- `packages/cephalon-ts/ecosystem.cljs`: `:cwd "/home/err/devel/services/cephalon"`
- `ecosystem.opencode-indexer.json`: `"cwd": "/home/err/devel"`
- `tests/pm2-clj.parity.test.ts`: Hardcoded paths in test expectations.
- `update-package-versions.mjs`: `execSync('grep -rl ... /home/err/devel ...')`

**Recommendation:**
- Replace `/home/err/devel` with `process.env.PWD`, `process.cwd()`, or a dedicated `WORKSPACE_ROOT` environment variable.
- Update `ecosystem` files to use relative paths or environment variables.

## 2. Deprecated `ecosystem.pm2.edn` References
**Severity:** Medium
**Issue:** The usage of `ecosystem.pm2.edn` is officially deprecated in favor of `ecosystems/*.cljs`, yet it remains widely referenced in documentation, specs, and even some active configuration.
**Risk:** Confuses developers about the correct way to configure process management. Creates technical debt by maintaining legacy support indefinitely.

**Locations:**
- `AGENTS.md` (Self-contradictory: warns about deprecation but referenced elsewhere)
- `spec/pm2-clj-migration-complete.md`
- `orgs/riatzukiza/promethean/cli/ecosystem-dsl/README.md`
- `ecosystem.pm2.edn` (Root file still exists)

**Recommendation:**
- Delete the root `ecosystem.pm2.edn` if unused.
- Update all specs and READMEs to point to `ecosystems/*.cljs`.
- Remove legacy support code once migration is confirmed complete.

## 3. Malformed Documentation (Concatenated READMEs)
**Severity:** Low (Quality of Life)
**Issue:** `orgs/riatzukiza/promethean/cli/ecosystem-dsl/README.md` appears to contain two separate README files concatenated together (around line 301).
**Risk:** Makes documentation hard to read and unprofessional. Likely a result of a broken build script or merge conflict.

**Recommendation:**
- Manually fix `cli/ecosystem-dsl/README.md`.
- Check other READMEs for similar "READMEFLOW" artifacts.

## Next Steps
1.  **Fix Hardcoded Paths:** Prioritize `ecosystem.cljs` and `.json` files.
2.  **Clean Documentation:** purge `ecosystem.pm2.edn` references.
3.  **Normalize Configs:** Ensure all new packages use the standard `tsconfig.base.json`.
