# Free DevOps Resources for Mission Control News Dashboard

Research compiled from [free-for-dev](https://github.com/ripienaar/free-for-dev) repository and direct vendor pricing pages.

---

## 1. Static Site / Frontend Hosting (React app with animated clocks)

| Service | Free Tier Limits | Best For |
|---------|-----------------|----------|
| **Cloudflare Pages** ⭐ | 500 builds/month, 100 custom domains, SSL, unlimited preview deploys, full-stack via Workers | **Primary recommendation** — fastest global CDN, unlimited bandwidth, integrates with Workers for SSR/API |
| **Vercel** | Free SSL, global CDN, preview URLs per git push | Great for Next.js; generous but has bandwidth caps on free |
| **Netlify** | 300 credits/month (~30 GB bandwidth) | Solid alternative, easy deploy |
| **Render Static Sites** | $0/month, global CDN, auto-deploy from Git, free SSL | Already in your stack — simplest option |
| **Kinsta Static** | 100 static sites, 100 GB bandwidth/month, 260+ CDN locations | Very generous if you need many sites |
| **Surge.sh** | Unlimited sites, custom domain support | Quick CLI deploys, dead simple |

### Recommendation
**Use Render Static Sites** (already in your stack) as primary. Add **Cloudflare Pages** if you need better global performance or want to offload from Render.

---

## 2. Backend API Hosting (Node.js Microservices)

| Service | Free Tier Limits | Best For |
|---------|-----------------|----------|
| **Render Web Services** ⭐ | Free: 512 MB RAM, 0.1 CPU, auto-deploy from Git, spins down after inactivity | Already in your stack — good for low-traffic microservices |
| **Cloudflare Workers** | 100K requests/day, runs at the edge globally | Lightweight API endpoints, cron triggers, ultra-fast cold starts |
| **Google Cloud Run** | 2M requests/month, 360K GB-seconds memory, 180K vCPU-seconds | Generous for bursty workloads, true scale-to-zero |
| **AWS Lambda** | 1M requests/month | Event-driven microservices |
| **Deno Deploy** | 100K requests/day, 100 GiB data transfer/month | If using Deno/TypeScript |
| **Railway** | $5 free credits/month | Git-based deploy, built-in databases |
| **Northflank** | 2 services, 2 cron jobs, 1 database | Good for microservice architectures |
| **Leapcell** | 100K service invocations, 10K async tasks, 100K Redis commands | All-in-one option |

### Recommendation
**Render free web services** for your primary API services (already integrated). Supplement with **Cloudflare Workers** for lightweight edge functions (signal intake endpoints, webhook handlers). Consider **Google Cloud Run** for any compute-heavy signal processing that needs burst capacity.

### Strategy for Render Free Services
- Free instances spin down after 15 min of inactivity (cold starts ~30s)
- Use cron pings or Upstash QStash to keep critical services warm
- Split into small microservices that can run in 512 MB RAM each

---

## 3. Database (Postgres — Minimal Usage, Config/State)

| Service | Free Tier Limits | Best For |
|---------|-----------------|----------|
| **Render Postgres** | Free: 256 MB RAM, 0.1 CPU, **30-day limit**, 100 connections | Already in stack but **expires after 30 days** — not suitable for permanent state |
| **Neon** ⭐ | 0.5 GB storage, 1 project, 10 branches, unlimited databases, auto-suspend after 5 min inactivity | **Primary recommendation** — serverless Postgres, always free, pgvector support for embeddings |
| **Nile** | 1 GB storage, unlimited databases, always available (no shutdown), 50M query tokens, unlimited vector embeddings | Great alternative — no auto-suspend, built-in vector support |
| **Aiven** | Free PostgreSQL plan: 1 CPU, 1 GB RAM, 1 GB storage | Solid managed Postgres |
| **Supabase** | Auth, realtime DB, object storage on free plan | Full BaaS if you want it |
| **CockroachDB** | 50M RUs + 10 GiB storage free/month | Distributed SQL, overkill for config/state |
| **Turso (SQLite)** | 9 GB storage, 500 databases, 1B row reads/month | If you prefer SQLite at the edge |

### Recommendation
**Neon** as primary database — true serverless Postgres, 0.5 GB free forever (plenty for config/state), supports `pgvector` extension for embeddings. **Do not rely on Render Postgres free tier** as it expires after 30 days.

### Strategy for Minimal DB Usage
- Store only config, user preferences, system state, and signal metadata
- Push all public content to AT Protocol/Bluesky
- Use Redis/KV for ephemeral caches and queues
- 0.5 GB Neon is ~500K rows of typical config data — more than enough

---

## 4. Redis / Queue Service (Signal Intake Pipeline)

| Service | Free Tier Limits | Best For |
|---------|-----------------|----------|
| **Upstash Redis** ⭐ | 256 MB data, 500K commands/month, 10 GB bandwidth | **Primary recommendation** — serverless, scale-to-zero, REST API |
| **Upstash QStash** ⭐ | 1,000 messages/day, 10 active schedules, 50 GB bandwidth | **Message queue + cron scheduler** — perfect for signal intake pipeline |
| **Render Key Value** | Free: 25 MB RAM, 50 connections | Already in stack, tiny but usable for basic caching |
| **Aiven Valkey** (Redis-compatible) | Free plan: 1 CPU, 1 GB RAM | Good Redis alternative |
| **Cloudflare Queues** | 1M operations/month | If using CF Workers ecosystem |
| **NATS (Synadia)** | 4K msg size, 50 active connections, 5 GB data/month | Lightweight pub/sub |

### Recommendation
**Upstash Redis** for caching + **Upstash QStash** for the message queue / scheduled signal intake pipeline. QStash's 1,000 messages/day with 10 schedules is perfect for periodic news signal collection. Render Key Value (25 MB free) works for simple KV caching alongside.

---

## 5. Vector Database / Search (Embeddings / Semantic Clustering)

| Service | Free Tier Limits | Best For |
|---------|-----------------|----------|
| **Upstash Vector** ⭐ | 200M vectors×dimensions, 10K daily queries/updates, 1 GB data/metadata, 100 namespaces | **Primary recommendation** — same platform as Redis/QStash, serverless |
| **Neon pgvector** ⭐ | Included with Neon free Postgres (0.5 GB total) | **Zero additional service** — run vector search in your existing Postgres |
| **Nile** | Unlimited vector embeddings in free tier | Built into Postgres, no extra service |
| **Pinecone** | 2 GB storage, ~1M vectors (1536-dim), limited namespaces | Popular but separate service to manage |
| **Tinybird** | 10 GB storage + 1K API requests/day (ClickHouse-based) | Analytics-focused, not pure vector |

### Recommendation
Start with **Neon pgvector** (zero additional services — use your Postgres for vector search). If query volume or vector count grows beyond what 0.5 GB can handle, add **Upstash Vector** (keeps you in the Upstash ecosystem). This avoids adding another vendor until needed.

---

## 6. Cron / Scheduled Jobs (Periodic Signal Collection)

| Service | Free Tier Limits | Best For |
|---------|-----------------|----------|
| **Upstash QStash** ⭐ | 10 active schedules, 1,000 messages/day | **Already recommended above** — doubles as cron + queue |
| **cron-job.org** | Unlimited cron jobs, free | Simple HTTP endpoint pinging |
| **Cloudflare Workers Cron Triggers** | Included with Workers free tier (100K requests/day) | If using CF Workers |
| **Render Cron Jobs** | From $1/month minimum (not free) | Already in stack but not free |
| **Northflank** | 2 cron jobs free | Alternative PaaS |
| **Pipedream** | Integration platform, free tier for workflows | Complex multi-step automations |
| **healthchecks.io** | 20 free checks | Cron monitoring (not execution) |

### Recommendation
**Upstash QStash schedules** for primary cron (you're already using it for queues). Supplement with **cron-job.org** for simple keep-alive pings to Render free services. If you adopt Cloudflare Workers, use their **Cron Triggers** instead.

---

## 7. AT Protocol / Bluesky Considerations

- **Public data stays on AT Protocol** — no database cost for posts, feeds, social graph
- **Bluesky PDS** is free for individual accounts; custom feeds via feed generators
- **Feed Generator** can run as a Render free web service or Cloudflare Worker
- **Jetstream/Firehose** for real-time signal intake — process via your queue pipeline
- **No storage cost** for content published to AT Protocol — the network stores it
- **Lexicon schemas** define your data structures on-protocol at zero cost
- Strategy: Only store signal metadata, processing state, and user config in your DB; all "content" lives on AT Protocol

---

## 8. Recommended Architecture Stack

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Render Static Site (or Cloudflare Pages)            │
│  React app with animated risk clocks                 │
│  Cost: $0                                            │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                 API GATEWAY                           │
│  Render Free Web Service (Node.js)                   │
│  512 MB RAM, 0.1 CPU                                 │
│  Cost: $0                                            │
└──────┬───────────────┬──────────────────────────────┘
       │               │
┌──────▼───────┐ ┌─────▼─────────────────────────────┐
│ SIGNAL       │ │ DATA LAYER                          │
│ INTAKE       │ │                                     │
│              │ │ Neon Postgres     — config/state     │
│ Upstash      │ │   + pgvector      — embeddings      │
│ QStash       │ │   0.5 GB free                       │
│ (queue +     │ │                                     │
│  cron)       │ │ Upstash Redis    — cache/sessions   │
│ 1K msg/day   │ │   256 MB, 500K cmd/mo               │
│ 10 schedules │ │                                     │
│              │ │ Upstash Vector   — if needed later   │
│ Cost: $0     │ │   10K queries/day                    │
└──────┬───────┘ │                                     │
       │         │ Cost: $0                             │
       │         └─────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────┐
│              SIGNAL PROCESSORS                        │
│  Render Free Web Services (1-3 microservices)        │
│  - News RSS collector                                │
│  - Bluesky firehose listener                         │
│  - Embedding/clustering worker                       │
│  Cost: $0                                            │
└──────┬──────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────┐
│            AT PROTOCOL / BLUESKY                     │
│  Public data published to Bluesky                    │
│  Feed generator for custom news feeds                │
│  Cost: $0 (network stores content)                   │
└─────────────────────────────────────────────────────┘
```

---

## 9. Total Estimated Resource Envelope

| Resource | Service | Free Limit | Expected Usage |
|----------|---------|-----------|----------------|
| Frontend hosting | Render Static | Unlimited | 1 static site |
| API services | Render Web (free) | 512 MB × N instances | 2-3 microservices |
| Database | Neon Postgres | 0.5 GB storage | ~50-100 MB (config/state) |
| Vector search | Neon pgvector | Shared with above | ~100-200 MB embeddings |
| Redis cache | Upstash Redis | 256 MB, 500K cmd/mo | ~50 MB cache |
| Message queue | Upstash QStash | 1K msg/day, 10 schedules | ~200-500 msg/day |
| Render KV (backup cache) | Render Key Value | 25 MB, 50 connections | Light caching |
| Cron keepalive | cron-job.org | Unlimited | 2-3 ping jobs |
| Content storage | AT Protocol | Unlimited (network) | All public content |
| **Total monthly cost** | | | **$0** |

---

## 10. Strategies for Staying Within Free Tier Limits

### Compute
1. **Microservice decomposition** — Each Render free service gets 512 MB RAM; split workloads so each fits
2. **Cold start mitigation** — Use cron-job.org to ping critical services every 14 min to prevent Render spin-down
3. **Edge offload** — Move lightweight API endpoints to Cloudflare Workers (100K req/day) if Render free limits are hit
4. **Batch processing** — Collect signals in QStash queue, process in batches to minimize active compute time

### Storage
5. **AT Protocol as primary storage** — All public news data, analysis, and feed content lives on Bluesky (zero DB cost)
6. **Ephemeral data in Redis** — Set TTLs aggressively; don't persist what can be recomputed
7. **Postgres only for state** — Config, user prefs, signal metadata, processing checkpoints
8. **pgvector for embeddings** — Avoid a separate vector DB until you outgrow 0.5 GB

### Queue/Messaging
9. **QStash batching** — Aggregate multiple signals into single messages to stay under 1K/day
10. **Schedule consolidation** — Use fewer schedules that handle multiple signal sources per run
11. **Fan-out at the edge** — If using CF Workers, fan out from a single cron trigger

### Monitoring
12. **healthchecks.io** (20 free checks) to monitor your cron jobs
13. **Better Stack** free tier (10 monitors) for uptime monitoring
14. **Render built-in metrics** for service health (7-day log retention on free tier)

### Growth Path (When You Outgrow Free Tiers)
- **Render Starter** web service: $7/month (512 MB, 0.5 CPU, no spin-down)
- **Neon Launch plan**: ~$19/month (10 GB storage, more compute)
- **Upstash Pay-as-you-go Redis**: $0.2/100K commands (scales gradually)
- **Cloudflare Workers Paid**: $5/month (10M requests)

---

## 11. Services Cross-Reference Summary

| Category | Primary (Free) | Backup/Supplement (Free) | Paid Upgrade Path |
|----------|----------------|--------------------------|-------------------|
| Frontend | Render Static | Cloudflare Pages | Render Starter |
| Backend API | Render Web Service | Cloudflare Workers | Render Starter ($7/mo) |
| Database | Neon Postgres | Nile (1 GB free) | Neon Launch ($19/mo) |
| Vector Search | Neon pgvector | Upstash Vector (10K/day) | Upstash PAYG ($0.4/100K) |
| Redis/Cache | Upstash Redis | Render Key Value (25 MB) | Upstash PAYG ($0.2/100K) |
| Queue | Upstash QStash | Cloudflare Queues (1M ops) | QStash PAYG ($1/100K) |
| Cron | Upstash QStash schedules | cron-job.org (unlimited) | Render Cron ($1/mo) |
| Content Store | AT Protocol/Bluesky | — | — |
| Monitoring | Render built-in | healthchecks.io (20 checks) | Better Stack paid |

---

*Research date: 2026-03-12*
*Sources: [free-for-dev](https://github.com/ripienaar/free-for-dev), render.com/pricing, upstash.com/pricing, neon.com/pricing*
