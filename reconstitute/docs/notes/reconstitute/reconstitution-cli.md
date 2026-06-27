#reconstitute #opencode #cephalon-clj #agent-skills

Here’s the **next layer**: skills that (1) **understand the actual OpenCode storage layout you showed**, (2) pull evidence not just from `storage/message` but also `tool-output/`, `session_diff/`, and `snapshot/`, and (3) set you up for either **handoff-to-coding-agent** *or* a **tool-guarded reconstitution agent**.

Below are **full file contents** (no diffs). Drop these alongside the pack you already started.

---

## Add these to your skills index

### `docs/agent_skills/reconstitute/_index.md` (append these links)

```md
## Expanded skills
- [[skill.inventory_opencode_data]]
- [[skill.map_projects_under_workspace]]
- [[skill.harvest_tool_output]]
- [[skill.recover_from_session_diff]]
- [[skill.snapshot_recover_targeted]]
- [[skill.semantic_expand_no_embeddings]]
- [[skill.semantic_expand_with_embeddings_optional]]
- [[skill.llm_writer_guarded_tools]]
- [[skill.run_manifest_and_hashes]]
```

---

## 1) Inventory what you actually have

### `docs/agent_skills/reconstitute/skill.inventory_opencode_data.md`

````md
#reconstitute #agent-skill #inventory #opencode

# Skill inventory_opencode_data

## Purpose
Create a concrete inventory of OpenCode data on disk so later skills can be deterministic.

This skill assumes an OpenCode home like:
- ~/.local/share/opencode
  - storage/
  - tool-output/
  - snapshot/

## Inputs
- OPENCODE_HOME (default: ~/.local/share/opencode)

## Commands

### Confirm layout
```bash
OPENCODE_HOME="${OPENCODE_HOME:-$HOME/.local/share/opencode}"

ls -la "$OPENCODE_HOME"
ls -la "$OPENCODE_HOME/storage"
ls -la "$OPENCODE_HOME/tool-output" || true
ls -la "$OPENCODE_HOME/snapshot" || true
````

### Count items by bucket (quick size signal)

```bash
OPENCODE_HOME="${OPENCODE_HOME:-$HOME/.local/share/opencode}"

for d in storage/session storage/message storage/part storage/session_diff; do
  p="$OPENCODE_HOME/$d"
  if [ -d "$p" ]; then
    echo "== $p =="
    find "$p" -type f | wc -l
    du -sh "$p" | sed 's/^/size: /'
  fi
done
```

### Sanity peek (no jq required)

```bash
OPENCODE_HOME="${OPENCODE_HOME:-$HOME/.local/share/opencode}"

# peek a couple json files safely
find "$OPENCODE_HOME/storage/session" -type f -name '*.json' | head -n 3 | while read -r f; do
  echo "---- $f ----"
  head -n 30 "$f"
done
```

## Outputs

* A list of what buckets exist
* Approx size and file counts per bucket
* Confidence on which recovery path will be richest:

  * snapshots often recover real code
  * session_diff sometimes reconstructs changes
  * tool-output often captures exact file paths and tool results

## Success criteria

* Confirm at least one of: storage/session, storage/message, snapshot exists.

````

---

## 2) Map projects under `~/devel` (no `opencode export`)

### `docs/agent_skills/reconstitute/skill.map_projects_under_workspace.md`

```md
#reconstitute #agent-skill #mapping #workspace

# Skill map_projects_under_workspace

## Purpose
Identify which OpenCode "projects" and "sessions" correspond to a workspace folder (ex: ~/devel),
without using `opencode session list` or `opencode export`.

Works by scanning OpenCode storage JSON for directory/cwd fields.

## Inputs
- WORKSPACE (default: ~/devel)
- OPENCODE_HOME (default: ~/.local/share/opencode)
- NEEDLE (default: cephalon-clj)
- OUTDIR (default: .reconstituted/<needle>)

## Commands

### Find all session files referencing workspace
```bash
WORKSPACE="${WORKSPACE:-$HOME/devel}"
OPENCODE_HOME="${OPENCODE_HOME:-$HOME/.local/share/opencode}"

mkdir -p .reconstituted/tmp
OUT=".reconstituted/tmp/sessions-under-workspace.txt"

# use grep to avoid json parsing complexity
rg -n --fixed-strings "$WORKSPACE" "$OPENCODE_HOME/storage/session" \
  | cut -d: -f1 \
  | sort -u \
  > "$OUT"

wc -l "$OUT"
head -n 20 "$OUT"
````

### Extract session ids (filename-based heuristic)

```bash
OUT=".reconstituted/tmp/sessions-under-workspace.txt"
SESS=".reconstituted/tmp/session-ids-under-workspace.txt"

cat "$OUT" \
  | sed -n 's/.*\(ses_[A-Za-z0-9]\+\).*/\1/p' \
  | sort -u \
  > "$SESS"

wc -l "$SESS"
head -n 30 "$SESS"
```

### Optional: find needle occurrences inside storage (workspace-scoped)

```bash
NEEDLE="${NEEDLE:-cephalon-clj}"
OPENCODE_HOME="${OPENCODE_HOME:-$HOME/.local/share/opencode}"

rg -n --fixed-strings "$NEEDLE" "$OPENCODE_HOME/storage" -S \
  | head -n 50
```

## Outputs

* A stable file list of session metadata referencing workspace
* A stable list of candidate session ids

## Success criteria

* Non-zero session ids for workspace
* Evidence that needle appears somewhere in storage or tool-output

````

---

## 3) Harvest tool-output (often contains the “missing path” clues)

### `docs/agent_skills/reconstitute/skill.harvest_tool_output.md`

```md
#reconstitute #agent-skill #tool-output #evidence

# Skill harvest_tool_output

## Purpose
Tool outputs often contain:
- exact file paths (e.g., filePath)
- diffs or code blocks
- tool call names + args

This skill extracts needle-matching tool outputs into `.reconstituted/<needle>/tool-output/`.

## Inputs
- NEEDLE (default: cephalon-clj)
- OPENCODE_HOME (default: ~/.local/share/opencode)
- OUTDIR (default: .reconstituted/<needle>)

## Commands

### Fast locate
```bash
NEEDLE="${NEEDLE:-cephalon-clj}"
OPENCODE_HOME="${OPENCODE_HOME:-$HOME/.local/share/opencode}"

rg -n --fixed-strings "$NEEDLE" "$OPENCODE_HOME/tool-output" -S \
  | head -n 100
````

### Copy matching tool outputs into reconstituted folder

```bash
NEEDLE="${NEEDLE:-cephalon-clj}"
OPENCODE_HOME="${OPENCODE_HOME:-$HOME/.local/share/opencode}"
OUTDIR="${OUTDIR:-.reconstituted/$NEEDLE}"

mkdir -p "$OUTDIR/tool-output/matched"

rg -l --fixed-strings "$NEEDLE" "$OPENCODE_HOME/tool-output" -S \
  | head -n 5000 \
  | while read -r f; do
      bn="$(basename "$f")"
      cp -f "$f" "$OUTDIR/tool-output/matched/$bn"
    done

find "$OUTDIR/tool-output/matched" -type f | wc -l
```

### Extract path hints from copied tool output

```bash
OUTDIR="${OUTDIR:-.reconstituted/cephalon-clj}"

rg -n "← Edit |filePath|/services/|/shared/|/docs/|cephalon-clj" \
  "$OUTDIR/tool-output/matched" -S \
  | head -n 200
```

## Outputs

* `.reconstituted/<needle>/tool-output/matched/*`
* a path-hint shortlist you can feed into dossier generation

## Success criteria

* at least one tool output file matches needle OR contains filePath markers

````

---

## 4) Recover from `storage/session_diff` (this can reconstruct *what changed*)

### `docs/agent_skills/reconstitute/skill.recover_from_session_diff.md`

```md
#reconstitute #agent-skill #session_diff #recovery

# Skill recover_from_session_diff

## Purpose
OpenCode stores session diffs under:
~/.local/share/opencode/storage/session_diff/

Those diffs frequently include:
- before/after snippets
- file path references
- patch-like content

This skill:
1) finds diffs that mention the needle
2) copies them into `.reconstituted/<needle>/session_diff/`
3) extracts path hints for dossiers

## Inputs
- NEEDLE
- OPENCODE_HOME
- OUTDIR

## Commands

### Locate diffs containing needle
```bash
NEEDLE="${NEEDLE:-cephalon-clj}"
OPENCODE_HOME="${OPENCODE_HOME:-$HOME/.local/share/opencode}"

rg -n --fixed-strings "$NEEDLE" "$OPENCODE_HOME/storage/session_diff" -S \
  | head -n 100
````

### Copy matching diffs

```bash
NEEDLE="${NEEDLE:-cephalon-clj}"
OPENCODE_HOME="${OPENCODE_HOME:-$HOME/.local/share/opencode}"
OUTDIR="${OUTDIR:-.reconstituted/$NEEDLE}"

mkdir -p "$OUTDIR/session_diff/matched"

rg -l --fixed-strings "$NEEDLE" "$OPENCODE_HOME/storage/session_diff" -S \
  | while read -r f; do
      cp -f "$f" "$OUTDIR/session_diff/matched/$(basename "$f")"
    done

find "$OUTDIR/session_diff/matched" -type f | wc -l
```

### Extract patch-ish blocks or file names

```bash
OUTDIR="${OUTDIR:-.reconstituted/cephalon-clj}"

rg -n "diff --git|\\+\\+\\+ b/|--- a/|filePath|← Edit " \
  "$OUTDIR/session_diff/matched" -S \
  | head -n 200
```

## Outputs

* `.reconstituted/<needle>/session_diff/matched/*`
* extracted file path hints to seed dossiers

## Success criteria

* any diff files copied OR at minimum a report "no needle in session_diff"

````

---

## 5) Snapshot recovery: targeted extraction (bare git repos)

### `docs/agent_skills/reconstitute/skill.snapshot_recover_targeted.md`

```md
#reconstitute #agent-skill #snapshot #git #targeted

# Skill snapshot_recover_targeted

## Purpose
Your snapshot folders are bare git repos (HEAD/objects/refs).
This skill searches snapshots for needle and extracts only matching snapshots into:
`.reconstituted/<needle>/snapshots/<id>/`

## Inputs
- NEEDLE
- OPENCODE_HOME
- OUTDIR

## Commands

### Quick verify snapshot is bare git
```bash
OPENCODE_HOME="${OPENCODE_HOME:-$HOME/.local/share/opencode}"
d="$(ls -1 "$OPENCODE_HOME/snapshot" | head -n 1)"
ls -la "$OPENCODE_HOME/snapshot/$d" | head
````

### Search + extract snapshots that contain needle

```bash
NEEDLE="${NEEDLE:-cephalon-clj}"
OPENCODE_HOME="${OPENCODE_HOME:-$HOME/.local/share/opencode}"
OUTDIR="${OUTDIR:-.reconstituted/$NEEDLE}"

mkdir -p "$OUTDIR/snapshots"

for d in "$OPENCODE_HOME/snapshot"/*; do
  [ -d "$d/objects" ] || continue

  if git --git-dir="$d" grep -q "$NEEDLE" --all-match --; then
    sid="$(basename "$d")"
    mkdir -p "$OUTDIR/snapshots/$sid"
    if git --git-dir="$d" rev-parse --verify HEAD >/dev/null 2>&1; then
      git --git-dir="$d" archive --format=tar HEAD \
        | tar -x -C "$OUTDIR/snapshots/$sid"
      echo "extracted $sid"
    else
      echo "snapshot $sid has no HEAD"
    fi
  fi
done
```

### Post-extract triage

```bash
OUTDIR="${OUTDIR:-.reconstituted/cephalon-clj}"

rg -n "$NEEDLE" "$OUTDIR/snapshots" -S | head -n 200
rg -n "guard|policy|append_file|write_file|tool" "$OUTDIR/snapshots" -S | head -n 200
```

## Outputs

* `.reconstituted/<needle>/snapshots/<id>/**` (real files)

## Success criteria

* At least one extracted snapshot OR explicit "no matches"

````

---

## 6) Semantic expansion without embeddings (safe, fast)

### `docs/agent_skills/reconstitute/skill.semantic_expand_no_embeddings.md`

```md
#reconstitute #agent-skill #semantic #no-embeddings

# Skill semantic_expand_no_embeddings

## Purpose
Expand beyond direct needle matches using deterministic heuristics:
- include neighbor evidence around matched sessions
- include files referenced by matched tool outputs / diffs
- include messages that mention the same file paths even without the needle

This avoids chroma and avoids LLM.

## Inputs
- OUTDIR (.reconstituted/<needle>)
- OPENCODE_HOME

## Commands

### Build a path-hint list from all extracted evidence
```bash
OUTDIR="${OUTDIR:-.reconstituted/cephalon-clj}"

mkdir -p "$OUTDIR/derived"
HINTS="$OUTDIR/derived/path-hints.txt"

rg -o "/[A-Za-z0-9_./-]+\\.(ts|tsx|js|jsx|clj|cljs|cljc|edn|md|json|yml|yaml|toml)" \
  "$OUTDIR" -S \
  | sort -u \
  > "$HINTS"

wc -l "$HINTS"
head -n 50 "$HINTS"
````

### Pull extra evidence from OpenCode storage based on those hints

```bash
OPENCODE_HOME="${OPENCODE_HOME:-$HOME/.local/share/opencode}"
OUTDIR="${OUTDIR:-.reconstituted/cephalon-clj}"
HINTS="$OUTDIR/derived/path-hints.txt"
EXTRA="$OUTDIR/derived/extra-evidence.txt"

rm -f "$EXTRA"
touch "$EXTRA"

# sample up to 200 hints to keep it quick
head -n 200 "$HINTS" | while read -r p; do
  rg -n --fixed-strings "$p" "$OPENCODE_HOME/storage" -S \
    | head -n 20 >> "$EXTRA" || true
done

wc -l "$EXTRA"
head -n 60 "$EXTRA"
```

### Create a “semantic expansion” dossier

```bash
OUTDIR="${OUTDIR:-.reconstituted/cephalon-clj}"
cat > "$OUTDIR/files/semantic-expansion.md" << 'EOF'
#reconstitute #semantic-expansion #cephalon-clj

# Semantic expansion notes

This file collects non-needle evidence that is likely related due to shared file paths and tool output references.

- Source: derived/extra-evidence.txt
- Next step: promote strong path groups into per-file dossiers.
EOF

sed -n '1,400p' "$OUTDIR/derived/extra-evidence.txt" >> "$OUTDIR/files/semantic-expansion.md"
```

## Outputs

* derived/path-hints.txt
* derived/extra-evidence.txt
* files/semantic-expansion.md

## Success criteria

* expansion evidence includes file paths you care about
* you can identify dossiers that should exist but don’t yet

````

---

## 7) Semantic expansion with embeddings (optional, later)

### `docs/agent_skills/reconstitute/skill.semantic_expand_with_embeddings_optional.md`

```md
#reconstitute #agent-skill #semantic #embeddings #optional

# Skill semantic_expand_with_embeddings_optional

## Purpose
Use embeddings to expand beyond literal string matches:
- query for "guard rails", "tool policy", "append_file", "reconstitution"
- cluster messages by similarity
- enrich dossiers with top-k related evidence

Only do this after deterministic recovery is done.

## Inputs
- dump.ndjson
- (optional) chroma / sqlite / leveldb index

## Minimal plan
1) Convert dump.ndjson -> documents with ids
2) Embed each document
3) Store (chroma or local index)
4) Query seed phrases and add results to dossiers

## Guardrails
- Embeddings step must be read-only with respect to source
- Writes only under `.reconstituted/**`

## Commands (placeholder)
This is intentionally a stub until you decide where embeddings live.
- If you want Chroma: run it and index dump.ndjson
- If you want local: store vectors in sqlite/duckdb

## Output
- `.reconstituted/<needle>/derived/semantic-results.ndjson`
- dossiers updated with similarity references
````

---

## 8) Tool-guarded LLM writer (the “safe qwen mode”)

### `docs/agent_skills/reconstitute/skill.llm_writer_guarded_tools.md`

````md
#reconstitute #agent-skill #llm #guarded-tools

# Skill llm_writer_guarded_tools

## Purpose
Let an LLM improve dossiers / generate reconstructed docs
WITHOUT allowing it to damage anything.

This skill defines:
- allowed tools
- write boundaries
- required citations back to evidence ids

## Allowed tools (minimal)
1) search_dump(query) -> returns excerpts + message ids
2) read_doc(path) -> reads .reconstituted/** only
3) append_doc(path, markdown) -> writes .reconstituted/** only
4) write_doc(path, markdown) -> writes .reconstituted/** only, no overwrite unless allowed

## Policy rules
- deny delete
- deny overwrite by default
- deny paths outside `.reconstituted/**`
- require "Evidence" section with ids in every generated doc

## Example tool schema (json)
```json
{
  "tools": [
    {
      "name": "search_dump",
      "args": { "query": "string", "k": "number" }
    },
    {
      "name": "read_doc",
      "args": { "path": "string" }
    },
    {
      "name": "write_doc",
      "args": { "path": "string", "markdown": "string", "mode": "string" }
    },
    {
      "name": "append_doc",
      "args": { "path": "string", "markdown": "string" }
    }
  ],
  "policy": {
    "write_root": ".reconstituted/",
    "deny": ["delete", "rm", "overwrite_outside_root"],
    "require_evidence_ids": true
  }
}
````

## Prompt skeleton for the LLM

* Task: Improve dossier docs under `.reconstituted/cephalon-clj/files`
* Constraint: Only write under `.reconstituted/cephalon-clj/**`
* For every claim: cite evidence message ids
* Output style: markdown, Obsidian-friendly

## Success criteria

* dossiers become clearer without hallucinating code
* every generated section includes evidence ids and excerpts

````

---

## 9) Make every run reproducible (manifest + hashes)

### `docs/agent_skills/reconstitute/skill.run_manifest_and_hashes.md`

```md
#reconstitute #agent-skill #manifest #hashes

# Skill run_manifest_and_hashes

## Purpose
Make the recovery run reproducible and auditable:
- record command lines used
- record timestamps
- record hashes of key outputs

## Inputs
- OUTDIR

## Commands

### Write run metadata
```bash
OUTDIR="${OUTDIR:-.reconstituted/cephalon-clj}"
mkdir -p "$OUTDIR/run"

date -Iseconds > "$OUTDIR/run/started_at.txt"
uname -a > "$OUTDIR/run/uname.txt"
````

### Save commands used

```bash
OUTDIR="${OUTDIR:-.reconstituted/cephalon-clj}"

cat > "$OUTDIR/run/commands.md" << 'EOF'
#reconstitute #run

## Commands used
- node recover-offline.mjs --needle cephalon-clj --workspace ~/devel --out .reconstituted/cephalon-clj --extract-snapshots
- rg -n "cephalon-clj" .reconstituted/cephalon-clj -S
- git --git-dir=... archive ...
EOF
```

### Hash important files

```bash
OUTDIR="${OUTDIR:-.reconstituted/cephalon-clj}"

(
  cd "$OUTDIR"
  find . -maxdepth 2 -type f \( -name 'dump.ndjson' -o -name 'dump.md' -o -name '_index.md' \) -print0 \
    | xargs -0 sha256sum
) > "$OUTDIR/run/hashes.sha256"

cat "$OUTDIR/run/hashes.sha256"
```

## Outputs

* run/started_at.txt
* run/commands.md
* run/hashes.sha256

## Success criteria

* hashes exist so you can confirm nothing changed across rebuild attempts

````

---

# One “do it all” command sequence (for a human or agent)

```bash
NEEDLE="cephalon-clj"
WORKSPACE="$HOME/devel"
OUTDIR=".reconstituted/$NEEDLE"
OPENCODE_HOME="$HOME/.local/share/opencode"

# 1) deterministic dump + dossiers (+ snapshots if your script supports it)
node recover-offline.mjs --needle "$NEEDLE" --workspace "$WORKSPACE" --out "$OUTDIR" --extract-snapshots

# 2) pull tool-output and session_diff evidence
rg -l --fixed-strings "$NEEDLE" "$OPENCODE_HOME/tool-output" -S | head -n 5000 | xargs -I{} cp -f {} "$OUTDIR/tool-output/" 2>/dev/null || true
rg -l --fixed-strings "$NEEDLE" "$OPENCODE_HOME/storage/session_diff" -S | xargs -I{} cp -f {} "$OUTDIR/session_diff/" 2>/dev/null || true

# 3) triage
rg -n "$NEEDLE" "$OUTDIR" -S | head -n 200
rg -n "guard|policy|append_file|write_file|tool" "$OUTDIR" -S | head -n 200

# 4) manifest
mkdir -p "$OUTDIR/run"
date -Iseconds > "$OUTDIR/run/started_at.txt"
````

---

## If you want the *next* “continue”

I can add one more layer:

* a **single CLI** `reconstitute recover --needle cephalon-clj --workspace ~/devel` that:

  * runs dump + snapshot extract + tool-output + session_diff
  * generates dossiers
  * writes run manifest/hashes
* plus a **minimal MCP server** that exposes the guarded tools (`search_dump`, `append_doc`, etc.) so your qwen agent can operate safely.

Say “continue with CLI + MCP” and I’ll write the full file set.
