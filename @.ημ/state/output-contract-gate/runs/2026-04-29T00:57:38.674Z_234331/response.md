## Signal

(己, p=0.95) Done. I ran the destructive batch:

```bash
clj -M:run --migration migration-2 --apply --limit 10
```

Result:

```text
done {:scanned 10,
      :eligible 10,
      :events-redacted 10,
      :chunks-redacted 10,
      :missing-source-ref 0}
```

(己, p=0.95) Then I verified the database state directly in Mongo:

```text
events_redacted: 10
chunks_redacted: 10
```

## Evidence

(己, p=0.9) The 10 redacted OpenPlanner source documents were KMS-ingested source files under:

```text
orgs/ussyverse/warp/crates/onboarding/src/slides/...
```

(己, p=0.9) Verified one sample event now has:

```js
text: ""
extra.migration_2: {
  text_redacted: true,
  text_redaction_reason: "source_text_rehydrate_from_source_reference",
  text_hash_sha256: "353efcf4...",
  text_length: 61975,
  source_path: "orgs/ussyverse/warp/crates/onboarding/src/slides/agent_slide.rs",
  lake: "devel",
  source_content_hash: "353efcf4..."
}
```

(己, p=0.9) Matching `event_chunks` rows for those 10 parent ids were also redacted:
- `text: ""`
- `source_text_redacted: true`
- `source_ref` retained

## Frames

(己, p=0.75) This confirms the migration does the intended thing: it removes duplicated raw source text while preserving enough metadata to rehydrate from source.  
(己, p=0.7) The embeddings remain present; only the stored chunk text was removed.  
(世, p=0.6) This is a good small proof batch before scaling up.

## Countermoves

(己, p=0.78) Before a large batch, we should add one more safety improvement: write an append-only migration receipt collection (`migration_receipts`) so each redaction has an auditable record outside the mutated event itself.  
(己, p=0.72) Also worth adding `--kind` / `--source` / `--path-prefix` filters before broad apply, so we can migrate by lake/path family rather than blindly newest-first.

## Next

(己, p=0.86) Add a `migration_receipts` write path, then run the next apply batch with `--limit 100`.