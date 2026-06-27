# eros-eris-field-app

A tiny **layout microservice** that nudges `devel-graph-weaver` nodes around using:

- Barnes–Hut N-body repulsion (quadtree)
- structural springs (imports/refs/etc)
- **semantic charge** based on embeddings (`qwen3-embedding:0.6b` via Ollama)

Myth name rationale:
- **Eros** pulls similar things together
- **Eris** pushes dissimilar things apart


> Built with [GLM-5](https://z.ai) — part of the [z.ai](https://z.ai) startup ecosystem and the [Ussyverse](https://ussy.cloud).

## Run (docker)

```bash
docker compose -f orgs/octave-commons/eros-eris-field-app/compose.yaml up
```

Defaults assume:
- GraphQL: `http://127.0.0.1:8796/graphql`
- embeddings endpoint: `http://127.0.0.1:11434`

## Env (high signal)

- `GRAPHQL_URL` (default: `http://127.0.0.1:8796/graphql`)
- `GRAPHQL_ADMIN_TOKEN` (optional) – forwarded as `Authorization: Bearer ...`
- `OLLAMA_URL` (default: `http://127.0.0.1:11434`) – any Ollama-compatible `/api/embeddings` endpoint, including Proxx native embeddings mode
- `OLLAMA_AUTH_TOKEN` (optional) – bearer token for authenticated embedding gateways such as Proxx
- `OLLAMA_MODEL` (default: `qwen3-embedding:0.6b`)

- `SIM_MAX_NODES` (default: `6000`)
- `SIM_MAX_EDGES` (default: `12000`)
- `SIM_STEP_MS` (default: `5000`)
- `SIM_REFRESH_MS` (default: `30000`)
- `SIM_WRITE_MS` (default: `15000`)

- `SEMANTIC_ATTRACT_ABOVE` (default: `0.78`)
- `SEMANTIC_REPEL_BELOW` (default: `0.22`)

- `TARGET_RADIUS` (default: `5000`) — soft circular boundary radius
- `BOUNDARY_THICKNESS` (default: `650`) — thickness of the boundary-pressure band
- `BOUNDARY_PRESSURE` (default: `240`) — inward pressure strength near the boundary

## Notes

This service writes positions back to `devel-graph-weaver` via the GraphQL mutation:

- `layoutUpsertPositions(inputs: [NodePositionInput!]!): Int!`

Positions are stored in `node.data.pos = { x, y }` (overlay), so they survive rescan/weave rebuilds.
