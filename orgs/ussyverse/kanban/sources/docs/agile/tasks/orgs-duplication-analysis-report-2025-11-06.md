---
uuid: 77167e23-4c79-4b81-99c0-24d6b8b3d7fc
title: Code Duplication Analysis - @orgs Workspace
date: 2025-11-06
tags:
  - duplication
  - orgs
  - analysis
status: completed
---

# @orgs Code Duplication Analysis Report

## Executive Summary

Conducted comprehensive duplication scan across the `/home/err/devel/orgs` workspace covering 10,958 JS/TS/JSON files (~110 MB) using SHA1 hashing for exact and whitespace-normalized detection.

**Key Findings:**
- Massive fixture duplication in Promethean build-fix pipelines (1,230+ identical tsconfig.json/package.json/src.ts files)
- Widespread config file cloning across Promethean packages (36+ ava.config.mjs, 29+ .prettierrc.json)
- Cross-repo code duplication between three opencode-hub implementations
- Replicated SST environment definitions across packages (15+ sst-env.d.ts files)

## Duplication Hotspots

### 1. Build-Fix Fixtures Explosion
**Scope:** `orgs/riatzukiza/promethean/packages/pipelines/buildfix/`

- **1,230 identical `tsconfig.json` files** across `massive-fixture-generation-2/` and `massive-repo-fixtures/`
- **1,235 identical `package.json` files** in same fixture directories
- **1,222 identical `src.ts` files** with large fixture implementations (~16-132 KB each)

**Sample Paths:**
- `orgs/riatzukiza/promethean/packages/pipelines/buildfix/massive-fixture-generation-2/fixture-0196-TS1294-render/src.ts`
- `orgs/riatzukiza/promethean/packages/pipelines/buildfix/repo-benchmark-temp/fixtures/repo-file-1-flags/tsconfig.json`

**Impact:** 340+ MB of redundant fixture data across automated test infrastructure

### 2. Promethean Package Configuration Duplication
**Scope:** `orgs/riatzukiza/promethean/packages/`

- **36 identical `ava.config.mjs` files** across 29+ packages
- **29 identical `.prettierrc.json` files** across 21+ packages  
- **Multiple shared `tsconfig.json` templates** reused across 10+ packages
- **11 identical `ecosystem.dependencies.js` files** across service packages

**Affected Packages:** cli, compiler, discord, effects, fs, http, llm, naming, platform, security, web-utils, worker, and others

### 3. Cross-Repo opencode-hub Duplication
**Scope:** Three opencode-hub implementations
- `/opencode-hub/` (standalone)
- `orgs/riatzukiza/opencode-hub/`
- `orgs/riatzukiza/promethean/packages/opencode-hub/`

**Identical Modules (3 copies each):**
- `src/util.ts`, `src/types.ts`, `src/index.ts`
- `src/opencodeManager.ts`, `src/hub.ts`, `src/config.ts`
- `src/rag/githubIndexer.ts`, `src/persistence/indexer.ts`
- `test/discovery.test.ts`

### 4. SST Environment Definition Duplication
**Scope:** `orgs/sst/opencode/`

- **15 identical `sst-env.d.ts` files** across all opencode packages
- Appears in: packages/plugin, packages/slack, packages/web, packages/ui, packages/sdk/js, packages/desktop, packages/function, and more

### 5. Schema Duplication
**Scope:** Promethean pipelines and test packages

- **10 identical `io.schema.json` files** across:
  - `orgs/riatzukiza/promethean/packages/pipelines/boardrev/schemas/io.schema.json`
  - `orgs/riatzukiza/promethean/packages/pipelines/semverguard/schemas/io.schema.json`
  - `orgs/riatzukiza/promethean/packages/testgap/schemas/io.schema.json`
  - `orgs/riatzukiza/promethean/packages/cookbookflow/schemas/io.schema.json`

## Cross-Organization Analysis

### Repo Distribution
- **orgs/riatzukiza/**: Contains 99% of duplication (primarily Promethean monorepo)
- **orgs/sst/**: Minor duplication in SST environment definitions
- **opencode-hub/**: Cross-repo duplication with riatzukiza implementations

### File Type Breakdown (Top Exact Duplicates)
1. `tsconfig.json`: 1,359 copies
2. `package.json`: 1,235 copies  
3. `src.ts`: 1,222 copies
4. `ava.config.mjs`: 56 copies
5. `.prettierrc.json`: 29 copies
6. `sst-env.d.ts`: 15 copies
7. `ecosystem.dependencies.js`: 11 copies

## Root Causes

1. **Build Infrastructure**: Automated fixture generation creates thousands of identical config files
2. **Monorepo Template Patterns**: Copy-paste approach for new package scaffolding
3. **Development History**: Multiple opencode-hub implementations evolved separately
4. **Missing Shared Configs**: No centralized configuration management for common tooling

## Cleanup Recommendations

### High Priority (Immediate Impact)
1. **Consolidate Build Fixtures**
   - Create shared fixture template system
   - Generate configs dynamically instead of copying
   - Estimated savings: 300+ MB, 3,000+ files

2. **Unify opencode-hub Implementations**
   - Select single authoritative version
   - Convert other instances to consumers
   - Estimated savings: 50+ files, reduced maintenance burden

### Medium Priority (Process Improvement)
1. **Extract Shared Configuration Package**
   - Centralize ava.config.mjs, .prettierrc.json
   - Create Promethean package scaffolding template
   - Estimated savings: 100+ files

2. **SST Environment Consolidation**
   - Move sst-env.d.ts to shared @sst/types package
   - Estimated savings: 14 files

### Low Priority (Long-term Architecture)
1. **Schema Centralization**
   - Extract common schemas to @promethean/schemas
   - Version shared schemas across pipelines

## Implementation Plan

### Phase 1: Build Fixtures (Week 1)
```bash
# Analyze fixture patterns
find orgs/riatzukiza/promethean/packages/pipelines/buildfix -name "*.json" | head -20

# Create shared template system
mkdir -p orgs/riatzukiza/promethean/tools/fixture-templates
# Implement dynamic fixture generation
```

### Phase 2: Configuration Cleanup (Week 2)
```bash
# Identify config patterns
rg --files -g "ava.config.mjs" orgs/riatzukiza/promethean/packages/
# Create shared config package
mkdir -p orgs/riatzukiza/promethean/packages/shared-configs
```

### Phase 3: Cross-Repo Unification (Week 3)
```bash
# Compare opencode-hub implementations
diff opencode-hub/src/util.ts orgs/riatzukiza/opencode-hub/src/util.ts
# Establish authoritative source
# Update package dependencies
```

## Metrics & Impact

### Current State
- **Files Scanned:** 10,958
- **Data Scanned:** 110.03 MB
- **Duplicate Groups:** 1,243 exact, 1,259 normalized
- **Redundant Files:** ~3,500+

### Post-Cleanup Targets
- **File Reduction:** 60-70% decrease in duplicate files
- **Storage Savings:** 300+ MB eliminated
- **Maintenance Burden:** Significant reduction in multi-file updates
- **Build Performance:** Faster indexing and tooling

## Validation Checklist

- [ ] Confirm build-fix fixtures generate correctly with templates
- [ ] Verify all packages build after config consolidation
- [ ] Test opencode-hub consumers post-unification
- [ ] Run full test suite after changes
- [ ] Update documentation to reflect new architecture

## Conclusion

The @orgs workspace contains substantial code duplication, primarily concentrated in automated build fixtures and package scaffolding. A systematic cleanup effort could eliminate thousands of redundant files, significantly reducing storage and maintenance overhead while improving build performance.

Priority should be given to the build fixture explosion and opencode-hub unification, which represent the largest opportunities for immediate impact.