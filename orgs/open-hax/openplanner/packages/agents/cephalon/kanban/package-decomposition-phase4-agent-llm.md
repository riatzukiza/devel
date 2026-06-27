---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-package-decomposition-phase4-agent-llm-md"
title: "Package Decomposition Phase 4 — Extract Agent LLM"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.905Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/package-decomposition-phase4-agent-llm.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/package-decomposition-phase4-agent-llm.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/package-decomposition-phase4-agent-llm.md`

# Package Decomposition Phase 4 — Extract Agent LLM

**Parent:** `package-decomposition-roadmap.md`
**Story Points:** 2
**Status:** todo

## Goal

Extract LLM providers and context assembly into `@promethean-os/agent-llm`.

## Scope

### In Scope
- Create `@promethean-os/agent-llm` package
- Move TS `llm/provider.ts`, `context/assembler.ts`
- Move CLJS `llm/openai.cljs`
- Define unified LLM provider interface

### Out of Scope
- Tool executor (depends on tools)
- Tool registry

## Tasks

- [ ] Create `packages/agent-llm/`
- [ ] Move TS provider and context files
- [ ] Move CLJS OpenAI client
- [ ] Define `LLMProvider` interface/protocol
- [ ] Export Ollama/OpenAI implementations
- [ ] Update imports in `cephalon-ts` and `cephalon-cljs`
- [ ] Add provider tests

## Acceptance Criteria

- [ ] `@promethean-os/agent-llm` exists with interface
- [ ] Ollama and OpenAI implementations available
- [ ] Context assembler available
- [ ] Provider tests pass

## Dependencies

- Phase 3 (agent-memory) — context assembler may use memory

## Blocking

- Blocks tool executor (needs LLM provider)
