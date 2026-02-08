#reconstitute #opencode #cephalon-clj #agent-skills

Below is a **bigger reconstitution workflow** plus a set of **agent “skills”** (copy-pasteable markdown files) that operationalize the commands you’ll run (`node recover-offline.mjs`, `rg`, `git`, etc.). The intent is:

* **Deterministic first** (safe, repeatable)
* **Generative second** (optional, guarded, output-only)

---

## Expanded workflow

### Phase 0  Prepare

* Confirm OpenCode data root exists:

  * `~/.local/share/opencode/storage`
  * `~/.local/share/opencode/tool-output`
  * `~/.local/share/opencode/snapshot`
* Pick:

  * `NEEDLE=cephalon-clj`
  * `WORKSPACE=~/devel`
  * `OUT=.reconstituted/cephalon-clj`

### Phase 1  Evidence dump

* Run offline scan that finds any blob containing `cephalon-clj` across:

  * `storage/**` (session, message, part, session_diff, …)
  * `tool-output/**`
* Produce:

  * `dump.ndjson` (machine-friendly)
  * `dump.md` (Obsidian-friendly)

### Phase 2  Dossiers per file path

* Parse evidence and extract file-path hints from:

  * “Edit path” markers
  * `filePath:` patterns
  * path-looking tokens with extensions
* Write:

  * `.reconstituted/cephalon-clj/files/_index.md`
  * one dossier per inferred file path

### Phase 3  Snapshot recovery

* For each snapshot repo under `~/.local/share/opencode/snapshot/<id>`:

  * treat it as a bare git repo
  * search it for `cephalon-clj`
  * if hit: `git archive` a working tree into `.reconstituted/…/snapshots/<id>/…`
* This can recover **real code** even when session export fails.

### Phase 4  Rebuild

Two safe patterns:

1. **Human/coding-agent pass**: “For each dossier, recreate the file it describes.”
2. **Tool-guarded LLM pass**: allow only `search` and `append_file` under `.reconstituted/…`

### Phase 5  Validate and package

* Quick checks:

  * compile / typecheck
  * unit tests
  * grep for “TODO RECOVER”
* Package output for sharing:

  * zip `.reconstituted/cephalon-clj`

---

## Agent skills pack

Suggested folder layout (you can change paths):

* `docs/agent_skills/reconstitute/_index.md`
* `docs/agent_skills/reconstitute/skill.scan_evidence.md`
* `docs/agent_skills/reconstitute/skill.extract_snapshots.md`
* `docs/agent_skills/reconstitute/skill.build_dossiers.md`
* `docs/agent_skills/reconstitute/skill.triage_rg.md`
* `docs/agent_skills/reconstitute/skill.reconstruct_from_dossiers.md`
* `docs/agent_skills/reconstitute/skill.validate_package.md`
* `docs/agent_skills/reconstitute/guardrails.md`

Each file below is a complete replacement you can paste into your repo.

---

## `docs/agent_skills/reconstitute/_index.md`

```md
#reconstitute #agent-skill #opencode

# Reconstitution skills index

## Primary runbook
1. [[skill.scan_evidence]]
2. [[skill.extract_snapshots]]
3. [[skill.build_dossiers]]
4. [[skill.triage_rg]]
5. [[skill.reconstruct_from_dossiers]]
6. [[skill.validate_package]]

## Constraints
- [[guardrails]]
```

---

## `docs/agent_skills/reconstitute/guardrails.md`

```md
#reconstitute #guardrails #agent-skill

# Guardrails

## Non-negotiables
- Never delete or modify any user source files during recovery.
- Only write under `.reconstituted/**` unless explicitly instructed otherwise.
- Every generated doc must cite evidence by including:
  - session id if known
  - source file path in OpenCode storage
  - a short quoted excerpt

## Output boundaries
Allowed write roots:
- `.reconstituted/cephalon-clj/**`
- `.reconstituted/<needle>/**` if needle changes

Forbidden:
- writing anywhere under `~/devel/**` (that is a later rebuild step)
- modifying OpenCode storage folders

## Safety defaults
- Prefer deterministic transforms over LLM inference.
- When uncertain about a path, create a dossier anyway and mark it `unknown-path`.

## Evidence quality
- Prefer snapshot content when available over reconstructed guesses.
- If snapshot content exists, dossier must include:
  - snapshot id
  - git refs (HEAD if available)
  - recovered file content or `git show` excerpt

## Stop conditions
- Storage root missing OR unreadable -> stop and report.
- Output dir already exists and is non-empty -> create a new run folder or stop.
```

---

## `docs/agent_skills/reconstitute/skill.scan_evidence.md`

````md
#reconstitute #agent-skill #scan

# Skill scan_evidence

## Purpose
Create a complete evidence dump of all OpenCode artifacts that contain a needle string.

Default needle: `cephalon-clj`

## Inputs
- NEEDLE
- WORKSPACE (used for scope hints)
- OPENCODE_DIR (default `~/.local/share/opencode`)
- OUTDIR (default `.reconstituted/<needle>`)

## Preconditions
- `node` installed
- `recover-offline.mjs` available in the repo or known path

## Commands

### Verify OpenCode folders
```bash
ls -la ~/.local/share/opencode
ls -la ~/.local/share/opencode/storage
ls -la ~/.local/share/opencode/tool-output || true
ls -la ~/.local/share/opencode/snapshot || true
````

### Run scan

```bash
NEEDLE="cephalon-clj"
WORKSPACE="$HOME/devel"
OUTDIR=".reconstituted/$NEEDLE"

node recover-offline.mjs \
  --needle "$NEEDLE" \
  --workspace "$WORKSPACE" \
  --out "$OUTDIR"
```

## Outputs

* `$OUTDIR/dump.ndjson`
* `$OUTDIR/dump.md`

## Success criteria

* `dump.ndjson` exists and has at least 1 line
* `dump.md` exists and is readable

## Failure handling

* If scan returns zero hits:

  * try `NEEDLE="cephalon"` and rerun
  * run `rg -n "cephalon-clj" ~/.local/share/opencode/storage -S`

````

---

## `docs/agent_skills/reconstitute/skill.extract_snapshots.md`

```md
#reconstitute #agent-skill #snapshot #git

# Skill extract_snapshots

## Purpose
Recover actual source trees from OpenCode snapshots.

Snapshots look like bare git repositories:
`~/.local/share/opencode/snapshot/<id>/objects`

## Inputs
- NEEDLE
- OUTDIR (must be `.reconstituted/<needle>`)
- SNAPSHOT_ROOT (default `~/.local/share/opencode/snapshot`)

## Preconditions
- `git` installed

## Commands

### List snapshot ids
```bash
ls -1 ~/.local/share/opencode/snapshot | head
````

### Search snapshots for the needle

Fast path: ask git to grep inside snapshot:

```bash
NEEDLE="cephalon-clj"
SNAPROOT="$HOME/.local/share/opencode/snapshot"

for d in "$SNAPROOT"/*; do
  [ -d "$d/objects" ] || continue
  git --git-dir="$d" grep -n "$NEEDLE" --all-match -- || true
done
```

### Extract any snapshot that matches

```bash
NEEDLE="cephalon-clj"
OUTDIR=".reconstituted/$NEEDLE"
SNAPROOT="$HOME/.local/share/opencode/snapshot"

mkdir -p "$OUTDIR/snapshots"

for d in "$SNAPROOT"/*; do
  [ -d "$d/objects" ] || continue
  if git --git-dir="$d" grep -q "$NEEDLE" --all-match --; then
    sid="$(basename "$d")"
    mkdir -p "$OUTDIR/snapshots/$sid"
    # archive HEAD if present
    if git --git-dir="$d" rev-parse --verify HEAD >/dev/null 2>&1; then
      git --git-dir="$d" archive --format=tar HEAD \
        | tar -x -C "$OUTDIR/snapshots/$sid"
      echo "extracted snapshot $sid"
    else
      echo "snapshot $sid has no HEAD"
    fi
  fi
done
```

## Outputs

* `$OUTDIR/snapshots/<id>/**` for matching snapshots

## Success criteria

* At least one snapshot extracted OR explicit report "no matches"

## Notes

* Snapshot content is higher confidence than session text.
* Prefer using snapshot files as ground truth for reconstruction.

````

---

## `docs/agent_skills/reconstitute/skill.build_dossiers.md`

```md
#reconstitute #agent-skill #dossier

# Skill build_dossiers

## Purpose
Generate one markdown dossier per inferred file path under `.reconstituted/<needle>/files`.

Dossiers group together:
- evidence excerpts from dumps
- inferred paths
- related session ids
- reconstruction checklist

## Inputs
- OUTDIR must already exist with:
  - `dump.ndjson` or `dump.md`

## Commands

### Ensure dossiers exist
```bash
NEEDLE="cephalon-clj"
OUTDIR=".reconstituted/$NEEDLE"

ls -la "$OUTDIR"
ls -la "$OUTDIR/files" || true
````

### Re-run offline tool to ensure dossiers are generated

If your `recover-offline.mjs` writes dossiers in the same run, just rerun scan:

```bash
node recover-offline.mjs \
  --needle "cephalon-clj" \
  --workspace "$HOME/devel" \
  --out ".reconstituted/cephalon-clj"
```

## Outputs

* `$OUTDIR/files/_index.md`
* `$OUTDIR/files/**/*.md`

## Success criteria

* `_index.md` exists and lists links
* at least one dossier exists

## Failure handling

* If dossiers are empty but dump has hits:

  * use `skill.triage_rg` to find path hints and manually create dossiers:

    * create file: `.reconstituted/<needle>/files/unknown-path-001.md`
    * paste excerpts and label TODO: infer real path

````

---

## `docs/agent_skills/reconstitute/skill.triage_rg.md`

```md
#reconstitute #agent-skill #triage #rg

# Skill triage_rg

## Purpose
Rapidly locate the highest value evidence and recovered snapshot files.

## Inputs
- OUTDIR
- NEEDLE

## Commands

### Evidence search
```bash
NEEDLE="cephalon-clj"
OUTDIR=".reconstituted/$NEEDLE"

rg -n "$NEEDLE" "$OUTDIR" -S
````

### Focus on likely code markers

```bash
OUTDIR=".reconstituted/cephalon-clj"

rg -n "tool call|append_file|write_file|guard|policy|allow|deny|sandbox|reconstitute" "$OUTDIR" -S
```

### Focus on file paths

```bash
OUTDIR=".reconstituted/cephalon-clj"
rg -n "← Edit |filePath|/services/|/shared/|/docs/|cephalon-clj" "$OUTDIR/dump.md" -S
```

### Snapshot hunt

```bash
OUTDIR=".reconstituted/cephalon-clj"
rg -n "cephalon-clj" "$OUTDIR/snapshots" -S
```

## Outputs

* A shortlist of dossiers to rebuild first
* A list of any real recovered source files in snapshots

## Success criteria

* Identify 3-10 “core” files that define guard rails / tool policies

````

---

## `docs/agent_skills/reconstitute/skill.reconstruct_from_dossiers.md`

```md
#reconstitute #agent-skill #rebuild

# Skill reconstruct_from_dossiers

## Purpose
Use dossiers to recreate source code in a controlled way.

This skill is intentionally conservative:
- it does not write into `~/devel/**` automatically
- it prepares a “handoff set” for a dedicated coding agent

## Inputs
- `.reconstituted/<needle>/files/**.md`

## Procedure

### 1. Choose targets
Pick files in this order:
1) policy / tool guard rails
2) file append/write adapters
3) search/index primitives
4) orchestration loop

### 2. Create a rebuild workspace
```bash
NEEDLE="cephalon-clj"
OUTDIR=".reconstituted/$NEEDLE"

mkdir -p "$OUTDIR/rebuild"
cp -r "$OUTDIR/files" "$OUTDIR/rebuild/files"
````

### 3. Generate a rebuild manifest

```bash
OUTDIR=".reconstituted/cephalon-clj"
find "$OUTDIR/files" -type f -name "*.md" \
  | sort > "$OUTDIR/rebuild/manifest.txt"
```

### 4. Handoff prompt for coding agent

Create a file `rebuild/INSTRUCTIONS.md` with:

* constraints: no deletes, no rewrites outside target folder
* produce full files, not diffs
* cite dossier evidence

Example instructions text:

* “For each dossier in `rebuild/files`, recreate the source file it describes.”
* “If path is unknown, create `rebuild/unknown/<name>.ts` and explain assumptions.”

## Outputs

* `.reconstituted/<needle>/rebuild/**`

## Success criteria

* A complete, ordered manifest and instructions ready for an external coding agent

````

---

## `docs/agent_skills/reconstitute/skill.validate_package.md`

```md
#reconstitute #agent-skill #validate #package

# Skill validate_package

## Purpose
Sanity check the recovered artifacts and package them for sharing or replay.

## Inputs
- OUTDIR

## Commands

### Basic integrity
```bash
OUTDIR=".reconstituted/cephalon-clj"
test -f "$OUTDIR/dump.ndjson"
test -f "$OUTDIR/dump.md"
test -f "$OUTDIR/files/_index.md"
````

### Count evidence

```bash
OUTDIR=".reconstituted/cephalon-clj"
wc -l "$OUTDIR/dump.ndjson" || true
find "$OUTDIR/files" -type f -name "*.md" | wc -l
```

### Package

```bash
OUTDIR=".reconstituted/cephalon-clj"
zip -r "reconstituted-cephalon-clj.zip" "$OUTDIR"
```

## Outputs

* `reconstituted-cephalon-clj.zip`

## Success criteria

* zip exists and is non-trivial size

```

---

# A single “macro skill” runbook

If you want a single skill an agent can follow top-to-bottom:

1. `scan_evidence`
2. `extract_snapshots`
3. `scan_evidence` again (snapshots add more hits)
4. `build_dossiers`
5. `triage_rg`
6. `reconstruct_from_dossiers`
7. `validate_package`

---

## Optional next upgrade

If you later add tool-enabled qwen for enrichment, keep it boring:

- Tool: `search_dump(query)` reads only `dump.ndjson`
- Tool: `append_doc(path, md)` writes only under `.reconstituted/**`
- Tool: `list_docs()` read-only

And require that each generated section includes:
- evidence msg id(s)
- a short excerpt quoted verbatim

---

If you want, I can also produce a **minimal JSON tool schema** for the “reconstitution agent” (`search_dump`, `append_doc`, `write_doc`) and a default policy file that enforces the `.reconstituted/**` write boundary.
::contentReference[oaicite:0]{index=0}
```
