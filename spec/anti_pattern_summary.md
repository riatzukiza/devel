---
uuid: 7d035d94-4146-45e3-9358-026c0cacdd15
title: "Comprehensive Anti-Pattern & Technical Debt Summary"
slug: anti_pattern_summary
status: done
priority: P2
tags: [anti-pattern, technical-debt, summary]
created_at: 2026-02-03
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Comprehensive Anti-Pattern & Technical Debt Summary

## Overview
This document aggregates findings from a deep codebase scan conducted on Feb 3, 2026. It identifies systemic issues across code duplication, configuration management, test hygiene, and dependency skew.

## 1. Code Duplication
**Status:** Critical
**Details:**
- **Ghost Files:** TypeScript source files have corresponding `.js` artifacts checked into the repo root (e.g., `index_opencode_sessions.js`).
- **Pipeline Utils:** Multiple CLI tools (`boardrev`, `semverguard`) re-implement the same utility functions (`readJSON`, `parseArgs`).
- **Structure Divergence:** A confusing split between the root `packages/` directory and `orgs/.../packages/`, with some packages existing in both locations with different content.

## 2. Configuration Anti-Patterns
**Status:** Critical
**Details:**
- **Hardcoded Paths:** Over 7,000 references to `/home/err/devel` found. Critical configuration files (ecosystem.cljs, ecosystem.json) hardcode the deployment environment, breaking portability.
- **Deprecated APIs:** Widespread reference to `ecosystem.pm2.edn` despite it being officially deprecated.
- **Malformed Documentation:** `cli/ecosystem-dsl/README.md` contains concatenated duplicate content.

## 3. Test Hygiene
**Status:** Warning
**Details:**
- **Skipped Tests:** Permanent `test.skip` usage without tracking comments (persistence, kanban modules).
- **Flakiness:** Explicit `sleep`/`setTimeout` calls in tests instead of deterministic polling.
- **Logging:** clustered `console.log` usage in MCP services.

## 4. Dependency Management
**Status:** Warning
- **TypeScript Skew:** Versions range from `5.3.0` to `5.9.3`.
- **Shadow-CLJS Skew:** Minor version mismatch (`3.2.1` vs `3.3.5`).
- **Overrides:** Intentional Vite override in one package.

## 5. Architectural Coupling
**Status:** Clean (Preliminary)
- Initial regex scans did not find deep relative imports or internal API bypasses.
- **Recommendation:** Run `madge` for authoritative circular dependency detection.

## Action Plan
1.  **Clean:** Delete checked-in JS artifacts and the root `ecosystem.pm2.edn`.
2.  **Refactor:** Move common pipeline utilities to `@promethean-os/utils`.
3.  **Consolidate:** Merge root `packages/` into `orgs/` structure.
4.  **Fix Config:** Replace hardcoded paths with environment variables.
5.  **Align Deps:** Pin TypeScript to `5.9.3` and Shadow-CLJS to `3.3.5`.
6.  **Fix Tests:** Audit skipped tests and remove `sleep` calls.

## Reference Specs
- `spec/code_duplication_analysis.md`
- `spec/configuration_anti_patterns.md`
- `spec/dependency_skew_analysis.md`
- `spec/test_hygiene.md`
- `spec/architectural_coupling.md`
