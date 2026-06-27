# Task prompt seed builder

## Goal
Build the first normalized `task_prompts` seed artifact from existing open harmful-task and benign-complement sources.

## Scope
Initial build should consume currently open/registered sources only:
- harmbench
- advbench
- malicious-instruct
- socialharmbench
- xstest
- or-bench-hard-1k

## Why now
We already:
- audited candidate sources
- registered the first open sources in the pipeline
- added explicit intent-label handling in canonicalization

The next useful step is a real merged artifact that can seed the new promptbench dataset split between task prompts and context prompts.

## Requirements
1. Build from existing source registrations + the machine-readable source manifest.
2. Reuse fetch/canonicalize logic instead of inventing a parallel ingest stack.
3. Write a deterministic artifact under a dedicated path, separate from the main bundle.
4. Preserve per-row provenance:
   - dataset/source name
   - source license
   - seed kind / role
   - wrapper confidence
   - gated/open status
5. Emit at least:
   - `task_prompts.parquet`
   - `task_prompts.edn`
   - `manifest.edn`
6. Default selection should skip gated/unregistered sources.

## Output row shape
```clojure
{:task_id string
 :source_id string
 :canonical_hash string
 :canonical_text string
 :language string
 :intent_label string
 :harm_category string?
 :source_dataset string
 :source_license string
 :source_gated boolean
 :seed_kind string
 :seed_role string
 :wrapper_confidence string
 :priority long}
```

## Phases
### Phase 1
- add task prompt seed builder namespace
- load source manifest
- select open/registered sources
- run fetch + canonicalize in isolated build dir
- write normalized artifact

### Phase 2
- add tests for selection + normalization + output writing
- optionally add CLI entrypoint later

## Definition of done
- A reproducible merged task prompt seed artifact exists on disk.
- It includes both adversarial task seeds and benign complements.
- It can be reused as the input layer for the next promptbench dataset build.
