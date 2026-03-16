#!/usr/bin/env python3
"""Render a compact markdown snapshot from the current state file."""
from __future__ import annotations
import json
import sys
from pathlib import Path

state_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'data' / 'state.v4.json'
state = json.loads(state_path.read_text())

lines = []
lines.append('# Hormuz Risk Clock Snapshot')
lines.append('')
lines.append(f"As of: {state['as_of_utc']}")
lines.append('')
lines.append('## States')
for k, v in state['states'].items():
    lines.append(f"- **{k}**: {v['score']}/4 ({v.get('trend','')}) — {v.get('notes','')}")
lines.append('')
lines.append('## Branch priors')
for k, v in state['branches'].items():
    lines.append(f"- **{k}**: {v:.0%}")
print('\n'.join(lines))
