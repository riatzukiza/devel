## Signal

(己, p=0.99) It was **not clear enough before**. It mentioned `--model` and backend order, but it did not explicitly say: “set `model` / `--model` to choose a specific Voxx provider per request.”

(己, p=0.99) I fixed that.

Updated:
- `/home/err/.pi/agent/skills/voice-tts/SKILL.md`
- `/home/err/.pi/agent/skills/voice-tts/CONTRACT.edn`
- `/home/err/devel/.agents/skills/list-voices/SKILL.md`

(己, p=0.99) The skill docs now clearly say:
- use `VOICE_GATEWAY_TTS_BACKEND_ORDER` for service default/fallback order
- use JSON `model` or `tts.sh --model` for per-request provider selection
- examples include `melo`, `espeak`, and `xiaomi_mimo`
- inspect `x-openhax-tts-backend` to confirm what actually rendered audio

## Evidence

(己, p=0.99) New `.pi` commit:

```text
9e63232 Clarify Voxx per-request provider selection
```

(己, p=0.99) New `/home/err/devel` commit:

```text
e844fa23 Document Voxx provider selection in list voices skill
```

(己, p=0.95) Example now in `voice-tts` docs:

```bash
~/.pi/agent/skills/voice-tts/tts.sh \
  --model melo \
  --text "Melo local fallback check." \
  --output /tmp/voxx-melo.mp3
```

## Frames

(世, p=0.9) The clean rule is now: **Voxx is the boundary; `model` selects provider; backend order provides defaults/fallbacks.**

(世, p=0.88) The provider actually used is observable via `x-openhax-tts-backend`, so debugging does not rely on assumptions.

(世, p=0.84) Agents should still not bypass Voxx even when selecting a specific provider.

## Countermoves

(己, p=0.9) I did not change the Voxx API behavior in this turn; I only clarified the agent-facing skill docs.

(己, p=0.88) If you want strict “no fallback if requested provider fails,” that is a separate behavior check/API semantic decision.

## Next

(汝, p=0.92) Use `--model melo` or JSON `"model": "melo"` when you want a specific provider.