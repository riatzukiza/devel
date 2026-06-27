# Π handoff — eta-mu kanban migration (openplanner)

- time: 2026-05-29T04:03:45Z
- batch: /tmp/eta-mu-kanban-batches/agent_open_hax_other.json
- migration: node services/eta-mu/kanban/scripts/migrate-specs-to-kanban.mjs --root /home/err/devel --manifest /tmp/eta-mu-kanban-batches/agent_open_hax_other.json
- verification: eta-mu-beta kanban count --tasks-dir for each listed board
- concurrent guardrail: staged paths are limited to migrated kanban directories, removed spec/specs directories, .ημ handoff artifacts, and later parent submodule pointers where applicable

## Boards
- kanban
- packages/agents/cephalon/kanban
- packages/agents/cephalon/packages/cephalon-clj/kanban
- packages/agents/cephalon/packages/cephalon-cljs/kanban
- packages/agents/cephalon/packages/cephalon-ts/kanban
- packages/agents/cephalon/recovered/cephalon-clj/kanban
- packages/graph/graph-weaver/kanban
- packages/graph/graph-weaver-aco/kanban
- packages/graph/myrmex/kanban
- pseudo/graph-runtime/kanban
