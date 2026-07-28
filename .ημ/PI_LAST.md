# Fork Tax Handoff

**Generated:** 2026-06-11T17:20:00Z  
**Branch:** feat/ci-automation-1781026522  
**Commit:** c60f8535

## Summary

Added Claude Code OAuth support for the Anthropic provider in proxx. Claude Code tokens (`sk-ant-oat01-*`) now work through the proxx proxy with proper Bearer auth and Claude Code beta headers.

## Changes

### Proxx Source (`orgs/open-hax/proxx`)
- **Commit:** 81caf5b
- `src/lib/provider-strategy/strategies/standard.ts`: Added `anthropic-version: 2023-06-01` header to MessagesProviderStrategy
- `src/proxx/strategies/anthropic.cljs`: Rewrote with `js*` for correct OAuth Bearer auth + Claude Code beta headers

### Service Configuration (`services/proxx`)
- `docker-compose.yml`: Added `ANTHROPIC_API_KEY` env var
- `policies/runtime/05-provider-seed.edn`: Added anthropic provider seed and route
- `policies/runtime/10-model-families.edn`: Added Claude model declarations
- `policies/runtime/20-provider-capabilities.edn`: Added anthropic capability and provider order

## Verification

- **claude-haiku-4-5**: Works
- **claude-sonnet-4-6**: Rate-limited (Max 20 plan)
- **claude-opus-4-6**: Not tested

## Blockers

1. Sonnet/opus models rate-limited on Max 20 plan
2. OAuth tokens expire and need periodic refresh via `claude` CLI

## Next Steps

1. Refresh OAuth token: `claude` (run CLI to refresh)
2. Update proxx credentials: `POST /api/v1/credentials/api-key`
3. Test sonnet/opus models when rate limits reset
