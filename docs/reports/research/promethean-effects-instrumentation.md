# Promethean Effects Instrumentation Research

## Summary
- Mature ecosystems solve cross-cutting side-effect instrumentation with **layered hooks**: language-level telemetry collectors (OpenTelemetry), framework-level interceptors (NestJS, Temporal), and persistence middleware (Prisma, TypeORM). These provide reusable entry points without forcing every call site to wrap itself manually[^otel][^nest-interceptors][^temporal][^prisma][^typeorm].
- Rather than deleting `@promethean-os/effects`, Promethean can replace its no-op wrapper with a thin adapter that ties into existing hooks (e.g., OpenTelemetry spans + Prisma/TypeORM events) and publishes enriched metadata to the Promethean event bus. Doing so prevents duplicated instrumentation logic, leverages standardized context propagation, and maintains the option to emit domain events via a CQRS-style pipeline when needed[^nest-cqrs].
- Decision criteria: if Promethean only needs structured logging/metrics, adopt OpenTelemetry end-to-end and delete the package. If Promethean still needs a single bus-aware entry point, reimplement `@promethean-os/effects` as a decorator/proxy that delegates to OpenTelemetry + ORM middlewares and enforces invariants before emitting events.

## Methodology
1. **Repository scan**: confirmed `@promethean-os/effects` is referenced in Promethean package manifests but currently implemented as a no-op helper.
2. **External research**: reviewed instrumentation patterns in leading Node.js/TypeScript stacks (OpenTelemetry JS SDK, Temporal TypeScript SDK, NestJS interceptors & CQRS module, Prisma Client middleware, TypeORM listeners/subscribers) to understand how they centralize side effects and propagate metadata across transports.
3. **Synthesis**: extracted recurring approaches (decorator/interceptor layers, workflow interceptors, ORM middleware, telemetry collectors) and mapped them to Promethean needs (DB + REST effects that should publish metadata on a bus, enforce invariants, and optionally span processes).

## Comparable Patterns & Libraries

| Pattern | Example & Capabilities | Applicability to Promethean |
| --- | --- | --- |
| **Telemetry Collector + Context Propagation** | OpenTelemetry JS SDK supports auto instrumentation for HTTP, DB clients, metrics, traces, and logs; requires initializing `NodeSDK`, registering tracers/meters, and can export via OTLP/console. Manual instrumentation can wrap any span, add attributes/events, and propagate trace context across async boundaries[^otel]. | Drop-in way to capture every REST/DB call. Promethean can configure `@promethean-os/effects` to start spans, attach domain metadata, and emit to current logging/metrics sinks while still calling downstream clients. Provides standardized context and multi-process linkage the team originally wanted from the package. |
| **Workflow/Worker Interceptors** | Temporal TypeScript SDK exposes `telemetryOptions`, OpenTelemetry interceptors, and workflow/activity log sinks. Interceptors wrap calls before/after execution across retries and propagate tracing headers via protobuf message headers between workers and clients[^temporal]. | Demonstrates cross-process effect instrumentation. Promethean could emulate this by adding worker-level interceptors (e.g., queue consumers, background jobs) that automatically publish metadata whenever `@promethean-os/effects` touches a remote system. |
| **HTTP/Controller Interceptors (AOP)** | NestJS interceptors implement `intercept()` to run logic before/after handlers, transform responses/exceptions, or short-circuit with cached data, inspired by aspect-oriented programming. They can be scoped per controller/method or global[^nest-interceptors]. | Shows how to build decorator/proxy helpers instead of no-op wrappers. Promethean services that already use NestJS can register an interceptor that invokes the new `effects` helper, ensuring every REST handler or outbound call is instrumented uniformly without code churn. |
| **CQRS & Event Bus Decorators** | NestJS CQRS module splits commands/queries/events, with buses that publish events and sagas that react asynchronously; handlers can return typed payloads and the EventPublisher can merge context into aggregates[^nest-cqrs]. | Provides a blueprint for Promethean's metadata bus: `@promethean-os/effects` can emit domain events that downstream projectors consume (similar to existing `projectors` package). If Promethean wants to enforce invariants before emitting to the bus, a command handler could call the effect helper, verify invariants, then publish events. |
| **ORM-level Middleware** | Prisma Client middleware (deprecated in v6.14 but replaced by query extensions) allows per-query hooks via `prisma.$use`, enabling logging, validation, soft deletes, and rewriting operations. Middlewares wrap every DB action and can short-circuit or augment params/results[^prisma]. TypeORM entity listeners/subscribers provide before/after hooks for inserts, updates, deletes, recoveries, and transaction events[^typeorm]. | Promethean DB-heavy services can rely on these built-in hooks rather than custom wrappers. The `effects` helper can expose shared Prisma/TypeORM middleware that captures the query context, attaches tenant/session metadata, and publishes structured events without requiring each repository to call a decorator explicitly. |

## Trade-offs & Design Considerations

| Option | Pros | Cons |
| --- | --- | --- |
| **Delete package, adopt OpenTelemetry + existing framework hooks** | Simplifies surface area, rely entirely on industry-standard instrumentation; minimal maintenance; tools like Temporal, NestJS, Prisma already expose hook points[^otel][^temporal][^prisma]. | Lose single choke point for custom metadata/invariant enforcement; requires every team to configure instrumentation correctly; Promethean-specific bus integration must be reimplemented per service. |
| **Re-implement `@promethean-os/effects` as thin decorator/proxy over OpenTelemetry + ORM interceptors** | Keeps a canonical helper for adding Promethean metadata (correlation IDs, access policies) while leveraging proven telemetry stacks; can expose decorators (`withEffectSpan(fn, metadata)`) that open spans, call downstream client, then publish events; easier to enforce invariants centrally. | Slightly more maintenance; must ensure helper stays synchronized with underlying telemetry frameworks and does not block event loops; teams must adopt helper consistently (but can enforce via lint rules). |
| **Grow package into CQRS/event-sourcing framework** | Solves metadata bus + invariants holistically, aligning with NestJS CQRS patterns and Promethean projectors[^nest-cqrs]. Could emit events for auditing/legal requirements. | Higher complexity: requires modelling commands/events, idempotency, and storage. Might duplicate existing Promethean infrastructure if the projectors already cover event sourcing. |

## Recommendations for Promethean
1. **Adopt OpenTelemetry as the base instrumentation layer.** Configure the monorepo's runtime entry points (services, workers, CLI tools) to initialize the Node SDK, register auto-instrumentations for HTTP/DB clients, and export spans/metrics to Prometheus/OTLP collectors. Use manual spans inside high-value helpers (LLM calls, DB transactions) to capture custom attributes.
2. **Recast `@promethean-os/effects` as a shim, not a framework.** Provide a small API such as:
   - `instrumentEffect('db', metadata, fn)` → starts an OpenTelemetry span, attaches metadata (service, tenant, actor), invokes `fn`, publishes a structured event to the existing metadata bus, and optionally enforces invariants (timeouts, payload size) before returning.
   - Decorators for NestJS/Temporal contexts (e.g., `@InstrumentEffect('rest')`) that automatically wrap controller methods or worker activities, borrowing from NestJS interceptor patterns and Temporal interceptors.
   - Prisma/TypeORM middleware registrations exported from the package so services can opt-in by importing once per ORM instance; the middleware calls the shared instrumentation helper for every query.
3. **Integrate with Promethean's event/projector system via CQRS semantics.** Where invariants matter (e.g., compliance logging), wrap effect calls in commands/handlers inspired by NestJS CQRS: commands perform the side effect via the helper, and when successful, emit domain events onto the bus for projectors to consume.
4. **Document migration path.** Provide usage examples and codemods that replace direct no-op wrappers with the new helper/decorators. Where teams already use OpenTelemetry, make the helper optional so they can call instrumentation primitives directly.

## Next Steps
1. **Spike:** Create a prototype `instrumentEffect` helper that:
   - initializes an OpenTelemetry span;
   - logs metadata to console/exporter;
   - publishes a mock event payload.
2. **Middleware integration:** Build sample Prisma and TypeORM middleware that call the helper during `before/after` hooks and attach query info.
3. **Framework adapters:** Implement a NestJS interceptor and a Temporal activity interceptor that call the helper automatically; document registration steps.
4. **Decision checkpoint:** After prototyping, decide whether to keep the package (with new helper) or delete and rely entirely on direct instrumentation. Criteria: ease of adoption, invariant enforcement needs, overlap with existing logging bus.

---

[^otel]: [OpenTelemetry JavaScript instrumentation docs](https://opentelemetry.io/docs/languages/js/instrumentation/) — explains initializing the Node SDK, acquiring tracers/meters, creating spans, and propagating context across HTTP/DB operations.
[^temporal]: [Temporal TypeScript Observability](https://docs.temporal.io/develop/typescript/observability) — details worker telemetry options, OpenTelemetry interceptors, and workflow/activity logging sinks that propagate tracing headers between processes.
[^nest-interceptors]: [NestJS Interceptors](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/interceptors.md) — describes aspect-oriented interceptors that wrap controller logic before/after execution, transform responses, cache, enforce timeouts, or handle errors globally.
[^nest-cqrs]: [NestJS CQRS Recipe](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/recipes/cqrs.md) — outlines command/query/event separation, buses, sagas, and event publishers for system-wide effect orchestration.
[^prisma]: [Prisma Client Middleware reference](https://www.prisma.io/docs/concepts/components/prisma-client/middleware) — covers `$use` hooks for query lifecycle, logging, validation, and soft-delete behaviours across all DB calls.
[^typeorm]: [TypeORM Entity Listeners & Subscribers](https://typeorm.io/docs/advanced-topics/listeners-and-subscribers/) — enumerates lifecycle hooks (before/after insert/update/remove/recover) and subscribers for transaction-aware instrumentation.
