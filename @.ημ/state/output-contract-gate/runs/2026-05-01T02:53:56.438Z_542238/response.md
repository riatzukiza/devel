## Signal

(己, p=0.98) Done. SFT export row construction and manifest shaping now live in CLJS `translation-core`.

New exports:

```ts
sftRow(input)
manifestShape(input)
```

Updated route:

```text
src/routes/v1/translations.ts
```

Commits:

- OpenPlanner nested repo: `390f5d7 feat: move translation exports to cljs core`
- Parent repo submodule pointer: `c4a29841 chore: advance openplanner translation export cljs`

## Evidence

(己, p=0.96) Added CLJS business rules for SFT rows:

```text
sftRow:
  source_lang + target_lang + source_text -> prompt
  corrected_text if present -> target
  else translated_text -> target
```

Prompt construction now lives in CLJS:

```text
Translate the following text from <source> to <target>.
Preserve formatting, technical terms, and code examples.

Text:
<source_text>
```

(己, p=0.95) Added CLJS manifest shaping:

```text
languages:
  total_segments
  approved
  rejected
  pending
  in_review
  with_corrections
  avg_labels_per_segment

export_sizes:
  sft_<lang>:
    rows = approved
    bytes_estimate = approved * 500

labelers:
  email
  segments_labeled
```

(己, p=0.94) TypeScript still owns the correct runtime parts:

```text
Mongo aggregations
correction counting queries
labeler aggregation queries
generated_at timestamp
NDJSON response headers
```

(己, p=0.97) Verification passed:

```text
pnpm --filter @open-hax/openplanner-translation-core test
Ran 5 tests containing 18 assertions.
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

Runtime smoke passed:

```text
node imported sftRow/manifestShape
verified prompt and export-size shaping
```

## Frames

(己, p=0.92) This continues the direct-to-CLJS migration path: no intermediate TypeScript refactor, just domain behavior moving into `translation-core`.

(己, p=0.89) The route is thinner now, but still large because query orchestration and route registration remain there.

(己, p=0.86) The next good extraction target is translation job planning because it is another clear “decide data shape, then persist” seam.

## Countermoves

(己, p=0.9) I did not move Mongo aggregation into CLJS.

(己, p=0.87) I did not change export API behavior intentionally; the output shape remains the same except it is now produced by CLJS helpers.

(己, p=0.84) I did not touch Knoxx.

## Next

(己, p=0.91) Move document translation job planning into `translation-core`: target language defaults, empty-document validation, and per-language job plan construction.