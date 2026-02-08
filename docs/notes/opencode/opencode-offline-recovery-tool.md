## Goal

* Walk **all OpenCode sessions**
* Keep **only** sessions whose exported JSON contains:

  * the substring **`cephalon-clj`** (anywhere in any message/part the export includes), and
  * **a path under `~/devel/`** (so it’s scoped to that folder)
* Produce **one zip** of the matching exports

This uses only supported CLI surfaces: `opencode session list --format json` and `opencode export <id>`. ([OpenCode][1])

---

## Script: export + filter + zip

Save as `opencode-export-filter-zip.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

NEEDLE="${1:-cephalon-clj}"
DEVEL_ROOT="${2:-$HOME/devel}"
OUT_ZIP="${3:-opencode-filtered-$(date +%Y%m%d).zip}"

# Where to place intermediate exports
WORKDIR="$(mktemp -d)"
OUTDIR="$WORKDIR/exports"
mkdir -p "$OUTDIR"

cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

# deps check
for cmd in opencode jq zip; do
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "Missing dependency: $cmd" >&2
    exit 1
  }
done

echo "[1/4] Listing sessions…"
SESS_JSON="$(opencode session list --format json)"  # all sessions :contentReference[oaicite:1]{index=1}

# Optional prefilter: if session list includes a cwd-ish field, use it.
# If not, we fall back to exporting everything and filtering by content.
CAND_IDS="$(
  echo "$SESS_JSON" | jq -r --arg devel "$DEVEL_ROOT/" '
    [ .[] | select( ((.dir? // .cwd? // .path? // .projectDir? // "") | startswith($devel)) ) | .id ]
    | if length > 0 then .[] else empty end
  ' || true
)"

if [[ -z "${CAND_IDS:-}" ]]; then
  echo "[info] No devel-scoped field found in session list; will scan all session exports."
  CAND_IDS="$(echo "$SESS_JSON" | jq -r '.[].id')"
else
  echo "[info] Prefiltered to sessions whose list metadata is under $DEVEL_ROOT/"
fi

TOTAL="$(echo "$CAND_IDS" | wc -l | tr -d ' ')"
echo "[2/4] Exporting + filtering $TOTAL sessions…"

MATCHED=0
i=0
while IFS= read -r sid; do
  i=$((i+1))
  tmp="$WORKDIR/$sid.json"

  # Export session JSON :contentReference[oaicite:2]{index=2}
  if ! opencode export "$sid" > "$tmp" 2>/dev/null; then
    echo "[warn] export failed for $sid (skipping)"
    rm -f "$tmp"
    continue
  fi

  # Filter rules:
  #  - must contain NEEDLE anywhere
  #  - must reference DEVEL_ROOT anywhere
  if grep -aq -- "$NEEDLE" "$tmp" && grep -aq -- "$DEVEL_ROOT" "$tmp"; then
    mv "$tmp" "$OUTDIR/$sid.json"
    MATCHED=$((MATCHED+1))
    echo "[match] ($i/$TOTAL) $sid"
  else
    rm -f "$tmp"
    echo "[skip ] ($i/$TOTAL) $sid"
  fi
done <<< "$CAND_IDS"

echo "[3/4] Matched: $MATCHED sessions"
if [[ "$MATCHED" -eq 0 ]]; then
  echo "No sessions matched needle='$NEEDLE' + devel_root='$DEVEL_ROOT'." >&2
  exit 2
fi

echo "[4/4] Zipping → $OUT_ZIP"
( cd "$OUTDIR" && zip -q -r "$OUT_ZIP" . )
mv "$OUTDIR/$OUT_ZIP" "./$OUT_ZIP"

echo "Done: ./$OUT_ZIP"
```

Run it:

```bash
chmod +x opencode-export-filter-zip.sh
./opencode-export-filter-zip.sh cephalon-clj ~/devel opencode-cephalon-clj-from-devel.zip
```

---

## What you get (and what you *don’t*)

* ✅ Zip contains **`<sessionID>.json`** files from `opencode export`, for only the sessions that matched.
* ✅ Filter is truly “anywhere in the exported data” because it searches the full export output.
* ⚠️ This does **not** include your credentials (`auth.json`) or full on-disk storage layout.

If you ever want a **raw disk backup** instead, OpenCode documents where it stores project data under `~/.local/share/opencode/project/<project-slug>/storage/` for git repos. ([OpenCode][2])
But doing *substring-based per-session extraction* from the raw store is more annoying than exporting, which is why the export-first approach is the cleanest.

---

## Small tweaks you might want

* **Only filter by `cephalon-clj`**, ignore `~/devel`:

  * remove the second `grep -aq -- "$DEVEL_ROOT"` check.
* **Match case-insensitively**:

  * change `grep -aq` → `grep -aiq`.
* **Speed (parallel)**:

  * if you want, I can rewrite the loop using `xargs -P` safely; I didn’t default to it because concurrent `opencode export` behavior can vary by install.

If you paste one sample `opencode export <id>` JSON header (first ~30 lines), I can tighten the “devel scoping” to use the exact field OpenCode writes (instead of relying on `grep "$HOME/devel"`).

[1]: https://opencode.ai/docs/cli/ "CLI | OpenCode"
[2]: https://opencode.ai/docs/troubleshooting/ "Troubleshooting | OpenCode"
