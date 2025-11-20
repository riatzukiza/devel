# Spec: Promethean Effects Instrumentation Research

## Context
- Package under review: `@promethean-os/effects` (currently a no-op wrapper around side effects in the Promethean monorepo)
- Goal: determine whether to delete the package or replace it with a smaller helper that instruments side-effectful functions (DB calls, REST calls, etc.) and publishes metadata/events

## Files & References
- `docs/reports/research/promethean-effects-instrumentation.md` (new) — final research deliverable with findings and recommendations
- Supporting references gathered from:
  - OpenTelemetry JS instrumentation docs (https://opentelemetry.io/docs/languages/js/instrumentation/)
  - Temporal TypeScript observability + interceptors (https://docs.temporal.io/develop/typescript/observability)
  - NestJS interceptors and CQRS recipes (https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/interceptors.md, https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/recipes/cqrs.md)
  - Prisma Client middleware (https://www.prisma.io/docs/concepts/components/prisma-client/middleware)
  - TypeORM entity listeners & subscribers (https://typeorm.io/docs/advanced-topics/listeners-and-subscribers/)

## Existing Issues / PRs
- None referenced yet; research output may identify follow-up issues for implementation options.

## Requirements
1. Survey comparable approaches in large TypeScript/Node.js or polyglot monorepos for capturing side effects centrally (instrumentation, middleware, decorators, proxies, CQRS/event-sourcing, etc.)
2. Highlight libraries, frameworks, or design patterns that wrap DB/network effects and emit metadata/events/logs across processes
3. Extract trade-offs: integration complexity, overhead, ecosystem fit for Promethean, cross-process propagation capabilities
4. Outline implementation guidance for Promethean (e.g., evaluate keeping package vs. smaller helper, layering on top of existing logging/telemetry infrastructure)
5. Document methodology, sources, findings, and recommendations in `docs/reports/research/promethean-effects-instrumentation.md`

## Definition of Done
- Research file created with structured sections (summary, methodology, key patterns/libraries, trade-offs, recommendations, next steps)
- References cited inline for each external source used
- Clear mapping from external patterns to Promethean context (how each option could inform redesign of `@promethean-os/effects`)
- Suggested decision criteria for delete vs. replacement path and any follow-up implementation spikes
