---
uuid: "orgs-open-hax-openplanner-packages-graph-myrmex-kanban-orgs-open-hax-openplanner-packages-graph-myrmex-specs-deployment-lattice-md"
title: "Deployment Lattice Spec"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:39.560Z"
source: "orgs/open-hax/openplanner/packages/graph/myrmex/specs/deployment-lattice.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/graph/myrmex/specs/deployment-lattice.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/graph/myrmex/kanban/deployment-lattice.md`

# Deployment Lattice Spec

## Purpose

Document the deployment shape implied by the repo and surrounding specs.

## Immediate dependencies

### Required services
- `graph-weaver-aco` as local workspace dependency
- ShuvCrawl service
- Proxx service

### Indirect downstreams
- OpenPlanner behind Proxx
- any graph-management or search UI consuming lake data later

## Important environment inputs

From `src/main.ts` and `src/types.ts`:
- `SEED_URLS`
- `SHUVCRAWL_BASE_URL`
- `SHUVCRAWL_TOKEN`
- `PROXX_BASE_URL`
- `PROXX_AUTH_TOKEN`
- `MYRMEX_ANTS`
- `MYRMEX_DISPATCH_INTERVAL_MS`
- `MYRMEX_MAX_FRONTIER`

## Docker shape

The repo ships a minimal Dockerfile that currently assumes built output exists and runs:
- `node dist/main.js`

That means the operational contract is:
1. build first
2. ship `dist`
3. provide service env

## Architectural reading

Myrmex wants to live in a small cluster:

```text
ShuvCrawl  ->  Myrmex  ->  Proxx  ->  OpenPlanner
                 ^
                 |
          graph-weaver-aco
```

## Future deployment concerns

- checkpoint durability
- secrets management for Proxx/ShuvCrawl auth
- crawl politeness at fleet scale
- content truncation and storage costs
- replay and restart semantics

## Principle

Deploy the orchestrator as a **thin coordination layer**. Do not bloat it with responsibilities that properly belong in the traversal engine or the lake.
