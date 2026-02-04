# RabbitMQ Messaging Consolidation – Status (2025-11-17)

## Reference
- Source requirements: `spec/rabbitmq-bus-consolidation.md:42`-`spec/rabbitmq-bus-consolidation.md:83`

## Summary
- A new `@promethean-os/messaging` package exists with connection/context/instrumentation helpers built on `amqplib`, but it is not exported anywhere else in the workspace or wired into Pantheon, effects, or legacy brokers.
- Legacy packages (`@promethean-os/broker`, `@promethean-os/event`, `@promethean-os/event-hooks-plugin`, `@promethean-os/effects`) remain untouched and continue to ship their previous in-memory/WebSocket implementations, so no migration has begun.
- Documentation, tooling, and infrastructure still refer to the pre-consolidation message bus defaults; there is no migration guide, compatibility layer, or validation harness for RabbitMQ consumers.

## Requirement Breakdown

### 1. RabbitMQ client & topology (Spec §4.1)
- ✅ `RabbitConnectionManager` wraps `amqplib` with retry/backoff, confirm-channel reuse, and prefetch controls (`orgs/riatzukiza/promethean/packages/messaging/src/connection.ts:1`).
- ⚠️ Queue/exchange provisioning happens ad hoc inside `subscribe` without creating paired DLX/DLQ resources or enforcing namespace conventions beyond inline defaults (`orgs/riatzukiza/promethean/packages/messaging/src/context.ts:171`). No helper seeds exchanges upfront as requested in the spec.

### 2. Unified package API surface (Spec §4.2 & §5 initial milestone)
- ✅ `createRabbitContext` exposes `publish`, `subscribe`, `request`, `respond`, and `close` helpers with instrumentation callbacks (`orgs/riatzukiza/promethean/packages/messaging/src/context.ts:138`).
- ⚠️ New `index.ts` and `pantheon-adapter.ts` files export `createRabbitMessageBus`, but no downstream packages import them yet, so the wider workspace still lacks a unified entrypoint despite the API existing (`orgs/riatzukiza/promethean/packages/messaging/src/index.ts:1`).
- ⚠️ No other workspace package imports `@promethean-os/messaging`; the only references are in the spec and the package’s own metadata (`orgs/riatzukiza/promethean/packages/messaging/package.json:2`).

### 3. Migration plan for legacy packages (Spec §4.3)
- ❌ `@promethean-os/broker` still hosts the in-process WebSocket/Redis broker (`orgs/riatzukiza/promethean/packages/broker/index.js:2`).
- ❌ `@promethean-os/event` only provides in-memory adapters with no RabbitMQ bindings (`orgs/riatzukiza/promethean/packages/event/src/memory.ts:2`).
- ❌ `@promethean-os/event-hooks-plugin` simply imports the client plugin dynamically and exposes no bus shims (`orgs/riatzukiza/promethean/packages/event-hooks-plugin/src/index.ts:2`).
- ❌ `@promethean-os/effects` helpers remain stubs that do not emit telemetry or call the new instrumentation hooks (`orgs/riatzukiza/promethean/packages/effects/src/mongo.ts:2`). No compatibility notes or deprecation flags are present anywhere in docs or READMEs.

### 4. Pantheon + agent tooling integration (Spec §4.4)
- ⚠️ `createRabbitMessageBus` implements the Pantheon `MessageBus` contract (routing + queues) but lives only inside `@promethean-os/messaging`, so Pantheon still ships the in-memory adapter and never instantiates the new bus (`orgs/riatzukiza/promethean/packages/messaging/src/pantheon-adapter.ts:1`).
- ❌ Pantheon’s `makeMessageBusAdapter` still uses an in-memory subscriber set and does not mention RabbitMQ (`orgs/riatzukiza/promethean/packages/pantheon/core/src/core/adapters.ts:30`).
- ❌ The integration guide still treats Redis as the only remote option and defaults to `in-memory`, with no RabbitMQ-focused configuration schema or examples (`orgs/riatzukiza/promethean/docs/packages/pantheon/integration-guide.md:1699`).

### 5. Infrastructure + DevEx alignment (Spec §4.5)
- ⚠️ `resolveRabbitConfigFromEnv` wires env vars like `MESSAGE_BUS_URI` and `MESSAGE_BUS_NAMESPACE` into the new package (`orgs/riatzukiza/promethean/packages/messaging/src/config.ts:32`), but those variables are not referenced anywhere else in the repository (verified via `rg`).
- ❌ No compose scripts, pnpm tasks, or smoke tests were added to launch RabbitMQ or validate queue provisioning; the existing `docker-compose.yml` keeps its prior services and does not seed exchanges.

### 6. Documentation & governance (Spec §4.6)
- ⚠️ The new package README now includes a usage snippet for `createRabbitMessageBus`, but still lacks migration notes or instrumentation best practices (`orgs/riatzukiza/promethean/packages/messaging/README.md:1`).
- ❌ Higher-level docs (Pantheon guides, package overviews) still describe the legacy brokers and do not reference `@promethean-os/messaging` (`orgs/riatzukiza/promethean/docs/packages/pantheon/integration-guide.md:1699`).

## Definition of Done Check (Spec §6)
- **Architectural design**: Partially satisfied—the package skeleton demonstrates a plausible API, but missing adapter/index exports prevent cross-team alignment.
- **Prototype implementation**: Publish/subscribe/RPC helpers exist but are untested and unused, so no end-to-end validation has occurred.
- **Migration plan**: Not started—no mapping from legacy exports to the new package or shims.
- **Documentation updates**: Not started beyond the short README stub; downstream guides still reference the old stacks.
- **Spec approval**: Pending—the current work does not cover the required integration hooks, infrastructure updates, or doc changes needed for sign-off.

## Recommended Next Steps
1. Finish the `@promethean-os/messaging` surface (add `index.ts`, `pantheon-adapter.ts`, config helpers, and tests) and publish usage docs.
2. Introduce shims or adapters inside `@promethean-os/broker`, `@promethean-os/event`, `@promethean-os/event-hooks-plugin`, and `@promethean-os/effects` that forward to the Rabbit context while documenting deprecations.
3. Update Pantheon’s message bus adapter plus the integration guide to default to RabbitMQ, using the new config env vars.
4. Extend infrastructure scripts/compose stacks with ready-made RabbitMQ bootstrap and smoke tests so teams can validate queue/exchange provisioning locally.
5. Produce a migration checklist and trace instrumentation plan aligned with `docs/reports/research/promethean-effects-instrumentation.md` so downstream teams know how to hook telemetry into the consolidated bus.
