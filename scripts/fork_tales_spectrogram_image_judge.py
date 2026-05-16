#!/usr/bin/env python3
"""Prepare and parse spectrogram/f0 image-judge evidence.

This helper does not run a vision model. It creates a calibrated prompt and
response template for a vision-capable judge, then normalizes that judge's JSON
response into the `judge_scores` format consumed by fork_tales_audio_grade.py.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

FEATURE_GUIDANCE: dict[str, dict[str, Any]] = {
    "pitch_notes": {
        "score_high": "F0 overlay tracks the same relative notes/register with only small local deviations; no obvious octave drift.",
        "score_low": "Candidate contour is flat, wrong register, wrong octave, or diverges for most voiced regions.",
        "confidence_hint": "Use high confidence only when axes are legible and both contours are visible in the same voiced regions.",
        "primary_images": ["f0_overlay", "original_f0", "candidate_f0"],
    },
    "pitch_expression": {
        "score_high": "Slides, bends, vibrato, trills, held-note contours, and portamento shapes visually resemble the original.",
        "score_low": "Candidate has blocky/static notes where original has expressive motion, or adds unrelated wobble/slides.",
        "confidence_hint": "Confidence should drop if the plot resolution hides short ornaments.",
        "primary_images": ["f0_overlay", "original_f0", "candidate_f0"],
    },
    "delivery_inflection": {
        "score_high": "Energy/onset shapes, phrase attacks, releases, breath/noise bands, and emphasis arcs resemble the original.",
        "score_low": "Candidate has visibly different phrase emphasis, onset density, release timing, or dynamic shape.",
        "confidence_hint": "Use mel images and f0 together; do not infer exact emotion from image alone.",
        "primary_images": ["original_mel", "candidate_mel", "mel_diff", "f0_overlay"],
    },
    "timbre_spectral": {
        "score_high": "Harmonic bands, brightness, noise/formant distribution, and spectral envelope are similar enough for the target task.",
        "score_low": "Candidate is much brighter/darker/noisier, has missing harmonics, or diverges across most bands.",
        "confidence_hint": "Confidence can be higher when mel scales/colors are identical and diff image is available.",
        "primary_images": ["original_mel", "candidate_mel", "mel_diff"],
    },
    "rhythm_grid": {
        "score_high": "Visible syllable/note onsets, rests, holds, and phrase boundaries line up with the original.",
        "score_low": "Onsets, gaps, or held regions are shifted/split/merged relative to original.",
        "confidence_hint": "Image-only rhythm confidence is moderate unless beat/grid annotations are present.",
        "primary_images": ["original_mel", "candidate_mel", "mel_diff", "f0_overlay"],
    },
    "lyric_timing": {
        "score_high": "Syllabic onset/hold patterns visually match the expected phrase timing.",
        "score_low": "Candidate appears to split/merge syllables or place vocal energy at different times.",
        "confidence_hint": "Image judges should not claim word identity; this is only a timing/shape proxy.",
        "primary_images": ["original_mel", "candidate_mel", "mel_diff"],
    },
    "lyric_identity": {
        "score_high": "Only score high if the visual evidence strongly supports the same syllable count/onset structure; do not transcribe from the image.",
        "score_low": "Different syllable counts or obvious missing/extra vocal events.",
        "confidence_hint": "Usually low confidence. Spectrogram images are weak lyric evidence.",
        "primary_images": ["original_mel", "candidate_mel", "mel_diff"],
    },
}

REVERSE_FEATURES = [
    "pitch_notes",
    "pitch_expression",
    "delivery_inflection",
    "timbre_spectral",
    "rhythm_grid",
    "lyric_timing",
    "lyric_identity",
]

ORIGINAL_QUALITY_FEATURES = [
    "melody_quality",
    "rhythm_groove",
    "delivery_inflection",
    "mix_translation",
    "arrangement_coherence",
    "fork_tales_identity",
    "instruction_following",
    "lyric_diction_quality",
]

ALIASES = {
    "melody_quality": "pitch_notes",
    "rhythm_groove": "rhythm_grid",
    "mix_translation": "timbre_spectral",
    "arrangement_coherence": "timbre_spectral",
    "fork_tales_identity": "delivery_inflection",
    "instruction_following": "delivery_inflection",
    "lyric_diction_quality": "lyric_timing",
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def clamp(x: Any, lo: float = 0.0, hi: float = 1.0) -> float:
    try:
        return max(lo, min(hi, float(x)))
    except Exception:
        return 0.0


def path_if_exists(value: str | None) -> str | None:
    if not value:
        return None
    return value


def add_image(images: list[dict[str, Any]], role: str, path: str | None, description: str) -> None:
    p = path_if_exists(path)
    if not p:
        return
    images.append({
        "role": role,
        "path": p,
        "description": description,
        "exists": Path(p).exists(),
    })


def collect_images(evidence: dict[str, Any]) -> list[dict[str, Any]]:
    metrics_ref = ((evidence.get("metrics") or {}).get("json"))
    metrics = load_json(Path(metrics_ref)) if metrics_ref and Path(metrics_ref).exists() else {}
    ev_outputs = (evidence.get("metrics") or {}).get("outputs") or {}
    images: list[dict[str, Any]] = []
    add_image(images, "f0_overlay", ev_outputs.get("f0_overlay_png"), "Original and candidate f0 contours overlaid on the same axes.")
    add_image(images, "mel_diff", ev_outputs.get("mel_diff_png"), "Candidate minus original mel-spectrogram dB difference.")

    original_outputs = ((metrics.get("original") or {}).get("outputs") or {})
    candidate_outputs = ((metrics.get("candidate") or {}).get("outputs") or {})
    add_image(images, "original_f0", original_outputs.get("f0_png"), "Original/reference f0 contour.")
    add_image(images, "candidate_f0", candidate_outputs.get("f0_png"), "Candidate/render f0 contour.")
    add_image(images, "original_mel", original_outputs.get("mel_png"), "Original/reference mel spectrogram.")
    add_image(images, "candidate_mel", candidate_outputs.get("mel_png"), "Candidate/render mel spectrogram.")
    return images


def features_for_profile(profile: str) -> list[str]:
    if profile == "curated_original_quality":
        return ORIGINAL_QUALITY_FEATURES
    return REVERSE_FEATURES


def guidance_for_feature(feature: str) -> dict[str, Any]:
    return FEATURE_GUIDANCE.get(feature) or FEATURE_GUIDANCE.get(ALIASES.get(feature, "")) or {
        "score_high": "Image evidence supports the feature.",
        "score_low": "Image evidence contradicts the feature.",
        "confidence_hint": "Use low confidence unless the visual evidence is direct.",
        "primary_images": ["f0_overlay", "original_mel", "candidate_mel", "mel_diff"],
    }


def response_template(audit_id: str, profile: str, images: list[dict[str, Any]], check_id: str | None = None) -> dict[str, Any]:
    return {
        "schema_version": "fork-tales-spectrogram-image-judge/v1",
        "audit_id": audit_id,
        "check_id": check_id or audit_id,
        "profile": profile,
        "judge": "spectrogram_image_judge",
        "image_refs": [{"role": i["role"], "path": i["path"]} for i in images],
        "global_observations": [],
        "feature_judgments": [
            {
                "feature": feature,
                "score": None,
                "confidence": None,
                "observations": [],
                "failure_modes": [],
                "image_roles_used": guidance_for_feature(feature).get("primary_images", []),
            }
            for feature in features_for_profile(profile)
        ],
        "do_not_score": [
            "Do not claim exact lyric transcription from images.",
            "Do not override f0 numeric metrics; image reading is additional visual evidence.",
            "Use null score and 0 confidence when the image does not support judging a feature.",
        ],
    }


def build_prompt(evidence: dict[str, Any], evidence_path: Path, profile: str, images: list[dict[str, Any]], template: dict[str, Any]) -> str:
    segment = evidence.get("segment") or {}
    metrics = evidence.get("metrics") or {}
    transcription = evidence.get("transcription") or {}
    lines = [
        "# Fork Tales Spectrogram/F0 Image Judge Prompt",
        "",
        "You are a spectrogram and f0-image judge. You are not an authoritative judge of the song.",
        "Your job is to inspect the attached images and produce feature-specific evidence for the grader.",
        "",
        "## Rules",
        "",
        "- Score only what the images support.",
        "- Do not claim exact lyric transcription from spectrograms.",
        "- For lyric identity, use very low confidence unless syllable count/onset evidence is visually obvious.",
        "- For pitch, use f0 overlay/contour images heavily.",
        "- For delivery, use f0 motion plus mel energy/onset/release shapes.",
        "- For timbre/mix, use original/candidate mel images and mel-diff.",
        "- If axes/colors are unclear or images are missing, lower confidence or use null score.",
        "- Return JSON only, matching the response template at the end.",
        "",
        "## Segment",
        "",
        f"- audit_id: `{evidence.get('audit_id')}`",
        f"- check_id: `{evidence.get('check_id') or evidence.get('audit_id')}`",
        f"- profile: `{profile}`",
        f"- evidence_json: `{evidence_path}`",
        f"- start_seconds: `{segment.get('start_seconds')}`",
        f"- duration_seconds: `{segment.get('duration_seconds')}`",
        f"- expected lyric clue: `{segment.get('expected')}`",
        "",
        "## Noisy Non-Image Context",
        "",
        "This context is provided only to orient the segment. Do not let it override the images.",
        "",
        f"- local STT original: `{((transcription.get('original') or {}).get('text'))}`",
        f"- local STT candidate: `{((transcription.get('candidate') or {}).get('text'))}`",
        f"- numeric pitch summary: `{(metrics.get('pitch') or {})}`",
        f"- numeric spectrogram summary: `{(metrics.get('spectrogram') or {})}`",
        "",
        "## Attach / Inspect Images In This Order",
        "",
    ]
    for idx, image in enumerate(images, 1):
        lines.append(f"{idx}. `{image['role']}` — `{image['path']}` — {image['description']} — exists={image['exists']}")
    lines.extend([
        "",
        "## Feature Calibration",
        "",
    ])
    for feature in features_for_profile(profile):
        g = guidance_for_feature(feature)
        lines.extend([
            f"### {feature}",
            f"- High score: {g['score_high']}",
            f"- Low score: {g['score_low']}",
            f"- Confidence: {g['confidence_hint']}",
            f"- Primary images: {', '.join(g.get('primary_images', []))}",
            "",
        ])
    lines.extend([
        "## Response Template",
        "",
        "Return JSON only. Replace null scores/confidences with numbers in [0,1] only when justified; otherwise keep score null and confidence 0.",
        "",
        "```json",
        json.dumps(template, ensure_ascii=False, indent=2),
        "```",
        "",
    ])
    return "\n".join(lines)


def parse_json_or_fence(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.S)
    if not match:
        raise SystemExit(f"Could not parse JSON or fenced JSON from {path}")
    return json.loads(match.group(1))


def normalize_scores(response: dict[str, Any], response_path: Path, evidence_path: Path | None = None) -> dict[str, Any]:
    judge = response.get("judge") or "spectrogram_image_judge"
    if judge != "spectrogram_image_judge":
        raise SystemExit(f"expected judge=spectrogram_image_judge, got {judge}")
    image_refs = response.get("image_refs") or []
    image_ref_text = ",".join(str((ref or {}).get("path") or ref) for ref in image_refs)
    out_scores: list[dict[str, Any]] = []
    for item in response.get("feature_judgments") or []:
        feature = item.get("feature")
        confidence = clamp(item.get("confidence"))
        score_raw = item.get("score")
        if score_raw is None or confidence <= 0:
            continue
        observations = item.get("observations") or []
        failures = item.get("failure_modes") or []
        roles = item.get("image_roles_used") or []
        notes_parts = []
        if observations:
            notes_parts.append("observations=" + "; ".join(map(str, observations)))
        if failures:
            notes_parts.append("failure_modes=" + "; ".join(map(str, failures)))
        if roles:
            notes_parts.append("image_roles_used=" + ",".join(map(str, roles)))
        out_scores.append({
            "feature": feature,
            "judge": "spectrogram_image_judge",
            "score": clamp(score_raw),
            "confidence": confidence,
            "evidence_ref": image_ref_text or str(response_path),
            "notes": " | ".join(notes_parts) or f"Parsed from {response_path}",
        })
    return {
        "schema_version": "fork-tales-judge-scores/v1",
        "source_schema_version": response.get("schema_version"),
        "audit_id": response.get("audit_id"),
        "check_id": response.get("check_id") or response.get("audit_id"),
        "judge": "spectrogram_image_judge",
        "source_response": str(response_path),
        "evidence_json": str(evidence_path) if evidence_path else None,
        "judge_scores": out_scores,
    }


def command_prompt(args: argparse.Namespace) -> None:
    evidence = load_json(args.evidence)
    profile = args.profile
    images = collect_images(evidence)
    audit_dir = args.evidence.parent
    out_md = args.out_md or audit_dir / "spectrogram-image-judge-prompt.md"
    out_json = args.out_json or audit_dir / "spectrogram-image-judge-request.json"
    out_template = args.out_template or audit_dir / "spectrogram-image-judge-response-template.json"
    template = response_template(str(evidence.get("audit_id")), profile, images, str(evidence.get("check_id") or evidence.get("audit_id")))
    request = {
        "schema_version": "fork-tales-spectrogram-image-judge-request/v1",
        "audit_id": evidence.get("audit_id"),
        "check_id": evidence.get("check_id") or evidence.get("audit_id"),
        "profile": profile,
        "evidence_json": str(args.evidence),
        "images": images,
        "response_template": template,
        "prompt_markdown": str(out_md),
        "response_template_json": str(out_template),
    }
    out_md.parent.mkdir(parents=True, exist_ok=True)
    out_md.write_text(build_prompt(evidence, args.evidence, profile, images, template), encoding="utf-8")
    write_json(out_template, template)
    write_json(out_json, request)
    print(json.dumps(request, ensure_ascii=False, indent=2))


def command_scores(args: argparse.Namespace) -> None:
    response = parse_json_or_fence(args.response)
    result = normalize_scores(response, args.response, args.evidence)
    write_json(args.out_json, result)
    print(json.dumps(result, ensure_ascii=False, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    p_prompt = sub.add_parser("prompt", help="Create a calibrated spectrogram/f0 image judge prompt and response template")
    p_prompt.add_argument("--evidence", required=True, type=Path)
    p_prompt.add_argument("--profile", default="suno_reverse_accuracy")
    p_prompt.add_argument("--out-md", type=Path)
    p_prompt.add_argument("--out-json", type=Path)
    p_prompt.add_argument("--out-template", type=Path)
    p_prompt.set_defaults(func=command_prompt)

    p_scores = sub.add_parser("scores", help="Normalize a spectrogram image judge response into grade-compatible judge_scores")
    p_scores.add_argument("--response", required=True, type=Path)
    p_scores.add_argument("--out-json", required=True, type=Path)
    p_scores.add_argument("--evidence", type=Path)
    p_scores.set_defaults(func=command_scores)

    args = parser.parse_args()
    try:
        args.func(args)
    except BrokenPipeError:
        try:
            sys.stdout.close()
        except Exception:
            pass


if __name__ == "__main__":
    main()
