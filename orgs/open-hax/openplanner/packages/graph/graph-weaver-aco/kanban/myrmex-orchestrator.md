---
uuid: "orgs-open-hax-openplanner-packages-graph-graph-weaver-aco-kanban-orgs-open-hax-openplanner-packages-graph-graph-weaver-aco-specs-myrmex-orchestrator-md"
title: "Myrmex Orchestrator"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:37.935Z"
source: "orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/specs/myrmex-orchestrator.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/specs/myrmex-orchestrator.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/graph/graph-weaver-aco/kanban/myrmex-orchestrator.md`

# Myrmex Orchestrator

## Status
Draft

## Summary
Myrmex is the foraging intelligence that combines GraphWeaver ACO's traversal algorithm with ShuvCrawl's browser-based content extraction. It sends ants into the web, cracks paywalls and renders JS through ShuvCrawl, and returns enriched page events with full content and link graphs to OpenPlanner via Proxx.

## Name
**Myrmex** (Greek: μύρμηξ, "ant") — the colony's foraging intelligence. Fits the Proxx/Voxx naming convention. Carries the ACO lineage.

## Problem statement
GraphWeaver ACO (`orgs/octave-commons/graph-weaver-aco`) is a lightweight TypeScript crawler with intelligent URL selection via ant colony optimization, but it only does simple `fetch()` — no JS rendering, no paywall bypass, no content extraction.

ShuvCrawl (`shuv1337/shuvcrawl`) is a browser-based scraper with Patchright + BPC extension that extracts clean markdown from paywalled/JS-heavy pages, but has naive BFS/Sitemap crawl strategy with no long-term graph growth intelligence.

Neither is sufficient alone for building a rich, traversable knowledge graph. Myrmex combines them.

## Goals
1. Use GraphWeaver ACO as the traversal brain (which URLs to visit, pheromone-based novelty selection).
2. Use ShuvCrawl as the extraction engine (paywall bypass, JS rendering, markdown extraction).
3. Emit enriched page events with full content, metadata, and outgoing links.
4. Persist graph state (nodes, edges, pheromones, frontier) to OpenPlanner.
5. Run as a managed service behind Proxx's gateway.
6. Support crash recovery via checkpointed frontier state.

## Non-goals
- Rewriting GraphWeaver ACO's pheromone algorithm.
- Rewriting ShuvCrawl's browser engine or BPC integration.
- Building a general-purpose web search engine.

## Architecture

```
┌─────────────────────────────────────────────┐
│                 Myrmex                       │
│                                              │
│  ┌──────────────┐    ┌──────────────────┐   │
│  │ GraphWeaver  │───▶│ ShuvCrawl Client │   │
│  │ ACO Engine   │    │ (POST /scrape)   │   │
│  │ (ants,       │    │ (POST /map)      │   │
│  │  pheromones, │    └────────┬─────────┘   │
│  │  frontier)   │             │              │
│  └──────────────┘             │              │
│                               │              │
│                    ┌──────────▼──────────┐   │
│                    │   Event Router      │   │
│                    │ (page events to     │   │
│                    │  OpenPlanner via    │   │
│                    │  Proxx)             │   │
│                    └──────────┬──────────┘   │
│                               │              │
│                    ┌──────────▼──────────┐   │
│                    │   Graph Store       │   │
│                    │ (checkpoint state   │   │
│                    │  to OpenPlanner)    │   │
│                    └─────────────────────┘   │
└─────────────────────────────────────────────┘
```

## API

### Orchestrator class
```typescript
interface MyrmexConfig {
  // GraphWeaver ACO params
  ants: number;                    // default: 4
  dispatchIntervalMs: number;      // default: 15000
  maxFrontier: number;             // default: 20000
  alpha: number;                   // default: 1.2
  beta: number;                    // default: 3.0
  evaporation: number;             // default: 0.03

  // ShuvCrawl connection
  shuvCrawlBaseUrl: string;        // http://shuvcrawl:3777
  shuvCrawlToken?: string;

  // Proxx/OpenPlanner connection
  proxxBaseUrl: string;            // http://proxx:8789
  proxxAuthToken: string;

  // Content filtering
  includePatterns: string[];
  excludePatterns: string[];
  maxContentLength: number;        // default: 500000
  allowedContentTypes: string[];   // default: ["text/html"]

  // Graph persistence
  checkpointIntervalMs: number;    // default: 60000
  graphStoreUrl: string;           // OpenPlanner endpoint
}

class Myrmex {
  constructor(config: MyrmexConfig);
  seed(urls: string[]): void;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  stats(): MyrmexStats;
  restoreCheckpoint(): Promise<void>;
  onEvent(cb: (ev: MyrmexEvent) => void): () => void;
}
```

### Event types
```typescript
type MyrmexPageEvent = {
  type: "page";
  url: string;
  title: string;
  content: string;           // extracted markdown
  contentHash: string;       // sha256
  metadata: {
    author?: string;
    publishedAt?: string;
    bypassMethod: "bpc-extension" | "direct" | "failed";
    status: "success" | "partial" | "failed";
    elapsed: number;
  };
  outgoing: string[];        // discovered links
  graphNodeId: string;
  fetchedAt: number;
};

type MyrmexErrorEvent = {
  type: "error";
  url: string;
  message: string;
  fetchedAt: number;
};

type MyrmexCheckpointEvent = {
  type: "checkpoint";
  frontierSize: number;
  nodeCount: number;
  edgeCount: number;
  savedAt: number;
};

type MyrmexEvent = MyrmexPageEvent | MyrmexErrorEvent | MyrmexCheckpointEvent;
```

## ShuvCrawl integration

### Endpoints used
- `POST /scrape` — extract content from a URL (with paywall bypass)
- `POST /map` — discover URLs on a page (links + sitemap)
- `GET /health` — health check

### Request format
```json
{
  "url": "https://example.com/article",
  "options": {
    "wait": "networkidle",
    "onlyMainContent": true
  }
}
```

### Response format
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/article",
    "content": "# Article Title\n\nArticle body...",
    "html": "<article>...</article>",
    "metadata": {
      "title": "Article Title",
      "bypassMethod": "bpc-extension",
      "status": "success",
      "elapsed": 2341
    },
    "links": ["https://example.com/related-1", ...]
  }
}
```

## OpenPlanner integration

### Graph storage
Nodes and edges stored as structured events:

**Node event:**
```json
{
  "kind": "graph.node",
  "url": "https://example.com/article",
  "title": "Article Title",
  "contentHash": "sha256:abc123",
  "discoveredAt": "2026-04-01T18:00:00Z",
  "lastVisitedAt": "2026-04-01T18:05:00Z",
  "visitCount": 3,
  "pheromone": 1.5
}
```

**Edge event:**
```json
{
  "kind": "graph.edge",
  "source": "https://example.com/article",
  "target": "https://example.com/related",
  "discoveredAt": "2026-04-01T18:00:00Z",
  "linkText": "related article"
}
```

### Checkpoint format
```json
{
  "version": 1,
  "savedAt": "2026-04-01T18:00:00Z",
  "frontier": {
    "urls": {
      "https://example.com/1": { "pheromone": 1.5, "visits": 0, "lastVisitedAt": null, "outgoing": [] },
      ...
    }
  },
  "ants": [
    { "id": 0, "at": "https://example.com/1" },
    ...
  ],
  "hostState": {
    "example.com": { "lastRequestAt": 1712000000000, "inFlight": 0 }
  }
}
```

## Deployment

### Package location
`orgs/octave-commons/myrmex/` — TypeScript package, Bun runtime

### Compose service
```yaml
services:
  myrmex:
    build: ../../orgs/octave-commons/myrmex
    networks:
      - gateway
    depends_on:
      - shuvcrawl
      - proxx
    environment:
      - SHUVCRAWL_BASE_URL=http://shuvcrawl:3777
      - PROXX_BASE_URL=http://proxx:8789
      - PROXX_AUTH_TOKEN=${PROXY_AUTH_TOKEN}
      - SEED_URLS=https://example.com,https://example.org
      - MYRMEX_ANTS=4
      - MYRMEX_DISPATCH_INTERVAL_MS=15000
      - MYRMEX_MAX_FRONTIER=20000
```

## Affected files

### New: Myrmex package
- `orgs/octave-commons/myrmex/` — new package
- `orgs/octave-commons/myrmex/src/Myrmex.ts` — main orchestrator class
- `orgs/octave-commons/myrmex/src/shuvcrawl-client.ts` — ShuvCrawl API client
- `orgs/octave-commons/myrmex/src/graph-store.ts` — graph persistence to OpenPlanner
- `orgs/octave-commons/myrmex/src/event-router.ts` — event routing to Proxx
- `orgs/octave-commons/myrmex/src/checkpoint.ts` — checkpoint save/restore
- `orgs/octave-commons/myrmex/src/config.ts` — configuration management
- `orgs/octave-commons/myrmex/src/types.ts` — type definitions
- `orgs/octave-commons/myrmex/src/index.ts` — public API
- `orgs/octave-commons/myrmex/package.json`
- `orgs/octave-commons/myrmex/tsconfig.json`
- `orgs/octave-commons/myrmex/Dockerfile`

### GraphWeaver ACO changes
- `orgs/octave-commons/graph-weaver-aco/src/GraphWeaverAco.ts` — add pluggable fetch backend interface
- `orgs/octave-commons/graph-weaver-aco/src/types.ts` — add content-rich page event type
- No breaking changes — existing simple `fetch()` remains default

## Phases

### Phase 1: ShuvCrawl as Fetch Backend
- Add pluggable fetch backend interface to GraphWeaver ACO
- Implement ShuvCrawl client that calls `POST /scrape` and `POST /map`
- Replace simple `fetch()` with ShuvCrawl extraction in Myrmex
- Test: GraphWeaver discovers URLs, ShuvCrawl extracts content

### Phase 2: Event Ingestion to OpenPlanner
- Implement event router that sends page events to OpenPlanner via Proxx
- Define graph event schema (`graph.node`, `graph.edge`)
- Store content, generate embeddings, index for FTS
- Test: crawled content searchable through OpenPlanner

### Phase 3: Graph Persistence + Checkpointing
- Implement graph state persistence to OpenPlanner
- Checkpoint frontier state for crash recovery
- Implement graph restore from persisted state
- Test: restart preserves graph state and frontier

### Phase 4: Proxx Management Surface
- Expose Myrmex through Proxx's `/api/v1/graph/*` surface
- Add management endpoints (start/stop/pause/resume/stats)
- Build graph management UI in web console

## Verification
- Myrmex selects URLs via ACO, ShuvCrawl extracts content with paywall bypass
- Extracted content appears in OpenPlanner with embeddings and FTS index
- `POST /api/v1/lake/search/vector?q=...` returns relevant crawled content
- `GET /api/v1/graph/stats` returns accurate node/edge counts
- `POST /api/v1/graph/crawl/start` begins crawling, `stop` halts it
- Graph state survives restart (frontier, pheromones, visited URLs)
- Unauthenticated requests to `/api/v1/graph/*` return 401

## Definition of done
- Myrmex package combines ACO traversal with ShuvCrawl extraction
- All crawled content is ingested into OpenPlanner through Proxx
- `/api/v1/graph/*` provides full graph management and query surface
- Content from crawled pages is searchable via semantic and FTS search
- Graph state persists across restarts
- Compose stack deploys Proxx + OpenPlanner + Myrmex + ShuvCrawl together

## Risks
- ShuvCrawl browser pool memory usage on resource-constrained hosts
- Paywall bypass reliability varies by site (BPC doesn't cover everything)
- Graph size growth unbounded without pruning policy
- Pheromone graph persistence adds complexity to crash recovery
- Rate limiting and politeness when crawling at scale
- ShuvCrawl is a private repo — dependency management and updates
- Browser pool concurrency limits throughput vs ant count

## Related specs
- `proxx-graph-weaver-shuvcrawl.md` — parent epic in devel/specs
- `proxx-openplanner-integration.md` — OpenPlanner data lake integration
- `proxx-mcp-gateway.md` — MCP server gateway integration
