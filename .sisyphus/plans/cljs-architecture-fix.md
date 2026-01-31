# ClojureScript Ecosystem File Architecture Fix

## TL;DR

> **Problem**: Ecosystem files have `.clj` extension but contain ClojureScript code (macros). They need to be `.cljs` files executed via nbb.
>
> **Solution**: Rename `ecosystem.clj` → `ecosystem.cljs`, update clobber to execute via nbb, add deprecation warnings.
>
> **Estimated Effort**: Medium

---

## Context

### Current State
- 10 `ecosystem.clj` files exist in submodules (uncommitted)
- Root `ecosystem.clj` was never created or was lost
- Files contain ClojureScript: `(load-file ...)`, `(defapp ...)`, `(ecosystem)`
- Current eval uses `cljs.reader/read-string` (doesn't execute macros)

### What Should Be
- Files should be `ecosystem.cljs` (ClojureScript extension)
- Executed via nbb (nbbly) in Node.js context
- clobber spawns nbb → executes macros → generates config → writes temp `.cjs` → PM2

---

## Work Objectives

### Concrete Deliverables
1. Create/rename all 12 `ecosystem.clj` → `ecosystem.cljs`
2. Update clobber to:
   - Add `.cljs` to supported extensions
   - Execute via nbb subprocess
   - Show deprecation warnings for legacy formats
3. Add `ecosystem-output` macro
4. Documentation updates

---

## TODOs

### Phase 1: File Creation and Renaming

- [ ] **1. Create root ecosystem.clj → ecosystem.cljs**
  
  Create `/home/err/devel/ecosystem.cljs` with proper ns + require pattern

- [ ] **2. Rename 10 existing ecosystem.clj files to .cljs**
  
  Files in submodules:
  1. orgs/octave-commons/cephalon-clj/ecosystem.clj → .cljs
  2. orgs/octave-commons/gates-of-aker/ecosystem.clj → .cljs
  3. orgs/octave-commons/promethean-agent-system/ecosystem.clj → .cljs
  4. orgs/open-hax/clients/ecosystem.clj → .cljs
  5. orgs/open-hax/openhax/ecosystem.clj → .cljs
  6. orgs/riatzukiza/ollama-benchmarks/ecosystem.clj → .cljs
  7. orgs/riatzukiza/promethean/ecosystem.clj → .cljs
  8. orgs/riatzukiza/promethean/packages/frontend/ecosystem.clj → .cljs
  9. orgs/riatzukiza/promethean/services/sentinel/ecosystem.clj → .cljs
  10. orgs/riatzukiza/riatzukiza.github.io/ecosystem.clj → .cljs

### Phase 2: Update Ecosystem Files

- [ ] **3. Update ecosystem files to use ns + require pattern**
  
  Migration pattern:
  ```clojure
  ;; OLD
  (load-file "pm2-clj-project/src/clobber/macro.cljs")
  (clobber.macro/defapp "myapp" {...})
  (clobber.macro/ecosystem)

  ;; NEW
  (ns my-ecosystem
    (:require ["./pm2-clj-project/src/clobber/macro.cljs" :as clobber]))
  (clobber.macro/defapp "myapp" {...})
  (clobber.macro/ecosystem-output)
  ```

### Phase 3: Update clobber CLI

- [ ] **4. Add ecosystem-output macro to macro.cljs**
  
  Macro that prints EDN to stdout

- [ ] **5. Update eval.cljs to use nbb subprocess**
  
  Execute `.cljs` files via nbb, capture stdout

- [ ] **6. Add deprecation warnings for legacy formats**
  
  For `.pm2.edn`, `.config.*` files, `pm2-clj` command

### Phase 4: Documentation

- [ ] **7. Update AGENTS.md**
- [ ] **8. Update README.md**
- [ ] **9. Update PM2 skill files**

### Phase 5: Verification

- [ ] **10. Full verification suite**
- [ ] **11. Final commit and summary**

---

## Success Criteria

```bash
# All files have .cljs extension
find . -name "ecosystem.cljs" | wc -l  # Expected: 12

# .cljs files render correctly
clobber render ecosystem.cljs  # Valid JSON output

# Deprecation warnings work
clobber render ecosystem.pm2.edn 2>&1 | grep -i "deprecated"
```

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1-2 | `refactor(ecosystem): rename .clj to .cljs` | All ecosystem files |
| 3-5 | `feat(clobber): add .cljs support` | cli.cljs, eval.cljs, macro.cljs |
| 6-9 | `docs: update for ecosystem.cljs format` | AGENTS.md, README.md, skills |
| 10-11 | `docs: add cljs architecture fix summary` | docs/migrations/ |
