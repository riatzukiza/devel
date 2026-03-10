#!/usr/bin/env python3
"""Normalize raw signals into a merged latest-signals file.

Usage:
  python scripts/normalize_signals.py raw.json > data/signals.latest.json
"""
from __future__ import annotations
import json, sys

raw = json.load(open(sys.argv[1])) if len(sys.argv) > 1 else json.load(sys.stdin)
# Minimal normalizer: de-duplicate by id, keep last occurrence
merged = {}
for item in raw:
    merged[item['id']] = item
print(json.dumps(list(merged.values()), indent=2))
