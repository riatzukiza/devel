#!/usr/bin/env bash
set -euo pipefail

: "${VERIFY_URL:?VERIFY_URL is required}"
VERIFY_RESOLVE_ADDRESS="${VERIFY_RESOLVE_ADDRESS:-}"

readarray -t curl_meta < <(python3 - "$VERIFY_URL" "$VERIFY_RESOLVE_ADDRESS" <<'PY'
from urllib.parse import urlparse
import sys

url = sys.argv[1]
resolve = sys.argv[2]
parsed = urlparse(url)
port = parsed.port or (443 if parsed.scheme == 'https' else 80)
print(parsed.hostname or '')
print(port)
print('yes' if resolve else 'no')
PY
)

HOST="${curl_meta[0]}"
PORT="${curl_meta[1]}"
USE_RESOLVE="${curl_meta[2]}"

curl_args=(-fsS)
if [[ "$USE_RESOLVE" == "yes" ]]; then
  curl_args+=(--resolve "${HOST}:${PORT}:${VERIFY_RESOLVE_ADDRESS}")
fi

curl "${curl_args[@]}" "${VERIFY_URL%/}/healthz" >/dev/null
status_payload="$(curl "${curl_args[@]}" "${VERIFY_URL%/}/api/status")"
page_payload="$(curl "${curl_args[@]}" "${VERIFY_URL%/}/")"

python3 - "$status_payload" "$page_payload" <<'PY'
import json
import sys

status = json.loads(sys.argv[1])
page = sys.argv[2]
assert status['ok'] is True
assert 'counts' in status
assert 'fork//tales' in page.lower()
PY
