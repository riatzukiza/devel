---
name: audio-reconstruction-audit
description: Reconstruct or reproduce audio from an owned reference using local-only tools, with auditable STT, f0/pitch, spectrogram, Gemma, and receipt evidence before claiming success.
---

# Skill: Audio Reconstruction Audit

## Goal
Turn an owned WAV/MP3 plus candidate render into a deterministic evidence bundle that lets an agent improve reconstruction without confusing lyric intelligibility, pitch accuracy, and timbre similarity.

## Use This Skill When
- Rebuilding a song, vocal, MIDI, OpenUTAU/UTAU project, or reference render from owned audio.
- Auditing whether a generated candidate matches an original segment.
- The user asks for reproducible audio reconstruction, transcription verification, pitch comparison, spectrogram comparison, or a local Gemma-led audio judge.
- A previous pass “sounds right” only because STT matched some words.

## Do Not Use This Skill When
- The task is simple TTS or voice conversion with no reference-audit loop.
- The source audio is not owned or authorized for this workflow.
- The user wants paid/cloud-only APIs.
- A long full-song judgment is requested in one model call; split into phrase-sized windows first.

## Inputs
- Original/reference audio path.
- Candidate/render path.
- Case directory for artifacts.
- Phrase start and duration from the original vocal/audio timeline.
- Optional expected lyric text as a dictionary clue, not timing truth.
- Optional USTX/MIDI/generator manifest refs for later diagnosis.

## Canonical Local Harness
Use the devel-level NBB harness, not a new runtime:

```bash
nbb /home/err/devel/scripts/fork_tales_audio_agent.cljs <command> [--key value]
```

Default local tools:

- Gemma/Ollama: `gemma4:e4b-128k` via `http://192.168.12.68:11434`
- STT: `http://127.0.0.1:8010/transcribe-timed`
- Metrics Python: `/home/err/devel/Music/fork-tales/references/mir-workbench/.venv/bin/python`
- Metrics helper: `/home/err/devel/scripts/fork_tales_audio_metrics.py`
- Rubric config: `/home/err/devel/docs/fork-tales-audio-rubrics.json`
- Grade helper: `/home/err/devel/scripts/fork_tales_audio_grade.py`
- Spectrogram image judge helper: `/home/err/devel/scripts/fork_tales_spectrogram_image_judge.py`
- Role/handoff operating model: `/home/err/devel/docs/fork-tales-audio-agent-operating-model.md`
- Handoff validator: `/home/err/devel/scripts/fork_tales_handoff_validate.py`

Do not restart Knoxx/PM2 just to get STT. Only call the STT endpoint if it is already running or the user explicitly authorizes service work.

## Protocol
1. Choose a phrase-sized segment from the original audio. Prefer 4-8 seconds; A/B audio doubles the model input duration.
2. Run the grounded Gemma Check command:
   ```bash
   nbb /home/err/devel/scripts/fork_tales_audio_agent.cljs gemma-check \
     --case-dir <case-dir> \
     --session-id <session-id> \
     --role <role> \
     --original <original.wav> \
     --candidate <candidate.wav> \
     --start <seconds> \
     --duration <seconds> \
     --expected '<lyric clue>'
   ```
   `audit` is retained as a legacy alias, but conceptually this is a Primary-agent tool/sub-agent check, not the final QC Reviewer.
3. Inspect `checks/<check-id>/evidence.json`, `metrics.json`, f0 CSV/PNGs, mel spectrogram PNGs, local STT JSON, and Gemma response.
4. Run the weighted grader for feature-specific score/confidence/coverage:
   ```bash
   nbb /home/err/devel/scripts/fork_tales_audio_agent.cljs grade \
     --case-dir <case-dir> \
     --evidence <case-dir>/checks/<check-id>/evidence.json \
     --profile suno_reverse_accuracy
   ```
5. When vision/spectrogram evidence is useful, generate a calibrated prompt and import the response:
   ```bash
   nbb /home/err/devel/scripts/fork_tales_audio_agent.cljs image-judge-prompt \
     --case-dir <case-dir> \
     --evidence <case-dir>/checks/<check-id>/evidence.json \
     --profile suno_reverse_accuracy

   nbb /home/err/devel/scripts/fork_tales_audio_agent.cljs image-judge-import \
     --case-dir <case-dir> \
     --evidence <case-dir>/checks/<check-id>/evidence.json \
     --response <case-dir>/checks/<check-id>/spectrogram-image-judge-response.json
   ```
6. Treat evidence types separately:
   - STT text = noisy phonetic sensor, not truth.
   - Gemma = task-level auditor over audio + tool evidence, not truth.
   - f0 metrics = pitch-contour evidence, not lyric evidence.
   - mel/spectrogram metrics = timbre/spectral evidence, not semantic evidence.
   - spectrogram image judges = moderate pitch/delivery evidence, low lyric evidence.
   - lyrics = dictionary clue, not timing truth.
7. Record decisions as candidate/version ledger entries: inputs, render unit, STT output, Gemma output, pitch metrics, spectrogram metrics, image-judge scores, weighted grade, decision, confidence, and failure mode.
8. Iterate by writing a new candidate version; never overwrite historical renders/manifests.
9. For multi-agent Scribe/Composition workflows, validate Planner/Primary/Adjudication/QC/Human handoff packets:
   ```bash
   nbb /home/err/devel/scripts/fork_tales_audio_agent.cljs handoff-validate \
     --case-dir <case-dir> \
     --packets planner-assignment.json,qc-review.json \
     --catalog approved-reference-catalog.json
   ```

## Metrics Command
For deterministic signal evidence without Gemma:

```bash
nbb /home/err/devel/scripts/fork_tales_audio_agent.cljs metrics \
  --case-dir <case-dir> \
  --role <role> \
  --original <original-slice.wav> \
  --candidate <candidate-slice.wav>
```

Outputs include original/candidate f0 CSV, f0 plots, mel spectrograms, f0 overlay, mel-diff image, and JSON metrics such as mean absolute cents error, f0 correlation, mel dB RMSE, mel correlation, and waveform correlation.

## Gemma Prompt Discipline
- Audio must be sent before text.
- Prefer one audio file per model turn. For A/B, use the harness-created combined file: `A original -> beep -> B candidate`.
- If Gemma crashes or appears contaminated, shorten the segment and/or use separate `hear` turns before `gemma-check`.
- Always tell Gemma that STT is noisy and that pitch correctness cannot be inferred from transcription.
- Treat Gemma like lint/typecheck/unit-test: useful fast local friction before handoff, never a guarantee of desired musical result.

## Success Standard
A reconstruction claim must name its evidence class explicitly:

- local-STT anchor pass,
- Gemma audit pass,
- f0/pitch contour pass,
- spectrogram/timbre pass,
- USTX/MIDI grid diff pass,
- or human/user judgment.

Do not call a branch pitch-correct unless f0 evidence supports it. Do not call a branch lyric-correct solely from a homophone-prone STT transcript.

Use two rubric profiles:

- `suno_reverse_accuracy`: exactness against owned Suno/reference audio.
- `curated_original_quality`: quality, identity, and instruction-following for new original tracks derived from curated high-scoring references.

## Knoxx-Compatible Contract Shape
If projecting this into Knoxx, keep the runtime delegation boundary explicit:

- Agent role: audio reconstruction auditor.
- Allowed capabilities: read, workspace media, bash/local process, multimodal/audio, audio editing.
- Primary tool: invoke the NBB harness commands above.
- Required artifacts: `evidence.json`, metrics JSON/images, raw STT JSON, raw Gemma response, optional spectrogram image-judge scores, weighted grade JSON, receipts, candidate manifest.
- Invariant: Knoxx may orchestrate; it must not silently replace the deterministic local evidence path.
