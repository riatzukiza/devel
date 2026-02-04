---
title: Promethean Extraction & Consolidation Strategy
status: todo
owner: assistant
created_at: 2026-02-03
updated_at: 2026-02-03
tags: [architecture, migration, promethean, giga-repo]
---

# Promethean Extraction & Consolidation Strategy

## Context
The "Promethean" repository (now a submodule) is being "cannibalized" for its high-value components to serve the top-level "Giga-repo".

## Key Components to Extract/Consolidate

### 1. Persistence Library (`@promethean-os/persistence`)
**Status:** Widely used, but duplicated.
**Current State:**
- Exists in `orgs/riatzukiza/promethean/packages/persistence`
- Exists in `packages/persistence` (Root)
**Goal:** Establish a single canonical source (likely the Root `packages/persistence` if it's the target destination) and ensure it serves as the shared data layer.

### 2. Kanban System
**Status:** High priority, tooling broken.
**Current State:**
- Logic likely in `orgs/riatzukiza/promethean/packages/kanban` (CLI) and `orgs/riatzukiza/promethean/docs/agile` (Configs).
**Goal:** Make the Kanban CLI usable from the Giga-repo root to manage `spec/*.md` and distributed `docs/agile/` tasks.

### 3. OpenCode Session Management
**Status:** To be extracted.
**Goal:** Reuse session handling logic for the Giga-repo agents.

## "Cannibalization" Action Plan

1.  **Audit & Converge Persistence**:
    - Compare Root `packages/persistence` vs Promethean submodule version.
    - Merge unique features to Root.
    - Symlink or update references in submodules to use the Root version (if possible via workspace protocol) or strictly treat Root as upstream.

2.  **Enable Giga-Kanban**:
    - Ensure the Kanban CLI can run from root.
    - Config it to discover tasks in `spec/*.md` AND `orgs/**/docs/agile/tasks/*.md`.
    - Unify the `process.yaml` config (use `duck-revival.yaml` as base or create `giga-process.yaml`).

3.  **Centralize Specs**:
    - Acknowledge scattered `docs/agile` folders.
    - Use the Root `spec/` folder for Giga-level architectural decisions (like this one).
    - Allow submodules to keep their local task boards but federate them if possible.

## Risks
- **Version Skew:** Submodules relying on older versions of extracted libs.
- **Path Hell:** Tooling expecting specific relative paths (e.g., `../../`) breaking when moved to Root.
