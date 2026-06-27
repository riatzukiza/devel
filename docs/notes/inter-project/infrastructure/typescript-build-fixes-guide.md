## 1) **Blocking: bad project reference / missing path**

```
packages/pipelines/symdocs build: tsconfig.json(11,18): TS6053: File '.../packages/pipelines/level-cache' not found.
```

**What’s wrong**
Your `packages/pipelines/symdocs/tsconfig.json` references a package/folder that doesn’t exist.

**Fix options (pick one):**

* If the package lives elsewhere (e.g. `packages/level-cache`), fix the *relative* path.
* If the package was removed/renamed, delete the reference.
* If it’s an npm workspace package, prefer referencing the package folder (relative path), not an absolute path.

**Patch (example – adjust to your actual layout):**

```diff
--- a/packages/pipelines/symdocs/tsconfig.json
+++ b/packages/pipelines/symdocs/tsconfig.json
@@
   "references": [
-    { "path": "../level-cache" }
+    // If the real package is packages/level-cache:
+    { "path": "../../level-cache" }
+    // OR if it no longer exists, remove the reference line entirely.
   ]
```

Rebuild `@promethean-os/symdocs` after this change.

---

## 2) **Syntax errors (must fix before type errors)**

```
packages/pipelines/boardrev:
  src/01-ensure-fm.ts(76,55): TS1005: ')' expected.
  src/04-enhanced-context.ts(391,35): TS1005: ',' expected.
  src/04-enhanced-context.ts(391,39): TS1002: Unterminated string literal.
  ...
```

**What’s wrong**
There are unmatched parentheses/commas or a missing string quote.

**How to fix quickly**
Open those files and repair the obvious typos at the listed lines. Example patterns I see often:

```ts
// Unterminated string
const note = "enhanced context: " + ctx  // <- missing closing quote or + value

// Missing paren/comma around an object literal param
fnCall({
  a: 1,
  b: 2  // <- add trailing comma if more args follow
}, moreArgs) // <- ensure this closing paren exists
```

Once these compile, a large chunk of downstream noise usually clears.

---

## 3) **Missing modules / wrong import paths**

```
packages/discord:
  Cannot find module '@promethean-os/migrations/chroma.js' ...
  Cannot find module '@promethean-os/migrations/embedder.js' ...
```

**What’s wrong**
TypeScript can’t resolve those files with the `.js` suffix or those paths don’t exist.

**Fix**

* If these files exist but are TypeScript, import without the extension:

  ```diff
  - import { CHROMA_MIGRATION } from '@promethean-os/migrations/chroma.js'
  + import { CHROMA_MIGRATION } from '@promethean-os/migrations/chroma'
  ```
* If they truly don’t exist, either add them or point to the generated output (e.g. `dist/...`) or the correct package.

Also ensure your repo-wide `tsconfig.base.json` (or per package) uses a modern resolver:

```jsonc
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

---

## 4) **Luxon types not found (UI packages)**

```
packages/pantheon/ui & pantheon/ui:
  TS7016: Could not find a declaration file for module 'luxon'.
```

**Why this happens**
Luxon ships its own types, but certain resolvers or import styles can confuse TS.

**Quick fixes (any one of these works):**

1. Install types anyway (harmless):

```bash
pnpm -w add -D @types/luxon
```

2. Ensure you import from the package root:

```ts
import { DateTime } from 'luxon'; // ✅
```

3. As a last resort, add a local shim:

```ts
// packages/pantheon/ui/src/types/luxon.d.ts
declare module 'luxon';
```

---

## 5) **LitElement: require `override` modifier**

```
TS4114: This member must have an 'override' modifier...
```

**Fix**
Add `override` on any method/property that overrides a base member (`render`, `connectedCallback`, `createRenderRoot`, etc.):

```diff
- connectedCallback() {
+ override connectedCallback() {
   super.connectedCallback();
}
```

Do this in:

* `packages/pantheon/ui/src/components/agent-card.ts` (two members per your log)
* `packages/pantheon/ui/src/components/agent-list.ts` (two members)

If you prefer to relax the rule, you can set `"noImplicitOverride": false` in the package `tsconfig`, but I recommend fixing the code.

---

## 6) **“Declared but never used” (TS6133/TS6196)**

You have many of these (e.g., `EventBus`, `HookRegistry`, `context`, `defaultHandler`, etc.)

**Best patterns**

* If it’s an *import only used for types*: use a type‑only import.

  ```diff
  ```
* import { EventBus, HookRegistry } from './types';

- import type { EventBus, HookRegistry } from './types';

  ```
  ```

* If it’s a parameter or property you must keep: prefix with `_` to signal intentional unused.

  ```diff
  ```
* constructor(private context: SandboxContext) {}

- constructor(private _context: SandboxContext) {}

  ```
  ```

* If it was genuinely unused: remove it.

If you want to reduce noise (not my first choice), set per‑package:

```json
"compilerOptions": {
  "noUnusedLocals": false,
  "noUnusedParameters": false
}
```

---

## 7) **Unsafe generic conversion (TS2352)**

```
packages/plugin-hooks/src/sdk/plugin-sdk.ts(227,17)
Conversion of type '{ [key]: T[K]; }' to 'Partial<T>' ...
```

**Fix (safe and idiomatic for narrow “patch” objects):**

```diff
- const patch: Partial<T> = { [key]: value };
+ const patch = { [key]: value } as unknown as Partial<T>;
```

Or make the mapped type explicit if you control the generics:

```ts
type Patch<T> = Partial<Record<keyof T, T[keyof T]>>;
const patch = { [key]: value } as unknown as Patch<T>;
```

---

## 8) **Sandbox `require` type (TS2739)**

```
Type '(id: string) => any' is missing properties from type 'Require': cache, extensions, main, resolve
```

**Cause**
You typed a `require`-like function as `NodeJS.Require` but only provided a function.

**Fix (NodeNext ESM):**

```ts
// packages/plugin-hooks/src/security/plugin-sandbox.ts
import { createRequire } from 'node:module';

const sandboxRequire: NodeJS.Require = createRequire(import.meta.url);

// Use `sandboxRequire(...)` instead of a plain `(id)=>any`
```

**If CJS:**

```ts
const sandboxRequire = require as NodeJS.Require;
```

Make sure any field access like `require.resolve` is available on the object you expose.

---

## 9) **Missing property on a Stats-like interface (TS2339: `pluginStats`)**

```
Property 'pluginStats' does not exist on type '{ activeSandboxes: number; totalViolations: number; violationsByType: Record<ViolationType, number>; }'.
```

**Fix**
Either *stop* referring to `pluginStats` or extend the type:

```diff
-type Metrics = {
+type Metrics = {
  activeSandboxes: number;
  totalViolations: number;
  violationsByType: Record<ViolationType, number>;
+ pluginStats?: Record<string, { violations: number; lastSeen?: Date }>;
}
```

…and guard before use:

```ts
this.metrics.pluginStats ??= {};
this.metrics.pluginStats[pluginId] ??= { violations: 0 };
this.metrics.pluginStats[pluginId].violations++;
```

---

## 10) **`security-manager.ts`: wrong target type + possible undefined (TS2322/TS2532)**

```
Type 'SecurityViolation' is not assignable to type 'Record<string, unknown>'.
Object is possibly 'undefined'.
```

**Fix**

* Don’t assign a domain type to a `Record<string, unknown>` slot—make the slot `SecurityViolation` (or `unknown`) instead.
* Add runtime guards:

```ts
// Type: prefer specific domain types
let lastViolation: SecurityViolation | undefined;

// Access: guard first
if (lastViolation) {
  writer.log(lastViolation.code);
}
```

Or:

```ts
writer.log(lastViolation?.code);
```

---

## 11) **`opencode-unified` CLI: stray properties & wrong method**

```
invalidProperty does not exist in 'Partial<ClientConfig>'
getNonExistentMethod does not exist on 'OpenCodeClient'
```

**Fix**

* Remove `invalidProperty` from the object literal.
* Call a *real* method (replace with the intended one, e.g., `client.getProject()` / `client.run()`).

Example:

```diff
- const cfg: Partial<ClientConfig> = { invalidProperty: true };
+ const cfg: Partial<ClientConfig> = {};

- client.getNonExistentMethod();
+ await client.run();
```

---

## 12) **`pantheon/ui` state-manager: assignment not assignable to `Agent` / `AgentTask`**

```
TS2322 in state-manager.ts lines ~100 and ~128
```

**Cause**
You’re assigning a partial object to a *concrete* type that has required fields.

**Fix (pick one):**

* Build a full `Agent`/`AgentTask` object with required fields.
* Change the receiving type to `Partial<Agent>` / `Partial<AgentTask>` if that’s the contract.
* Provide defaults:

```ts
const agent: Agent = {
  id: crypto.randomUUID(),
  name: input.name ?? 'Untitled',
  status: input.status ?? 'idle',
  type: input.type ?? 'general',
  model: input.model ?? defaultModel,
  updatedAt: new Date(),
  ...input,
};
```

---

## 13) **`mcp-kanban-bridge` big cluster**

### 13a) Redeclaration & export conflicts

```
Cannot redeclare exported variable 'BridgeServer' / conflicts with exported declaration
```

You likely both `export class BridgeServer ...` **and** `export { BridgeServer }` later. Remove the extra export:

```diff
-export { BridgeServer };
```

### 13b) Definite assignment (TS2564)

```
Property 'syncEngine' has no initializer and is not definitely assigned in the constructor.
```

**Fix**
Initialize in constructor **or** use definite assignment assertion `!`:

```diff
- private syncEngine: SyncEngine;
+ private syncEngine!: SyncEngine;
```

Repeat for all flagged properties (`webhookServer`, `queue`, `storage`, …).

### 13c) `.on` doesn’t exist on `SyncEngine` / `MetricsCollector`

```
Property 'on' does not exist on type 'SyncEngine' | 'MetricsCollector'
```

You are treating these as `EventEmitter`s. Either:

* Make their interfaces extend `EventEmitter`, or
* Narrow where used:

```ts
import { EventEmitter } from 'node:events';
const engine = this.syncEngine as unknown as EventEmitter;
engine.on('taskCreated', ({ taskId, task }) => { ... });
```

Prefer the first approach: update the definitions to extend `EventEmitter` and type the events.

### 13d) Implicit `any` in handlers (TS7006/TS7031)

Add types to event payloads:

```ts
engine.on('taskCreated', ({ taskId, task }: { taskId: string; task: AgentTask }) => { ... });
```

### 13e) Method arity mismatches (TS2554)

```
Expected N arguments, but got M. (several sites)
```

These mean underlying APIs changed. Update the calls to pass the new required parameters, or adopt an options object.

Example pattern:

```diff
- queue.enqueue(task)
+ queue.enqueue(task.id, task, { priority: 'normal' })
```

(Adjust to your real function signatures.)

### 13f) String vs string‑union (TS2322)

```
Type 'string' is not assignable to type '"P0" | "P1" | "P2" | "P3"'
```

Map from free strings to the union:

```ts
const asPriority = (s: string): 'P0'|'P1'|'P2'|'P3' => {
  const normalized = s.toUpperCase();
  return (['P0','P1','P2','P3'] as const).includes(normalized as any)
    ? (normalized as 'P0'|'P1'|'P2'|'P3')
    : 'P2'; // default
};
```

### 13g) `number | undefined` to `number` (TS2322)

Use nullish coalescing default:

```ts
this.stats.totalLatency = maybeLatency ?? 0;
```

### 13h) Node‑Redis v4 typing errors

```
Cannot use namespace 'Redis' as a type.
This expression is not constructable.
```

**Cause**
`redis` v4 exports factory functions, not a `new Redis()` class.

**Fix**

```diff
- import Redis from 'redis';
- let client: Redis = new Redis(url);
+ import { createClient, type RedisClientType } from 'redis';
+ const client: RedisClientType = createClient({ url });
+ await client.connect();
```

Do similarly in `src/storage.ts`.

### 13i) Wrong param types in `simple-mcp-server.ts`

```
Argument of type 'string | undefined' is not assignable to parameter of type ...
```

Either guard or widen the function signature to accept `string | undefined`, or provide defaults:

```ts
const metadata = input?.metadata ?? {};
```

For

```
Type '"low" | "medium" | "high" | undefined' is not assignable to '"medium" | "simple" | "complex" | undefined'
```

Map user “priority” to your internal “complexity”:

```ts
const complexityMap = { low: 'simple', medium: 'medium', high: 'complex' } as const;
const complexity = input.priority ? complexityMap[input.priority] : undefined;
```

---

## 14) **General cleanup for “unused” and context params**

Where you see:

```
TS6138: Property 'context' is declared but its value is never read.
TS6133: 'context' is declared but its value is never read.
```

Rename to `_context` or remove. Example from `plugin-sandbox.ts`:

```diff
- constructor(private context: SandboxContext) {}
+ constructor(private _context: SandboxContext) {}
```

---

## 15) **Safe repo‑wide compiler nudges (optional)**

Add to **each** package `tsconfig.json` that pulls web dependencies/types you don’t control:

```jsonc
{
  "compilerOptions": {
    "skipLibCheck": true,     // ignore .d.ts in dependencies
    "exactOptionalPropertyTypes": false
  }
}
```

*(This lowers noise when third‑party types are noisy; I still recommend fixing your code rather than turning off checks for it.)*

---

## 16) Example targeted patches

Below are ready‑to‑paste diffs for the lines the log called out (adapt the paths if they differ):

### `packages/plugin-hooks/src/sdk/plugin-sdk.ts`

```diff
@@
-import { EventBus, HookRegistry } from './types';
+import type { EventBus, HookRegistry } from './types';
@@
-const patch: Partial<T> = { [key]: value };
+const patch = { [key]: value } as unknown as Partial<T>;
@@
-private context: PluginContext;
+private _context!: PluginContext; // value injected; not read here
```

### `packages/plugin-hooks/src/security/plugin-sandbox.ts`

```diff
@@
-import type { SandboxContext } from './types';
+import type { SandboxContext } from './types';
+import { createRequire } from 'node:module';
@@
- constructor(private require: (id: string) => any, private context: SandboxContext) {}
+ private readonly require: NodeJS.Require = createRequire(import.meta.url);
+ constructor(private _context: SandboxContext) {}
@@
- this.metrics.pluginStats[pluginId].violations++;
+ this.metrics.pluginStats ??= {};
+ this.metrics.pluginStats[pluginId] ??= { violations: 0 };
+ this.metrics.pluginStats[pluginId].violations++;
```

### `packages/pantheon/ui/src/components/agent-card.ts`

```diff
@@
- connectedCallback() {
+ override connectedCallback() {
   super.connectedCallback();
 }
@@
- createRenderRoot() {
+ override createRenderRoot() {
   return this;
 }
```

### `packages/mcp-kanban-bridge/src/queue.ts` (node‑redis v4)

```diff
- import Redis from 'redis';
- type Redis = Redis;
- const client = new Redis(url);
+ import { createClient, type RedisClientType } from 'redis';
+ const client: RedisClientType = createClient({ url });
+ await client.connect();
```

### `packages/discord/src/message-embedder/index.ts`

```diff
- import { CHROMA_MIGRATION } from '@promethean-os/migrations/chroma.js';
- import { EMBEDDER_MIGRATION } from '@promethean-os/migrations/embedder.js';
+ import { CHROMA_MIGRATION } from '@promethean-os/migrations/chroma';
+ import { EMBEDDER_MIGRATION } from '@promethean-os/migrations/embedder';
```

---

## 17) Rebuild order (to minimize churn)

1. `@promethean-os/boardrev` (syntax fixes)
2. `@promethean-os/symdocs` (tsconfig reference)
3. `@promethean-os/discord` (missing modules)
4. `@promethean-os/pantheon-ui` (Luxon + override)
5. `@promethean-os/plugin-hooks` (generics + sandbox types)
6. `@promethean-os/mcp-kanban-bridge` (EventEmitter, Redis, arities)
7. `@promethean-os/opencode-unified` (CLI cleanup)
8. Then run `pnpm -r build` again

---

## 18) If anything still fails

* Paste the *current* error tail (top 30–50 lines) and I’ll zero in further—once the blockers above are fixed, what remains is usually small, local mismatches (e.g., “Expected 4 arguments” will point to a specific API change we can codify).

Good luck—apply the first two sections and you should see a *big* drop in red on the next build.
