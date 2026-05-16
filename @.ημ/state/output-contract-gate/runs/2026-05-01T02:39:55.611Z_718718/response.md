## Signal

(己, p=0.98) Agreed, and done: I extracted translation business logic directly into ClojureScript instead of doing an intermediate TypeScript cleanup.

New package:

```text
packages/translations/translation-core
```

Exports:

```ts
nextSegmentStatus(...)
documentOverallStatus(...)
summarizeSegments(...)
normalizeTranslationSegment(...)
translationGraphMemoryPlan(...)
```

Wired into:

```text
src/routes/v1/translations.ts
```

Commits:

- OpenPlanner nested repo: `4c7d72c feat: extract translation domain logic to cljs`
- Parent repo submodule pointer: `35bb4d62 chore: advance openplanner translation cljs core`

## Evidence

(己, p=0.96) New CLJS files:

```text
packages/translations/translation-core/src/openplanner/translations/core.cljs
packages/translations/translation-core/src/openplanner/translations/boundary.cljs
packages/translations/translation-core/test/openplanner/translations/core_test.cljs
packages/translations/translation-core/shadow-cljs.edn
packages/translations/translation-core/index.d.ts
packages/translations/translation-core/package.json
```

(己, p=0.94) Business logic moved to CLJS:

- label overall → segment status:
  - `approve` → `approved`
  - `needs_edit` + corrected text → `approved`
  - `needs_edit` without correction → `in_review`
  - `reject` → `rejected`

- document aggregate status:
  - `fully_approved`
  - `fully_rejected`
  - `pending_review`
  - `partial_review`
  - `mixed`

- segment summary counts:
  - total
  - approved
  - pending
  - rejected
  - in_review
  - overall status

- segment normalization/validation:
  - source/target/document fields
  - languages
  - segment index
  - optional metadata
  - required-field errors

- graph memory upsert planning:
  - translation example node
  - document → translation edge
  - no Mongo writes inside CLJS; pure plan only

(己, p=0.97) Verification passed:

```text
pnpm --filter @open-hax/openplanner-translation-core test
Ran 4 tests containing 14 assertions.
0 failures, 0 errors.
```

```text
pnpm --filter @open-hax/openplanner-translation-core build
0 warnings
```

```text
pnpm exec tsc --noEmit --pretty false
passed
```

```text
pnpm build
passed
```

```text
node imported @open-hax/openplanner-translation-core
nextSegmentStatus/summarizeSegments smoke passed
```

```text
pnpm test:integration:edge-claims
3 tests passed
```

## Frames

(己, p=0.93) This matches the better migration path: move stable domain decisions into CLJS now, leave HTTP/Mongo orchestration in TypeScript until later slices.

(己, p=0.9) `translations.ts` is still large, but it now delegates a real cluster of business rules to ClojureScript.

(己, p=0.87) The package mirrors the graph-claim pattern: pure `core.cljs`, JS-facing `boundary.cljs`, ESM exports, TypeScript declarations, and package-local CLJS tests.

## Countermoves

(己, p=0.9) I did not rewrite the whole translation route.

(己, p=0.87) I did not move Mongo queries into CLJS; that stays in TS runtime boundary for now.

(己, p=0.84) I avoided a broad TypeScript “cleanup” pass; the slice is domain extraction only.

## Next

(己, p=0.91) Extract the next translation rule cluster directly into `translation-core`: export/SFT prompt construction and manifest aggregation shaping.