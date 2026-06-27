---
uuid: "orgs-open-hax-openplanner-packages-graph-graph-weaver-aco-kanban-orgs-open-hax-openplanner-packages-graph-graph-weaver-aco-specs-ethical-crawling-contract-md"
title: "Ethical Crawling Contract"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:37.933Z"
source: "orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/specs/ethical-crawling-contract.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/specs/ethical-crawling-contract.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/kanban/ethical-crawling-contract.md`

# Ethical Crawling Contract

## Purpose

Make the engine's compliance stance explicit so future extensions do not quietly mutate it into a hostile scraper.

## Source anchors

- `fork_tales` presence contract for Web Graph Weaver
- current `RobotsCache` usage
- current host pacing logic

## Hard rules

1. obey robots gating before fetch
2. enforce per-host minimum interval
3. avoid parallel in-flight requests to the same host
4. use explicit user-agent
5. default to skip/fail-safe on uncertainty
6. emit errors instead of hiding failures

## Non-goals

The engine is not for:
- credential capture
- paywall circumvention by itself
- rate-limit evasion
- stealth scraping

## Relationship to richer systems

A downstream system like `myrmex` may use a stronger fetch backend, but the ethical posture of the traversal engine should remain visible and intentional.

## Required surfaces for any serious extension

If someone extends this engine, they should preserve or improve:
- robots visibility
- host pacing visibility
- explicit skip/error outcomes
- a reasoned user-agent string

## Stop line

If a modification increases crawl power while decreasing inspectability or compliance legibility, it violates the extraction intent.
