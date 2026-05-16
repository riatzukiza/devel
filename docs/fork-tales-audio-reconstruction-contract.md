# Fork Tales Audio Reconstruction Agent Contract

This is the contract-shaped interface for the local audio reconstruction workflow. Knoxx may project this into EDN contracts later, but the current executable boundary is the NBB harness:

```bash
nbb /home/err/devel/scripts/fork_tales_audio_agent.cljs <command> [--key value]
```

The role-level Scribe/Composition operating model is defined in [`fork-tales-audio-agent-operating-model.md`](./fork-tales-audio-agent-operating-model.md).

## Purpose

Reconstruct owned reference audio into reusable musical artifacts (MIDI/OpenUTAU/render units) through an auditable loop. The loop must distinguish:

- lyric intelligibility,
- rhythm/timing,
- pitch contour,
- timbre/spectral match,
- model judgment,
- and human judgment.

A candidate render is not “solved” unless the claim names which evidence class supports it.

## Agent Contract

```edn
{:contract/id :fork-tales/audio-reconstruction-auditor
 :contract/version 1
 :runtime/boundary :nbb-local-harness
 :runtime/entrypoint "/home/err/devel/scripts/fork_tales_audio_agent.cljs"
 :capabilities #{:read :workspace-media :bash-local :audio-editing :multimodal-audio}
 :forbidden #{:paid-api :unowned-audio :silent-service-restart :overwrite-history}
 :inputs {:original-audio :path
          :candidate-audio :path
          :case-dir :path
          :segment-start-seconds :float
          :segment-duration-seconds :float
          :expected-lyrics-clue [:optional :string]
          :candidate-manifest [:optional :path]
          :ustx-or-midi [:optional :path]}
 :outputs {:evidence-json :path
           :metrics-json :path
           :stt-json [:vector :path]
           :gemma-response-json [:optional :path]
           :f0-csv [:vector :path]
           :spectrogram-png [:vector :path]
           :weighted-grade-json :path
           :spectrogram-image-judge-request [:optional :path]
           :spectrogram-image-judge-scores [:optional :path]
           :receipts :path
           :decision-ledger-entry :map}
 :invariants ["original audio/stem is timing truth"
              "lyrics are dictionary clues, never timing truth"
              "local STT is a noisy sensor, not the judge"
              "Gemma consumes audio before text and receives tool evidence"
              "pitch claims require f0/pitch evidence"
              "spectral/timbre claims require spectrogram or signal evidence"
              "new candidates use new versioned paths"]}
```

## Command Surface

### `gemma-check` / legacy `audit`

Primary local pre-review checker. Creates slices, local STT evidence, deterministic f0/spectrogram metrics, a single A/B audio file, `evidence.json`, a Gemma response, and receipts.

This is not the QC Reviewer. It is a tool/sub-agent called by the Primary Agent, analogous to lint/typecheck/unit-test: useful friction before `handoff`, not a guarantee of success. `audit` is retained as a legacy alias for `gemma-check`.

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

### `metrics`

Deterministic signal-only analysis. Does not call Gemma.

```bash
nbb /home/err/devel/scripts/fork_tales_audio_agent.cljs metrics \
  --case-dir <case-dir> \
  --role <role> \
  --original <original-slice.wav> \
  --candidate <candidate-slice.wav>
```

### `hear` and `stt`

Use for single-audio model turns and local STT checks when A/B contamination or model resource limits appear.

### `grade`

Feature-specific evidence weighting. Reads an `evidence.json`, applies a rubric profile from [`fork-tales-audio-rubrics.json`](./fork-tales-audio-rubrics.json), and writes score/confidence/coverage/gate results.

```bash
nbb /home/err/devel/scripts/fork_tales_audio_agent.cljs grade \
  --case-dir <case-dir> \
  --evidence <case-dir>/checks/<check-id>/evidence.json \
  --profile suno_reverse_accuracy
```

Profiles:

- `suno_reverse_accuracy`: exactness against owned source audio.
- `curated_original_quality`: quality and instruction-following for new original tracks derived from curated references.

### `image-judge-prompt` / `image-judge-import`

Optional spectrogram/f0 image evidence path. The prompt command creates a calibrated prompt and response template from `evidence.json`; the import command normalizes the vision response into `judge_scores` for `grade`.

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

Invariant: image judges are moderate evidence for pitch/delivery/timbre and weak evidence for transcription.

### `handoff-validate`

Validate Planner/Primary/Adjudication/QC/Human handoff packets against the current executable μ-specs.

```bash
nbb /home/err/devel/scripts/fork_tales_audio_agent.cljs handoff-validate \
  --case-dir <case-dir> \
  --packets planner-assignment.json,qc-review.json \
  --catalog approved-reference-catalog.json
```

This wraps `/home/err/devel/scripts/fork_tales_handoff_validate.py` and schema definitions from [`fork-tales-audio-handoff-schemas.json`](./fork-tales-audio-handoff-schemas.json).

## Gemma vs Smart Reviewer

The smart reviewer appears after Primary handoff as the **QC Reviewer Agent**. It is expected to be a stronger multimodal model with the authority to `accept`, `revise`, or `reject` the submitted bundle.

`gemma4:e4b` audio is earlier and narrower:

- called by Primary during execution,
- local/cheap/fast,
- emits bounded observations and suggested next actions,
- informs grade/adjudication evidence,
- does not accept final work.

## Evidence JSON Schema

`gemma-check` writes `checks/<check-id>/evidence.json`; the legacy `audit` alias still writes `audits/<audit-id>/evidence.json` for backward compatibility:

```json
{
  "schema_version": "fork-tales-audio-check-evidence/v1",
  "audit_id": "string kept for backward compatibility",
  "check_id": "string",
  "created_at": "ISO-8601",
  "segment": {
    "start_seconds": 0.0,
    "duration_seconds": 6.0,
    "expected": "lyric clue",
    "task": "operator instruction"
  },
  "files": {
    "original": "path",
    "candidate": "path",
    "original_fullband_slice": "path",
    "candidate_fullband_slice": "path",
    "original_stt_slice": "path",
    "candidate_stt_slice": "path",
    "ab_audio": "path"
  },
  "transcription": {
    "tool": "local-stt/transcribe-timed",
    "original": {"text": "string", "response_file": "path"},
    "candidate": {"text": "string", "response_file": "path"}
  },
  "metrics": {
    "tool": "/home/err/devel/scripts/fork_tales_audio_metrics.py",
    "json": "path",
    "outputs": {"mel_diff_png": "path", "f0_overlay_png": "path"},
    "pitch": {"mean_abs_cents": 0.0, "f0_hz_correlation": 0.0},
    "spectrogram": {"mel_db_rmse": 0.0, "mel_db_correlation": 0.0},
    "waveform": {"normalized_correlation": 0.0}
  }
}
```

## Decision Ledger Entry

Every candidate decision should be reducible to:

```edn
{:candidate/id "v16/timeline/55.26-69.26"
 :inputs {:original "path" :candidate "path" :manifest "path"}
 :segment {:start 55.26 :duration 6.0 :expected "..."}
 :evidence {:local-stt "path"
            :gemma "path-or-nil"
            :metrics "path"
            :weighted-grade "path"
            :spectrogram-image-judge "path-or-nil"
            :f0-overlay "path"
            :mel-diff "path"}
 :judgment {:lyric :pass|:fail|:ambiguous
            :rhythm :pass|:fail|:ambiguous
            :pitch :pass|:fail|:ambiguous
            :timbre :pass|:fail|:ambiguous}
 :confidence 0.0
 :failure-mode "specific mismatch"
 :next-action "specific deterministic command or generator edit"}
```

## Current Baseline

Current baseline is v16:

- `/home/err/devel/Music/fork-tales/references/heresy-between/reconstructions/openutau/heresy-between-exact-phrase-grid-openutau-v16.wav`
- `/home/err/devel/Music/fork-tales/references/heresy-between/reconstructions/openutau/heresy-between-exact-phrase-grid-openutau-v16.json`

v16 is a reproducible lyric-intelligibility baseline, not a pitch-solved reconstruction. Future branches should cite `audit` artifacts before claiming improvement.
