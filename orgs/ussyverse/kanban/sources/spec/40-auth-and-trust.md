# MCP Migration Spec — Auth and Trust Model

## Problem
`services/api-gateway` intentionally skips bearer validation for `/mcp` paths (to allow MCP resource servers to validate tokens). This means **each `services/mcp-*` service must enforce auth** unless requests are strictly internal.

## Acceptable approaches

### A) Downstream validates bearer tokens (recommended to match current gateway intent)
- All MCP services apply `requireBearerAuth` middleware.
- Tokens may be:
  - JWT (validate with JWKS)
  - opaque (validate via introspection or shared store)

### B) Gateway asserts identity (works if you harden internal trust)
- Gateway performs auth.
- Gateway forwards a signed internal identity header.
- Downstream trusts only:
  - requests from the internal network / loopback proxy
  - headers signed with shared secret / HMAC

## Practical recommendation
Start with (A) if feasible:
- Extract a tiny shared package: `packages/mcp-auth`
  - `makeBearerMiddleware({ issuerUrl, resourceMetadataUrl, requiredScopes })`
- Each `mcp-*` service uses it for `/mcp` GET/POST/DELETE.

## Local/testing bypass
Mirror the `mcp-fs-oauth` behavior:
- allow `ALLOW_UNAUTH_LOCAL=true` for loopback-only traffic
- never bypass if host is externally forwarded

## mcp-files current state
`services/mcp-files` currently runs auth-free. Before routing it through gateway in production:
- add bearer verification or gateway-assertion checks
- restrict service to internal network

