#!/usr/bin/env python3
"""Update the state file from normalized signals.

This remains heuristic, but now keeps branch outputs explicit by deriving scenario
midpoints plus uncertainty bands from state pressure, modifier signals, evidence
confidence, and a model-uncertainty floor.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

import yaml

root = Path(__file__).resolve().parents[1]
signals_path = (
    Path(sys.argv[1]) if len(sys.argv) > 1 else root / "data" / "signals.latest.json"
)
signals = (
    json.loads(signals_path.read_text())
    if signals_path.exists()
    else json.loads((root / "data" / "signals.example.json").read_text())
)
base_state_path = (
    Path(sys.argv[2])
    if len(sys.argv) > 2
    else root / "data" / "state.template.v4.json"
)
state = json.loads(base_state_path.read_text())
config = yaml.safe_load((root / "config" / "model_config.yaml").read_text())

for entry in state.get("states", {}).values():
    entry["evidence"] = []


def clamp(n, lo=0, hi=4):
    return max(lo, min(hi, n))


def clamp_float(n, lo=0.0, hi=1.0):
    return max(lo, min(hi, float(n)))


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


def as_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def modifier_strength(value: object) -> float:
    if isinstance(value, dict):
        if "strength" in value:
            return clamp_float(as_float(value.get("strength"), 0.0))
        if "ordinal" in value:
            return clamp_float(as_float(value.get("ordinal"), 0.0) / 4.0)
    return clamp_float(as_float(value, 0.0))


def confidence_label(value: float) -> str:
    if value >= 0.72:
        return "high"
    if value >= 0.52:
        return "medium"
    return "low"


def evidence_item(sig: dict) -> dict:
    return {
        "id": sig.get("id"),
        "source": sig.get("source"),
        "timestamp_utc": sig.get("timestamp_utc"),
        "url": sig.get("url", ""),
    }


def attach_evidence(name: str, sig: dict) -> None:
    entry = state["states"][name]
    existing = entry.setdefault("evidence", [])
    item = evidence_item(sig)
    if not any(row.get("id") == item["id"] for row in existing):
        existing.append(item)


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


branch_modifiers = []

for sig in signals:
    cat = sig.get("category")
    value = sig.get("value")
    confidence = sig.get("confidence")
    notes = sig.get("notes") or ""

    if cat == "transit_flow" and isinstance(value, dict):
        attach_evidence("transit_flow", sig)
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
    elif cat == "attack_tempo":
        attach_evidence("attack_tempo", sig)
        ordinal = 0
        if isinstance(value, dict) and "ordinal" in value:
            ordinal = int(clamp(as_float(value.get("ordinal"), 0)))
        elif str(value).lower() == "critical":
            ordinal = 4
        update_entry(
            "attack_tempo",
            score=max(ordinal, int(state["states"]["attack_tempo"].get("score", 0))),
            confidence=confidence,
            notes=notes or "critical operating-risk conditions reported",
        )
    elif cat == "navigation_integrity":
        attach_evidence("navigation_integrity", sig)
        if isinstance(value, dict) and "ordinal" in value:
            next_score = int(clamp(as_float(value.get("ordinal"), 0)))
        else:
            next_score = 3 if "interference" in str(value).lower() else 0
        update_entry(
            "navigation_integrity",
            score=max(
                int(state["states"]["navigation_integrity"].get("score", 0)),
                next_score,
            ),
            confidence=confidence,
            notes=notes or "interference / GNSS disruption reported",
        )
    elif cat == "insurance_availability" and isinstance(value, dict):
        attach_evidence("insurance_availability", sig)
        cover_available = bool(value.get("cover_available", True))
        premium_low = as_float(
            value.get("premium_pct_of_value_low", value.get("premium_pct_of_value", 0))
        )
        premium_high = as_float(value.get("premium_pct_of_value_high", premium_low))
        surge_pct = as_float(value.get("surge_percent", 0))
        if not cover_available:
            score = 4
        elif premium_high >= 1.0 or surge_pct >= 1000:
            score = 3
        elif premium_high >= 0.5 or surge_pct >= 500:
            score = 2
        elif premium_high > 0.2 or surge_pct >= 100:
            score = 1
        else:
            score = 0
        update_entry(
            "insurance_availability",
            score=score,
            confidence=confidence,
            notes=notes
            or (
                "war-risk cover available but heavily repriced "
                f"({premium_low:g}-{premium_high:g}% of vessel value, surge {surge_pct:g}%)"
            ),
        )
    elif cat == "bypass_capacity" and isinstance(value, dict):
        attach_evidence("bypass_capacity", sig)
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
            or (
                f"conservative bypass ratio={ratio:.2f} from {vmin:g}-{vmax:g} mb/d "
                f"versus {total:g} mb/d Hormuz flow"
            ),
        )
    elif (
        cat == "asia_buffer_stress"
        and isinstance(value, dict)
        and "release_million_barrels" in value
    ):
        attach_evidence("asia_buffer_stress", sig)
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
    elif cat in {"reopening_pressure", "regional_escalation"}:
        branch_modifiers.append(
            {
                "category": cat,
                "source": sig.get("source", "unknown"),
                "strength": modifier_strength(value),
                "confidence": clamp_float(as_float(confidence, 0.5), 0.01, 0.99),
                "experimental": bool(sig.get("experimental", False)),
                "notes": notes,
                "url": sig.get("url", ""),
                "timestamp_utc": sig.get("timestamp_utc", ""),
            }
        )


branch_model = config.get("branch_model", {})
if branch_model:
    raw = {}
    contributions = {}
    branch_inputs = {
        branch: [] for branch in branch_model.get("base", {}).keys()
    }

    for branch, base in branch_model.get("base", {}).items():
        total = float(base)
        contributions[branch] = {
            "base": round(float(base), 4),
            "states": {},
            "modifiers": [],
        }
        for state_name, weight in branch_model.get("state_weights", {}).get(branch, {}).items():
            pressure = as_float(state["states"][state_name].get("score"), 0.0) / 4.0
            delta = float(weight) * pressure
            total += delta
            contributions[branch]["states"][state_name] = round(delta, 4)
            branch_inputs[branch].append(
                {
                    "kind": "state",
                    "name": state_name,
                    "confidence": clamp_float(
                        as_float(state["states"][state_name].get("confidence"), 0.5),
                        0.01,
                        0.99,
                    ),
                    "importance": abs(delta),
                    "experimental": False,
                }
            )
        raw[branch] = total

    for modifier in branch_modifiers:
        adjustments = branch_model.get("signal_adjustments", {}).get(
            modifier["category"], {}
        )
        for branch, weight in adjustments.items():
            delta = float(weight) * modifier["strength"]
            raw[branch] = raw.get(branch, 0.0) + delta
            contributions.setdefault(
                branch, {"base": 0.0, "states": {}, "modifiers": []}
            )
            contributions[branch]["modifiers"].append(
                {
                    "category": modifier["category"],
                    "source": modifier["source"],
                    "strength": round(modifier["strength"], 2),
                    "confidence": round(modifier["confidence"], 2),
                    "contribution": round(delta, 4),
                    "experimental": modifier["experimental"],
                    "notes": modifier["notes"],
                }
            )
            branch_inputs.setdefault(branch, []).append(
                {
                    "kind": "modifier",
                    "name": modifier["category"],
                    "confidence": modifier["confidence"],
                    "importance": abs(delta),
                    "experimental": modifier["experimental"],
                }
            )

    raw = {key: max(0.01, value) for key, value in raw.items()}
    raw_total = sum(raw.values())
    centers = {key: raw[key] / raw_total for key in raw.keys()}

    uncertainty = branch_model.get("uncertainty", {})
    range_floor = clamp_float(as_float(uncertainty.get("range_floor"), 0.07), 0.01, 0.4)
    range_scale = clamp_float(as_float(uncertainty.get("range_scale"), 0.16), 0.0, 0.5)
    range_ceiling = clamp_float(
        as_float(uncertainty.get("range_ceiling"), 0.22), range_floor, 0.5
    )
    confidence_floor = clamp_float(
        as_float(uncertainty.get("confidence_floor"), 0.25), 0.0, 0.95
    )
    confidence_scale = clamp_float(
        as_float(uncertainty.get("confidence_scale"), 0.5), 0.0, 1.0
    )
    confidence_ceiling = clamp_float(
        as_float(uncertainty.get("confidence_ceiling"), 0.85), 0.01, 0.99
    )
    experimental_penalty_scale = clamp_float(
        as_float(uncertainty.get("experimental_penalty_scale"), 0.1), 0.0, 0.5
    )

    branches_out = {}
    for branch, center in centers.items():
        inputs = branch_inputs.get(branch, [])
        total_importance = sum(item["importance"] for item in inputs if item["importance"] > 0)
        if total_importance > 0:
            weighted_confidence = sum(
                item["confidence"] * item["importance"] for item in inputs
            ) / total_importance
            experimental_share = sum(
                item["importance"] for item in inputs if item.get("experimental")
            ) / total_importance
        else:
            weighted_confidence = 0.5
            experimental_share = 0.0

        branch_confidence = clamp_float(
            confidence_floor
            + (weighted_confidence * confidence_scale)
            - (experimental_share * experimental_penalty_scale),
            0.01,
            confidence_ceiling,
        )
        half_width = clamp_float(
            range_floor + ((1.0 - branch_confidence) * range_scale),
            range_floor,
            range_ceiling,
        )
        low = max(0.0, center - half_width)
        high = min(1.0, center + half_width)

        branches_out[branch] = {
            "center": round(center, 4),
            "range": {"low": round(low, 4), "high": round(high, 4)},
            "confidence": round(branch_confidence, 4),
            "confidence_label": confidence_label(branch_confidence),
        }
        contributions[branch]["uncertainty"] = {
            "weighted_evidence_confidence": round(weighted_confidence, 4),
            "experimental_share": round(experimental_share, 4),
            "half_width": round(half_width, 4),
        }

    state["branches"] = branches_out
    state["branch_model"] = {
        "version": branch_model.get("version", "weighted-state-ranges-v1"),
        "note": (
            "Working scenario midpoints with uncertainty bands; these are model choices, not observed facts."
        ),
        "uncertainty_method": (
            "Range = midpoint ± heuristic band derived from weighted evidence confidence plus a model-uncertainty floor. "
            "Ranges overlap by design and are not calibrated prediction intervals."
        ),
        "uncertainty_config": {
            "range_floor": round(range_floor, 4),
            "range_scale": round(range_scale, 4),
            "range_ceiling": round(range_ceiling, 4),
            "confidence_floor": round(confidence_floor, 4),
            "confidence_scale": round(confidence_scale, 4),
            "confidence_ceiling": round(confidence_ceiling, 4),
            "experimental_penalty_scale": round(experimental_penalty_scale, 4),
        },
        "modifiers": branch_modifiers,
        "contributions": contributions,
    }


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
