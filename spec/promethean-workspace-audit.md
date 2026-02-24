---
uuid: 373aa7e8-054b-4a59-92d8-a46db0f8d84e
title: "Promethean workspace audit"
slug: promethean-workspace-audit
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T06:36:00.409448Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Promethean workspace audit

## Scope
Target repository: `/home/err/devel/promethean`

## Code files and references
- `pnpm-workspace.yaml` (workspace package roots)
- `nx.json` (project layout and target defaults)
- `package.json` (top-level scripts and dependencies)
- `README.md` (current framing and core components)
- `promethean/services/mcp/` (legacy MCP stack per user inventory)
- `promethean/docs/design/pantheon/` (Pantheon design docs per user inventory)

## Requirements
1. Enumerate modules by category (cli/services/pipelines/packages/experimental/tools/scripts).
2. Identify glue/OS responsibilities vs library responsibilities.
3. Highlight overlaps (e.g., MCP implementations) and likely consolidation targets.
4. Propose a reframed mental model: Promethean as OS + orchestrator, with services and libraries as separable components.

## Definition of done
- A concise audit summary exists with module categories, primary roles, and integration points.
- A short list of consolidation candidates and migration priorities is recorded.
- Open questions are listed for follow-up.
