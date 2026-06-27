---
uuid: b0a03f45-10e1-42f0-a965-f7e2856366e5
title: "Code Duplication Analysis & Refactoring Plan"
slug: code_duplication_analysis
status: todo
priority: P2
tags: [duplication, refactoring]
created_at: 2026-02-03
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Code Duplication Analysis & Refactoring Plan

## Executive Summary
A preliminary scan of the codebase has identified three significant areas of code duplication and structural ambiguity. These issues pose risks for maintainability, "single source of truth" violations, and potential bugs due to divergent copies.

## 1. Source vs. Compiled Artifacts (Ghost Files)
Several TypeScript files have corresponding JavaScript files checked into the repository root. These JS files appear to be compiled artifacts.

**Identified Instances:**
- `index_opencode_sessions.ts` vs `index_opencode_sessions.js`
- `reconstitute.ts` vs `reconstitute.js`
- `mirror-prs.ts` vs `mirror-prs.js`
- `vitest.config.ts` vs `vitest.config.js`

**Risk:** Developers may edit the JS file expecting changes, but the TS file is the canonical source (or vice versa). `package.json` scripts mostly reference the `.ts` versions via `tsx`.

**Recommendation:**
- Delete the `.js` files from the root.
- Ensure `package.json` scripts consistently use `tsx` or `bun` to run `.ts` files directly.
- Add `*.js` to `.gitignore` if they are build artifacts, or move them to a `dist/` folder if strictly necessary.

## 2. Pipeline Utility Duplication
The `orgs/riatzukiza/promethean/pipelines/` directory contains multiple CLI tools (`boardrev`, `semverguard`, `readmeflow`, etc.), each with its own `src/utils.ts`.

**Identified Patterns:**
- `readJSON` / `writeJSON`: Re-implemented in `boardrev` and likely others.
- `parseArgs`: Custom argument parsing logic duplicated.
- `hashSignature`: Duplicated hashing logic.
- `slug`: Some pipelines import from `@promethean-os/utils`, others might redefine it.

**Risk:** Inconsistent implementation of core helpers (e.g., JSON parsing error handling) and unnecessary code bloat.

**Recommendation:**
- Audit all `pipelines/*/src/utils.ts` files.
- Refactor common functions (`readJSON`, `writeJSON`, `parseArgs`, `glob`, `hash`) into `@promethean-os/utils` or a new `@promethean-os/cli-utils` package.
- Update pipelines to import from the shared package.

## 3. Structural Duplication: Root `packages/` vs `orgs/.../packages/`
There is a confusing overlap between the root `packages/` directory and `orgs/riatzukiza/promethean/packages/`.

**Findings:**
- `packages/embedding` exists in both locations but content differs (different `package.json`, divergent source).
- `packages/` contains `cephalon-clj`, `cephalon-ts` which are absent in `orgs/...`.
- `orgs/...` contains many packages not in root.

**Risk:** It is unclear which version of `embedding` is the "truth". New developers might add code to the wrong location.

**Recommendation:**
- Perform a detailed audit of `packages/` contents.
- **Move** unique packages (like `cephalon-ts`) to the appropriate `orgs/` submodule or `experimental/` folder if they are active.
- **Merge/Archive** divergent packages (like `embedding`).
- **Delete** the root `packages/` directory once empty to enforce the `orgs/` structure.

## 4. Other Potential Areas (To Be Investigated)
- **Ecosystem Configs:** `ecosystems/` folder has multiple `.cljs` files. Ensure they utilize shared definitions where possible.
- **Test Configs:** Check if `tsconfig.*.json` files can share a common base more effectively.

## Next Steps
1. **Immediate:** Remove checked-in JS artifacts (`index_opencode_sessions.js`, etc.).
2. **Short-term:** Refactor `pipelines` to use shared utils.
3. **Medium-term:** Resolve `packages/` vs `orgs/` divergence.
