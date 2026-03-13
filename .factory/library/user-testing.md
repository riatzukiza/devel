# User Testing

Testing surface, tools, resource cost classification, and validation approach.

---

## Validation Surface

### Browser (threat-radar-web dashboard)
- **Tool**: agent-browser v0.17.1
- **Syntax**: Subcommand style — `agent-browser open <url>`, `agent-browser screenshot [path]`, `agent-browser snapshot`, `agent-browser click <selector>`
- **URL**: http://localhost:9002 (Vite dev server)
- **Setup**: Start threat-radar-mcp on 9001 first, then threat-radar-web on 9002
- **Known issue**: Must set `VITE_API_URL=http://localhost:9001` for API connection

### API (threat-radar-mcp)
- **Tool**: curl
- **URL**: http://localhost:9001
- **Health**: GET /health
- **Auth**: Header `x-admin-key: <ADMIN_AUTH_KEY from .env>` for mutations
- **MCP endpoint**: POST /mcp (Streamable HTTP)

## Validation Concurrency

**Machine**: 31Gi RAM, 22 CPUs, ~12Gi available headroom
**Budget**: 70% of 12Gi = 8.4Gi

### Browser surface (agent-browser)
- Per instance: ~300MB (lightweight React app)
- Dev servers: ~200MB (Vite) + ~200MB (Express/MCP)
- 5 instances: 1.5GB + 400MB servers = 1.9GB — well within budget
- **Max concurrent validators: 5**

### API surface (curl)
- Negligible resource cost
- **Max concurrent validators: 5**

## Pre-existing Issues

- threat-radar-mcp has 1 pre-existing TS error at `src/main.ts:374` (string | string[] type mismatch)
- Packages not in pnpm-workspace.yaml — must run typecheck directly in submodule dirs until fixed

## Flow Validator Guidance: API (signal-pipeline)

**Surface**: MCP HTTP API at http://localhost:9001
**Tool**: curl
**Auth**: For MCP endpoint (POST /mcp), local requests are auto-authenticated (ALLOW_UNAUTH_LOCAL=true). For REST endpoints (/api/*), use header `x-admin-auth-key: dev-admin-key-12345`.
**MCP call format**: POST to http://localhost:9001/mcp with JSON body:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "<tool-name>",
    "arguments": { ... }
  }
}
```
**DB queries**: Use `docker exec open-hax-openai-proxy-open-hax-openai-proxy-db-1 psql -U openai_proxy -d threat_radar -c "<SQL>"` to query Postgres directly.
**Isolation**: Each flow validator should use unique radar IDs (UUIDs) and unique identifiers to avoid collisions. Do NOT delete or modify data created by other validators.

## Flow Validator Guidance: Unit Tests (signal-pipeline)

**Surface**: vitest test runner
**radar-core tests**: `cd /home/err/devel/packages/radar-core && npx vitest run`
**signal-atproto tests**: `cd /home/err/devel/packages/signal-atproto && npx vitest run`
**Isolation**: Unit tests are self-contained with no shared state concerns.

## Flow Validator Guidance: Browser (dashboard-mvp)

**Surface**: Browser — threat-radar-web dashboard at http://localhost:9002
**Tool**: agent-browser (invoke via Skill tool at start of your session for full documentation)
**URL**: http://localhost:9002
**Backend API**: http://localhost:9001 (already running, seeded with test data — 14 radars, 12 signals, 22 snapshots)

### Session naming
Each flow validator MUST use its own agent-browser session to avoid conflicts. Use the session ID provided in your prompt.

### How to use agent-browser
1. Invoke the `agent-browser` skill via the Skill tool to get full documentation
2. Open the dashboard: `agent-browser --session "<your-session>" open "http://localhost:9002"`
3. Take screenshots for evidence: `agent-browser --session "<your-session>" screenshot "/path/to/evidence/screenshot.png"`
4. Get DOM snapshot: `agent-browser --session "<your-session>" snapshot`
5. Click elements: `agent-browser --session "<your-session>" click "<selector>"`
6. Close session when done: `agent-browser --session "<your-session>" close`

### What the dashboard shows
The dashboard is a single-page React app with:
- Hero panel with ring gauges (Agency, Nuance, Critical)
- Composite stress clock with sweep hand
- Three lanes: η (Global/cyan), μ (Local/emerald), Π (Connections/fuchsia)
- Thread cards with gauges, narrative branches, source badges
- Personalization controls (sliders, toggles)
- Source firehose panel
- Action feed with time-bounded suggestions
- Critical thinking section
- Dark theme throughout

### Data seeding
The backend already has 14 test radars with live/daily snapshots and 12 signals. The dashboard fetches data via polling from http://localhost:9001/api/radars. No additional seeding should be needed for visual testing.

### Isolation rules
- DO NOT stop or restart the dev servers (port 9001, 9002)
- DO NOT modify the database directly
- Personalization tests that modify localStorage should not affect other validators since each agent-browser instance has its own browser context
- All validators are read-only against the backend API (except for personalization slider persistence which uses localStorage)

### API operations (for cross-area flow tests)
For tests that need to create radars or submit packets via MCP:
```bash
# Create radar via MCP
curl -s -X POST http://localhost:9001/mcp -H "Content-Type: application/json" -d '{
  "jsonrpc": "2.0", "id": 1,
  "method": "tools/call",
  "params": { "name": "radar_create", "arguments": { "name": "Test Radar", "slug": "test-unique-slug", "category": "test" }}
}'

# Submit assessment packet
curl -s -X POST http://localhost:9001/mcp -H "Content-Type: application/json" -d '{
  "jsonrpc": "2.0", "id": 1,
  "method": "tools/call",
  "params": { "name": "radar_submit_packet", "arguments": { "radar_id": "<id>", "model_id": "test-model", "signals": {"transit_flow": 5, "attack_tempo": 3, "insurance_availability": 2}, "branches": [{"name": "test", "support": "moderate", "triggers": ["test"]}] }}
}'
```

**Admin auth for REST**: Use the `x-admin-auth-key` header with the value from the ADMIN_AUTH_KEY env var when calling `/api/*` endpoints.

## Known Issues (dashboard-mvp round 2)

### μ Lane Category Filter Mismatch
**App.tsx localTiles filter** only accepts categories `'local'|'community'|'oss'` for routing to the μ lane. Radars with category `'technology'` (e.g., "Open Source AI Community") route to connectionTiles (Π lane) instead. Fix: add `'technology'` to localTiles category list.

### MuThreadCard Missing Per-Card Action Suggestions
MuThreadCard shows title, signal count, proximity/leverage/time-to-act indicators, leverage bar, source badges, and expandable signal details. It does NOT include per-card action suggestions. The Action Feed component (lane-level) shows action suggestions derived from branches, but they are not embedded within individual thread cards.

### Data Seeding for Dashboard Testing
To populate η/μ lanes with test data:
1. Create radars via REST: `POST /api/radars` with `x-admin-auth-key` header
2. Insert signals into DB with `radar_id` set (not NULL)
3. Submit assessment packets via `POST /api/submit-packet` (needs `thread_id`, `radar_id`, `module_version_id`, `timestamp_utc`, `model_id`, `signal_scores` with `{value, range, confidence, reason}`, `branch_assessment`)
4. Trigger `POST /api/reduce-live/:radarId` — this auto-clusters signals into threads and generates snapshots with deterministicSnapshot render_state

### Personalization Weight Dimension Names
Weight keys in personalization panel (e.g., 'geopolitical', 'infrastructure') don't exactly match radar data dimension names (e.g., 'geopolitics'). Only exact matches respond to slider changes.
