#!/usr/bin/env bash
set -euo pipefail

INTERVAL="${HORMUZ_RUN_INTERVAL_SECONDS:-3600}"
RUN_ONCE="${HORMUZ_RUN_ONCE:-0}"

while true; do
  echo "[hormuz-agent] cycle start $(date -u +%FT%TZ)"
  if python3 /workspace/services/radar-stack/scripts/hormuz_cycle.py; then
    echo "[hormuz-agent] cycle ok $(date -u +%FT%TZ)"
  else
    echo "[hormuz-agent] cycle failed $(date -u +%FT%TZ)" >&2
  fi

  if [ "$RUN_ONCE" = "1" ]; then
    exit 0
  fi

  sleep "$INTERVAL"
done
