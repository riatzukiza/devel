# Threat Radar MCP

MCP control plane and REST API for the threat-radar platform — a news intelligence system that expresses nuance, preserves user agency, and resists mental model collapse.

Collects signals from Bluesky and Reddit, normalizes and clusters them into threads, reduces assessment packets into live snapshots, and exposes everything via 10 MCP tools plus a REST API.

## Setup

### Prerequisites

- Node.js ≥ 20, pnpm
- PostgreSQL 15+ (optional — falls back to in-memory storage)

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `9001` | HTTP listen port |
| `DATABASE_URL` | — | Postgres connection string |
| `ADMIN_AUTH_KEY` | — | Bearer token for write endpoints |
| `ALLOW_UNAUTH_LOCAL` | `false` | Skip auth for loopback requests |

### Install & Build

```bash
pnpm install
pnpm --filter @workspace/radar-core build
pnpm --filter @workspace/mcp-foundation build
pnpm --filter @riatzukiza/threat-radar-mcp build
```

## Run

```bash
# Development (tsx, auto-loads .env)
pnpm --filter @riatzukiza/threat-radar-mcp dev

# Production
pnpm --filter @riatzukiza/threat-radar-mcp start
```

Listens on `http://0.0.0.0:9001` by default.

## MCP Tools

| Tool | Description |
|---|---|
| `radar_create` | Create a new threat radar from a template |
| `radar_list` | List current threat radars with stats |
| `radar_add_source` | Attach a typed source definition to a radar |
| `radar_submit_packet` | Submit a structured assessment packet |
| `radar_reduce_live` | Produce the current live reduced snapshot |
| `radar_seal_daily_snapshot` | Seal an immutable daily snapshot |
| `radar_get_audit_log` | Get audit events for a radar |
| `radar_collect_bluesky` | Collect signals from Bluesky public feeds |
| `radar_collect_reddit` | Collect signals from Reddit subreddits |
| `radar_cluster_signals` | Cluster signals into threads via TF-IDF similarity |

MCP endpoint: `POST /mcp` (Streamable HTTP transport)

## REST API

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Health check |
| `GET` | `/api/radars` | No | List all radars |
| `POST` | `/api/radars` | Admin | Create a radar |
| `POST` | `/api/submit-packet` | Admin | Submit assessment packet |
| `POST` | `/api/reduce-live/:radarId` | Admin | Reduce live snapshot |
| `GET` | `/api/federation/status` | No | Federation node status |
| `GET` | `/api/federation/peers` | No | List federation peers |
| `POST` | `/api/federation/receive` | No | Receive federated data |
| `POST` | `/api/federation/peers` | Admin | Add federation peer |
| `DELETE` | `/api/federation/peers/:peerId` | Admin | Remove federation peer |
| `POST` | `/api/federation/trust/:peerId` | Admin | Trust a peer |
| `DELETE` | `/api/federation/trust/:peerId` | Admin | Untrust a peer |
| `POST` | `/api/federation/broadcast` | Admin | Broadcast to peers |

## Tests

```bash
pnpm --filter @riatzukiza/threat-radar-mcp test
```

## License

GPL-3.0-only
