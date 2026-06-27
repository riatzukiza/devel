---
uuid: "orgs-open-hax-openplanner-packages-graph-graph-weaver-aco-kanban-orgs-open-hax-openplanner-packages-graph-graph-weaver-aco-specs-fetch-backend-contract-md"
title: "Fetch Backend Contract"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:37.935Z"
source: "orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/specs/fetch-backend-contract.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/specs/fetch-backend-contract.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/kanban/fetch-backend-contract.md`

# Fetch Backend Contract

## Purpose

Document the pluggable seam that lets `graph-weaver-aco` stay small while downstream systems attach richer extraction strategies.

## Interface

```ts
interface FetchBackend {
  fetch(url, options?): Promise<FetchResult>
  discoverLinks?(url, options?): Promise<string[]>
}
```

## Required `fetch` output

A backend should return:
- `url`
- `status`
- `contentType`
- optional `html`
- optional `content`
- optional `title`
- optional `metadata`
- optional `outgoing`
- optional `error`

## Built-in backend

`SimpleFetchBackend`:
- uses plain `fetch()`
- follows redirects
- extracts outgoing links from HTML
- returns an error payload instead of throwing through the engine loop

## Downstream backend example

`octave-commons/myrmex` provides `ShuvCrawlFetchBackend`, which:
- uses ShuvCrawl for rendered / cleaned content
- returns extracted markdown/content
- exposes richer metadata
- still conforms to the same event payload shape expected by the engine

## Design reason

This seam prevents the engine from collapsing into one oversized crawler.
The traversal brain stays reusable while the extraction mouth can vary.

## Invariant

Backends may become richer, but they should not force the engine to know about service-specific internals.
The engine consumes a small normalized result shape and emits generic page/error events.
