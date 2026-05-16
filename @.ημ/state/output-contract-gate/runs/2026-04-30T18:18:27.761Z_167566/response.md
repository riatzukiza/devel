## Signal

(世, p=0.94) Yes. `orgs/open-hax/voxx/` currently has **two real audio-shaping/postprocess layers**, plus one **prompt-aware upstream style path** that is easy to confuse with postprocessing.

1. **Final backend-agnostic postprocess**
   - Enabled by default:
     ```bash
     TTS_POSTPROCESS_ENABLED=1
     TTS_POSTPROCESS_PROFILE=sports-commentator-v1
     ```
   - Aliases include `sports`, `broadcast`, `sports-commentator`, `sports-commentary`, `broadcast-sports`.
   - It is applied after synthesis from any backend: `kokoro`, `xiaomi_mimo`, `requesty`, `openai`, `melo`, or `espeak`.
   - Current profile is a conservative FFmpeg mastering chain:
     - highpass / lowpass
     - EQ presence boosts
     - compressor
     - limiter
     - output gain

2. **Melo-only narrator unifier**
   - Controlled by:
     ```bash
     TTS_NARRATOR_UNIFIER_ENABLED=1
     TTS_NARRATOR_EN_PITCH=1.02
     TTS_NARRATOR_JP_PITCH=0.97
     TTS_NARRATOR_EN_VARIANCE_DEPTH=0.02
     TTS_NARRATOR_VARIANCE_FREQ_HZ=4.5
     ```
   - Applied inside the local Melo path before final output conversion.
   - It does pitch shaping, light vibrato for English, level normalization, envelope shaping, and language-switch fades/gaps.

3. **Prompt-aware upstream style path: Xiaomi MiMo**
   - This is probably the thing you’re remembering.
   - It is **not local audio postprocessing**. Voxx sends a style prompt as a chat message:
     ```bash
     XIAOMI_MIMO_TTS_STYLE="Speak naturally and clearly."
     ```
   - Code sends:
     - user message = style prompt
     - assistant message = requested text
     - audio config = voice + format
   - If you set the style prompt to tell the model to honor tags, e.g.:
     ```bash
     XIAOMI_MIMO_TTS_STYLE="Interpret bracketed tags like [excited], [whisper], [pause], and [dramatic] as performance directions, not spoken words."
     ```
     then text like:
     ```text
     [excited] They are going for the comeback! [pause] Unbelievable!
     ```
     may produce tag-driven inflection **if the upstream model supports that behavior**.

(世, p=0.88) Current Voxx itself does **not** parse inflection tags into DSP spans. It passes text through to the backend. Tag awareness is provider/model behavior, mainly via the Xiaomi MiMo style-prompt bridge or any upstream TTS model that natively honors tags.

## Evidence

(世, p=0.96) Relevant implementation points:

- `orgs/open-hax/voxx/src/voice_gateway/config.py`
  - `TTS_POSTPROCESS_ENABLED`
  - `TTS_POSTPROCESS_PROFILE`
  - profile normalization aliases for `sports`, `broadcast`, etc.
  - `XIAOMI_MIMO_TTS_STYLE`
  - `TTS_NARRATOR_*` knobs

- `orgs/open-hax/voxx/src/voice_gateway/tts.py`
  - `_build_output_postprocess_filter_chain()` defines `sports-commentator-v1`.
  - `synthesize()` builds `output_postprocess_filters` once, then passes it into final conversion for every backend.
  - `_synthesize_with_melo()` applies the narrator unifier only in the Melo path.
  - `_synthesize_with_xiaomi_mimo()` sends `messages = [{"role": "user", "content": style}, {"role": "assistant", "content": text}]`.

- `orgs/open-hax/voxx/src/voice_gateway/audio_utils.py`
  - `convert_audio_bytes(..., audio_filters=...)` applies FFmpeg `-af <filters>`.
  - If source and target formats match and no filters are present, it returns original bytes.
  - If FFmpeg is missing or conversion fails, it fails open and returns original audio bytes.

- `orgs/open-hax/voxx/README.md`
  - Documents “Sports commentator postprocess”.
  - Says the final backend-agnostic postprocess shapes output from any TTS backend.

(世, p=0.82) Historical note: a prior commit had a direct ElevenLabs backend with `voice_settings` (`stability`, `similarity_boost`, `style`, `speaker_boost`, `speed`), but current `HEAD` has commit `39dafe7 Disable direct proprietary voice backend`, so direct ElevenLabs is no longer active in the current implementation. The `.env.example` still contains `ELEVENLABS_*` entries, but current `config.py` no longer reads them.

## Frames

(汝, p=0.78) If by “post processing” you meant **local deterministic audio processing**, then the real feature is `sports-commentator-v1` plus the Melo narrator unifier.

(汝, p=0.74) If by “prompt aware one with tags” you meant **inflection tags like `[excited]` or `[whisper]`**, that is not currently a Voxx parser. It is closest to the Xiaomi MiMo style-prompt backend path, where tags can be interpreted by the upstream model if instructed.

(汝, p=0.66) If you were remembering ElevenLabs v3/audio-tags behavior, that support is not presently wired as a direct Voxx backend anymore; it may have existed as pass-through text behavior when the direct ElevenLabs backend was still present.

## Countermoves

(世, p=0.9) There is no per-request `postprocess_profile` field in the current API. Postprocess is controlled globally through environment/settings.

(世, p=0.9) Unknown `TTS_POSTPROCESS_PROFILE` names silently produce no output filter chain; they do not error.

(世, p=0.86) Provider-style `voice_settings` in requests currently only affects `speed`; stability/style/similarity are not applied to current active backends.

(世, p=0.82) If you want reliable tag-based inflections across providers, Voxx would need a real tag parser that turns markup into either provider instructions or segmented synthesis + DSP operations.

## Next

(己, p=0.93) Use `TTS_POSTPROCESS_PROFILE=sports` for the current deterministic postprocess, and use `XIAOMI_MIMO_TTS_STYLE` if you want to experiment with prompt-aware inflection tags.