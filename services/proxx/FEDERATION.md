# Federation Testing

This directory supports running multiple proxx instances in a federation for local testing.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ai-infra network (Docker)                   │
│                                                                   │
│  ┌─────────────────────┐        ┌─────────────────────┐         │
│  │   Primary Proxy     │        │   Federation Peer    │         │
│  │   (proxx)           │◄──────►│   (proxx-federation) │         │
│  │                     │        │                       │         │
│  │   Port 8789         │        │   Port 8790           │         │
│  │   Web: 5174         │        │   Web: 5175           │         │
│  │   DB: 5432          │        │   DB: 5433           │         │
│  └─────────────────────┘        └─────────────────────┘         │
│           │                              │                        │
│           ▼                              ▼                        │
│  ┌─────────────────────┐        ┌─────────────────────┐         │
│  │   PostgreSQL (5432) │        │   PostgreSQL (5433) │         │
│  │   openai_proxy       │        │   federation_proxy   │         │
│  └─────────────────────┘        └─────────────────────┘         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Start both stacks (main + federation peer)
cd services/proxx
docker compose -f docker-compose.yml -f docker-compose.federation.yml up -d

# Wait for health checks
sleep 10

# Run federation setup (register peers with each other)
./bin/federation-setup.sh
```

## Environment Variables

Key federation environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `FEDERATION_SELF_NODE_ID` | `primary` / `federation-peer-1` | Unique node identifier |
| `FEDERATION_SELF_GROUP_ID` | `local-test-group` | Group ID for peer grouping |
| `FEDERATION_SELF_CLUSTER_ID` | `local-test-cluster` | Cluster ID for deployment grouping |
| `FEDERATION_SELF_PEER_DID` | (empty) | AT Protocol DID for peer identity |
| `FEDERATION_SELF_PUBLIC_BASE_URL` | `http://open-hax-federation-peer:8789` | Public URL for this peer |
| `FEDERATION_REQUEST_TIMEOUT_MS` | `30000` | Timeout for federation API calls |

## Ports

| Service | Primary | Federation |
|---------|---------|------------|
| Proxy API | 8789 | 8792 |
| Web UI | 5174 | 5175 |
| PostgreSQL | 5432 | 5433 |
| OAuth Callback | 1455 | 1456 |

## Federation API Endpoints

Once configured, you can:

- **List peers**: `GET /api/ui/federation/peers`
- **Get self info**: `GET /api/ui/federation/self`
- **Add peer**: `POST /api/ui/federation/peers`
- **List projected accounts**: `GET /api/ui/federation/accounts`
- **Sync diff events**: `GET /api/ui/federation/diff-events?afterSeq=N`

## Testing Federation

### Verify both peers are running

```bash
# Primary health
curl http://localhost:8789/health

# Federation peer health
curl http://localhost:8790/health
```

### Check federation status

```bash
# Primary's view of peers
curl -H "Authorization: Bearer $PROXY_AUTH_TOKEN" \
    http://localhost:8789/api/ui/federation/peers | jq .

# Federation peer's view of peers
curl -H "Authorization: Bearer federation-peer-token" \
    http://localhost:8790/api/ui/federation/peers | jq .
```

### Make a request through federation

```bash
# Request through primary (will route to best available account)
curl -H "Authorization: Bearer $PROXY_AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"hello"}]}' \
    http://localhost:8789/v1/chat/completions
```

## Stopping Federation

```bash
# Stop both stacks
docker compose -f docker-compose.yml -f docker-compose.federation.yml down

# Remove volumes to reset state
docker compose -f docker-compose.yml -f docker-compose.federation.yml down -v
```

## Troubleshooting

### Peers can't reach each other

Both containers share the `ai-infra` Docker network. Verify:
```bash
docker network inspect ai-infra
```

### Federation registration fails

Check the auth token matches:
- Primary uses `PROXY_AUTH_TOKEN`
- Federation peer uses `FEDERATION_PROXY_AUTH_TOKEN`

### Accounts not syncing

Federation sync happens on-demand or during credential warm-import. Check:
```bash
# Trigger account sync on primary
curl -X POST -H "Authorization: Bearer $PROXY_AUTH_TOKEN" \
    http://localhost:8789/api/ui/federation/accounts/warm-import
```