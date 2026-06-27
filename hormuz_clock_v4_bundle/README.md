# Hormuz Risk Clock v4 Bundle

This bundle packages a flexible, evolving version of the Strait of Hormuz clock system.

## Included
- `reports/analyst_commentary_synthesis_2026-03-08.md` — uploaded analyst synthesis report
- `methodology/clock_methodology_v4.md` — modeling approach, signal flow, and update rules
- `skills/hormuz-risk-clock/SKILL.md` — OpenCode-compatible skill instructions
- `scripts/` — renderers, state-updaters, and signal extraction utilities
- `prompts/` — seed prompts for GPT/Claude/Perplexity/generic scheduled agents
- `data/` — current state, example signals, and default model config
- `assets/` — prior clock images and the generated v4 image

## Note on provenance
Some scripts in `scripts/` are **reconstructed approximations** of code used interactively during this chat session. They are designed to be faithful to the generated outputs, but the original ephemeral tool code was not auto-saved.

## Recommended flow
1. Fetch raw signals with `scripts/extract_signals.py`
2. Normalize and merge them into `data/signals.latest.json`
3. Compute state with `scripts/update_state.py`
4. Render a new image with `scripts/generate_v4_clock.py`
5. Optionally emit a markdown brief with `scripts/render_snapshot_report.py`

## Added in this extension
- `skills/social-publish-bluesky/SKILL.md`
- `skills/social-publish-discord/SKILL.md`
- `skills/social-publish-x/SKILL.md`
- `skills/social-publish-reddit/SKILL.md`
- `skills/clock-model-evolver/SKILL.md`
- `scripts/social/` — JavaScript social adapters and a shared payload builder
- `prompts/social/` — platform-specific post-generation prompts
- `prompts/research/` — model-evolution prompts for deep research and cross-model comparison
- `.env.social.example` and `config/social_profiles.example.yaml`

## Social publishing flow
1. Render / update the clock as usual.
2. Generate a markdown snapshot.
3. Build platform payloads with `node scripts/social/build_social_payloads.mjs reports/v4_snapshot.md`.
4. Dry-run platform posts with the platform adapters under `scripts/social/`.
5. Publish only when credentials, subreddit/channel/handle targets, and content review are all correct.

## Design note
The social adapters are thin wrappers. They should not decide the model; they should only format and transport the latest state.
