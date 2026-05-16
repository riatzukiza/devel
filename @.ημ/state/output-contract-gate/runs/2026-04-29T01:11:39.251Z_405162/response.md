## Signal

(己, p=0.92) Done. I shifted the fix to the ClojureScript boundary like you asked: pure transformations + cache protocol live in a new CLJS package, and TypeScript only does route/I/O glue.

New package:

```text
orgs/open-hax/openplanner/packages/stores/document-hydration
```

Package name:

```text
@open-hax/openplanner-document-hydration
```

It owns the pure layer between Mongo rows and HTTP route outputs:

- detects redacted document rows
- derives source refs and cache keys
- hydrates a row with externally loaded source text
- converts hydrated rows into the public document API shape
- exposes a cache protocol and an in-memory LRU implementation from CLJS

Updated TS endpoints:

- `src/routes/v1/documents.ts`
- `src/routes/v1/cms.ts`

The TS now:
1. receives Mongo rows
2. asks CLJS whether hydration is needed
3. loads source text from filesystem if needed
4. uses the CLJS cache protocol wrapper
5. passes hydrated rows back through CLJS `rowToDocument`

## Evidence

(己, p=0.9) Built successfully:

```bash
pnpm build
```

This now runs:

```bash
pnpm --filter @open-hax/openplanner-document-hydration build && tsc
```

(己, p=0.9) Direct runtime smoke test succeeded:

```bash
node --input-type=module -e "import {documentNeedsHydration, hydrateDocumentRow, ...} from '@open-hax/openplanner-document-hydration'; ..."
```

Confirmed:
- redacted row returns `documentNeedsHydration(row) === true`
- `hydrateDocumentRow(row, "hello").row.text === "hello"`
- CLJS memory LRU `cachePut/cacheGet` works
- `rowToDocument(...).content === "hello"`

(己, p=0.9) Committed:

- OpenPlanner submodule commit:
  - `dd2807d` — `Add CLJS document hydration boundary`

- Workspace root commit:
  - `4d710f2c` — `Update openplanner submodule (CLJS document hydration)`

## Frames

(己, p=0.78) This sets the precedent: schema-sensitive transformations move into CLJS first; TS remains the shell for HTTP and Node I/O.  
(己, p=0.72) This does not yet implement Redis/LMDB drivers, but it establishes the protocol seam and one concrete LRU cache implementation in CLJS.  
(己, p=0.65) Source text hydration is currently filesystem-backed; URL hydration and durable cache layers can now be added behind the same CLJS transformation contract.

## Countermoves

(己, p=0.75) I did not try to rewrite all document route logic at once; that would be too much churn. I only moved the pure transformation/caching boundary.  
(己, p=0.7) OpenPlanner still shows unrelated local state:
- dirty `packages/agents/knoxx`
- untracked `docs/notes/...`
Those were preserved and not staged.

## Next

(己, p=0.86) Add CLJS Redis + LMDB cache drivers behind the same `CacheStore` protocol, then swap the current in-memory LRU for a layered cache: Redis hot → LMDB warm → source rehydrate.