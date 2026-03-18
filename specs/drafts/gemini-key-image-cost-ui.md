# Spec Draft: Gemini key injection + image cost stats in UI

## Summary
Add GEMINI_API_KEY pass-through to the proxy container and surface image-generation cost stats in the proxy UI. Track image counts/costs in request logs, aggregate them in the usage overview, and render in the dashboard.

## Open Questions
- Final per-image pricing values for each provider (configure via IMAGE_COST_USD_DEFAULT / IMAGE_COST_USD_BY_PROVIDER).

## Risk Analysis
- **Cost accuracy**: incorrect per-image pricing could mislead usage decisions.
- **Secrets leakage**: ensure GEMINI_API_KEY is only passed via env and never committed.
- **Log compatibility**: adding new fields to request logs must remain backward compatible.

## Priority
High (billing respect requirement).

## Implementation Phases
1. **Config & container wiring**
   - Pass GEMINI_API_KEY through docker-compose environment.
   - Document new image-cost env vars in `.env.example`.
2. **Request log metrics**
   - Extend RequestLogEntry/AccountAccumulator/HourlyBucket with image count + image cost.
   - Extract image counts from image responses and update request logs.
3. **Usage overview aggregation**
   - Compute 24h image count + image cost totals.
   - Expose totals in `/api/ui/dashboard/overview` response.
4. **UI rendering**
   - Show image count + cost cards in Dashboard metrics.
   - Surface per-account image counts/costs in the Account Health table.

## Affected Files
- `services/open-hax-openai-proxy/docker-compose.yml`
- `services/open-hax-openai-proxy/.env.example`
- `services/open-hax-openai-proxy/src/lib/config.ts`
- `services/open-hax-openai-proxy/src/lib/request-log-store.ts`
- `services/open-hax-openai-proxy/src/lib/provider-strategy.ts`
- `services/open-hax-openai-proxy/src/lib/ui-routes.ts`
- `services/open-hax-openai-proxy/web/src/lib/api.ts`
- `services/open-hax-openai-proxy/web/src/pages/DashboardPage.tsx`

## Dependencies
- GEMINI API key present in host environment.
- Docker compose used for local proxy deployment.

## Existing Issues / PRs
- None known.

## Definition of Done
- GEMINI_API_KEY is passed into the proxy container without committing secrets.
- Image generation requests update request logs with image count + cost fields.
- Dashboard summary shows image count and cost for the last 24h.
- UI builds without errors.
