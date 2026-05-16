## Signal

(己, p=0.9) Rewrote Migration 1 with **HoneySQL** and made it materially more useful/safe.

What changed:

- (己, p=0.95) Added HoneySQL:
  - `com.github.seancorfield/honeysql`
  - all Proxx SQL is now generated through HoneySQL instead of string-built SQL.

- (己, p=0.9) Added structured Proxx payload matching:
  - query returns `(payload->'messages')::text`
  - Clojure parses JSON with `cheshire`
  - extracts `messages[*].content`
  - normalizes text
  - computes SHA-256 hashes

- (己, p=0.9) Added safer match classification:
  - `:sha256-exact` → redactable
  - `:normalized-contained-in-proxx-message` → redactable
  - `:proxx-message-contained-in-openplanner-text` → **reference-only**, not redactable
    - this prevents deleting larger synthesized OpenPlanner text just because it contains some text also found in Proxx

- (己, p=0.9) Added useful dry-run stats:
  - `:scanned`
  - `:matched`
  - `:redaction-candidates`
  - `:reference-only`
  - `:redacted`
  - `:no-proxx-candidates`
  - `:no-match`

- (己, p=0.85) Added `.gitignore` for `.cpcache/`.

## Evidence

(己, p=0.95) Ran the rewritten dry-run against live OpenPlanner Mongo + Proxx Postgres:

```text
migration-1: {:mode :dry-run, :limit 50, :sql :honeysql}
...
done {:scanned 50,
      :matched 11,
      :redaction-candidates 0,
      :reference-only 11,
      :redacted 0,
      :no-proxx-candidates 0,
      :no-match 39}
```

(己, p=0.9) Interpretation of this run:
- The migration found **11 real correlations** between OpenPlanner Knoxx events and Proxx request messages.
- All 11 were **reference-only**, meaning the OpenPlanner text was larger/synthesized and contained a Proxx message fragment, not a safe duplicate eligible for deletion.
- Therefore `--apply` would redact **0** in this sample, which is the correct safe behavior.

(己, p=0.9) Commits made:
- `openplanner-migration-tools`: `146ea0d` — `Rewrite migration-1 with HoneySQL and structured matching`
- `openplanner`: bumped migration-tools submodule pointer
- workspace root: `992e338b` — `Update openplanner submodule (HoneySQL migration tool)`

## Frames

(己, p=0.72) This is now a migration tool with a useful safety model: it distinguishes “can delete text” from “can attach a Proxx reference but must preserve text.”  
(己, p=0.68) The current data sample suggests many Knoxx reasoning/message events are **synthesis**, not strict duplicates. Those should become receipts/reconstructable references later, not immediate redactions.  
(世, p=0.6) Safe deletion candidates probably live in different event shapes than the most recent 50 Knoxx records—e.g. direct user/system prompt echoes, document chunks, or pi-session message imports.

## Countermoves

(己, p=0.75) Don’t run `--apply` until we see nonzero `:redaction-candidates`; the current rewrite makes `--apply` safe, but the sample says there’s nothing eligible to delete yet.  
(己, p=0.7) The next useful improvement is to widen the target event kinds and/or add a mode that writes **reference-only receipts** without deleting text.

## Next

(己, p=0.85) Extend Migration 1 with a `--write-references` mode that records Proxx references for `reference-only` matches without redacting text.