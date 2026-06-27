---
uuid: "orgs-open-hax-openplanner-packages-graph-graph-weaver-aco-kanban-orgs-open-hax-openplanner-packages-graph-graph-weaver-aco-specs-pluggable-fetch-backend-md"
title: "GraphWeaver ACO Pluggable Fetch Backend"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:37.935Z"
source: "orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/specs/pluggable-fetch-backend.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/specs/pluggable-fetch-backend.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/kanban/pluggable-fetch-backend.md`

# GraphWeaver ACO Pluggable Fetch Backend

## Status
Draft

## Summary
Add a pluggable fetch backend interface to GraphWeaver ACO so it can use ShuvCrawl (or any other extractor) instead of the built-in simple `fetch()`. This enables paywall bypass, JS rendering, and rich content extraction while keeping the ACO algorithm unchanged.

## Problem statement
GraphWeaver ACO currently uses `fetch()` directly in `fetchOne()` to retrieve pages. This works for basic HTML but:
- Can't handle JavaScript-rendered pages
- Can't bypass paywalls
- Doesn't extract structured content (just raw HTML)
- Can't get rich metadata (author, publish date, etc.)

The ACO algorithm itself is solid — the limitation is only in how pages are fetched and what data is extracted from them.

## Goals
1. Define a `FetchBackend` interface that abstracts page fetching.
2. Keep the existing `fetch()` implementation as the default backend.
3. Allow Myrmex to inject a ShuvCrawl-based backend.
4. Emit enriched page events with content when the backend supports it.
5. No breaking changes to existing users of GraphWeaver ACO.

## Non-goals
- Rewriting the ACO algorithm.
- Adding ShuvCrawl as a dependency to GraphWeaver ACO (the backend is injected).
- Changing the frontier or pheromone logic.

## Interface

```typescript
/**
 * Result from fetching a URL.
 * Simple backends return just URL + status + HTML.
 * Rich backends (ShuvCrawl) return extracted content + metadata + links.
 */
export interface FetchResult {
  url: string;
  status: number;
  contentType: string;
  html?: string;           // raw HTML (for link extraction fallback)
  content?: string;        // extracted markdown (rich backends)
  title?: string;          // page title
  metadata?: Record<string, unknown>;  // author, date, etc.
  outgoing?: string[];     // discovered links (rich backends extract these)
  error?: string;          // error message if fetch failed
}

/**
 * A fetch backend that retrieves and extracts page content.
 * GraphWeaver ACO uses this instead of raw fetch().
 */
export interface FetchBackend {
  /**
   * Fetch a URL and return the result.
   * Must respect the AbortController signal for cancellation.
   */
  fetch(url: string, options?: {
    signal?: AbortSignal;
    timeout?: number;
    userAgent?: string;
  }): Promise<FetchResult>;

  /**
   * Discover outgoing links from a URL.
   * Simple backends can return empty array (ACO will extract from HTML).
   * Rich backends can use sitemap, link mapping, etc.
   */
  discoverLinks?(url: string, options?: {
    signal?: AbortSignal;
    timeout?: number;
  }): Promise<string[]>;
}

/**
 * Default fetch backend using raw fetch() + HTML link extraction.
 * This is the existing behavior — kept as the default.
 */
export class SimpleFetchBackend implements FetchBackend {
  private readonly userAgent: string;

  constructor(options?: { userAgent?: string }) {
    this.userAgent = options?.userAgent ?? "graph-weaver/0.1";
  }

  async fetch(url: string, options?: { signal?: AbortSignal; timeout?: number; userAgent?: string }): Promise<FetchResult> {
    // ... existing fetchOne() logic moved here
  }

  discoverLinks(url: string): Promise<string[]> {
    // Not supported — ACO extracts links from HTML in fetch()
    return Promise.resolve([]);
  }
}
```

## GraphWeaverAco changes

### Constructor
```typescript
export interface GraphWeaverAcoOptions {
  // ... existing options ...

  /**
   * Custom fetch backend. Defaults to SimpleFetchBackend.
   * Pass a ShuvCrawl-backed implementation for paywall bypass.
   */
  fetchBackend?: FetchBackend;
}
```

### Internal changes
- `fetchOne()` delegates to `this.fetchBackend.fetch()` instead of raw `fetch()`
- If backend returns `outgoing` links, use those directly instead of HTML extraction
- If backend returns `content`, include it in the page event
- If backend returns `metadata`, include it in the page event
- Link discovery: if backend has `discoverLinks()`, use it for richer link mapping

### Event type extension
```typescript
export type WeaverPageEvent = {
  type: "page";
  url: WeaverUrl;
  status: number;
  contentType: string;
  fetchedAt: number;
  outgoing: WeaverUrl[];
  // New fields (optional, populated by rich backends):
  content?: string;        // extracted markdown
  title?: string;          // page title
  metadata?: Record<string, unknown>;
};
```

## Affected files

### GraphWeaver ACO changes
- `orgs/octave-commons/graph-weaver-aco/src/types.ts` — add `FetchBackend`, `FetchResult`, extended `WeaverPageEvent`
- `orgs/octave-commons/graph-weaver-aco/src/GraphWeaverAco.ts` — accept `fetchBackend` option, delegate to backend
- `orgs/octave-commons/graph-weaver-aco/src/fetch-backend.ts` — new: `SimpleFetchBackend` implementation (extracted from existing code)
- `orgs/octave-commons/graph-weaver-aco/src/index.ts` — export new types and `SimpleFetchBackend`

### Myrmex changes
- `orgs/octave-commons/myrmex/src/shuvcrawl-client.ts` — implement `FetchBackend` using ShuvCrawl API
- `orgs/octave-commons/myrmex/src/Myrmex.ts` — inject ShuvCrawl backend into GraphWeaver ACO

## Verification
- GraphWeaver ACO works unchanged with default `SimpleFetchBackend`
- GraphWeaver ACO accepts custom `FetchBackend` and uses it for fetching
- ShuvCrawl-backed backend returns enriched content, metadata, and links
- Page events include `content` and `metadata` when provided by backend
- No breaking changes to existing API surface

## Definition of done
- `FetchBackend` interface defined and exported
- `SimpleFetchBackend` implementation extracted from existing code
- GraphWeaver ACO accepts optional `fetchBackend` constructor option
- Existing behavior unchanged when no backend is provided
- Myrmex can inject ShuvCrawl backend for rich extraction

## Related specs
- `myrmex-orchestrator.md` — Myrmex injects ShuvCrawl backend
- `myrmex-graph-epic.md` — parent epic
