---
title: Dependency Anti-Patterns & Version Skew
status: todo
owner: assistant
created_at: 2026-02-03
updated_at: 2026-02-03
tags: [dependencies, version-skew]
---

# Dependency Anti-Patterns & Version Skew

## Overview
A scan of representative `package.json` files reveals significant minor version skew in core dependencies, particularly TypeScript and Shadow-CLJS. While no major version conflicts (e.g., v4 vs v5) were found, the minor version divergence poses risks for tooling consistency, type-checking reliability, and build reproducibility.

## 1. TypeScript Version Skew
**Status:** Warning
**Issue:** TypeScript versions range from `5.3.0` to `5.9.3` across the workspace.
**Impact:** 
- Inconsistent type-checking behavior (stricter checks in newer versions might fail in older ones).
- Features available in 5.9 might be used in shared code but break in 5.3 consumers.
- Tooling (VS Code, LSP) might behave inconsistently depending on which `tsconfig.json` is active.

**Detected Versions:**
- `^5.9.3`: Root, `orgs/riatzukiza/promethean`, `orgs/open-hax/codex`
- `^5.5.0`: `packages/utils`, `services/opencode-indexer`
- `^5.3.0`: `orgs/moofone/codex-ts-sdk`

**Recommendation:**
- Pin all packages to a single TypeScript version (recommended: `5.9.3` or latest stable).
- Use `pnpm.overrides` or `resolutions` in the root `package.json` to enforce this workspace-wide if possible.

## 2. Shadow-CLJS Skew
**Status:** Warning
**Issue:** `shadow-cljs` versions differ between root (`^3.3.5`) and Promethean (`^3.2.1`).
**Impact:** 
- Potential build inconsistencies for ClojureScript projects.
- "Works on my machine" issues if developers have different global/local versions installed.

**Recommendation:**
- Align to the latest version (`^3.3.5`) across all `package.json` files.

## 3. Vite Overrides
**Status:** Info
**Issue:** `orgs/open-hax/codex` forces `vite: ^7.1.12` via overrides.
**Impact:** This is likely intentional to fix a bug or security issue, but it bypasses standard dependency resolution.
**Recommendation:** Document *why* this override exists in the package's README or a comment near the override.

## Action Plan
1.  **Align TypeScript:** Update all `package.json` files to use `typescript: ^5.9.3`.
2.  **Align Shadow-CLJS:** Update Promethean's `package.json` to use `shadow-cljs: ^3.3.5`.
3.  **Run Install:** Execute `pnpm install` to deduplicate lockfile entries.

## Reference
- `spec/anti_pattern_summary.md`
