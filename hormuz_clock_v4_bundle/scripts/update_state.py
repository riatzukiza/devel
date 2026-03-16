#!/usr/bin/env python3
"""Update the state file from normalized signals.

This is a heuristic scorer, not a black-box model.
Extend scoring rules in config/model_config.yaml as the system evolves.
"""

from __future__ import annotations
import json
import sys
from datetime import datetime
from pathlib import Path

root = Path(__file__).resolve().parents[1]
signals_path = (
    Path(sys.argv[1]) if len(sys.argv) > 1 else root / "data" / "signals.latest.json"
)
signals = (
    json.loads(signals_path.read_text())
    if signals_path.exists()
    else json.loads((root / "data" / "signals.example.json").read_text())
)
state = json.loads((root / "data" / "state.v4.json").read_text())


# Simple scoring logic. Replace with richer probabilistic updates later.
def clamp(n, lo=0, hi=4):
    return max(lo, min(hi, n))


def parse_timestamp(value: str):
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def isoformat_z(value: datetime) -> str:
    return value.replace(microsecond=0).isoformat().replace("+00:00", "Z")


def trend_for(old_score: int, new_score: int) -> str:
    if new_score > old_score:
        return "worsening"
    if new_score < old_score:
        return "easing"
    return "flat-high" if new_score >= 3 else "flat"


def update_entry(
    name: str, *, score=None, confidence=None, notes=None, trend=None
) -> None:
    entry = state["states"][name]
    old_score = int(entry.get("score", 0))
    if score is not None:
        score = int(clamp(score))
        entry["score"] = score
        entry["trend"] = trend or trend_for(old_score, score)
    if confidence is not None:
        entry["confidence"] = max(
            float(entry.get("confidence", 0.0)), float(confidence)
        )
    if notes:
        entry["notes"] = notes


for sig in signals:
    cat = sig.get("category")
    value = sig.get("value")
    confidence = sig.get("confidence")
    notes = sig.get("notes") or ""
    if cat == "transit_flow" and isinstance(sig.get("value"), dict):
        cur = float(value.get("current", 0))
        baseline = max(float(value.get("baseline", 1)), 1.0)
        ratio = cur / baseline
        score = (
            4
            if ratio < 0.1
            else 3
            if ratio < 0.3
            else 2
            if ratio < 0.6
            else 1
            if ratio < 0.8
            else 0
        )
        update_entry(
            "transit_flow",
            score=score,
            confidence=confidence,
            notes=notes
            or f"ratio={ratio:.2f} from current={cur:g}, baseline={baseline:g}",
        )
    elif cat == "attack_tempo" and str(value).lower() == "critical":
        update_entry(
            "attack_tempo",
            score=4,
            confidence=confidence,
            notes=notes or "critical operating-risk conditions reported",
        )
    elif cat == "navigation_integrity" and "interference" in str(value).lower():
        update_entry(
            "navigation_integrity",
            score=max(int(state["states"]["navigation_integrity"].get("score", 0)), 3),
            confidence=confidence,
            notes=notes or "interference / GNSS disruption reported",
        )
    elif cat == "bypass_capacity" and isinstance(value, dict):
        vmin = float(value.get("bypass_min_mbpd", value.get("bypass_max_mbpd", 0)))
        vmax = float(value.get("bypass_max_mbpd", vmin))
        total = max(float(value.get("hormuz_mbpd", 1)), 1.0)
        ratio = vmin / total
        score = (
            4
            if ratio < 0.1
            else 3
            if ratio < 0.2
            else 2
            if ratio < 0.4
            else 1
            if ratio < 0.6
            else 0
        )
        update_entry(
            "bypass_capacity",
            score=score,
            confidence=confidence,
            notes=notes
            or f"conservative bypass ratio={ratio:.2f} from {vmin:g}-{vmax:g} mb/d versus {total:g} mb/d Hormuz flow",
        )
    elif (
        cat == "asia_buffer_stress"
        and isinstance(value, dict)
        and "release_million_barrels" in value
    ):
        current_score = int(state["states"]["asia_buffer_stress"].get("score", 0))
        next_score = current_score if current_score <= 1 else current_score - 1
        next_trend = "flat" if next_score == current_score else "easing"
        update_entry(
            "asia_buffer_stress",
            score=next_score,
            confidence=confidence,
            notes=notes
            or f"IEA emergency release: {value['release_million_barrels']} million barrels",
            trend=next_trend,
        )

timestamps = [parse_timestamp(sig.get("timestamp_utc", "")) for sig in signals]
timestamps = [value for value in timestamps if value is not None]
if timestamps:
    as_of = max(timestamps)
    t0 = parse_timestamp(state["clock"]["t0_utc"])
    state["as_of_utc"] = isoformat_z(as_of)
    if t0 is not None:
        state["clock"]["second_hand_days"] = round(
            (as_of - t0).total_seconds() / 86400, 2
        )

print(json.dumps(state, indent=2))
