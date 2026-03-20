#!/usr/bin/env python3
"""Render a compact markdown snapshot from the current state file."""
from __future__ import annotations

import json
import sys
from pathlib import Path

state_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'data' / 'state.v4.json'
state = json.loads(state_path.read_text())


def pct(value: float) -> str:
    return f"{round(float(value) * 100):.0f}%"


lines = []
lines.append('# Hormuz Risk Clock Snapshot')
lines.append('')
lines.append(f"As of: {state['as_of_utc']}")
lines.append('')
lines.append('## Observed state (facts folded into scored conditions)')
for k, v in state['states'].items():
    conf = v.get('confidence')
    conf_txt = f", confidence {conf:.0%}" if isinstance(conf, (int, float)) else ''
    lines.append(f"- **{k}**: {v['score']}/4 ({v.get('trend','')}{conf_txt}) — {v.get('notes','')}")
    evidence = v.get('evidence', [])
    if evidence:
        sources = '; '.join(
            f"{item.get('source','?')} ({str(item.get('timestamp_utc',''))[:10]})"
            for item in evidence
        )
        lines.append(f"  - Sources: {sources}")
lines.append('')
lines.append('## Working branch ranges (model choice, not fact)')
for k, v in state['branches'].items():
    low = v.get('range', {}).get('low', 0)
    high = v.get('range', {}).get('high', 0)
    center = v.get('center', 0)
    conf = v.get('confidence', 0)
    label = v.get('confidence_label', '')
    lines.append(
        f"- **{k}**: midpoint {pct(center)} (range {pct(low)}-{pct(high)}, confidence {pct(conf)}, {label})"
    )
lines.append('')
lines.append('> Range note: these scenario bands overlap by design. They express model uncertainty around each branch share and are not calibrated prediction intervals.')
branch_model = state.get('branch_model') or {}
if branch_model:
    lines.append('')
    lines.append('## Model notes')
    lines.append(f"- Version: {branch_model.get('version','')}")
    lines.append(f"- Note: {branch_model.get('note','')}")
    lines.append(f"- Uncertainty method: {branch_model.get('uncertainty_method','')}")
    modifiers = branch_model.get('modifiers', [])
    if modifiers:
        lines.append('- Explicit modifiers:')
        for item in modifiers:
            lines.append(
                f"  - **{item.get('category','')}** from {item.get('source','?')} "
                f"(strength {item.get('strength', 0):.2f}, confidence {item.get('confidence', 0):.0%}) — {item.get('notes','')}"
            )
print('\n'.join(lines))
