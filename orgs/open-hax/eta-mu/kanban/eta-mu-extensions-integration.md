---
uuid: "orgs-open-hax-eta-mu-kanban-orgs-open-hax-eta-mu-specs-eta-mu-extensions-integration-md"
title: "eta-mu-extensions Integration Spec"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:29:39.346Z"
source: "orgs/open-hax/eta-mu/specs/eta-mu-extensions-integration.md"
category: "specs"
---

> Source: `orgs/open-hax/eta-mu/specs/eta-mu-extensions-integration.md`
> Migrated-to-kanban: `orgs/open-hax/eta-mu/kanban/eta-mu-extensions-integration.md`

# eta-mu-extensions Integration Spec

Status: draft
Date: 2026-04-09
License: GPL-3.0-or-later

## Overview

This spec defines the integration path for unported pi TypeScript extensions into the eta-mu-extensions CLJS package, and identifies repeating patterns suitable for macroization.

## Current State

### Ported Extensions (CLJS)

| Extension | Lines | Status | Notes |
|-----------|-------|--------|-------|
| `bootstrap.cljs` | 345 | ✅ Active | Session initialization, state recovery |
| `chronos.cljs` | 9,623 | ✅ Active | Time tracking for contracting work |
| `contract_runtime.cljs` | 18,197 | ✅ Active | Contract fulfillment evaluation |
| `custom_providers.cljs` | 7,678 | ✅ Active | Provider configuration extensions |
| `image_render.cljs` | 9,220 | ✅ Active | Image rendering for TUI |
| `opencode_global_instructions.cljs` | 2,185 | ✅ Active | Global instruction injection |
| `opmf_contract_gate.cljs` | 17,272 | ✅ Active | Output contract gate enforcement |
| `receipt_river.cljs` | 23,868 | ✅ Active | Append-only audit ledger |
| `session_mycology.cljs` | 30,152 | ✅ Active | Per-turn retrospection + skill spore incubation |
| `task_timing.cljs` | 7,425 | ✅ Active | Task timing and performance tracking |
| `websearch_open_hax.cljs` | 5,599 | ✅ Active | Web search via OpenHax proxy |

**Total ported: 11 extensions, ~131k lines generated**

### Unported Extensions (TypeScript)

| Extension | Lines | Priority | Dependencies | Notes |
|-----------|-------|----------|--------------|-------|
| `analyze-image.ts` | 338 | P1 | Vision API, contracts | Contract-based image analysis |
| `manipulate-image.ts` | 338 | P1 | Sharp/jimp | Image operations (crop, resize, etc.) |
| `apply-patch.ts` | 799 | P2 | None | Codex-style multi-file patches |
| `desktop-ops.ts` | 705 | P2 | KDE/Spectacle/i3 | Desktop integration (screenshots, firefox) |
| `webpage-markdown.ts` | 758 | P3 | Fetch, pandoc | URL fetching with markdown extraction |
| `opmf-contract-runtime.ts` | 470 | P3 | Superseded by CLJS | Legacy, will be removed |
| `skill-graph-aco.ts` | 1,400 | P1 | Embeddings, ACO | Adaptive skill graph with decay |

**Total unported: 7 extensions, ~4.8k lines source**

## Integration Priorities

### Phase 1: Core Constitutional Extensions (Week 1)

These are the constitutional layer primitives that should be in eta-mu:

1. **skill-graph-aco** (P1)
   - Adaptive skill graph derived from skill-call telemetry
   - Uses Markov chains + semantic similarity (embeddings)
   - Ant-colony optimization for skill suggestion
   - Depends on Ollama embeddings (configurable)
   - Key files: `STATE_DIR/skill-call-events.jsonl`, `adaptive-skill-graph.json`

2. **analyze-image** + **manipulate-image** (P1)
   - Vision capabilities via OpenHax proxy
   - Contract-based structured output for image analysis
   - Operations: crop, resize, pad, grayscale, blur
   - Enables screenshot-based workflows

### Phase 2: Workflow Extensions (Week 2)

3. **apply-patch** (P2)
   - GPT models often prefer patch format over edit/write
   - Multi-file changes in single atomic operation
   - Codex/Claude patch format parser

4. **desktop-ops** (P2)
   - Screenshot capture (Spectacle on KDE)
   - Firefox/XDG-open integration
   - i3 window manager control

### Phase 3: Utility Extensions (Week 3)

5. **webpage-markdown** (P3)
   - URL content extraction
   - Static HTML → Markdown
   - PDF text extraction

## Macroization Opportunities

### Pattern Analysis

After reviewing all 11 ported CLJS extensions, these patterns repeat:

#### 1. State Management Pattern

Every extension has:
```clojure
(def ^:const GLOBAL-KEY "__pi_<name>_state__")

(defn get-state []
  (if-let [existing (aget js/globalThis GLOBAL-KEY)]
    existing
    (let [fresh #js {:enabled true ...}]
      (aset js/globalThis GLOBAL-KEY fresh)
      fresh)))
```

**Proposal: `defstate` macro**
```clojure
(defstate receipt-river
  :enabled true
  :currentTurn 0
  :turnToolNames [])
;; Expands to GLOBAL-KEY, get-state, set-state! functions
```

#### 2. State Directory Pattern

Most extensions have:
```clojure
(def ^:const HOME (.homedir os))
(def ^:const STATE-DIR (str HOME "/.pi/agent/state/<name>"))
(def ^:const EVENTS-FILE (str STATE-DIR "/events.jsonl"))
```

**Proposal: `defstate-dir` macro**
```clojure
(defstate-dir receipt-river
  :files [events-file spores-file promotions-file])
;; Expands to STATE-DIR, EVENTS-FILE, etc. constants
```

#### 3. JSONL I/O Pattern

All extensions with state use:
```clojure
(defn append-jsonl [file-path value]
  (ensure-dir (path/dirname file-path))
  (.appendFileSync fs file-path (str (js/JSON.stringify value) "\n") "utf8"))

(defn read-jsonl [file-path limit]
  ;; ... parsing logic
  )
```

**Proposal: `jsonl-file` macro**
```clojure
(jsonl-file events
  :path STATE-DIR
  :file "events.jsonl"
  :schema {:ts string? :action string? :data any?})
```

#### 4. UI Integration Pattern

Extensions with UI use:
```clojure
(defn set-status [ctx state]
  (let [ui (when (aget ctx "hasUI") (aget ctx "ui"))
        set-status-fn (and ui (aget ui "setStatus"))]
    (when set-status-fn
      (.call set-status-fn ui STATUS-KEY (format-status state)))))

(defn ui-notify [ctx message level]
  (let [ui (when (aget ctx "hasUI") (aget ctx "ui"))
        notify-fn (and ui (aget ui "notify"))]
    (when notify-fn
      (.call notify-fn ui message level))))
```

**Proposal: `ui-helpers` macro**
```clojure
(ui-helpers receipt-river
  :status format-status
  :widget format-widget)
;; Generates set-status, ui-notify, ui-set-widget
```

#### 5. Event Handler Registration Pattern

All extensions register similar events:
```clojure
(em/on "session_start" :handler (fn [_event ctx] ...))
(em/on "session_switch" :handler (fn [_event ctx] ...))
(em/on "session_shutdown" :handler (fn [_event ctx] ...))
```

**Proposal: `event-handlers` macro**
```clojure
(event-handlers
  (on-session-start [ctx]
    (reset-state!))
  (on-session-shutdown [ctx]
    (cleanup-state!)))
```

#### 6. Tool Parameter Schema Pattern

Tools have verbose parameter definitions:
```clojure
(em/tool "receipt_river"
  :label "Receipt River"
  :description "..."
  :parameters {:action {:type "string"
                        :enum ["status" "bootstrap" "append" "tail" "validate"]
                        :description "..."}
               :path {:type "string" :optional true :description "..."}
               ...})
```

**Proposal: `deftool` macro with schema DSL**
```clojure
(deftool receipt_river
  "Append-only receipts.log ledger"
  [:action [:enum "status" "bootstrap" "append" "tail" "validate"]
   :path :string?
   :kind :string?
   :lines [:int? {:min 1 :max 2000}]])
```

### Proposed Macro Library: `eta-mu.macros`

```clojure
(ns eta-mu.macros
  "Constitutional layer extension DSL macros.

   Usage:
   (ns eta-mu.extensions.my-extension
     (:require-macros [eta-mu.macros :as em])
     (:require [eta-mu.core :as core]))

   (em/defextension my-extension
     :name \"my-extension\"
     :description \"Does something useful\"

     (em/defstate
       :enabled true
       :counter 0)

     (em/defstate-dir
       :files [events-file cache-file])

     (em/deftool my_tool
       \"Tool description\"
       [:param1 :string?
        :param2 [:enum \"a\" \"b\" \"c\"]]
       (fn [params ctx]
         (implement-tool-logic params ctx)))

     (em/defcommand my_command
       \"Command description\"
       [args ctx]
       (implement-command-logic args ctx))

     (em/event-handlers
       (on-session-start [ctx]
         (reset-state!))
       (on-turn-start [event ctx]
         (increment-counter!))))")
```

## Implementation Roadmap

### Week 1: Macros + skill-graph-aco

1. Create `lib/eta_mu/macros.cljc` with:
   - `defstate`
   - `defstate-dir`
   - `jsonl-file`
   - `ui-helpers`

2. Refactor one existing extension (e.g., `chronos.cljs`) to use macros

3. Port `skill-graph-aco.ts` to CLJS using new macros

### Week 2: Image Extensions

4. Port `analyze-image.ts` to CLJS
5. Port `manipulate-image.ts` to CLJS
6. Refactor remaining extensions to use macros

### Week 3: Workflow Extensions

7. Port `apply-patch.ts` to CLJS
8. Port `desktop-ops.ts` to CLJS
9. Port `webpage-markdown.ts` to CLJS

### Week 4: Cleanup + Documentation

10. Remove legacy TypeScript extensions
11. Update all extension READMEs
12. Create extension authoring guide

## Fork Tax Integration

After completing this spec, we commit:

1. This spec document
2. Any new macro code
3. Updated README for eta-mu-extensions
4. New CLJS extension ports

## Success Criteria

- [ ] All 7 unported TypeScript extensions have CLJS equivalents
- [ ] Macro library reduces extension boilerplate by 40%+
- [ ] All extensions compile and load without errors
- [ ] No duplicate code patterns across extensions
- [ ] Documentation covers extension authoring workflow
