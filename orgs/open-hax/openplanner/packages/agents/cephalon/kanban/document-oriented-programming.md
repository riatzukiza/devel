---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-document-oriented-programming-md"
title: "Document-Oriented Programming for Cephalon"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.900Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/document-oriented-programming.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/document-oriented-programming.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/document-oriented-programming.md`

# Document-Oriented Programming for Cephalon

## Principle

A sufficiently explicit prompt is indistinguishable from a program.

For Cephalon, that means the docs are not secondary narrative. They are part of the runtime design surface.

## Implications

### 1. Docs precede confident refactors
When multiple partial implementations exist, first write:
- source maps
- provenance docs
- package lattice
- absorption specs
- behavior contracts

Then refactor code.

### 2. Prompts are architecture
A Cephalon package is not fully specified by source files alone.
It also includes:
- session contracts
- prompt/policy surfaces
- memory and context rules
- tool-call and authority doctrine

### 3. Recovered fragments stay executable as thought
Even when source is lost, explicit docs can preserve:
- module boundaries
- tool surfaces
- event shapes
- recovery paths
- migration decisions

## Rule of practice

Before deleting or merging any Cephalon straggler, write down:
- what it was for
- what survives elsewhere
- what is unique about it
- what must be preserved verbatim
- where its concepts now live

That note is part of the program.
