#!/usr/bin/env python3
"""Export the current Hormuz bundle state as a threat-radar assessment packet."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_STATE_PATH = ROOT / "data" / "state.v4.json"
DEFAULT_MODEL_ID = "hormuz-bundle-v4"


def clamp(value: int, lo: int = 0, hi: int = 4) -> int:
    return max(lo, min(hi, int(value)))


def confidence_to_radius(confidence: float) -> int:
    if confidence >= 0.9:
        return 0
    if confidence >= 0.7:
        return 1
    return 2


def likelihood_band(probability: float) -> str:
    if probability < 0.2:
        return "very_low"
    if probability < 0.4:
        return "low"
    if probability < 0.6:
        return "moderate"
    if probability < 0.8:
        return "high"
    return "very_high"


def classify_source(source_name: str) -> str:
    normalized = source_name.strip().lower()
    if normalized in {"jmic", "iea", "ukmto", "marad"}:
        return "official"
    if normalized in {"ap", "reuters", "insurance journal / reuters", "insurance journal", "abc11 / ap"}:
        return "news"
    return "other"


def dedupe_sources(state: dict[str, Any]) -> list[dict[str, Any]]:
    seen: set[tuple[str, str]] = set()
    rows: list[dict[str, Any]] = []

    for entry in state.get("states", {}).values():
        confidence = float(entry.get("confidence", 0.75) or 0.75)
        for item in entry.get("evidence", []):
            name = str(item.get("source", "unknown"))
            url = str(item.get("url", "") or "")
            key = (name, url)
            if key in seen:
                continue
            seen.add(key)
            rows.append(
                {
                    "type": classify_source(name),
                    "name": name,
                    "url": url or None,
                    "confidence": round(confidence, 2),
                    "retrieved_at": item.get("timestamp_utc") or state.get("as_of_utc"),
                    "notes": item.get("id"),
                }
            )

    for modifier in state.get("branch_model", {}).get("modifiers", []):
        name = str(modifier.get("source", "unknown"))
        url = str(modifier.get("url", "") or "")
        key = (name, url)
        if key in seen:
            continue
        seen.add(key)
        rows.append(
            {
                "type": classify_source(name),
                "name": name,
                "url": url or None,
                "confidence": round(float(modifier.get("confidence", 0.65) or 0.65), 2),
                "retrieved_at": modifier.get("timestamp_utc") or state.get("as_of_utc"),
                "notes": modifier.get("notes") or modifier.get("category"),
            }
        )

    return rows


def build_signal_scores(state: dict[str, Any]) -> dict[str, dict[str, Any]]:
    signal_scores: dict[str, dict[str, Any]] = {}
    for signal_name, entry in state.get("states", {}).items():
        score = clamp(entry.get("score", 0))
        confidence = float(entry.get("confidence", 0.75) or 0.75)
        radius = confidence_to_radius(confidence)
        evidence = entry.get("evidence", [])
        signal_scores[signal_name] = {
            "value": score,
            "range": [clamp(score - radius), clamp(score + radius)],
            "confidence": round(confidence, 2),
            "reason": str(entry.get("notes", "") or f"{signal_name} derived from current Hormuz bundle state"),
            "supporting_sources": [str(item.get("id", "")) for item in evidence if item.get("id")],
        }
    return signal_scores


def build_branch_assessments(state: dict[str, Any]) -> list[dict[str, Any]]:
    modifiers = state.get("branch_model", {}).get("modifiers", [])
    triggers = [str(item.get("category", "")) for item in modifiers if item.get("category")]
    result: list[dict[str, Any]] = []
    for branch_name, probability in state.get("branches", {}).items():
        numeric_probability = float(probability)
        result.append(
            {
                "branch": branch_name,
                "likelihood_band": likelihood_band(numeric_probability),
                "confidence": 0.72,
                "reason": f"Bundle branch share {numeric_probability:.1%} from weighted-state-priors-v1.",
                "key_triggers": triggers,
                "disconfirming_signals": [],
            }
        )
    return result


def build_uncertainties(state: dict[str, Any]) -> list[dict[str, Any]]:
    note = str(state.get("branch_model", {}).get("note", "") or "Model branch shares are heuristic, not observed facts.")
    return [
        {
            "category": "model",
            "description": note,
            "impact": "moderate",
            "mitigation": "Treat branch support as an explicit model choice; re-run as fresh public signals arrive.",
        }
    ]


def main(argv: list[str]) -> int:
    state_path = Path(argv[1]) if len(argv) > 1 else DEFAULT_STATE_PATH
    radar_id = argv[2] if len(argv) > 2 else "hormuz"
    module_version_id = argv[3] if len(argv) > 3 else f"{radar_id}:module:v1"
    model_id = argv[4] if len(argv) > 4 else DEFAULT_MODEL_ID

    state = json.loads(state_path.read_text())
    as_of_utc = str(state.get("as_of_utc", "")).strip()
    if not as_of_utc:
        raise SystemExit("state file is missing as_of_utc")

    packet = {
        "thread_id": f"{radar_id}:bundle:{as_of_utc}",
        "radar_id": radar_id,
        "module_version_id": module_version_id,
        "timestamp_utc": as_of_utc,
        "model_id": model_id,
        "model_version": str(state.get("branch_model", {}).get("version", "weighted-state-priors-v1")),
        "sources": dedupe_sources(state),
        "signal_scores": build_signal_scores(state),
        "branch_assessment": build_branch_assessments(state),
        "uncertainties": build_uncertainties(state),
        "calibration_notes": "Exported from Hormuz clock bundle state.v4.json",
    }

    json.dump(packet, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
