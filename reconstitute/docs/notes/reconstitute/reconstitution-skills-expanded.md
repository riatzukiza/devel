#reconstitute #opencode #recovery #cephalon-clj

From your screenshots, your local OpenCode data dir has **three goldmines**:

* `~/.local/share/opencode/storage/…` — session metadata, messages, parts, session diffs, etc
* `~/.local/share/opencode/tool-output/…` — tool outputs (often diffs / file lists / logs)
* `~/.local/share/opencode/snapshot/<id>/…` — **bare git repos** (this is the “oh wow” one; you can often recover *actual source* here with `git archive`)

So the “best” reconstitution flow is:

1. **Snapshot-first restore** (if possible): extract matching snapshots → you might get your lost guard-rails code back *verbatim*.
2. **Evidence dump**: scan `storage/**` + `tool-output/**` for `cephalon-clj` and write an NDJSON + Obsidian-friendly markdown.
3. **Per-file dossiers**: infer file paths from evidence and write a markdown doc per file under `.reconstituted/cephalon-clj/files/…`.
4. (Optional) **LLM phase**: feed those dossiers to a coding agent to regenerate missing files.

---

## A working MVP program (no jq, no opencode export, no chroma)

I made you a **dependency-free Node script** that does steps **2 + 3**, and can optionally do step **1** via `git archive`.

### Download

* [recover-offline.mjs](sandbox:/mnt/data/recover-offline.mjs)
* [recover-offline.zip](sandbox:/mnt/data/recover-offline.zip)

### Run it

```bash
# basic: scan storage + tool-output
node recover-offline.mjs \
  --needle cephalon-clj \
  --workspace ~/devel

# include snapshot extraction (recommended)
node recover-offline.mjs \
  --needle cephalon-clj \
  --workspace ~/devel \
  --extract-snapshots
```

### What it writes

By default it outputs to: `.reconstituted/<needle>/` (so `.reconstituted/cephalon-clj/`)

* `dump.ndjson` — one record per matched blob (easy to post-process)
* `dump.md` — readable evidence dump (good in Obsidian)
* `files/_index.md` — index of inferred file paths
* `files/<path>.md` — evidence grouped by file path hints
* `snapshots/<id>/…` — extracted snapshot trees *(only if `--extract-snapshots`)*

---

## Why your `jq` approach blew up

That `jq: parse error: Unfinished JSON term at EOF` usually means the thing you piped into `jq` was **not a single valid JSON document** (common causes: JSONL output, progress/log lines mixed into stdout, or streaming output cut mid-object).

This offline approach sidesteps that entire class of failure by scanning the **local persisted artifacts directly**.

---

## Guard rails if you later let qwen tool-call during reconstitution

If/when you add a “tool-using reconstitution agent”, the safest pattern I’ve found is:

* Tools: `search_evidence`, `read_evidence`, `write_file`, `append_file`, `list_files`
* Hard rule: writes **only** under `.reconstituted/…`
* Hard caps: max bytes per file, max files, max tool calls per run
* Two-phase:

  1. **deterministic extraction** (the script above)
  2. **generative reconstruction** (agent consumes dossiers, produces code)

This keeps the “LLM is deleting stuff again” problem from infecting the recovery process itself.

---

If you run the snapshot extraction and it produces a plausible tree, the fastest next step is usually:

```bash
rg -n "guard" .reconstituted/cephalon-clj/snapshots
rg -n "policy|tool" .reconstituted/cephalon-clj/snapshots
```

…then you can point OpenCode/Codex at `files/_index.md` and say: “recreate these sources from the evidence docs; do not delete anything.”
