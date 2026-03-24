# Web Graph Weaver — Extraction Spec

> *A crawler that respects the web, builds knowledge from pages, and feeds the radar.*

---

## Purpose

Extract the Web Graph Weaver from `fork_tales/web_graph_weaver.js` into `packages/web-graph-weaver/` — a clean, modular web crawler with RSS feed support, knowledge graph extraction, and WebSocket streaming.

---

## Conceptual Model

```
┌─────────────────────────────────────────────────────────────┐
│                     WEB GRAPH WEAVER                         │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  Watchlist  │───►│   Crawler   │───►│   Graph     │      │
│  │   Seeds     │    │   Engine    │    │   Builder    │      │
│  │  (RSS/URL)  │    │             │    │             │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│         │                  │                  │              │
│         │                  ▼                  ▼              │
│         │           ┌─────────────┐    ┌─────────────┐      │
│         │           │ Robots.txt  │    │  WebSocket  │      │
│         │           │   Handler   │    │   Stream    │      │
│         │           └─────────────┘    └─────────────┘      │
│         │                                     │              │
│         │                                     ▼              │
│         │                              ┌─────────────┐      │
│         │                              │   Clients   │      │
│         │                              │  (Threat    │      │
│         │                              │   Radar)    │      │
│         │                              └─────────────┘      │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │  Knowledge  │◄──────── Knowledge Graph ◄────┘           │
│  │   Graph     │   (nodes, edges, concepts)                │
│  └─────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

**Watchlist Seeds** = URLs or RSS feeds to crawl.

**Crawler Engine** = Respects robots.txt, rate limits, concurrency.

**Graph Builder** = Extracts concepts, references, metadata into nodes/edges.

**WebSocket Stream** = Real-time progress to connected clients.

---

## Source Vault Contracts

### `part64/code/web_graph_weaver.js` — Main Implementation

```javascript
const HOST = process.env.WEAVER_HOST || "127.0.0.1";
const PORT = Number.parseInt(process.env.WEAVER_PORT || "8793", 10);
const MAX_EVENTS = Number.parseInt(process.env.WEAVER_MAX_EVENTS || "200000", 10);
const DEFAULT_MAX_DEPTH = Number.parseInt(process.env.WEAVER_MAX_DEPTH || "12", 10);
const DEFAULT_MAX_NODES = Number.parseInt(process.env.WEAVER_MAX_NODES || "2000000", 10);
const DEFAULT_CONCURRENCY = Number.parseInt(process.env.WEAVER_CONCURRENCY || "32", 10);
const DEFAULT_DELAY_MS = Number.parseInt(process.env.WEAVER_DEFAULT_DELAY_MS || "1200", 10);
const FETCH_TIMEOUT_MS = Number.parseInt(process.env.WEAVER_FETCH_TIMEOUT_MS || "12000", 10);
const ARXIV_API_MIN_DELAY_MS = Number.parseInt(process.env.WEAVER_ARXIV_API_MIN_DELAY_MS || "3100", 10);
```

**Key features:**
- Watchlist seed loading (`@open-hax/signal-watchlists`)
- URL normalization and feed detection (`@open-hax/signal-source-utils`)
- Robots.txt caching and compliance
- Concurrency limits and rate limiting
- ArXiv API integration with polite delay
- WebSocket streaming for real-time updates

---

## Extracted Package Structure

```
packages/web-graph-weaver/
├── src/
│   ├── index.ts               # Public API
│   ├── weaver.ts              # Main crawler class
│   ├── watchlist.ts           # Seed management
│   ├── fetcher.ts             # HTTP fetch with rate limiting
│   ├── robots.ts              # Robots.txt handling
│   ├── feed-parser.ts         # RSS/Atom parsing
│   ├── knowledge-graph.ts     # Graph builder
│   ├── websocket.ts           # WebSocket server
│   ├── arxiv.ts               # ArXiv integration
│   ├── wikipedia.ts           # Wikipedia integration
│   └── types.ts               # Type definitions
├── test/
│   ├── weaver.test.ts
│   ├── robots.test.ts
│   ├── feed-parser.test.ts
│   └── knowledge-graph.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Core Types

### `types.ts`

```typescript
export interface WatchlistSeed {
  url: string;
  kind: "rss" | "atom" | "html" | "arxiv" | "wikipedia";
  priority: number;        // Higher = crawl first
  maxDepth?: number;       // Override default
  interval?: number;      // Refresh interval in minutes
  lastCrawledAt?: string;  // ISO timestamp
}

export interface CrawlConfig {
  maxDepth: number;        // Maximum crawl depth
  maxNodes: number;        // Maximum graph nodes
  concurrency: number;     // Concurrent fetches
  delayMs: number;        // Delay between requests
  timeoutMs: number;      // Request timeout
  respectRobots: boolean; // Honor robots.txt
  userAgent: string;      // User agent header
}

export interface CrawlEvent {
  type: "started" | "fetched" | "parsed" | "linked" | "error" | "complete";
  url: string;
  depth: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeNode {
  id: string;              // URL hash
  url: string;             // Canonical URL
  title?: string;          // Page title
  summary?: string;        // Extracted summary
  concepts: string[];      // Extracted concepts
  references: string[];    // Outgoing links
  metadata: Record<string, unknown>;
  crawledAt: string;
  depth: number;
}

export interface KnowledgeEdge {
  from: string;            // Source node ID
  to: string;              // Target node ID
  kind: "references" | "cites" | "mentions" | "related";
  weight: number;          // Relevance weight
}

export interface KnowledgeGraph {
  nodes: Map<string, KnowledgeNode>;
  edges: Map<string, KnowledgeEdge>;
  stats: {
    totalNodes: number;
    totalEdges: number;
    maxDepth: number;
    crawledAt: string;
  };
}

export const DEFAULT_CONFIG: CrawlConfig = {
  maxDepth: 12,
  maxNodes: 2_000_000,
  concurrency: 32,
  delayMs: 1200,
  timeoutMs: 12000,
  respectRobots: true,
  userAgent: "WebGraphWeaver/1.0",
};
```

### `watchlist.ts`

```typescript
export interface WatchlistManager {
  load(path: string): Promise<WatchlistSeed[]>;
  merge(a: WatchlistSeed[], b: WatchlistSeed[]): WatchlistSeed[];
  prioritize(seeds: WatchlistSeed[]): WatchlistSeed[];
  markCrawled(seeds: WatchlistSeed[], url: string): void;
}

export function parseWatchlistSeeds(content: string): WatchlistSeed[] {
  const lines = content.split("\n").filter(line => line.trim() && !line.startsWith("#"));
  return lines.map(line => {
    const [url, ...rest] = line.split(/\s+/);
    const kind = classifyUrl(url);
    return {
      url: normalizeUrl(url),
      kind,
      priority: parseInt(rest[0] || "1", 10),
      maxDepth: rest[1] ? parseInt(rest[1], 10) : undefined,
    };
  });
}

export function classifyUrl(url: string): WatchlistSeed["kind"] {
  if (url.includes("arxiv.org")) return "arxiv";
  if (url.includes("wikipedia.org")) return "wikipedia";
  if (url.includes("/feed") || url.includes("/rss") || url.includes(".xml")) return "rss";
  if (url.includes("/atom")) return "atom";
  return "html";
}
```

### `fetcher.ts`

```typescript
export interface Fetcher {
  fetch(url: string, options?: FetchOptions): Promise<FetchResult>;
  isAllowed(url: string): Promise<boolean>;
  delay(host: string): Promise<void>;
}

export interface FetchOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface FetchResult {
  url: string;
  status: number;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  size: number;
  durationMs: number;
}

export class PoliteFetcher implements Fetcher {
  private robotsCache = new Map<string, RobotsRules>();
  private hostDelays = new Map<string, number>();

  async isAllowed(url: string): Promise<boolean> {
    const parsed = new URL(url);
    const robots = await this.getRobots(parsed.origin);
    return robots.isAllowed(url);
  }

  async delay(host: string): Promise<void> {
    const last = this.hostDelays.get(host) || 0;
    const elapsed = Date.now() - last;
    if (elapsed < this.config.delayMs) {
      await new Promise(r => setTimeout(r, this.config.delayMs - elapsed));
    }
    this.hostDelays.set(host, Date.now());
  }

  async fetch(url: string, options?: FetchOptions): Promise<FetchResult> {
    await this.delay(new URL(url).host);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        signal: options?.signal || controller.signal,
        headers: {
          "User-Agent": this.config.userAgent,
          ...options?.headers,
        },
      });

      clearTimeout(timeout);

      return {
        url: response.url,
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: await response.text(),
        contentType: response.headers.get("content-type") || "text/html",
        size: parseInt(response.headers.get("content-length") || "0", 10),
        durationMs: Date.now() - (this.hostDelays.get(new URL(url).host) || Date.now()),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
```

### `feed-parser.ts`

```typescript
export interface FeedParser {
  parse(content: string): Promise<FeedResult>;
  extractEntries(feed: FeedResult): FeedEntry[];
}

export interface FeedResult {
  type: "rss" | "atom" | "unknown";
  title?: string;
  link?: string;
  entries: FeedEntry[];
}

export interface FeedEntry {
  id: string;
  title: string;
  link: string;
  summary?: string;
  published?: string;
  updated?: string;
  authors?: string[];
  categories?: string[];
}

export function detectFeedType(content: string): "rss" | "atom" | "unknown" {
  if (content.includes("<rss") || content.includes("<channel")) return "rss";
  if (content.includes("<feed") && content.includes("xmlns=\"http://www.w3.org/2005/Atom\"")) return "atom";
  return "unknown";
}

export function extractFeedEntries(feed: FeedResult): FeedEntry[] {
  return feed.entries.map(entry => ({
    id: entry.id || hashUrl(entry.link),
    title: entry.title || "Untitled",
    link: entry.link,
    summary: entry.summary?.slice(0, 500),
    published: entry.published,
    categories: entry.categories || [],
  }));
}
```

### `knowledge-graph.ts`

```typescript
export interface KnowledgeGraphBuilder {
  addNode(node: KnowledgeNode): void;
  addEdge(edge: KnowledgeEdge): void;
  getNode(id: string): KnowledgeNode | undefined;
  getEdges(nodeId: string): KnowledgeEdge[];
  stats(): GraphStats;
  export(): KnowledgeGraphJSON;
}

export class InMemoryKnowledgeGraph implements KnowledgeGraphBuilder {
  private nodes = new Map<string, KnowledgeNode>();
  private edges = new Map<string, KnowledgeEdge[]>();

  addNode(node: KnowledgeNode): void {
    this.nodes.set(node.id, node);

    // Index by outgoing edges
    for (const ref of node.references) {
      const edge: KnowledgeEdge = {
        from: node.id,
        to: hashUrl(ref),
        kind: "references",
        weight: 1.0,
      };
      const existing = this.edges.get(node.id) || [];
      existing.push(edge);
      this.edges.set(node.id, existing);
    }
  }

  getNode(id: string): KnowledgeNode | undefined {
    return this.nodes.get(id);
  }

  getEdges(nodeId: string): KnowledgeEdge[] {
    return this.edges.get(nodeId) || [];
  }

  stats(): GraphStats {
    const maxDepth = [...this.nodes.values()].reduce((max, n) => Math.max(max, n.depth), 0);
    return {
      totalNodes: this.nodes.size,
      totalEdges: [...this.edges.values()].flat().length,
      maxDepth,
      crawledAt: new Date().toISOString(),
    };
  }
}
```

---

## Weaver API

### `weaver.ts`

```typescript
export interface Weaver {
  crawl(seeds: WatchlistSeed[]): Promise<KnowledgeGraph>;
  subscribe(handler: (event: CrawlEvent) => void): () => void;
  stats(): GraphStats;
  stop(): void;
}

export class WebGraphWeaver implements Weaver {
  private graph: KnowledgeGraphBuilder;
  private fetcher: Fetcher;
  private config: CrawlConfig;
  private subscribers: Set<(event: CrawlEvent) => void> = new Set();
  private running = false;

  constructor(config: Partial<CrawlConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.graph = new InMemoryKnowledgeGraph();
    this.fetcher = new PoliteFetcher(this.config);
  }

  async crawl(seeds: WatchlistSeed[]): Promise<KnowledgeGraph> {
    this.running = true;
    const queue: QueueItem[] = seeds.map(s => ({ url: s.url, depth: 0, priority: s.priority }));
    const visited = new Set<string>();

    while (queue.length > 0 && this.running) {
      const item = queue.shift()!;
      const normalized = normalizeUrl(item.url);

      if (visited.has(normalized)) continue;
      if (this.graph.stats().totalNodes >= this.config.maxNodes) break;

      visited.add(normalized);

      // Check robots.txt
      if (this.config.respectRobots && !(await this.fetcher.isAllowed(normalized))) {
        this.emit({ type: "error", url: normalized, depth: item.depth, timestamp: new Date().toISOString(), metadata: { reason: "robots.txt" } });
        continue;
      }

      // Fetch
      this.emit({ type: "started", url: normalized, depth: item.depth, timestamp: new Date().toISOString() });

      try {
        const result = await this.fetcher.fetch(normalized);
        const node = await this.parse(result, item.depth);

        this.graph.addNode(node);
        this.emit({ type: "fetched", url: normalized, depth: item.depth, timestamp: new Date().toISOString(), metadata: { size: result.size } });

        // Queue references
        if (item.depth < this.config.maxDepth) {
          for (const ref of node.references) {
            if (!visited.has(normalizeUrl(ref))) {
              queue.push({ url: ref, depth: item.depth + 1, priority: item.priority });
            }
          }
        }
      } catch (error) {
        this.emit({ type: "error", url: normalized, depth: item.depth, timestamp: new Date().toISOString(), metadata: { error: String(error) } });
      }
    }

    this.emit({ type: "complete", url: "", depth: 0, timestamp: new Date().toISOString() });
    return this.graph;
  }

  subscribe(handler: (event: CrawlEvent) => void): () => void {
    this.subscribers.add(handler);
    return () => this.subscribers.delete(handler);
  }

  private emit(event: CrawlEvent): void {
    for (const handler of this.subscribers) {
      handler(event);
    }
  }

  stop(): void {
    this.running = false;
  }
}
```

---

## Integration Points

### Threat Radar Integration

```typescript
import { WebGraphWeaver, WatchlistSeed } from "@workspace/web-graph-weaver";
import { SourceDefinition } from "@workspace/radar-core";

// Convert web graph nodes to radar sources
function graphNodeToSource(node: KnowledgeNode): SourceDefinition {
  return {
    id: `source:${node.id}`,
    radar_id: "hormuz",
    kind: node.url.includes("/feed") ? "rss" : "web",
    name: node.title || node.url,
    uri: node.url,
    adapter_config: { depth: node.depth },
    trust_profile: {
      default_confidence: 0.7,
      quality: node.depth === 0 ? "primary" : "secondary",
    },
    status: "active",
  };
}
```

### Syndicussy Integration

```typescript
import { WebGraphWeaver, FeedParser } from "@workspace/web-graph-weaver";

// Use syndicussy for RSS source management, weaver for crawling
const weaver = new WebGraphWeaver();
const parser = new FeedParser();

// Subscribe to events
weaver.subscribe(event => {
  if (event.type === "fetched") {
    console.log(`Crawled ${event.url} at depth ${event.depth}`);
  }
});

// Crawl RSS feeds
const seeds: WatchlistSeed[] = [
  { url: "https://arxiv.org/rss/cs.AI", kind: "rss", priority: 1 },
  { url: "https://news.ycombinator.com/rss", kind: "rss", priority: 2 },
];

const graph = await weaver.crawl(seeds);
```

---

## Tests

```typescript
// test/weaver.test.ts
describe("WebGraphWeaver", () => {
  it("respects robots.txt", async () => {
    const weaver = new WebGraphWeaver({ respectRobots: true });
    // Mock robots.txt disallow
    const graph = await weaver.crawl([{ url: "https://example.com/private", kind: "html", priority: 1 }]);
    expect(graph.nodes.has(hashUrl("https://example.com/private"))).toBe(false);
  });

  it("limits crawl depth", async () => {
    const weaver = new WebGraphWeaver({ maxDepth: 2 });
    const graph = await weaver.crawl(seeds);
    const maxDepth = [...graph.nodes.values()].reduce((max, n) => Math.max(max, n.depth), 0);
    expect(maxDepth).toBeLessThanOrEqual(2);
  });

  it("emits events to subscribers", async () => {
    const weaver = new WebGraphWeaver();
    const events: CrawlEvent[] = [];
    weaver.subscribe(e => events.push(e));
    await weaver.crawl(seeds);
    expect(events.some(e => e.type === "complete")).toBe(true);
  });
});
```

---

## Migration Steps

1. **Create package structure** (`packages/web-graph-weaver/`)
2. **Extract types** from vault JavaScript → TypeScript
3. **Implement PoliteFetcher** with robots.txt and rate limiting
4. **Implement FeedParser** for RSS/Atom
5. **Implement KnowledgeGraph** builder
6. **Add WebSocket streaming** for real-time updates
7. **Write tests** for crawling logic
8. **Integrate with @open-hax/signal-watchlists**
9. **Integrate with Threat Radar** for source ingestion

---

## Dependencies

- `zod` — Schema validation
- `@open-hax/signal-watchlists` — Watchlist utilities
- `@open-hax/signal-source-utils` — URL/feed utilities
- `ws` — WebSocket server (optional)

---

## Source Anchors

| Concept | Vault File | Extracted Concept |
|---------|------------|-------------------|
| Watchlist seeds | `web_graph_weaver.js:L10-30` | `watchlist.ts` |
| Robots cache | `web_graph_weaver.js:L200-250` | `robots.ts` |
| Feed detection | `web_graph_weaver.js:L300-350` | `feed-parser.ts` |
| Knowledge graph | `web_graph_weaver.js:L600-800` | `knowledge-graph.ts` |
| WebSocket stream | `web_graph_weaver.js:L50-100` | `websocket.ts` |

---

## Next

Create `specs/panel-composer-spec.md` for UI composition extraction.