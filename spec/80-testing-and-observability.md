# MCP Migration Spec — Testing and Observability

## Gateway contract tests
Add/extend tests in `services/api-gateway/src/tests`:
- proxy smoke test for `/api/mcp/:service/mcp` (session init)
- streaming support (SSE) sanity check
- `mcp-session-id` roundtrip
- unknown service returns 404

## Service-level smoke tests
Each `services/mcp-*` should have:
- `GET /health` returns ok
- `POST /mcp` to list tools / initialize session works
- at least one tool invocation works

## Tool parity tests
For each tool family:
- snapshot the tool list and schemas from legacy monolith
- compare to new service output

## Observability
- Gateway logs:
  - upstream target URL (redacted auth)
  - status, latency
  - token exchange enhanced logs (already present)

- Services:
  - correlation id passthrough (`x-request-id` if present)
  - structured logs per tool invocation

## Rollout
- Route services one-by-one behind the mux.
- Monitor error rates and latency.
- Keep legacy route as fallback until parity confirmed.

