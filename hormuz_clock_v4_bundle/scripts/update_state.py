#!/usr/bin/env python3
"""Update the state file from normalized signals.

This is a heuristic scorer, not a black-box model.
Extend scoring rules in config/model_config.yaml as the system evolves.
"""
from __future__ import annotations
import json, math, sys
from pathlib import Path
import yaml

root = Path(__file__).resolve().parents[1]
config = yaml.safe_load((root / 'config' / 'model_config.yaml').read_text())
signals = json.load(open(sys.argv[1])) if len(sys.argv) > 1 else json.loads((root / 'data' / 'signals.example.json').read_text())
state = json.loads((root / 'data' / 'state.v4.json').read_text())

# Simple scoring logic. Replace with richer probabilistic updates later.
def clamp(n, lo=0, hi=4):
    return max(lo, min(hi, n))

for sig in signals:
    cat = sig.get('category')
    if cat == 'transit_flow' and isinstance(sig.get('value'), dict):
        cur = sig['value'].get('current', 0)
        baseline = max(sig['value'].get('baseline', 1), 1)
        ratio = cur / baseline
        score = 4 if ratio < 0.1 else 3 if ratio < 0.3 else 2 if ratio < 0.6 else 1 if ratio < 0.8 else 0
        state['states']['transit_flow']['score'] = score
        state['states']['transit_flow']['notes'] = f"ratio={ratio:.2f} from current={cur}, baseline={baseline}"
    elif cat == 'attack_tempo' and str(sig.get('value')).lower() == 'critical':
        state['states']['attack_tempo']['score'] = 4
    elif cat == 'navigation_integrity' and 'interference' in str(sig.get('value')).lower():
        state['states']['navigation_integrity']['score'] = max(state['states']['navigation_integrity']['score'], 3)
    elif cat == 'bypass_capacity' and isinstance(sig.get('value'), dict):
        vmax = sig['value'].get('bypass_max_mbpd', 0)
        total = max(sig['value'].get('hormuz_mbpd', 1), 1)
        ratio = vmax / total
        score = 4 if ratio < 0.1 else 3 if ratio < 0.2 else 2 if ratio < 0.4 else 1 if ratio < 0.6 else 0
        state['states']['bypass_capacity']['score'] = score
        state['states']['bypass_capacity']['notes'] = f"max bypass ratio={ratio:.2f}"

print(json.dumps(state, indent=2))
