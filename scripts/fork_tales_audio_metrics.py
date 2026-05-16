#!/usr/bin/env python3
"""Deterministic local audio evidence for Fork Tales reconstruction checks/audits.

This helper deliberately stays outside the model path. It produces concrete files
(JSON/CSV/PNG) that Gemma or another agent can consume as evidence:

- mel-spectrogram images for visual inspection;
- f0 contour CSV/PNG via librosa.pyin;
- JSON summaries and pairwise comparison metrics;
- SHA-256 hashes for reproducible artifact references.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
from pathlib import Path
from typing import Any

import librosa
import librosa.display
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

DEFAULT_SR = 22050
DEFAULT_HOP = 256
DEFAULT_N_FFT = 2048
DEFAULT_N_MELS = 128
DEFAULT_FMIN = 65.0
DEFAULT_FMAX = 1046.5


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def load_audio(path: Path, sr: int) -> tuple[np.ndarray, int]:
    y, sr_out = librosa.load(path, sr=sr, mono=True)
    if y.size == 0:
        raise ValueError(f"empty audio: {path}")
    return y.astype(np.float32), sr_out


def safe_float(x: Any) -> float | None:
    if x is None:
        return None
    try:
        value = float(x)
    except Exception:
        return None
    if math.isnan(value) or math.isinf(value):
        return None
    return value


def stats(values: np.ndarray) -> dict[str, float | int | None]:
    finite = values[np.isfinite(values)]
    if finite.size == 0:
        return {"count": 0, "mean": None, "median": None, "min": None, "max": None, "p05": None, "p95": None}
    return {
        "count": int(finite.size),
        "mean": float(np.mean(finite)),
        "median": float(np.median(finite)),
        "min": float(np.min(finite)),
        "max": float(np.max(finite)),
        "p05": float(np.percentile(finite, 5)),
        "p95": float(np.percentile(finite, 95)),
    }


def compute_f0(y: np.ndarray, sr: int, hop_length: int, fmin: float, fmax: float) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    f0, voiced_flag, voiced_prob = librosa.pyin(
        y,
        fmin=fmin,
        fmax=fmax,
        sr=sr,
        hop_length=hop_length,
        frame_length=DEFAULT_N_FFT,
        fill_na=np.nan,
    )
    times = librosa.frames_to_time(np.arange(len(f0)), sr=sr, hop_length=hop_length)
    return times, f0, voiced_flag.astype(bool), voiced_prob


def mel_db(y: np.ndarray, sr: int, hop_length: int, n_fft: int, n_mels: int) -> np.ndarray:
    mel = librosa.feature.melspectrogram(
        y=y,
        sr=sr,
        n_fft=n_fft,
        hop_length=hop_length,
        n_mels=n_mels,
        power=2.0,
    )
    return librosa.power_to_db(mel, ref=np.max)


def write_f0_csv(path: Path, times: np.ndarray, f0: np.ndarray, voiced_flag: np.ndarray, voiced_prob: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["time_s", "f0_hz", "midi", "voiced", "voiced_prob"])
        for t, hz, voiced, prob in zip(times, f0, voiced_flag, voiced_prob):
            hz_value = safe_float(hz)
            midi = None if hz_value is None or hz_value <= 0 else float(librosa.hz_to_midi(hz_value))
            writer.writerow([
                f"{float(t):.6f}",
                "" if hz_value is None else f"{hz_value:.6f}",
                "" if midi is None else f"{midi:.6f}",
                int(bool(voiced)),
                "" if safe_float(prob) is None else f"{float(prob):.6f}",
            ])


def artifact_path(out_prefix: Path, suffix: str) -> Path:
    return out_prefix.parent / f"{out_prefix.name}{suffix}"


def plot_f0(path: Path, times: np.ndarray, f0: np.ndarray, title: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(12, 4))
    plt.plot(times, f0, linewidth=1.2)
    plt.ylim(DEFAULT_FMIN, DEFAULT_FMAX)
    plt.xlabel("time (s)")
    plt.ylabel("f0 (Hz)")
    plt.title(title)
    plt.grid(True, alpha=0.25)
    plt.tight_layout()
    plt.savefig(path, dpi=140)
    plt.close()


def plot_mel(path: Path, db: np.ndarray, sr: int, hop_length: int, title: str, vmin: float = -80, vmax: float = 0) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(12, 5))
    librosa.display.specshow(db, sr=sr, hop_length=hop_length, x_axis="time", y_axis="mel", vmin=vmin, vmax=vmax)
    plt.colorbar(format="%+2.0f dB")
    plt.title(title)
    plt.tight_layout()
    plt.savefig(path, dpi=140)
    plt.close()


def plot_mel_diff(path: Path, diff: np.ndarray, sr: int, hop_length: int, title: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(12, 5))
    vmax = max(1.0, float(np.percentile(np.abs(diff), 95)))
    librosa.display.specshow(diff, sr=sr, hop_length=hop_length, x_axis="time", y_axis="mel", cmap="coolwarm", vmin=-vmax, vmax=vmax)
    plt.colorbar(format="%+2.0f dB")
    plt.title(title)
    plt.tight_layout()
    plt.savefig(path, dpi=140)
    plt.close()


def analyze_audio(audio: Path, out_prefix: Path, sr: int, hop_length: int, n_fft: int, n_mels: int, fmin: float, fmax: float) -> dict[str, Any]:
    y, sr_out = load_audio(audio, sr)
    duration = float(len(y) / sr_out)
    times, f0, voiced_flag, voiced_prob = compute_f0(y, sr_out, hop_length, fmin, fmax)
    db = mel_db(y, sr_out, hop_length, n_fft, n_mels)
    rms = librosa.feature.rms(y=y, frame_length=n_fft, hop_length=hop_length)[0]
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr_out, n_fft=n_fft, hop_length=hop_length)[0]

    f0_csv = artifact_path(out_prefix, ".f0.csv")
    f0_png = artifact_path(out_prefix, ".f0.png")
    spec_png = artifact_path(out_prefix, ".mel.png")
    write_f0_csv(f0_csv, times, f0, voiced_flag, voiced_prob)
    plot_f0(f0_png, times, f0, f"f0: {audio.name}")
    plot_mel(spec_png, db, sr_out, hop_length, f"mel spectrogram: {audio.name}")

    voiced_f0 = f0[np.isfinite(f0)]
    voiced_prob_finite = voiced_prob[np.isfinite(voiced_prob)]
    summary = {
        "audio": str(audio),
        "sha256": sha256_file(audio),
        "sample_rate": sr_out,
        "duration_seconds": duration,
        "analysis_settings": {
            "hop_length": hop_length,
            "n_fft": n_fft,
            "n_mels": n_mels,
            "fmin_hz": fmin,
            "fmax_hz": fmax,
        },
        "outputs": {
            "f0_csv": str(f0_csv),
            "f0_png": str(f0_png),
            "mel_png": str(spec_png),
        },
        "f0_hz": stats(voiced_f0),
        "voiced_ratio": float(np.mean(voiced_flag)) if voiced_flag.size else 0.0,
        "voiced_probability": stats(voiced_prob_finite),
        "rms": stats(rms),
        "spectral_centroid_hz": stats(centroid),
    }
    return summary


def correlation(a: np.ndarray, b: np.ndarray) -> float | None:
    if a.size < 2 or b.size < 2:
        return None
    if np.std(a) == 0 or np.std(b) == 0:
        return None
    return float(np.corrcoef(a, b)[0, 1])


def compare_audio(original: Path, candidate: Path, out_prefix: Path, sr: int, hop_length: int, n_fft: int, n_mels: int, fmin: float, fmax: float) -> dict[str, Any]:
    y_a, sr_out = load_audio(original, sr)
    y_b, _ = load_audio(candidate, sr)
    n = min(len(y_a), len(y_b))
    y_a = y_a[:n]
    y_b = y_b[:n]
    duration = float(n / sr_out)

    base_a = out_prefix.parent / f"{out_prefix.name}.original"
    base_b = out_prefix.parent / f"{out_prefix.name}.candidate"
    a_summary = analyze_audio(original, base_a, sr, hop_length, n_fft, n_mels, fmin, fmax)
    b_summary = analyze_audio(candidate, base_b, sr, hop_length, n_fft, n_mels, fmin, fmax)

    times_a, f0_a, voiced_a, _ = compute_f0(y_a, sr_out, hop_length, fmin, fmax)
    times_b, f0_b, voiced_b, _ = compute_f0(y_b, sr_out, hop_length, fmin, fmax)
    m = min(len(f0_a), len(f0_b))
    f0_a = f0_a[:m]
    f0_b = f0_b[:m]
    voiced = voiced_a[:m] & voiced_b[:m] & np.isfinite(f0_a) & np.isfinite(f0_b) & (f0_a > 0) & (f0_b > 0)
    cents = np.array([], dtype=np.float32)
    if np.any(voiced):
        cents = 1200.0 * np.log2(f0_b[voiced] / f0_a[voiced])

    db_a = mel_db(y_a, sr_out, hop_length, n_fft, n_mels)
    db_b = mel_db(y_b, sr_out, hop_length, n_fft, n_mels)
    cols = min(db_a.shape[1], db_b.shape[1])
    db_a = db_a[:, :cols]
    db_b = db_b[:, :cols]
    diff = db_b - db_a

    diff_png = artifact_path(out_prefix, ".mel-diff.png")
    overlay_png = artifact_path(out_prefix, ".f0-overlay.png")
    plot_mel_diff(diff_png, diff, sr_out, hop_length, f"candidate - original mel dB: {original.name} vs {candidate.name}")
    plt.figure(figsize=(12, 4))
    plt.plot(times_a[:m], f0_a[:m], label="original", linewidth=1.2)
    plt.plot(times_b[:m], f0_b[:m], label="candidate", linewidth=1.2, alpha=0.8)
    plt.ylim(fmin, fmax)
    plt.xlabel("time (s)")
    plt.ylabel("f0 (Hz)")
    plt.title("f0 overlay")
    plt.grid(True, alpha=0.25)
    plt.legend()
    plt.tight_layout()
    plt.savefig(overlay_png, dpi=140)
    plt.close()

    # Normalized waveform correlation is only a rough sanity check for timing/shape.
    a_norm = y_a - np.mean(y_a)
    b_norm = y_b - np.mean(y_b)
    waveform_corr = correlation(a_norm, b_norm)

    comparison = {
        "original": a_summary,
        "candidate": b_summary,
        "duration_compared_seconds": duration,
        "outputs": {
            "mel_diff_png": str(diff_png),
            "f0_overlay_png": str(overlay_png),
        },
        "pitch": {
            "voiced_overlap_ratio": float(np.mean(voiced)) if voiced.size else 0.0,
            "cents_error": stats(cents),
            "mean_abs_cents": None if cents.size == 0 else float(np.mean(np.abs(cents))),
            "f0_hz_correlation": correlation(f0_a[voiced], f0_b[voiced]) if np.any(voiced) else None,
        },
        "spectrogram": {
            "mel_db_mean_abs_diff": float(np.mean(np.abs(diff))),
            "mel_db_rmse": float(np.sqrt(np.mean(diff ** 2))),
            "mel_db_correlation": correlation(db_a.flatten(), db_b.flatten()),
        },
        "waveform": {
            "normalized_correlation": waveform_corr,
        },
    }
    return comparison


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["analyze", "compare"])
    parser.add_argument("--audio", type=Path)
    parser.add_argument("--original", type=Path)
    parser.add_argument("--candidate", type=Path)
    parser.add_argument("--out-json", required=True, type=Path)
    parser.add_argument("--out-prefix", required=True, type=Path)
    parser.add_argument("--sr", type=int, default=DEFAULT_SR)
    parser.add_argument("--hop-length", type=int, default=DEFAULT_HOP)
    parser.add_argument("--n-fft", type=int, default=DEFAULT_N_FFT)
    parser.add_argument("--n-mels", type=int, default=DEFAULT_N_MELS)
    parser.add_argument("--fmin", type=float, default=DEFAULT_FMIN)
    parser.add_argument("--fmax", type=float, default=DEFAULT_FMAX)
    args = parser.parse_args()

    args.out_json.parent.mkdir(parents=True, exist_ok=True)
    args.out_prefix.parent.mkdir(parents=True, exist_ok=True)

    if args.command == "analyze":
        if not args.audio:
            raise SystemExit("--audio is required for analyze")
        result = analyze_audio(args.audio, args.out_prefix, args.sr, args.hop_length, args.n_fft, args.n_mels, args.fmin, args.fmax)
    else:
        if not args.original or not args.candidate:
            raise SystemExit("--original and --candidate are required for compare")
        result = compare_audio(args.original, args.candidate, args.out_prefix, args.sr, args.hop_length, args.n_fft, args.n_mels, args.fmin, args.fmax)

    result["command"] = args.command
    result["out_json"] = str(args.out_json)
    args.out_json.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
