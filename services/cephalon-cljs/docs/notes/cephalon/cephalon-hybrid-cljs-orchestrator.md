Your error is coming from **`opencode session list --format json` not actually producing valid JSON** (it’s getting cut off / mixed with non-JSON), so `jq` hits EOF mid-parse.

You can skip `session list` entirely and instead read OpenCode’s **on-disk session metadata** (which is stored as individual JSON files under `~/.local/share/opencode/storage/`) and then only `opencode export` the sessions whose `directory` is under `~/devel`. This is also faster + more reliable. ([OpenCode][1])
(And `opencode export <sessionID>` is the supported way to dump a session as JSON.) ([OpenCode][2])

## Drop-in replacement script

Save this as `recover-cephalon-clj.sh` (overwrite your current one), then run it the same way you did.

```bash
#!/usr/bin/env bash
set -euo pipefail

NEEDLE="${1:-cephalon-clj}"
DEVEL_ROOT="${2:-$HOME/devel}"
OUT_ZIP="${3:-opencode-cephalon-clj-from-devel.zip}"

# ---- deps ----
for cmd in opencode jq zip find xargs grep sort uniq mktemp; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing dependency: $cmd" >&2; exit 1; }
done

# ---- paths ----
DATA_ROOT="${XDG_DATA_HOME:-$HOME/.local/share}/opencode"
STORAGE="$DATA_ROOT/storage"
SESSION_DIR="$STORAGE/session"

if [[ ! -d "$SESSION_DIR" ]]; then
  echo "OpenCode session dir not found at: $SESSION_DIR" >&2
  echo "Expected OpenCode storage under: $STORAGE" >&2
  exit 1
fi

# normalize DEVEL_ROOT (best-effort)
DEVEL_ROOT="${DEVEL_ROOT%/}"
TILDE_DEVEL="~/$(realpath -m "$DEVEL_ROOT" 2>/dev/null | sed "s|^$HOME/||" || echo "${DEVEL_ROOT#"$HOME"/}")"
# if realpath isn't available, TILDE_DEVEL will still be usable-ish for ~/devel cases
if [[ "$DEVEL_ROOT" == "$HOME"* ]]; then
  TILDE_DEVEL="~/${DEVEL_ROOT#"$HOME"/}"
else
  TILDE_DEVEL="~/devel" # fallback
fi

WORKDIR="$(mktemp -d)"
OUTDIR="$WORKDIR/exports"
mkdir -p "$OUTDIR"
trap 'rm -rf "$WORKDIR"' EXIT

echo "[1/4] Finding sessions whose directory is under: $DEVEL_ROOT (or $TILDE_DEVEL)"

# Collect candidate session IDs by reading session metadata files directly.
# We try several possible directory field names to survive schema/version drift.
CAND_IDS="$(
  find "$SESSION_DIR" -type f -name 'ses_*.json' -print0 \
    | xargs -0 -n 200 jq -r --arg devel "$DEVEL_ROOT/" --arg tilde "$TILDE_DEVEL/" '
        def dir:
          (
            .directory? //
            .dir? //
            .cwd? //
            .path? //
            .properties?.directory? //
            .properties?.dir? //
            .properties?.cwd? //
            ""
          ) | tostring;

        select( (dir | startswith($devel)) or (dir | startswith($tilde)) )
        | .id
      ' 2>/dev/null \
    | sort -u
)"

if [[ -z "${CAND_IDS:-}" ]]; then
  echo "No sessions found with directory under $DEVEL_ROOT." >&2
  exit 2
fi

TOTAL="$(echo "$CAND_IDS" | wc -l | tr -d ' ')"
echo "[2/4] Exporting + filtering $TOTAL candidate sessions for needle: $NEEDLE"

MATCHED=0
i=0
while IFS= read -r sid; do
  i=$((i+1))
  tmp="$WORKDIR/$sid.json"

  # Export session data as JSON
  # (official CLI command)
  if ! opencode export "$sid" > "$tmp" 2>/dev/null; then
    echo "[warn] export failed ($i/$TOTAL): $sid"
    rm -f "$tmp"
    continue
  fi

  # Keep only sessions whose exported JSON contains NEEDLE anywhere
  if grep -aqF -- "$NEEDLE" "$tmp"; then
    mv "$tmp" "$OUTDIR/$sid.json"
    MATCHED=$((MATCHED+1))
    echo "[match] ($i/$TOTAL) $sid"
  else
    rm -f "$tmp"
    echo "[skip ] ($i/$TOTAL) $sid"
  fi
done <<< "$CAND_IDS"

echo "[3/4] Matched: $MATCHED"
if [[ "$MATCHED" -eq 0 ]]; then
  echo "No sessions matched '$NEEDLE' within exports (scoped to $DEVEL_ROOT)." >&2
  exit 3
fi

echo "[4/4] Zipping → $OUT_ZIP"
( cd "$OUTDIR" && zip -q -r "$OUT_ZIP" . )
mv "$OUTDIR/$OUT_ZIP" "./$OUT_ZIP"

echo "Done: $(realpath "./$OUT_ZIP" 2>/dev/null || echo "./$OUT_ZIP")"
```

Run:

```bash
bash recover-cephalon-clj.sh cephalon-clj ~/devel opencode-cephalon-clj-from-devel.zip
```

## Why this fixes your `jq` EOF error

* It **does not** parse `opencode session list --format json` at all.
* It reads the **per-session JSON files** that OpenCode stores under `~/.local/share/opencode/storage/session/` (which are independent JSON documents), then exports only the ones whose `directory` is inside `~/devel`. ([Basehub Forums][3])

## Optional speed boost (if you have `rg`)

If you have ripgrep, you can prefilter even harder by only exporting sessions that already have `cephalon-clj` somewhere in the raw storage:

```bash
rg -lF "cephalon-clj" ~/.local/share/opencode/storage \
  | head
```

(If you want, I can fold that into the script so it exports *far fewer* sessions on big stores.)

If this still comes back empty, the next thing I’d do is print one matching session metadata file and confirm what the directory field is named in your version—this script already checks several common possibilities, but OpenCode’s schema has drifted across versions. ([Stan's blog][4])

[1]: https://opencode.ai/docs/troubleshooting/?utm_source=chatgpt.com "Troubleshooting"
[2]: https://opencode.ai/docs/cli/?utm_source=chatgpt.com "OpenCode CLI - Options and Commands"
[3]: https://forums.basehub.com/anomalyco/opencode/15?utm_source=chatgpt.com "Where do OpenCode servers store messages and session info?"
[4]: https://stanislas.blog/2026/01/tui-index-search-coding-agent-sessions/?utm_source=chatgpt.com "Building a TUI to index and search my coding agent sessions"
