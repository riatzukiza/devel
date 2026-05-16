#!/usr/bin/env python3
"""Evidence-weighted grading for Fork Tales audio checks/audits.

This is intentionally an adjudicator, not an oracle. It reads an audit
`evidence.json`, optional external judge scores, and a machine-readable rubric.
Then it reports feature scores, confidence, coverage, gates, and grade bands.
"""
from __future__ import annotations

import argparse
import json
import math
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

DEFAULT_RUBRIC = Path("/home/err/devel/docs/fork-tales-audio-rubrics.json")


def clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


def load_json(path: Path | None, default: Any = None) -> Any:
    if path is None or not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_text_portable(s: str | None) -> str:
    if not s:
        return ""
    s = s.lower()
    # Python stdlib does not support \p classes. Keep word chars and CJK/Hiragana/Katakana.
    kept = []
    for ch in s:
        code = ord(ch)
        if ch.isalnum() or (0x3040 <= code <= 0x30ff) or (0x3400 <= code <= 0x9fff):
            kept.append(ch)
    return "".join(kept)


def similarity(a: str | None, b: str | None) -> float | None:
    aa = normalize_text_portable(a)
    bb = normalize_text_portable(b)
    if not aa or not bb:
        return None
    return float(SequenceMatcher(None, aa, bb).ratio())


def linear_score(value: float | None, good: float, bad: float, higher_is_better: bool = False) -> float | None:
    if value is None or math.isnan(value):
        return None
    if higher_is_better:
        if value >= good:
            return 1.0
        if value <= bad:
            return 0.0
        return clamp((value - bad) / (good - bad))
    if value <= good:
        return 1.0
    if value >= bad:
        return 0.0
    return clamp(1.0 - ((value - good) / (bad - good)))


def corr_score(corr: float | None, floor: float = 0.05, excellent: float = 0.85) -> float | None:
    if corr is None:
        return None
    return linear_score(float(corr), excellent, floor, higher_is_better=True)


def grade_band(score: float | None, bands: list[dict[str, Any]]) -> str:
    if score is None:
        return "U"
    for band in bands:
        if score >= float(band["min_score"]):
            return str(band["grade"])
    return "F"


def add(scores: list[dict[str, Any]], feature: str, judge: str, score: float | None, confidence: float, evidence_ref: str, notes: str) -> None:
    if score is None:
        return
    scores.append({
        "feature": feature,
        "judge": judge,
        "score": clamp(float(score)),
        "confidence": clamp(float(confidence)),
        "evidence_ref": evidence_ref,
        "notes": notes,
    })


def stt_words_span(response_file: str | None) -> tuple[float | None, int]:
    if not response_file:
        return None, 0
    data = load_json(Path(response_file), {})
    words = data.get("words") or []
    starts = []
    ends = []
    for word in words:
        try:
            starts.append(float(word.get("start_s")))
            ends.append(float(word.get("end_s")))
        except Exception:
            pass
    if not starts or not ends:
        return None, len(words)
    return max(ends) - min(starts), len(words)


def deterministic_judge_scores(evidence: dict[str, Any]) -> list[dict[str, Any]]:
    scores: list[dict[str, Any]] = []
    audit_id = evidence.get("check_id") or evidence.get("audit_id", "unknown")
    segment = evidence.get("segment") or {}
    expected = segment.get("expected") or ""
    duration = float(segment.get("duration_seconds") or 0.0)
    transcription = evidence.get("transcription") or {}
    original_t = ((transcription.get("original") or {}).get("text")) or ""
    candidate_t = ((transcription.get("candidate") or {}).get("text")) or ""
    original_stt_ref = (transcription.get("original") or {}).get("response_file")
    candidate_stt_ref = (transcription.get("candidate") or {}).get("response_file")
    metrics = evidence.get("metrics") or {}
    metrics_ref = metrics.get("json") or f"{audit_id}:metrics"

    cand_vs_orig = similarity(candidate_t, original_t)
    cand_vs_expected = similarity(candidate_t, expected)
    orig_vs_expected = similarity(original_t, expected)

    if cand_vs_orig is not None or cand_vs_expected is not None:
        pieces = []
        weights = []
        if cand_vs_orig is not None:
            pieces.append(cand_vs_orig)
            weights.append(0.65)
        if cand_vs_expected is not None:
            # Expected lyrics are a clue, not truth; lower authority than original-stem STT.
            pieces.append(cand_vs_expected)
            weights.append(0.35)
        score = sum(p * w for p, w in zip(pieces, weights)) / sum(weights)
        confidence = 0.70 if cand_vs_orig is not None and cand_vs_expected is not None else 0.55
        add(scores, "lyric_identity", "local_stt", score, confidence,
            ",".join(ref for ref in [original_stt_ref, candidate_stt_ref] if ref),
            f"char similarity candidate-vs-original-stt={cand_vs_orig}; candidate-vs-expected={cand_vs_expected}")
        add(scores, "lyric_diction_quality", "local_stt", score, confidence * 0.85,
            ",".join(ref for ref in [original_stt_ref, candidate_stt_ref] if ref),
            "STT alignment proxy for diction clarity; not a pitch/delivery score.")

    if orig_vs_expected is not None:
        # If original STT differs from prompt, prompt drift accounting should increase when drift is explicitly detectable.
        drift_accounting_score = clamp(1.0 - abs(1.0 - orig_vs_expected))
        add(scores, "prompt_drift_accounting", "local_stt", drift_accounting_score, 0.55,
            original_stt_ref or "local-stt", f"original-stt vs expected lyric prompt similarity={orig_vs_expected}")

    orig_span, orig_word_count = stt_words_span(original_stt_ref)
    cand_span, cand_word_count = stt_words_span(candidate_stt_ref)
    if orig_span is not None and cand_span is not None and duration > 0:
        span_score = linear_score(abs(cand_span - orig_span), 0.05 * duration, 0.35 * duration)
        count_score = linear_score(abs(cand_word_count - orig_word_count), 0.0, max(2.0, orig_word_count + 1.0))
        timing_score = 0.75 * (span_score or 0.0) + 0.25 * (count_score or 0.0)
        add(scores, "lyric_timing", "local_stt", timing_score, 0.38,
            ",".join(ref for ref in [original_stt_ref, candidate_stt_ref] if ref),
            f"STT span/count proxy: original_span={orig_span}, candidate_span={cand_span}, original_words={orig_word_count}, candidate_words={cand_word_count}")
        add(scores, "rhythm_grid", "local_stt", timing_score, 0.22,
            ",".join(ref for ref in [original_stt_ref, candidate_stt_ref] if ref),
            "Low-confidence rhythm proxy from STT span/count only.")

    pitch = metrics.get("pitch") or {}
    mean_abs_cents = pitch.get("mean_abs_cents")
    f0_corr = pitch.get("f0_hz_correlation")
    voiced_overlap = pitch.get("voiced_overlap_ratio")
    cents_component = linear_score(float(mean_abs_cents), 35.0, 350.0) if mean_abs_cents is not None else None
    corr_component = corr_score(float(f0_corr), floor=0.05, excellent=0.85) if f0_corr is not None else None
    if cents_component is not None or corr_component is not None:
        pcs = []
        pws = []
        if cents_component is not None:
            pcs.append(cents_component)
            pws.append(0.72)
        if corr_component is not None:
            pcs.append(corr_component)
            pws.append(0.28)
        pitch_score = sum(s * w for s, w in zip(pcs, pws)) / sum(pws)
        confidence = clamp((float(voiced_overlap) if voiced_overlap is not None else 0.55) * 0.86)
        add(scores, "pitch_notes", "f0_tracker", pitch_score, confidence, metrics_ref,
            f"mean_abs_cents={mean_abs_cents}; f0_corr={f0_corr}; voiced_overlap={voiced_overlap}")
        expression_score = 0.65 * (corr_component if corr_component is not None else pitch_score) + 0.35 * clamp(float(voiced_overlap or 0.0))
        add(scores, "pitch_expression", "f0_tracker", expression_score, confidence * 0.85, metrics_ref,
            "Proxy from f0 correlation plus voiced overlap; vibrato/slide-specific scoring still needed.")
        add(scores, "melody_quality", "f0_tracker", pitch_score, confidence * 0.65, metrics_ref,
            "For original-quality profile this is only a contour sanity proxy, not taste.")

    spectrogram = metrics.get("spectrogram") or {}
    mel_corr = spectrogram.get("mel_db_correlation")
    mel_rmse = spectrogram.get("mel_db_rmse")
    mel_abs = spectrogram.get("mel_db_mean_abs_diff")
    mel_corr_component = corr_score(float(mel_corr), floor=0.05, excellent=0.78) if mel_corr is not None else None
    mel_rmse_component = linear_score(float(mel_rmse), 6.0, 28.0) if mel_rmse is not None else None
    if mel_corr_component is not None or mel_rmse_component is not None:
        parts = []
        weights = []
        if mel_corr_component is not None:
            parts.append(mel_corr_component)
            weights.append(0.55)
        if mel_rmse_component is not None:
            parts.append(mel_rmse_component)
            weights.append(0.45)
        spec_score = sum(s * w for s, w in zip(parts, weights)) / sum(weights)
        add(scores, "timbre_spectral", "spectrogram_metrics", spec_score, 0.74, metrics_ref,
            f"mel_corr={mel_corr}; mel_rmse={mel_rmse}; mel_mean_abs={mel_abs}")
        add(scores, "mix_translation", "spectrogram_metrics", spec_score, 0.70, metrics_ref,
            "Spectrogram similarity proxy for mix translation.")
        add(scores, "delivery_inflection", "spectrogram_metrics", spec_score, 0.34, metrics_ref,
            "Low-confidence delivery proxy from spectral similarity; needs Gemma/image/human evidence.")
        add(scores, "arrangement_coherence", "spectrogram_metrics", spec_score, 0.36, metrics_ref,
            "Low-confidence arrangement proxy from spectral similarity.")

    waveform = metrics.get("waveform") or {}
    wave_corr = waveform.get("normalized_correlation")
    if wave_corr is not None:
        rhythm_proxy = corr_score(abs(float(wave_corr)), floor=0.02, excellent=0.65)
        add(scores, "rhythm_grid", "spectrogram_metrics", rhythm_proxy, 0.24, metrics_ref,
            f"Very rough waveform correlation rhythm proxy={wave_corr}; use onset/grid extraction later.")
        add(scores, "rhythm_groove", "spectrogram_metrics", rhythm_proxy, 0.20, metrics_ref,
            "Very rough waveform proxy; not a groove judge.")

    if expected:
        # Prompt evidence is low authority in reverse mode but important for original instruction following.
        add(scores, "instruction_following", "lyric_prompt", 0.5, 0.35, "segment.expected", "Prompt exists; actual adherence requires audio/model/human judges.")
        add(scores, "fork_tales_identity", "lyric_prompt", 0.5, 0.25, "segment.expected", "Identity cannot be inferred from expected lyric alone.")

    return scores


def load_external_scores(paths: list[Path]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for path in paths:
        data = load_json(path, {})
        if isinstance(data, list):
            out.extend(data)
        elif isinstance(data, dict) and isinstance(data.get("judge_scores"), list):
            out.extend(data["judge_scores"])
        elif isinstance(data, dict) and data.get("judge") == "spectrogram_image_judge" and isinstance(data.get("feature_judgments"), list):
            image_refs = data.get("image_refs") or []
            image_ref_text = ",".join(str((ref or {}).get("path") or ref) for ref in image_refs)
            for item in data["feature_judgments"]:
                score = item.get("score")
                confidence = item.get("confidence")
                if score is None or confidence is None or float(confidence or 0.0) <= 0.0:
                    continue
                observations = item.get("observations") or []
                failures = item.get("failure_modes") or []
                out.append({
                    "feature": item.get("feature"),
                    "judge": "spectrogram_image_judge",
                    "score": clamp(float(score)),
                    "confidence": clamp(float(confidence)),
                    "evidence_ref": image_ref_text or str(path),
                    "notes": " | ".join(
                        part for part in [
                            "observations=" + "; ".join(map(str, observations)) if observations else "",
                            "failure_modes=" + "; ".join(map(str, failures)) if failures else "",
                        ] if part),
                })
    return out


def aggregate(evidence: dict[str, Any], rubric: dict[str, Any], profile_name: str, judge_scores: list[dict[str, Any]]) -> dict[str, Any]:
    profile = rubric["profiles"][profile_name]
    feature_importance: dict[str, float] = {k: float(v) for k, v in profile["feature_importance"].items()}
    reliability: dict[str, dict[str, float]] = {
        f: {j: float(w) for j, w in judges.items()}
        for f, judges in profile["judge_reliability"].items()
    }
    by_feature: dict[str, list[dict[str, Any]]] = {f: [] for f in feature_importance}
    for s in judge_scores:
        feature = s.get("feature")
        if feature in by_feature:
            by_feature[feature].append(s)

    feature_results: dict[str, Any] = {}
    total_num = 0.0
    total_den = 0.0
    cov_num = 0.0
    cov_den = 0.0
    conf_num = 0.0
    conf_den = 0.0

    for feature, importance in feature_importance.items():
        configured = reliability.get(feature, {})
        configured_sum = sum(configured.values()) or 1.0
        entries = by_feature.get(feature, [])
        available_rel_sum = 0.0
        eff_sum = 0.0
        weighted_sum = 0.0
        weighted_scores = []
        for entry in entries:
            judge = entry.get("judge")
            rel = configured.get(judge, 0.0)
            if rel <= 0:
                continue
            score = clamp(float(entry.get("score", 0.0)))
            conf = clamp(float(entry.get("confidence", 0.0)))
            available_rel_sum += rel
            eff = rel * conf
            eff_sum += eff
            weighted_sum += score * eff
            weighted_scores.append((score, eff))
        if eff_sum > 0:
            feature_score = weighted_sum / eff_sum
            mean = feature_score
            variance = sum(eff * (score - mean) ** 2 for score, eff in weighted_scores) / eff_sum
            std = math.sqrt(max(0.0, variance))
            agreement = clamp(1.0 - (std / 0.35))
            if len(weighted_scores) == 1:
                agreement *= 0.85
            feature_conf = clamp((eff_sum / configured_sum) * agreement)
            coverage = clamp(available_rel_sum / configured_sum)
            band = grade_band(feature_score, rubric["score_bands"])
            total_num += feature_score * importance * max(feature_conf, 0.05)
            total_den += importance * max(feature_conf, 0.05)
            cov_num += coverage * importance
            cov_den += importance
            conf_num += feature_conf * importance
            conf_den += importance
        else:
            feature_score = None
            feature_conf = 0.0
            coverage = 0.0
            band = "U"
            cov_den += importance
            conf_den += importance
        feature_results[feature] = {
            "importance": importance,
            "score": feature_score,
            "grade": band,
            "confidence": feature_conf,
            "coverage": coverage,
            "available_judges": entries,
            "missing_judges": [j for j in configured if not any(e.get("judge") == j for e in entries)],
        }

    overall_score = total_num / total_den if total_den > 0 else None
    overall_coverage = cov_num / cov_den if cov_den > 0 else 0.0
    overall_confidence = conf_num / conf_den if conf_den > 0 else 0.0
    gates = profile.get("promotion_gates", {})
    gate_results: dict[str, Any] = {
        "min_overall": overall_score is not None and overall_score >= float(gates.get("min_overall", 0.0)),
        "min_confidence": overall_confidence >= float(gates.get("min_confidence", 0.0)),
        "min_coverage": overall_coverage >= float(gates.get("min_coverage", 0.0)),
        "critical_features": {},
    }
    for feature, threshold in (gates.get("critical_features") or {}).items():
        # Some docs use musical_quality as a conceptual alias for melody_quality.
        actual_feature = "melody_quality" if feature == "musical_quality" and "melody_quality" in feature_results else feature
        score = (feature_results.get(actual_feature) or {}).get("score")
        gate_results["critical_features"][feature] = score is not None and score >= float(threshold)
    promote = bool(
        gate_results["min_overall"]
        and gate_results["min_confidence"]
        and gate_results["min_coverage"]
        and all(gate_results["critical_features"].values())
    )
    return {
        "schema_version": "fork-tales-audio-grade/v1",
        "profile": profile_name,
        "audit_id": evidence.get("audit_id"),
        "check_id": evidence.get("check_id") or evidence.get("audit_id"),
        "overall": {
            "score": overall_score,
            "grade": grade_band(overall_score, rubric["score_bands"]),
            "confidence": overall_confidence,
            "coverage": overall_coverage,
            "promote": promote,
            "gate_results": gate_results,
        },
        "features": feature_results,
        "judge_scores": judge_scores,
        "notes": [
            "This grade is evidence-weighted, not authoritative.",
            "Missing image, Gemma, human, USTX/MIDI, or stronger pitch judges lower coverage/confidence rather than proving failure.",
            "Promotion requires critical feature gates, not just a high weighted average."
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--evidence", required=True, type=Path)
    parser.add_argument("--rubric", default=DEFAULT_RUBRIC, type=Path)
    parser.add_argument("--profile", default="suno_reverse_accuracy")
    parser.add_argument("--judge-scores", action="append", default=[], type=Path, help="Optional JSON list or object containing judge_scores[]")
    parser.add_argument("--out-json", required=True, type=Path)
    args = parser.parse_args()

    evidence = load_json(args.evidence, {})
    rubric = load_json(args.rubric, {})
    if args.profile not in rubric.get("profiles", {}):
        raise SystemExit(f"unknown profile {args.profile}; known={list((rubric.get('profiles') or {}).keys())}")
    judge_scores = deterministic_judge_scores(evidence)
    judge_scores.extend(load_external_scores(args.judge_scores))
    result = aggregate(evidence, rubric, args.profile, judge_scores)
    args.out_json.parent.mkdir(parents=True, exist_ok=True)
    args.out_json.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
