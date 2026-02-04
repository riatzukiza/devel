# RabbitMQ Messaging Consolidation

## Problem Statement
- Promethean currently maintains several overlapping messaging/effects packages — e.g. `@promethean-os/broker` (a custom WebSocket/Redis broker)
and `@promethean-os/event`/`@promethean-os/event-hooks-plugin`/`@promethean-os/effects` — yet the implementations are mostly placeholders or
bespoke wrappers. For example, the broker README describes a custom JSON protocol over WebSockets/Redis
(`orgs/riatzukiza/promethean/packages/broker/README.md:3-47`), while the effects package still returns plain objects with no
instrumentation (`orgs/riatzukiza/promethean/packages/effects/src/mongo.ts:1-9`). Maintaining these parallel stacks causes churn and
fragmentation whenever teams need to emit events or tap into global side effects.
- Pantheon and other agent subsystems already expect a configurable "messageBus" adapter that can target RabbitMQ, Redis, or
in-memory implementations (`orgs/riatzukiza/promethean/docs/packages/pantheon/integration-guide.md:1688-1732`). Instead of hand-rolling
additional brokers, we should standardize on RabbitMQ (AMQP) and expose a single package that wraps an npm RabbitMQ client for publishing,
subscribing, RPC, and event instrumentation.
- Tooling already provisions RabbitMQ alongside other messaging infrastructure
(see `orgs/riatzukiza/promethean/infrastructure/compose/kitchen-sink.yml:408-428`), so consolidating onto RabbitMQ reduces tech sprawl and
lets us leverage mature features (durable exchanges, routing keys, DLQs).
- Prior research captured in `docs/reports/research/promethean-effects-instrumentation.md` advocates turning `@promethean-os/effects` into
a thin instrumentation layer (decorators/interceptors) instead of a monolithic wrapper. Combining that insight with a RabbitMQ-backed bus
gives us a single place to emit events, traces, and cross-process notifications without duplicating code.

## Scope & Affected Components
- Packages slated for consolidation: `@promethean-os/broker`, `@promethean-os/event`, `@promethean-os/event-hooks-plugin`, `@promethean-os/effects`, plus any bespoke message-bus helpers inside Pantheon, `@promethean-os/opencode-client`, and related adapters.
- Consumer surface areas to audit: agent orchestration (Pantheon), plugin hooks, Discord/indexer services pulling from effects, and infrastructure scripts that talk to the broker/event packages.
- New work will live in a single package (working name `@promethean-os/messaging` or similar) that exposes:
- a RabbitMQ connection manager (AMQP URL, TLS, reconnection)
- typed publish/subscribe helpers (exchanges, queues, routing keys, dead-letter policies)
- request/response (RPC) utilities for tool invocations or workflows
- instrumentation/decorator APIs so any side effect can emit structured events without bespoke wrappers
- integration hooks for Pantheon message bus adapters, Event Hooks Plugin, and effect decorators.

## Current Implementation Audit
- `@promethean-os/broker` is a standalone WebSocket/Redis broker that handles subscribe/publish/enqueue actions entirely in-process and proxies queue work via `queueManager` (`orgs/riatzukiza/promethean/packages/broker/index.js:1-198`). There is no AMQP support, and routing happens via WebSocket topics stored in memory, so it cannot provide persistence or multi-tenant exchanges.
- `@promethean-os/event` defines a typed EventBus abstraction but only ships functional/in-memory adapters plus a MongoDB persistence shim that subclasses the in-memory bus (`orgs/riatzukiza/promethean/packages/event/src/memory.ts:1-83`, `mongo.ts:1-68`, `outbox.ts:1-26`). There is no message broker integration, so publish/subscribe remain process local.
- `@promethean-os/event-hooks-plugin` re-exports the client plugin dynamically from `@promethean-os/opencode-client` and offers no direct instrumentation or bus bindings to tie plugin hooks into RabbitMQ (`orgs/riatzukiza/promethean/packages/event-hooks-plugin/src/index.ts:5-12`).
- `@promethean-os/effects` exports placeholder helpers for REST/HTTP/DB calls that just echo arguments, confirming instrumentation is stubbed with no transports or telemetry (`orgs/riatzukiza/promethean/packages/effects/src/rest.ts:1-77`, `mongo.ts:1-9`).

## Related Work Tracking
- The migration backlog already calls out `Migrate @promethean-os/broker to ClojureScript` (`orgs/riatzukiza/promethean/docs/agile/tasks/Migrate @promethean broker to ClojureScript.md:3-24`), underscoring that the current implementation is a temporary scaffold and reinforcing the need for a consolidated RabbitMQ package.
- Pantheon integration docs require adapters to accept `messageBus.type` values of `redis | rabbitmq | in-memory` and load URIs from env vars, so the spec must ensure the RabbitMQ implementation can satisfy those ports without downstream code changes (`orgs/riatzukiza/promethean/docs/packages/pantheon/integration-guide.md:1688-1764`).

## Requirements
1. **Select RabbitMQ client & topology**
- Use a well-supported npm client `amqplib` with connection pooling, channel reuse, and confirm-mode publishing.
- Define opinionated exchange/queue naming conventions, dead-letter exchanges, and retry policies that work for
multi-tenant Promethean deployments (consider namespaces from the Pantheon config).
2. **Design unified package API surface**
- Provide a small core API (e.g., `createRabbitContext(config)`, `publish(event)`, `subscribe(binding, handler)`, `request(queue, payload)`),
plus decorator helpers for instrumentation (tying into the recommendations from
`docs/reports/research/promethean-effects-instrumentation.md:15-47`).
3. **Migration plan for legacy packages**
- Catalog current exports from `@promethean-os/broker`, `@promethean-os/event`, `@promethean-os/event-hooks-plugin`, and `@promethean-os/effects`
and map each to the new package (e.g., deprecate WebSocket broker endpoints, replace event hook registries with RabbitMQ subscriptions).
- Document shims or compatibility layers required during the transition so downstream packages keep functioning while migrations land incrementally.
4. **Pantheon + Agent tooling integration**
- Update Pantheon’s message bus adapters/ports (`orgs/riatzukiza/promethean/docs/packages/pantheon/integration-guide.md:1688-1750`) to
treat RabbitMQ as the default implementation, including schemas for config (`MESSAGE_BUS_TYPE=rabbitmq`, `MESSAGE_BUS_URI`).
- Ensure validation tests (e.g., `orgs/riatzukiza/promethean/packages/pantheon/src/validation-test.ts:82-90`) and orchestrator
docs keep working with the new bus.
5. **Infrastructure + DevEx alignment**
- Confirm docker-compose stacks (`orgs/riatzukiza/promethean/docker-compose.yml:3-11`) expose the correct ports/credentials.
- Provide local dev scripts (maybe via `pnpm` or `bun`) that spin up RabbitMQ, run smoke tests, and seed exchanges.
6. **Documentation & governance**
- Update package READMEs and higher-level docs (Pantheon guides, package graphs) to describe the new RabbitMQ-based bus and retire
references to the legacy broker/effects placeholders.
- Capture best practices: tracing, monitoring, dead-letter handling, schema validation, idempotency, tenancy boundaries.

## Proposed RabbitMQ Package (initial milestone)
- **Directory layout**: create `orgs/riatzukiza/promethean/packages/messaging/` with `src/connection.ts`, `src/context.ts`, `src/pantheon-adapter.ts`, `src/instrumentation.ts`, and `src/index.ts` so each concern (connection pooling vs. high-level helpers) remains testable.
- **Connection manager**: `createRabbitConnectionManager(config: RabbitConnectionConfig)` wraps `amqplib` connections, tracks a confirm channel, handles `close/error` events, and performs bounded exponential backoff reconnects while emitting instrumentation callbacks.
- **Core context API**: `createRabbitContext()` returns `{ publish, subscribe, request, respond, close }` where `publish` accepts `EventRecord`-compatible payloads, `subscribe` binds durable queues/exchanges with DLX defaults, and RPC helpers rely on reply queues plus correlation IDs.
- **Pantheon adapter**: export `createRabbitMessageBus` implementing the Pantheon `MessageBus` port by mapping `bus.send` → topic exchange publish and `bus.subscribe` → queue consumer (auto-provisioned per actor system) so the orchestrator can switch to RabbitMQ without touching core actors (`orgs/riatzukiza/promethean/packages/pantheon/core/src/core/adapters.ts:123-164`).
- **Instrumentation hooks**: `instrumentation.ts` exposes a small contract (`onPublish`, `onDelivery`, `onRetry`, `onError`) used by both effects decorators and Pantheon to attach metrics/traces, linking back to the recommendations in `docs/reports/research/promethean-effects-instrumentation.md:33-47`.
- **Configuration sources**: `config.ts` maps env vars (`MESSAGE_BUS_URI`, `MESSAGE_BUS_PREFETCH`, `MESSAGE_BUS_NAMESPACE`) into strongly typed settings shared between Pantheon, CLI tools, and tests.

## Definition of Done
- Architectural design settled for the consolidated package (API surface, connection lifecycle, instrumentation strategy) with alignment
from stakeholders (agents, Pantheon, plugin ecosystems).
- Prototype implementation demonstrating RabbitMQ publish/subscribe plus instrumentation decorators, validated end-to-end via a sample
consumer/producer or Pantheon validation harness.
- Migration plan documented (including deprecated packages, codemods, or wrappers) with clear sequencing.
- Documentation updates drafted for affected packages (README, Pantheon guides, infrastructure notes) so teams know how to configure the RabbitMQ bus.
- Spec reviewed/approved as the source of truth before implementation begins.
