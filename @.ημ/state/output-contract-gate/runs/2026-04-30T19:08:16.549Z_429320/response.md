## Signal

(己, p=0.98) Updated and committed Knoxx voice-related contracts under `orgs/open-hax/openplanner/packages/agents/knoxx/contracts/`.

(己, p=0.98) Commit created in the Knoxx repo:

- `9bb63f72 Update Knoxx voice contracts for Voxx postprocess API`

(己, p=0.95) Main changes:
- Normalized legacy voice capabilities:
  - `:cap/vocal-synthesis` → `:cap/voice-synth`
  - `:cap/voice_synth` → `:cap/voice-synth`
- Updated `cap_voice_synth.edn` with the current Voxx API contract:
  - postprocess profiles: `sports`, `broadcast`, `narrator`, `radio`, `soft`
  - query/body controls: `postprocess_profile`, `postprocess`, `postprocess_enabled`
  - prompt-aware controls: `--prompt-aware`, `--prompt-aware-style`
  - dry capture for autotune: `--postprocess off`
  - no direct ElevenLabs wiring
- Updated singer/frontman/music/creative contracts to route spoken audio through Voxx via `skill:voice-tts`.
- Updated spawning/producer contracts so future singer/spoken-voice agents include `:cap/voice-synth` and current Voxx guidance.

## Evidence

(己, p=0.98) Changed contracts parsed successfully with `bb`:

```text
ok contracts/agents/back_jack.edn
ok contracts/agents/creative_music_studio.edn
ok contracts/agents/discord_frontman.edn
ok contracts/agents/discord_pixel_artist.edn
ok contracts/agents/discord_producer.edn
ok contracts/agents/discord_singer.edn
ok contracts/agents/discord_talent_scout.edn
ok contracts/agents/muse_melodic_receipt.edn
ok contracts/agents/native_music_maker.edn
ok contracts/agents/novel_VOXX_VOICE_VOGUE_20260429T0748.edn
ok contracts/agents/novel_graph_weaver_202604280120.edn
ok contracts/agents/session_singer_20260427061610.edn
ok contracts/agents/session_singer_20260427061944.edn
ok contracts/agents/ussyverse_social_creative.edn
ok contracts/capabilities/cap_voice_synth.edn
ok contracts/ensemble/kilo/slyce.edn
ok contracts/ensemble/lumia/nyx.edn
ok contracts/ensemble/sterling/selah.edn
ok contracts/novel_VOICE_COMPLIANCE_WARDEN_20260429T2245.edn
ok contracts/novel_graph_weaver_202604280120.edn
ok contracts/novel_kokoro_evangelist_20260429.edn
ok contracts/roles/creative_catalyst.edn
ok contracts/roles/rapper.edn
ok contracts/roles/singer.edn
ok contracts/roles/story_teller.edn
```

(己, p=0.9) `pnpm run lint:size` was attempted and still fails on pre-existing file-size violations unrelated to these contract edits.

(己, p=0.9) Full-contract EDN parse is blocked by a pre-existing invalid file:

```text
contracts/synthetic-slang-ledger.edn
No dispatch macro for:
```

## Frames

(己, p=0.9) This was a contract migration, not runtime code work: no Knoxx backend/frontend code was changed.

(己, p=0.85) The remaining `ElevenLabs` mentions are intentional audit/compliance language that forbids direct wiring and points agents back to Voxx.

(己, p=0.86) Some “voice” terms remain as prose/persona voice, but where they can imply actual audio output, they now distinguish prose voice from real Voxx TTS.

## Countermoves

(己, p=0.9) I did not stage unrelated untracked/modified Knoxx files. Remaining Knoxx repo state includes unrelated/untracked items:

```text
 M data/taxonomy/sacred_errors.edn
?? contracts/novel_SOVEREIGN_NULLITY_AUDITOR_20260430T0700.edn
?? hall_of_interop_shame.md
```

(己, p=0.93) I avoided `git add -A`; only changed contract paths were staged for the commit.

## Next

(汝, p=0.8) If desired, run the Knoxx contract loader/runtime against the live service next to confirm these prompt/capability updates project into the UI/runtime agent catalog.