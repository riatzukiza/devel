# Fork Tales Gemma Audio Agent Harness

This is the canonical devel-level prototype for the audio reconstruction loop. Knoxx may reference or delegate to it, but it is not an eta-mu extension and is not a replacement Knoxx workflow until proven.

Contract-shaped interface notes live in [`fork-tales-audio-reconstruction-contract.md`](./fork-tales-audio-reconstruction-contract.md).

The higher-level role and handoff model lives in [`fork-tales-audio-agent-operating-model.md`](./fork-tales-audio-agent-operating-model.md). Machine-readable handoff definitions live in [`fork-tales-audio-handoff-schemas.json`](./fork-tales-audio-handoff-schemas.json).

The harness lives at:

`scripts/fork_tales_audio_agent.cljs`

It is intentionally not an eta-mu extension and does not change eta-mu CLI behavior. It uses eta-mu SDK-shaped audio maps internally:

```clojure
{:type "audio"
 :data "<raw-base64>"
 :mimeType "audio/wav"
 :format "wav"}
```

At the boundary it sends the proven OpenAI-compatible Ollama audio-first payload to `gemma4:e4b-128k`.

## Artifacts

Each case directory contains:

- `labels.edn` for file labels and notes.
- `receipts.edn` as an append-only tool/model ledger.
- `slices/` for generated 16k mono WAV excerpts.
- `responses/` for raw Gemma JSON responses.
- `metrics/` for standalone f0/spectrogram analysis outputs.
- `checks/<check-id>/` for deterministic Gemma Check evidence bundles: full-band slices, STT slices, A/B audio, f0 CSV/PNG, mel spectrogram PNGs, metrics JSON, and `evidence.json`.
- `audits/<audit-id>/` exists only for legacy runs created before the Gemma Check role split.

## Commands

Initialize a case:

```bash
nbb scripts/fork_tales_audio_agent.cljs init --case-dir /home/err/devel/Music/fork-tales/references/heresy-between/diagnostics/gemma-agent
```

Slice audio:

```bash
nbb scripts/fork_tales_audio_agent.cljs slice --case-dir <case-dir> --in <input.wav> --start 0 --duration 10 --out <slice.wav>
```

Filter audio:

```bash
nbb scripts/fork_tales_audio_agent.cljs filter --case-dir <case-dir> --kind speech --in <input.wav> --out <filtered.wav>
```

Label an artifact:

```bash
nbb scripts/fork_tales_audio_agent.cljs label --case-dir <case-dir> --file <path> --labels opening,wrong-syllables --note "Gemma hears candidate syllables diverging immediately."
```

Ask Gemma about one or more audio files:

```bash
nbb scripts/fork_tales_audio_agent.cljs ask --case-dir <case-dir> --audio <a.wav>,<b.wav> --prompt "Transcribe A and B separately. Return JSON only."
```

Start a persistent listening session:

```bash
nbb scripts/fork_tales_audio_agent.cljs session-init \
  --case-dir <case-dir> \
  --session-id heresy-opening \
  --goal "Learn why OpenUTAU is not singing the same opening words as the isolated vocal." \
  --original <vocals.wav> \
  --candidate <openutau.wav> \
  --lyrics <lyrics.txt>
```

Hear exactly one segment in that session:

```bash
nbb scripts/fork_tales_audio_agent.cljs hear \
  --case-dir <case-dir> \
  --session-id heresy-opening \
  --role original \
  --audio <vocals.wav> \
  --start 0 \
  --duration 6 \
  --expected "げんきだよって一行だけのメッセージ"
```

`hear` sends one audio slice only, stores the response under `responses/`, and appends the turn to `sessions/<session-id>.edn`. Use it for original and candidate in separate turns when A/B prompts contaminate the model.

Run local timed STT on one segment as a second, non-Gemma ear:

```bash
nbb scripts/fork_tales_audio_agent.cljs stt \
  --case-dir <case-dir> \
  --session-id heresy-opening \
  --role candidate \
  --audio <candidate.wav> \
  --start 0 \
  --duration 8
```

`stt` uses the local Knoxx STT endpoint at `http://127.0.0.1:8010/transcribe-timed`, stores the JSON under `responses/`, and appends the transcript to the session. Do not restart Knoxx for this; only call it if the service is already up.

Compare original vs candidate:

```bash
nbb scripts/fork_tales_audio_agent.cljs compare \
  --case-dir <case-dir> \
  --original <original-vocal.wav> \
  --candidate <openutau.wav> \
  --start 0 \
  --duration 10 \
  --task "Find the first wrong syllable and recommend the next tool action."
```

`compare` deliberately creates one combined A/B WAV instead of sending two separate audio inputs. The combined file layout is:

`A original -> short separator beep -> B candidate`

This is more stable with the current Ollama/OpenAI-compatible `gemma4:e4b-128k` transport than multiple `input_audio` parts in one request.

Generate deterministic f0/spectrogram evidence without calling Gemma:

```bash
nbb scripts/fork_tales_audio_agent.cljs metrics \
  --case-dir <case-dir> \
  --role opening-v16 \
  --original <original-slice.wav> \
  --candidate <candidate-slice.wav>
```

`metrics` uses `/home/err/devel/scripts/fork_tales_audio_metrics.py` through the local MIR workbench venv at `/home/err/devel/Music/fork-tales/references/mir-workbench/.venv/bin/python`. It writes JSON plus visual artifacts:

- `<role>.original.f0.csv` and `<role>.candidate.f0.csv`
- `<role>.original.f0.png` and `<role>.candidate.f0.png`
- `<role>.original.mel.png` and `<role>.candidate.mel.png`
- `<role>.f0-overlay.png`
- `<role>.mel-diff.png`
- `<role>.json`

Run a grounded Gemma Check that gives Gemma the audio first and then explicit tool evidence:

```bash
nbb scripts/fork_tales_audio_agent.cljs gemma-check \
  --case-dir <case-dir> \
  --session-id heresy-v16-audit \
  --role timeline-v16 \
  --original <original-vocal.wav> \
  --candidate <candidate-render.wav> \
  --start 55.26 \
  --duration 6 \
  --expected "タイムラインには知らない誰かの笑顔"
```

`gemma-check` is the transparent pre-review checker for future reconstruction claims. It is a cheap local sub-agent/tool called by the Primary Agent between execution phases, closer to lint/typecheck/unit-test than to final QC. The older command name `audit` remains as a legacy alias.

It produces:

1. full-band original/candidate slices for signal analysis,
2. 16k STT slices and local timed STT JSON,
3. a single A/B audio file for Gemma (`A original -> separator -> B candidate`),
4. f0/pitch and mel-spectrogram metrics via local Python,
5. `evidence.json`, and
6. a Gemma JSON response under `responses/` that must separate direct listening, STT evidence, pitch metrics, spectrogram metrics, hypotheses, confidence, and next tool actions.

Keep Gemma Check windows short. A 14s segment becomes roughly 29s of A/B audio and can exhaust the local model runner. Prefer 4-8s phrase windows, then aggregate the evidence at the session level.

Grade an audit evidence bundle with feature-specific judge weights:

```bash
nbb scripts/fork_tales_audio_agent.cljs grade \
  --case-dir <case-dir> \
  --evidence <case-dir>/checks/<check-id>/evidence.json \
  --profile suno_reverse_accuracy
```

`grade` uses [`fork-tales-audio-rubrics.json`](./fork-tales-audio-rubrics.json) and `/home/err/devel/scripts/fork_tales_audio_grade.py`. It outputs a weighted grade JSON beside the evidence bundle. The grade is not authoritative; it reports feature score, evidence confidence, evidence coverage, critical gate status, missing judges, and promotion eligibility.

Prepare a spectrogram/f0 image-judge prompt:

```bash
nbb scripts/fork_tales_audio_agent.cljs image-judge-prompt \
  --case-dir <case-dir> \
  --evidence <case-dir>/checks/<check-id>/evidence.json \
  --profile suno_reverse_accuracy
```

This writes a prompt, request manifest, and JSON response template next to the audit. Give the prompt plus listed images to a vision-capable judge. It should score only visually supported features such as pitch contour, pitch expression, delivery shape, timbre/spectral similarity, onset/hold timing, and very weak/low-confidence lyric timing. It must not claim exact transcription from images.

Normalize the vision judge response into grade-compatible evidence:

```bash
nbb scripts/fork_tales_audio_agent.cljs image-judge-import \
  --case-dir <case-dir> \
  --evidence <case-dir>/checks/<check-id>/evidence.json \
  --response <case-dir>/checks/<check-id>/spectrogram-image-judge-response.json
```

Then pass `--judge-scores <case-dir>/checks/<check-id>/spectrogram-image-judge-scores.json` to `grade`.

Validate role handoff packets against the executable loop specs:

```bash
nbb scripts/fork_tales_audio_agent.cljs handoff-validate \
  --case-dir <case-dir> \
  --packets planner-assignment.json,qc-review.json \
  --catalog approved-reference-catalog.json
```

`handoff-validate` enforces the current μ-specs: accepted artifacts carry provenance/source span/unresolved issues; QC rejection has actionable required actions; human rejection has domain+span structure; composition mode references are approved; and Planner restarts carry prior plan, failed artifacts, adjudication output, and review feedback.

## Agentic Loop

1. Planner chooses a suspect phrase-sized region from the isolated vocal, not from lyric text alone.
2. Run `gemma-check` before Primary handoff when making any reconstruction-quality claim; run `hear`/`stt` separately only when A/B audio appears contaminated or too long.
3. Treat local STT as a noisy sensor, not a judge. Homophones such as `タイムラインには知らない` vs `タイムラインに走らない` require lyric-aware interpretation.
4. Treat f0 and spectrogram metrics as signal evidence, not musical truth. Large pitch error means the branch is not pitch-solved even if words are intelligible.
5. Gemma receives the audio before text and then receives `evidence.json` as tool evidence. Its response is a structured diagnosis, not ground truth.
6. Optionally run `image-judge-prompt` and `image-judge-import` to add vision/spectrogram evidence.
7. Run `grade` to combine feature-specific evidence weights; inspect score, confidence, coverage, and missing judges separately.
8. Planner/Primary executes only known local tools: `slice`, `filter`, `label`, `note`, `hear`, `stt`, `metrics`, `gemma-check`, `audit` (legacy alias), `grade`, `image-judge-prompt`, `image-judge-import`, or another `ask`.
9. Every action appends to `receipts.edn`; session observations also append to `sessions/<session-id>.edn`.
10. Once a region has stable lyric, timing, and pitch hypotheses, generate the next OpenUTAU branch from the labeled EDN data.

## Transport Notes

- Use `gemma4:e4b-128k`, an Ollama alias created from `gemma4:e4b` with `num_ctx 131072`.
- The OpenAI-compatible path ignored per-request `num_ctx` for the original model; `/api/ps` stayed at `context_length: 4096`.
- The model accepts audio only when audio appears before text in the content list.
- Multiple `input_audio` parts were unstable or ignored in this local setup; single-file A/B is the current reliable path.

## Current Reconstruction Priorities

1. Lyric/syllable correctness.
2. Rhythm and meter.
3. Pitch contour.
4. Delivery/timbre.

The current v16 OpenUTAU branch is a reproducible lyric-intelligibility baseline, not a pitch-correct reconstruction. Future v17+ claims must cite their evidence type explicitly: local STT, Gemma audit, f0/pitch metrics, spectrogram metrics, USTX grid diff, or human/user judgment.
