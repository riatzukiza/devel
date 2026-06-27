## Best: zip the on-disk project storage (fast + complete)

OpenCode keeps session/message data as JSON under your data dir (typically `~/.local/share/opencode/storage/`). ([forums.basehub.com][1])
Sessions are stored project-scoped as `storage/session/{projectID}/{sessionID}.json`. For git repos, `projectID` is the **root commit hash**; for non-git dirs it’s `"global"`. ([GitHub][2])
Alongside `session/`, OpenCode also stores the per-session message/part JSON in sibling folders (commonly `message/` and `part/`). ([npm][3])

So the simplest “full zip for the current repo” is: compute `projectID`, then zip the project’s subfolders.

### One-liner-ish script (run from the repo)

```bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
PROJECT_ID="$(git rev-list --max-parents=0 HEAD | tail -n 1)"   # root commit hash
DATA_ROOT="${XDG_DATA_HOME:-$HOME/.local/share}/opencode"
STORAGE="$DATA_ROOT/storage"

ZIP="opencode-sessions-$(basename "$PWD")-${PROJECT_ID:0:8}-$(date +%Y%m%d).zip"

to_zip=()
for d in \
  "$STORAGE/session/$PROJECT_ID" \
  "$STORAGE/message/$PROJECT_ID" \
  "$STORAGE/part/$PROJECT_ID" \
  "$STORAGE/session-metadata/$PROJECT_ID"
do
  [[ -d "$d" ]] && to_zip+=("$d")
done

if [[ ${#to_zip[@]} -eq 0 ]]; then
  echo "No OpenCode storage dirs found for projectID=$PROJECT_ID under $STORAGE" >&2
  exit 1
fi

zip -r "$ZIP" "${to_zip[@]}"
echo "$ZIP"
```

That zip is the closest thing to a “full project dump” because it includes **sessions + messages + parts/attachments** (where present). ([npm][3])

---

## More portable (but slower): export every session, then zip

If your goal is “I want a zip of per-session `export` files I can `import` elsewhere”, OpenCode supports:

* `opencode export [sessionID]` ([OpenCode][4])
* `opencode import <file>` ([OpenCode][4])

You can iterate the session IDs from the storage directory and export them:

```bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
PROJECT_ID="$(git rev-list --max-parents=0 HEAD | tail -n 1)"
DATA_ROOT="${XDG_DATA_HOME:-$HOME/.local/share}/opencode"
STORAGE="$DATA_ROOT/storage"

OUTDIR="opencode-exports-$(basename "$PWD")-${PROJECT_ID:0:8}"
mkdir -p "$OUTDIR"

shopt -s nullglob
for f in "$STORAGE/session/$PROJECT_ID"/*.json; do
  sid="$(basename "$f" .json)"
  opencode export "$sid" > "$OUTDIR/$sid.json"
done

zip -r "$OUTDIR.zip" "$OUTDIR"
echo "$OUTDIR.zip"
```

This produces a zip you can unpack and `opencode import some-session.json` per file. ([OpenCode][4])

---

## Which should you pick?

* **Backup / migration / “give me everything”** → zip `storage/{session,message,part}/$PROJECT_ID` (first script).
* **Shareable / clean imports** → batch `opencode export` and zip the results (second script). ([OpenCode][4])

[1]: https://forums.basehub.com/anomalyco/opencode/15?utm_source=chatgpt.com "Where do OpenCode servers store messages and session info?"
[2]: https://github.com/anomalyco/opencode/issues/8538?utm_source=chatgpt.com "Session lookup fails with NotFoundError when PTY ..."
[3]: https://www.npmjs.com/package/%40nogataka%2Fopencode-viewer?utm_source=chatgpt.com "nogataka/opencode-viewer"
[4]: https://opencode.ai/docs/cli/ "CLI | OpenCode"
