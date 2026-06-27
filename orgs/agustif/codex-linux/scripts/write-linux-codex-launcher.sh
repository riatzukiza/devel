#!/bin/bash

set -euo pipefail

LAUNCHER_PATH="${1:-}"
BACKEND_NAME="${2:-codex-app-server}"

if [ -z "$LAUNCHER_PATH" ]; then
  echo "usage: $0 <launcher-path> [backend-name]" >&2
  exit 1
fi

cat >"$LAUNCHER_PATH" <<EOF
#!/bin/sh
set -eu

SELF_DIR=\$(CDPATH= cd -- "\$(dirname -- "\$0")" && pwd)
BACKEND="\$SELF_DIR/$BACKEND_NAME"

if [ "\${1:-}" = "app-server" ]; then
  shift
fi

if [ "\${1:-}" = "--analytics-default-enabled" ]; then
  shift
fi

exec "\$BACKEND" "\$@"
EOF

chmod +x "$LAUNCHER_PATH"
