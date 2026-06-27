# RSS Adapter — Integration Spec

> *Every RSS feed is a presence in the radar. Syndicussy feeds the clock.*

---

## Purpose

Define the integration contract between **Threat Radar** (`packages/radar-core`) and **syndicussy** (shuv's RSS aggregator) for RSS source ingestion, filtering, and signal extraction.

---

## Conceptual Model

```
┌─────────────────────────────────────────────────────────────┐
│                      SYNDICUSSY                              │
│  (RSS Aggregator at https://rss.shuv.dev/)                  │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  Feed URL   │───►│   Parser    │───►│   Filter    │      │
│  │  (RSS/Atom) │    │   Parser    │    │   Engine    │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│                                              │              │
│                                              ▼              │
│                                        ┌─────────────┐      │
│                                        │   Channel   │      │
│                                        │   Router    │      │
│                                        └─────────────┘      │
│                                              │              │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                                               │ Webhook / API
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      THREAT RADAR                            │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ SourceDef   │───►│  RSS        │───►│  Signal     │      │
│  │ (kind=rss)  │    │  Adapter    │    │  Extractor  │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│                                              │              │
│                                              ▼              │
│                                        ┌─────────────┐      │
│                                        │ Assessment  │      │
│                                        │   Packet    │      │
│                                        └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**Syndicussy** = shuv's RSS aggregator with backend filtering and channel routing.

**Threat Radar** = Signal collection, assessment packets, reduction.

**Contract** = RSS SourceDefinition + adapter_config + webhook/API delivery.

---

## Source Definition Schema

### `radar-core` Source Definition (Already Exists)

```typescript
sourceDefinitionSchema = z.object({
  id: z.string().min(1),
  radar_id: z.string().min(1),
  kind: sourceKindSchema,  // "rss" | "web" | "api" | "manual" | "social" | "ais" | "official"
  name: z.string().min(1),
  uri: z.string().min(1),
  adapter_config: z.record(z.unknown()).default({}),
  trust_profile: z.object({
    default_confidence: z.number().min(0).max(1),
    quality: z.enum(["primary", "secondary", "tertiary", "unreliable"]),
  }),
  freshness_policy: z.object({
    expected_interval_minutes: z.number().int().positive().optional(),
    stale_after_minutes: z.number().int().positive().optional(),
  }).default({}),
  status: z.enum(["active", "disabled", "staging"]).default("active"),
});
```

### RSS Adapter Config (Extension)

```typescript
export interface RSSAdapterConfig {
  // Feed identification
  feed_url: string;                    // Canonical RSS/Atom URL
  feed_type: "rss" | "atom" | "json";  // Feed format

  // Filtering (passed to syndicussy)
  filter: {
    include_keywords?: string[];        // Only items matching these
    exclude_keywords?: string[];       // Skip items matching these
    include_categories?: string[];      // Only these categories
    exclude_categories?: string[];     // Skip these categories
    min_relevance_score?: number;       // 0.0 - 1.0 threshold
    language?: string;                  // ISO 639-1 code
  };

  // Delivery
  delivery: {
    method: "webhook" | "poll" | "stream";
    endpoint?: string;                  // Webhook URL for delivery
    poll_interval_minutes?: number;     // For poll method
    batch_size?: number;                // Items per delivery
  };

  // Signal extraction
  signal_extraction: {
    extract_entities?: boolean;         // Extract named entities
    extract_sentiment?: boolean;        // Sentiment analysis
    extract_links?: boolean;            // Follow and analyze links
    llm_model?: string;                 // Model for extraction
  };

  // Channel routing (syndicussy)
  syndicussy_channel?: string;         // Map to syndicussy channel
}
```

---

## Integration Points

### 1. Create RSS Source in Threat Radar

```typescript
import { SourceDefinition, sourceDefinitionSchema } from "@workspace/radar-core";

const hormuzRSSSource: SourceDefinition = {
  id: "source:hormuz:maritime-news",
  radar_id: "hormuz",
  kind: "rss",
  name: "Maritime Security News",
  uri: "https://example.com/maritime-security/feed.xml",
  adapter_config: {
    feed_url: "https://example.com/maritime-security/feed.xml",
    feed_type: "rss",
    filter: {
      include_keywords: ["Hormuz", "Strait", "tanker", "naval", "Iran", "UAE"],
      exclude_keywords: ["advertisement", "sponsored"],
      min_relevance_score: 0.6,
      language: "en",
    },
    delivery: {
      method: "webhook",
      endpoint: "https://radar.promethean.rest/api/sources/hormuz/webhook",
      batch_size: 10,
    },
    signal_extraction: {
      extract_entities: true,
      extract_sentiment: true,
      extract_links: true,
    },
    syndicussy_channel: "hormuz-security",
  } as RSSAdapterConfig,
  trust_profile: {
    default_confidence: 0.75,
    quality: "secondary",
  },
  freshness_policy: {
    expected_interval_minutes: 60,
    stale_after_minutes: 180,
  },
  status: "active",
};
```

### 2. Threat Radar MCP Tool

```typescript
// In threat-radar-mcp/src/main.ts

server.registerTool(
  "radar_add_rss_source",
  {
    description: "Add an RSS feed source to a radar with filtering configuration",
    inputSchema: {
      radar_id: z.string().min(1),
      name: z.string().min(1),
      feed_url: z.string().url(),
      config: z.object({
        filter: z.object({
          include_keywords: z.array(z.string()).optional(),
          exclude_keywords: z.array(z.string()).optional(),
          min_relevance_score: z.number().min(0).max(1).optional(),
        }).optional(),
        delivery: z.object({
          method: z.enum(["webhook", "poll", "stream"]),
          endpoint: z.string().url().optional(),
        }).optional(),
      }).optional(),
      trust_profile: z.object({
        default_confidence: z.number().min(0).max(1),
        quality: z.enum(["primary", "secondary", "tertiary", "unreliable"]),
      }).optional(),
    },
  },
  async ({ radar_id, name, feed_url, config, trust_profile }): Promise<CallToolResult> => {
    const source: SourceDefinition = {
      id: `source:${radar_id}:${crypto.randomUUID()}`,
      radar_id,
      kind: "rss",
      name,
      uri: feed_url,
      adapter_config: {
        feed_url,
        feed_type: "rss",
        ...config,
      },
      trust_profile: trust_profile ?? { default_confidence: 0.7, quality: "secondary" },
      freshness_policy: { expected_interval_minutes: 60 },
      status: "active",
    };
    const validated = sourceDefinitionSchema.parse(source);
    await addSource(validated);
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, source: validated }, null, 2) }] };
  },
);
```

### 3. Syndicussy Webhook Payload

When syndicussy delivers filtered items to Threat Radar:

```typescript
export interface SyndicussyWebhookPayload {
  source_id: string;              // Matches radar-core SourceDefinition.id
  feed_url: string;
  items: SyndicussyItem[];
  delivered_at: string;           // ISO timestamp
  batch_id: string;
}

export interface SyndicussyItem {
  guid: string;                   // Feed item GUID
  title: string;
  link: string;
  published: string;              // ISO timestamp
  summary?: string;
  content?: string;
  author?: string;
  categories?: string[];
  extracted?: {
    entities?: string[];           // Named entities
    sentiment?: number;            // -1 to 1
    relevance?: number;            // 0 to 1
  };
}

// Threat Radar webhook receiver
app.post("/api/sources/:radar_id/webhook", async (req, res) => {
  const { radar_id } = req.params;
  const payload: SyndicussyWebhookPayload = req.body;

  // Validate source belongs to radar
  const source = await store.getSource(payload.source_id);
  if (!source || source.radar_id !== radar_id) {
    return res.status(400).json({ error: "Invalid source for radar" });
  }

  // Convert items to source citations
  const citations: SourceCitation[] = payload.items.map(item => ({
    type: mapCategoryToSourceType(item.categories),
    name: item.author || source.name,
    url: item.link,
    confidence: (item.extracted?.relevance ?? 0.7) * source.trust_profile.default_confidence,
    retrieved_at: payload.delivered_at,
    notes: item.extracted?.entities?.join(", "),
  }));

  // Index in evidence
  const evidenceIndex = getEvidenceIndex(radar_id);
  evidenceIndex.indexBatch(citations);

  res.json({ ok: true, items_received: payload.items.length });
});
```

---

## Signal Extraction

### RSS Item → Signal Score

```typescript
export interface SignalExtractor {
  extractSignals(item: SyndicussyItem, signalDefs: SignalDefinition[]): Partial<Record<string, SignalScore>>;
}

export class MaritimeSecuritySignalExtractor implements SignalExtractor {
  extractSignals(item: SyndicussyItem, signalDefs: SignalDefinition[]): Partial<Record<string, SignalScore>> {
    const scores: Partial<Record<string, SignalScore>> = {};

    for (const def of signalDefs) {
      switch (def.id) {
        case "transit_flow":
          scores[def.id] = this.scoreTransitFlow(item);
          break;
        case "attack_tempo":
          scores[def.id] = this.scoreAttackTempo(item);
          break;
        case "insurance_availability":
          scores[def.id] = this.scoreInsurance(item);
          break;
      }
    }

    return scores;
  }

  private scoreTransitFlow(item: SyndicussyItem): SignalScore {
    const text = `${item.title} ${item.summary || ""}`.toLowerCase();

    let value = 2; // Default "normal"
    const signals: string[] = [];

    // Negative indicators
    if (text.includes("closure") || text.includes("blocked")) {
      value = 4; // "broken"
      signals.push("closure_mentioned");
    } else if (text.includes("delay") || text.includes("disruption")) {
      value = 3; // "degraded"
      signals.push("disruption_mentioned");
    }

    // Positive indicators
    if (text.includes("normal") || text.includes("resumed")) {
      value = Math.min(value, 1); // at most "stressed"
      signals.push("normalcy_mentioned");
    }

    return {
      value,
      range: [0, 4],
      confidence: item.extracted?.relevance ?? 0.7,
      reason: signals.join("; ") || "baseline",
      supporting_sources: [item.link],
    };
  }

  private scoreAttackTempo(item: SyndicussyItem): SignalScore {
    const text = `${item.title} ${item.summary || ""}`.toLowerCase();

    let value = 1; // Default "stressed"
    const signals: string[] = [];

    if (text.includes("attack") || text.includes("drone") || text.includes("missile")) {
      value = 3; // "degraded"
      signals.push("attack_mentioned");

      if (text.includes("sunk") || text.includes("destroyed") || text.includes("casualty")) {
        value = 4; // "broken"
        signals.push("severe_attack");
      }
    }

    return {
      value,
      range: [0, 4],
      confidence: item.extracted?.relevance ?? 0.7,
      reason: signals.join("; ") || "baseline_tension",
      supporting_sources: [item.link],
    };
  }

  private scoreInsurance(item: SyndicussyItem): SignalScore {
    const text = `${item.title} ${item.summary || ""}`.toLowerCase();

    let value = 1; // Default "stressed"
    const signals: string[] = [];

    if (text.includes("war risk") || text.includes("insurance premium")) {
      value = 2; // "moderate"
      signals.push("insurance_mentioned");

      if (text.includes("unavailable") || text.includes("withdrawn")) {
        value = 4; // "broken"
        signals.push("insurance_unavailable");
      }
    }

    return {
      value,
      range: [0, 4],
      confidence: item.extracted?.relevance ?? 0.7,
      reason: signals.join("; ") || "baseline_availability",
      supporting_sources: [item.link],
    };
  }
}
```

---

## Discord Output Channel

### Configured in adapter_config

```typescript
export interface DiscordOutputConfig {
  enabled: boolean;
  webhook_url: string;             // Discord channel webhook
  template: "brief" | "full" | "alert";
  filters: {
    min_signal_value?: number;     // Only send if signal >= threshold
    signal_ids?: string[];          // Only certain signals
    categories?: string[];          // Only certain item categories
  };
}

// RSS Source with Discord output
const hormuzRSSToDiscord: SourceDefinition = {
  // ... same as above ...
  adapter_config: {
    // ... RSS config ...
    discord_output: {
      enabled: true,
      webhook_url: process.env.DISCORD_WEBHOOK_HORMUZ,
      template: "brief",
      filters: {
        min_signal_value: 3,  // Only send "impaired" or worse
        signal_ids: ["transit_flow", "attack_tempo"],
      },
    },
  },
};
```

### Discord Message Format

```typescript
export interface DiscordMessage {
  embeds: DiscordEmbed[];
}

export interface DiscordEmbed {
  title: string;
  description: string;
  url?: string;
  color?: number;              // Decimal color
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp?: string;
}

function itemToDiscordEmbed(item: SyndicussyItem, signals: SignalScore[]): DiscordEmbed {
  const color = Math.max(...signals.map(s => s.value)) >= 3 ? 0xFF0000 : 0xFFFF00; // Red if impaired, Yellow otherwise

  return {
    title: item.title.slice(0, 256),
    description: (item.summary || "").slice(0, 2048),
    url: item.link,
    color,
    fields: signals.map(s => ({
      name: s.id.replace(/_/g, " ").toUpperCase(),
      value: `${s.value}/4 — ${s.reason}`,
      inline: true,
    })),
    timestamp: item.published,
  };
}
```

---

## Syndicussy Integration Contract

### Assumed API (needs verification)

```typescript
// Syndicussy (https://rss.shuv.dev/) assumed interface
// This needs verification from actual implementation

export interface SyndicussyClient {
  // Feed management
  addFeed(url: string, config: FeedConfig): Promise<Feed>;
  removeFeed(feedId: string): Promise<void>;
  listFeeds(): Promise<Feed[]>;

  // Filtering
  setFilter(feedId: string, filter: FeedFilter): Promise<void>;

  // Channel routing
  createChannel(name: string, config: ChannelConfig): Promise<Channel>;
  subscribe(channelId: string, delivery: DeliveryConfig): Promise<void>;

  // Webhooks
  registerWebhook(feedId: string, webhook: WebhookConfig): Promise<void>;
}

export interface FeedConfig {
  poll_interval_minutes?: number;
  cache_ttl_minutes?: number;
}

export interface FeedFilter {
  include_keywords?: string[];
  exclude_keywords?: string[];
  min_relevance_score?: number;
  language?: string;
}

export interface ChannelConfig {
  name: string;
  filters?: FeedFilter[];
}

export interface DeliveryConfig {
  method: "webhook" | "poll" | "websocket";
  endpoint: string;
  batch_size?: number;
}
```

---

## Migration Steps

1. **Verify syndicussy API** — Inspect `https://rss.shuv.dev/` for actual API
2. **Implement RSS adapter** — `packages/radar-core/src/adapters/rss.ts`
3. **Add MCP tool** — `radar_add_rss_source` in threat-radar-mcp
4. **Implement webhook receiver** — `/api/sources/:radar_id/webhook`
5. **Implement signal extractor** — MaritimeSecuritySignalExtractor
6. **Add Discord output** — Optional `discord_output` in adapter_config
7. **Test integration** — End-to-end RSS → source → signal flow

---

## Next

Create `specs/daily-briefing-spec.md` for the "Good Morning Hormuz" renderer.