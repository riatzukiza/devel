# Fork Tales Audio Rubrics and Grading Loop

This document defines the evidence-weighted rubric for two related workflows:

1. **Suno reverse-engineering / reconstruction**: recover what an owned Suno audio file actually sings and plays, then rebuild it as stems, MIDI, OpenUTAU, USTX, and reference renders.
2. **Curated original generation**: use the best reverse-engineered Suno references as a dataset/style compass for creating new original Fork Tales tracks, where quality and instruction-following matter more than exact reconstruction.

The machine-readable rubric lives in [`fork-tales-audio-rubrics.json`](./fork-tales-audio-rubrics.json).

The cross-agent role/handoff model that wraps this rubric lives in [`fork-tales-audio-agent-operating-model.md`](./fork-tales-audio-agent-operating-model.md).

## Core Principle

No judge is authoritative. Every judge is feature-specific evidence.

A statement like “v16 passed” is invalid unless it names the feature and evidence class:

- local-STT lyric anchor pass,
- Gemma audio audit pass,
- f0/pitch contour pass,
- spectrogram/timbre pass,
- USTX/MIDI grid pass,
- image/spectrogram judge pass,
- or human/user judgment.

The grading system therefore separates:

```text
feature score != judge confidence != evidence coverage != promotion decision
```

## Evidence Classes

| Evidence class | Strongest for | Weak for | Notes |
|---|---|---|---|
| `lyric_prompt` | intended lyrics, style prompt, dictionary clue | actual sung timing, Suno deviations | Prompt text is not ground truth. |
| `local_stt` | lyric identity, rough word/phrase timing | pitch, inflection, held notes | Heavier than Gemma for lyrics/timing, but homophone-prone. |
| `gemma_audio` | broad audio audit, delivery, phrasing, mismatch explanation | exact pitch, exact Japanese consonants, long A/B windows | Useful as a reasoning judge over tool evidence. |
| `f0_tracker` | pitch notes, pitch contour, slides, vibrato | words, timbre, unvoiced phonemes | Must handle octave errors and stem bleed. |
| `spectrogram_metrics` | timbre/spectral distance, energy/onset proxies | lyrics, human style intent | Deterministic but not semantic. |
| `spectrogram_image_judge` | pitch contour, delivery shapes, vibrato, onsets | transcription, exact lyrics | Vision can infer voice features from images, but should be low weight for lyrics. |
| `ustx_midi_grid` | symbolic timing, note grid, phoneme-note mapping, renderability | whether rendered audio actually sounds right | Grid truth must be audited against audio. |
| `human_user` | taste, intent, language nuance, final accept/reject | consistency at scale | Use sparingly but preserve as high-value evidence. |
| `gemini_text_audio` | optional high-level lyric reconciliation and quality critique | local/free guarantee | Non-local optional assist, never required for the free/local loop. |

## Case 1: Suno Reverse-Engineering Accuracy

### Objective

Given owned Suno audio, lyrics, style prompt, and usually multiple Suno variants, recover the actual performed piece as faithfully as possible.

### Feature Weights

| Feature | Weight | Meaning |
|---|---:|---|
| `lyric_identity` | 0.16 | What syllables/words are actually sung? |
| `lyric_timing` | 0.12 | Are word/phoneme boundaries at the right times? |
| `phoneme_beat_mapping` | 0.10 | Are syllables mapped to beats/notes correctly, including melisma? |
| `rhythm_grid` | 0.12 | Are durations, rests, ties, subdivisions, and meter correct? |
| `pitch_notes` | 0.16 | Are MIDI notes/key/intervals correct? |
| `pitch_expression` | 0.12 | Are slides, bends, trills, vibrato, and held-note contours captured? |
| `delivery_inflection` | 0.09 | Does phrasing/dynamics/articulation resemble the source? |
| `timbre_spectral` | 0.07 | Does spectral envelope/tone resemble the source enough for the task? |
| `stem_score_separation` | 0.04 | Are stems/instrument tracks separated and transcribed usefully? |
| `prompt_drift_accounting` | 0.02 | Are Suno lyric/style prompt deviations explicitly recorded? |

### Critical Gates

A reverse-engineered candidate should not be promoted as a reference-quality reconstruction unless:

- overall score ≥ `0.82`,
- confidence ≥ `0.62`,
- evidence coverage ≥ `0.60`,
- `lyric_identity` ≥ `0.84`,
- `lyric_timing` ≥ `0.78`,
- `pitch_notes` ≥ `0.74`,
- `rhythm_grid` ≥ `0.76`.

A candidate may still be useful as a diagnostic branch even if it fails promotion.

### Feature-Specific Judge Bias

For reverse-engineering:

- Lyrics/timing: local STT is weighted heavier than Gemma.
- Pitch: f0 trackers and spectrogram evidence dominate; STT has effectively zero pitch weight.
- Delivery: Gemma, f0 dynamics, spectrogram image reading, and human judgment all matter.
- Image analysis: moderate for pitch/delivery/timbre, very low for transcription.
- Prompt text: useful clue, low authority against actual audio.

## Case 2: Curated Original Track Quality

### Objective

Use high-scoring reconstructed references as a curated dataset/style compass, then create new original tracks. Exact match to a source recording is not the goal; quality, identity, and instruction-following are.

### Feature Weights

| Feature | Weight | Meaning |
|---|---:|---|
| `instruction_following` | 0.16 | Did the track obey the creative brief/style prompt? |
| `lyric_diction_quality` | 0.10 | Are lyrics clear, well-pronounced, and intentional? |
| `melody_quality` | 0.13 | Is the melody strong, singable, and emotionally legible? |
| `rhythm_groove` | 0.11 | Does timing/groove feel intentional and stable? |
| `delivery_inflection` | 0.14 | Is the performance expressive and genre-appropriate? |
| `arrangement_coherence` | 0.12 | Do sections, instruments, and dynamics form a coherent track? |
| `mix_translation` | 0.10 | Does the mix translate across spectral/energy checks? |
| `fork_tales_identity` | 0.08 | Does it preserve the JP/EN, mythic, emotional Fork Tales identity? |
| `renderability` | 0.04 | Can it be turned into OpenUTAU/MIDI/stems without heroic rescue? |
| `novelty_without_drift` | 0.02 | Is it new without violating the brief? |

### Critical Gates

A new original candidate should not be promoted into the curated dataset unless:

- overall score ≥ `0.80`,
- confidence ≥ `0.58`,
- evidence coverage ≥ `0.52`,
- `instruction_following` ≥ `0.78`,
- `musical_quality` / melody quality ≥ `0.80`,
- `delivery_inflection` ≥ `0.72`,
- `mix_translation` ≥ `0.70`.

## Weighted Grade Formula

Each feature receives judge outputs:

```edn
{:feature :pitch_notes
 :judge :f0_tracker
 :score 0.72
 :confidence 0.81
 :evidence-ref "metrics.json"
 :notes "Mean absolute cents error 96c; f0 correlation 0.62."}
```

For a feature `f` and judge `j`:

```text
effective_weight(f,j) = reliability(profile,f,j) × confidence(j)
feature_score(f) = Σ(score(f,j) × effective_weight(f,j)) / Σ(effective_weight(f,j))
feature_coverage(f) = Σ(reliability(profile,f,j) for available judges) / Σ(reliability(profile,f,j) for configured judges)
```

Overall:

```text
overall_score = Σ(feature_score(f) × feature_importance(f) × feature_confidence(f))
              / Σ(feature_importance(f) × feature_confidence(f))

overall_coverage = weighted mean of feature_coverage(f)
overall_confidence = weighted mean of feature_confidence(f), penalized for judge disagreement
```

Promotion is gate-based, not just average-based. A high timbre score cannot compensate for failed lyric identity in reverse-engineering. A beautiful melody cannot compensate for total instruction failure in original-track generation.

## Spectrogram/F0 Image Judge

Image analysis is a third/fourth judge class. It is useful because f0 overlays and spectrograms visibly encode pitch contour, onsets, holds, vibrato, spectral brightness, and some delivery shape. It is weak for exact words.

Generate a calibrated prompt and response template from an existing audit:

```bash
nbb scripts/fork_tales_audio_agent.cljs image-judge-prompt \
  --case-dir <case-dir> \
  --evidence <case-dir>/checks/<check-id>/evidence.json \
  --profile suno_reverse_accuracy
```

This writes, beside the audit evidence:

- `spectrogram-image-judge-prompt.md`
- `spectrogram-image-judge-request.json`
- `spectrogram-image-judge-response-template.json`

Give the prompt plus listed images to a vision-capable judge. The judge must return JSON with:

```json
{
  "schema_version": "fork-tales-spectrogram-image-judge/v1",
  "judge": "spectrogram_image_judge",
  "feature_judgments": [
    {
      "feature": "pitch_notes",
      "score": 0.0,
      "confidence": 0.0,
      "observations": [],
      "failure_modes": [],
      "image_roles_used": ["f0_overlay"]
    }
  ]
}
```

Normalize the response into grade-compatible judge scores:

```bash
nbb scripts/fork_tales_audio_agent.cljs image-judge-import \
  --case-dir <case-dir> \
  --evidence <case-dir>/checks/<check-id>/evidence.json \
  --response <case-dir>/checks/<check-id>/spectrogram-image-judge-response.json
```

Then include it in grading:

```bash
nbb scripts/fork_tales_audio_agent.cljs grade \
  --case-dir <case-dir> \
  --evidence <case-dir>/checks/<check-id>/evidence.json \
  --profile suno_reverse_accuracy \
  --judge-scores <case-dir>/checks/<check-id>/spectrogram-image-judge-scores.json
```

Calibration rules:

- `pitch_notes`: use f0 overlay most heavily.
- `pitch_expression`: use f0 overlay for slides/bends/vibrato/held-note contours.
- `delivery_inflection`: combine f0 motion with mel energy/onset/release shapes.
- `timbre_spectral`: use original/candidate mel images and mel-diff.
- `rhythm_grid` and `lyric_timing`: use onsets, gaps, holds, and phrase boundaries; confidence should be moderate.
- `lyric_identity`: usually null or low confidence. Do not transcribe from images unless syllable count/onset evidence is visually obvious.

## Grade Bands

| Grade | Score | Meaning |
|---|---:|---|
| A | ≥ 0.90 | Excellent; promote unless a critical gate fails. |
| B | ≥ 0.80 | Usable; promote if coverage/confidence gates pass. |
| C | ≥ 0.65 | Diagnostic; keep evidence but do not promote as final. |
| D | ≥ 0.50 | Poor; useful mainly for failure analysis. |
| F | < 0.50 | Failed or insufficient. |

## Reverse-Engineering Loop

1. **Ingest**
   - Store original Suno WAV/MP3, lyric prompt, style prompt, metadata, and all generated variants.
   - Record which audio is owned and allowed.

2. **Separate**
   - Generate stems: vocals, piano, bass, guitar, drums, etc.
   - Treat the isolated vocal/instrument stem as timing truth for that source.

3. **Segment**
   - Align into phrase-sized windows.
   - Prefer 4-8 seconds for Gemma Check A/B windows.
   - Preserve absolute song timeline positions.

4. **Extract evidence**
   - local STT for original and candidate,
   - f0 contours and pitch metrics,
   - mel spectrograms and diff images,
   - USTX/MIDI note grids,
   - optional image-judge readings of f0/spectrogram plots,
   - Gemma audio-first audit over audio + evidence JSON.

5. **Adjudicate**
   - Convert each judge output into feature-specific scores.
   - Aggregate with the rubric matrix.
   - Record score, confidence, coverage, disagreement, and failure mode.

6. **Diagnose**
   - Identify the feature bottleneck: lyrics, timing, pitch, expression, timbre, stem separation, or prompt drift.
   - Pick exactly one next repair target.

7. **Generate candidate**
   - Create a new versioned MIDI/USTX/OpenUTAU/render branch.
   - Never overwrite previous versions.

8. **Audit candidate**
   - Run `audit` and then `grade`.
   - Compare to previous branch by feature, not by vibes.

9. **Promote or reject**
   - Promote if gates pass.
   - Otherwise write the branch to the ledger as diagnostic evidence and continue.

## Curated Original Loop

1. **Select source exemplars**
   - Only use Suno references that passed reverse-engineering gates or were explicitly human-promoted.

2. **Extract style features**
   - Language balance, melodic contour archetypes, arrangement patterns, vocal delivery, section structure, spectral/mix profile.

3. **Write target brief**
   - Define lyrics, JP/EN balance, style constraints, allowed deviations, and desired emotional arc.

4. **Generate candidate**
   - Produce MIDI/OpenUTAU/audio candidate from the curated style map.

5. **Score quality**
   - Use `curated_original_quality`, not exact source reconstruction.
   - Judge instruction following, musical quality, delivery, arrangement, mix, identity, and renderability.

6. **Curate**
   - Add high-scoring candidates back into the dataset only with provenance and rubric scores.
   - Do not allow low-scoring generated tracks to silently train the next generation.

## Current Implementation Status

Implemented:

- `audit` evidence bundle in `scripts/fork_tales_audio_agent.cljs`
- deterministic f0/mel metrics in `scripts/fork_tales_audio_metrics.py`
- machine-readable rubric in `docs/fork-tales-audio-rubrics.json`
- first-pass grade aggregator in `scripts/fork_tales_audio_grade.py`
- calibrated spectrogram/f0 image-judge prompt + response normalizer in `scripts/fork_tales_spectrogram_image_judge.py`

Still needed:

- better Japanese/kana/mora edit scoring,
- CREPE/SPICE comparison against librosa.pyin,
- USTX/MIDI grid feature extraction,
- multi-variant Suno consensus scoring,
- human calibration data to tune weights.
