# CLJS Domain Boundaries and JS Interop

Status: draft  
Owner: OpenPlanner architecture  
Scope: ClojureScript packages in the `openplanner` workspace, especially graph, policy, runtime, and Knoxx-derived backend code.

## Decision

Split by domain and change boundary first. Inside each domain package, define explicit boundary namespaces for host/runtime/dependency interop. Hoist a boundary into a shared package only after multiple domains need the same dependency semantics.

Do not create one wrapper package per npm dependency by default.

```text
Bad by default:
  @openplanner/node-fs
  @openplanner/node-path
  @openplanner/mongodb-wrapper
  @openplanner/graphql-wrapper

Preferred:
  domain package owns pure rules
  domain package owns its boundary adapters
  shared runtime/dependency adapters exist only for reused generic semantics
```

The governing rule is:

```text
Domain packages own semantics.
Dependency adapters own interop.
Runtime namespaces own orchestration.
```

## Rationale

Knoxx already demonstrates a useful `backend.node.*` pattern: Node APIs are isolated behind CLJS-facing functions, JS arrays and objects are converted at the edge, and callers receive CLJS values or promises of CLJS values. That pattern should become a workspace convention, not a reflex to make every npm dependency its own package.

Proxx demonstrates the complementary policy-engine shape: policy loading, expression evaluation, policy execution, and routing are separated. OpenPlanner graph claim validation can reuse that architectural shape by passing normalized claim contexts into policy evaluation rather than embedding raw Mongo, HTTP, or JS objects in policy logic.

## Package and namespace template

A domain package should generally look like:

```text
packages/<area>/<domain>/
  src/openplanner/<area>/<domain>/core.cljs       ; pure domain rules
  src/openplanner/<area>/<domain>/schema.cljs     ; Malli/spec/data contracts if needed
  src/openplanner/<area>/<domain>/policy.cljs     ; policy DSL bridge if needed
  src/openplanner/<area>/<domain>/boundary.cljs   ; JS-facing conversion facade
  src/openplanner/<area>/<domain>/adapters/*.cljs ; dependency-specific adapters
  test/openplanner/<area>/<domain>/*_test.cljs
```

A package README should declare:

- domain responsibility
- pure namespaces
- boundary namespaces
- allowed side effects
- exported JS API
- future policy hooks, if any

## Boundary classes

### 1. Domain boundary

A domain boundary answers:

- What concept owns this logic?
- What invariants are true here?
- What data shape does this domain accept after normalization?

Examples:

```clojure
openplanner.graph.claims.core
openplanner.graph.claims.schema
openplanner.graph.claims.policy
openplanner.graph.claims.boundary

openplanner.graph.semantic-field.core
openplanner.graph.semantic-field.schema
openplanner.graph.semantic-field.boundary

openplanner.graph.daimoi.core
openplanner.graph.daimoi.trails
openplanner.graph.daimoi.boundary
```

Rules:

- Pure domain namespaces do not import JS packages.
- Pure domain namespaces do not inspect JS objects.
- Pure domain namespaces do not parse host dates.
- Pure domain namespaces do not handle HTTP/Mongo aliases.
- Domain policy namespaces consume normalized context maps, not raw host objects.

### 2. Adapter/dependency boundary

An adapter boundary isolates an external library, host API, or runtime dependency.

Examples:

```clojure
openplanner.runtime.node.fs
openplanner.runtime.node.path
openplanner.runtime.node.crypto

openplanner.graph.claims.adapters.mongo
openplanner.graph.semantic-field.adapters.vexx
openplanner.graph.weaver.adapters.graphql
```

Rules:

- Adapters may require npm/node modules.
- Adapters may use JS object inspection and conversion.
- Adapters must return normalized CLJS values or `Promise<normalized CLJS>` to internal callers.
- Adapters must not contain domain acceptance logic.
- Adapters must document all lossy conversions, alias normalization, and date/hash semantics.

### 3. Application/runtime boundary

A runtime boundary composes effects and wires dependencies.

Examples:

```clojure
openplanner.graph.claims.routes
openplanner.graph.semantic-field.worker
openplanner.graph.weaver.server
```

Rules:

- Runtime namespaces register routes, workers, servers, jobs, or websocket notifications.
- Runtime namespaces should be thin.
- Runtime namespaces call domain packages and adapters; they do not embed policy logic.

## Normative rules

1. Split packages by domain/change boundary first.
2. Every CLJS package should have at most one public JS boundary namespace unless complexity requires multiple explicit adapters.
3. Pure namespaces may depend only on CLJS/CLJC pure libraries and sibling pure namespaces.
4. Boundary/adapters are the only namespaces allowed to:
   - require npm/node modules
   - inspect JS objects with `aget`/`aset`/property access
   - call host date parsing or construction
   - call `js/JSON`
   - convert with `clj->js` or `js->clj`
   - normalize HTTP/Mongo field aliases
5. Boundary functions return normalized CLJS values internally or typed JS export values externally.
6. Policy DSL integration happens through normalized context maps, never raw Mongo/HTTP/JS objects.
7. Runtime route/server/worker namespaces are orchestration only.
8. Avoid generic util namespaces; helpers live by domain or adapter responsibility.
9. Namespace layout mirrors file layout.
10. Hoist dependency adapters into shared packages only when at least two domains need the same normalized semantics.

## Graph claim package recommendation

Graph claims should start as a domain-first package:

```text
packages/graph/graph-claim-core/
  src/openplanner/graph/claims/core.cljs
  src/openplanner/graph/claims/schema.cljs
  src/openplanner/graph/claims/boundary.cljs
  src/openplanner/graph/claims/policy.cljs
  src/openplanner/graph/claims/adapters/mongo.cljs
  test/openplanner/graph/claims/*_test.cljs
```

Responsibilities:

- `core.cljs`: claim status, projection, lifecycle, and domain rules.
- `schema.cljs`: claim shape, accepted status values, projection contracts, and validation helpers.
- `boundary.cljs`: JS object/date/hash/field alias conversion.
- `policy.cljs`: later bridge to Proxx-style abductive policy evaluation for accepted claims.
- `adapters/mongo.cljs`: Mongo-specific query and persistence conversion only.

Claim acceptance should flow as:

```text
raw host/dependency data
  -> boundary/adapters normalize
  -> claim context map
  -> policy filters
  -> abductive/domain strategies
  -> accept / reject / defer / supersede
```

## Shared runtime node boundary recommendation

Create a shared runtime package only if reused outside Knoxx:

```text
packages/runtime/node-boundary/
  src/openplanner/runtime/node/fs.cljs
  src/openplanner/runtime/node/path.cljs
  src/openplanner/runtime/node/crypto.cljs
```

Promotion criteria:

- A second package needs the same filesystem/path/crypto semantics.
- Knoxx semantics have stabilized enough to copy or move without broad churn.
- The shared package can expose CLJS-normalized behavior without importing Knoxx domain assumptions.

Until then, Knoxx `backend.node.*` should remain the reference implementation rather than being churned preemptively.

## Migration guidance

1. Keep existing Knoxx wrappers as reference implementation.
2. Implement new graph work with domain-first packages and explicit local boundaries.
3. When a second consumer needs the same Node semantics, create `packages/runtime/node-boundary`.
4. Move/copy stable semantics into the shared package with tests.
5. Update Knoxx only in an explicit follow-up change.

## Anti-patterns

Avoid:

- one package per JS dependency by default
- broad `util` or `common` buckets
- raw JS objects crossing into pure namespaces
- raw Mongo/HTTP field aliases crossing into policy evaluation
- route handlers that perform domain acceptance logic inline
- a single mega package such as `@open-hax/openplanner-cljs-core`

Prefer:

- coherent domain packages
- named adapter namespaces
- thin runtime orchestration
- normalized context maps for policy evaluation
- small pure functions with tests at domain boundaries
