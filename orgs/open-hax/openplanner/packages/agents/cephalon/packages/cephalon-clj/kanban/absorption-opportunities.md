---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-clj-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-clj-specs-absorption-opportunities-md"
title: "Absorption Opportunities from the JVM CLJ Package"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:24.753Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-clj/specs/absorption-opportunities.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-clj/specs/absorption-opportunities.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-clj/kanban/absorption-opportunities.md`

# Absorption Opportunities from the JVM CLJ Package

## Purpose

Name what the rest of the Cephalon family should deliberately preserve from the JVM precursor path.

## Preserve these ideas

### 1. Small-form cephalon loop clarity
`runtime/cephalon.clj` is concise enough that the full loop can be understood in one sitting.

Preserve:
- event subscription
- related/persistent/recent context assembly
- one explicit model call
- one emitted thought event

### 2. Sentinel note contract
`runtime/sentinel.clj` is a strong reusable pattern.

Preserve:
- markdown ingestion
- JSON metadata request
- minimal validation and retry
- frontmatter write-back

This idea may belong as a cross-family capability rather than only inside the JVM branch.

### 3. EDN-centered configuration clarity
The JVM branch keeps configuration explicit and small.

Preserve:
- simple declarative config
- fewer hidden env assumptions where practical

## Do not preserve these limits by accident

- single-session assumptions
- implicit output routing
- lack of richer tool/event surfaces compared with the TS runtime
- anything that would erase the CLJS branch’s stronger always-running world model

## Recommended use

When the larger family becomes too ambient or complicated, use this package as a reference sketch for the irreducible Cephalon loop.
