# Environment

Environment variables, external dependencies, and setup notes.

**What belongs here:** Required env vars, external API keys/services, dependency quirks, platform-specific notes.
**What does NOT belong here:** Service ports/commands (use `.factory/services.yaml`).

---

## Required Environment Variables

### threat-radar-mcp
- `PORT` — API server port (default: 10002, dev: 9001)
- `ADMIN_AUTH_KEY` — Admin auth key, min 12 chars
- `DATABASE_URL` — Postgres connection string (local: `postgres://localhost:5432/threat_radar`, cloud: Neon)
- `ALLOW_UNAUTH_LOCAL` — Allow unauthenticated local requests (dev only)
- `PUBLIC_BASE_URL` — Public URL for MCP endpoint discovery

### Bluesky / AT Protocol
- No credentials required for public search
- For authenticated list access: `BSKY_IDENTIFIER` + `BSKY_PASSWORD` (optional)

### Reddit
- No API keys needed — uses public JSON API (`reddit.com/r/*/hot.json`)
- User agent: `threat-radar-mcp/0.1.0`

## External Dependencies

- **Postgres**: Existing Docker instance on port 5432 (shared with open-hax-openai-proxy)
- **Redis**: Existing Docker instance on port 6379 (in mcp-stack, for future queueing)
- **Node.js**: v22 (via Volta)
- **pnpm**: Workspace package manager

## Cloud Deployment (Render)
- **Neon Postgres**: Free tier, 0.5GB limit — store only config/state/snapshots
- **Upstash Redis + QStash**: Free tier — cache + queue + scheduled jobs
- **AT Protocol**: All public signal data published to Bluesky (infinite, free)
