---
name: hormuz-risk-clock
description: "Maintain and evolve the Hormuz public-signal risk clock by ingesting signals, updating state, and rendering reports"
compatibility: opencode
metadata:
  domain: hormuz-clock
  version: 3
---

# Skill: Hormuz Risk Clock

## Goal
Update the Strait of Hormuz risk clock from **fresh public signals**, keep the state model explicit, and produce a verifiable render plus report.

## ⚠️ CRITICAL: Always Fetch Fresh Signals

**Never rely on cached state as ground truth.** The Hormuz situation evolves rapidly. Before producing any clock update or report:

1. **Check cached state age** — If `data/state*.json` is older than 24 hours, it is stale.
2. **Fetch fresh signals via web search** — Use `websearch` to find latest developments:
   - `"Strait of Hormuz transit shipping [current date]"`
   - `"Iran Hormuz attacks [current month year]"`
   - `"Hormuz oil price [current date]"`
   - `"UN Hormuz resolution [current date]"`
3. **Extract facts from fresh sources** — Use `webfetch` to pull full articles or PDF text.
4. **Update state model** before rendering or publishing.

If the user asks for a clock update, they expect **current intelligence**, not a stale snapshot.

## Use This Skill When
- The user asks to regenerate or update the Hormuz clock.
- New public signals need to be folded into the current state.
- You need to compare clock versions or produce a daily snapshot.
- The task involves maritime, energy, insurance, AIS, or navigation-disruption inputs for this model.

## Do Not Use This Skill When
- The task is only social reposting of an already-finished snapshot.
- The request is to redesign the model itself without producing a normal clock update.
- The work is unrelated to the Hormuz clock bundle.

## Inputs
- Optional as-of timestamp.
- New raw signal files or URLs.
- Revised thresholds or branch-prior logic.
- Requests for a render, markdown snapshot, or comparison animation.

## Workflow

### Preflight: Staleness Check
Before starting any update:
1. Read the `as_of_utc` timestamp from `data/state.latest.json`.
2. Compare to current date. If older than 24 hours: **STOP and fetch fresh signals.**
3. Only proceed with cached state if explicitly asked to work from a specific historical snapshot.

### Fresh Signal Extraction
When state is stale or missing:
1. Use `websearch` with current-date queries (see CRITICAL section above).
2. Use `webfetch` to extract full source text from key articles or PDFs.
3. Normalize findings into signal objects:
   - `id`, `timestamp_utc`, `source`, `category`, `value`, `confidence`, `direction`, `notes`, `url`
4. Merge into `data/signals.latest.json`.

### State Update & Render
1. Read `config/model_config.yaml` and relevant methodology notes.
2. Run `scripts/update_state.py` to fold signals into state scores.
3. Render `assets/hormuz_risk_clock_v4.png` with `scripts/generate_v4_clock.py`.
4. Optionally generate a markdown brief with `scripts/render_snapshot_report.py`.
5. If requested, compare versions with `scripts/animate_transition.py`.

## State Model
- Primary variables: `transit_flow`, `attack_tempo`, `insurance_availability`, `navigation_integrity`, `bypass_capacity`, `asia_buffer_stress`.
- Each state should keep `score`, `trend`, `confidence`, and `notes` when available.
- **Uncertainty ranges (v4.1):** Each state should also include:
  - `score_range`: `{low, high}` — plausible interval for the score
  - `uncertainty`: `minimal|low|moderate|high` — qualitative uncertainty level
  - `confidence_range`: `{low, high}` — uncertainty about the confidence estimate
  - `reasoning`: brief explanation of why the range is wide or narrow
- Branch priors stay explicit and editable; they are not facts.
- Branch probabilities should include `center`, `range`, `confidence`, and `confidence_range`.

## Guardrails
- **Never publish stale state as current.** Always check timestamps.
- Separate observed facts from model choices and inferred scores.
- Prefer additive schema and extraction changes over breaking rewrites.
- Allow rewind when signals improve.
- Keep provenance visible in reports and commits.
- If you cannot fetch fresh signals (network issues, source down), clearly label the output as "stale" with the `as_of_utc` timestamp prominently displayed.

## Output
- Updated clock artifacts and any changed state files.
- A short explanation of what changed and why the update is safe.
- Quick verification steps for rerunning the update path.

## Publishing Voice & Tone (DEFAULT)

When publishing Hormuz updates to social platforms, use the **"Good Morning, Cyber Soldiers"** voice:

**Tone:** Robin Williams meets war room briefing. High energy, rapid-fire, irreverent but deadly serious about the stakes. The audience is software engineers, but remind them they're cyber soldiers — the ones who keep the systems running when the world catches fire.

**Key elements:**
- Open with "Good morning, cyber soldiers!" or similar
- Mix technical precision with theatrical urgency
- Acknowledge the absurdity while delivering real intelligence
- Use humor to maintain engagement, not to minimize
- End with actionable signals, not despair
- Remind the audience: "You build the systems. You watch the signals. You're the early warning network."

**Example opening:**
> "GOOD MORNING CYBER SOLDIERS! It's Day 37 of the Hormuz Crisis and we've got ourselves a proper deadline, folks! Trump's got a finger on the button, Iran's got a stranglehold on 20% of the world's oil, and Brent crude is doing its best impression of a SpaceX launch trajectory!"

**Example closing:**
> "You beautiful keyboard warriors, you're not just watching history — you're running the infrastructure it breaks. Stay frosty. Watch the signals. This is your morning brief."

## ⚠️ CRITICAL: Always Share the Clock

**The clock image is NOT optional.** Every Hormuz update publication MUST include:

1. The rendered clock image (`assets/hormuz_risk_clock_v4_*.png`)
2. The text brief with scores, uncertainty ranges, and key developments

If the clock doesn't render, fix the generation script. If Discord has message limits, split into multiple messages. **Never publish a Hormuz update without the clock.**

## Default Publication Targets

When the user says "publish the clock" or "share it" without specifying platforms, publish to ALL of these by default:

### Discord
- **Channel:** `1444189585373663417` (The Ussyverse #errorcoded-slop)
- **Format:** Multi-message thread with clock image
- Use `discord` tool with `action="send-image"` for clock, `action="send"` for text

### Bluesky
- **Account:** Configured via `BLUESKY_IDENTIFIER` and `BLUESKY_APP_PASSWORD` env vars
- **Format:** 4-post thread with clock image on first post
- Use `bluesky` tool with `action="post-image"` for clock, `action="post"` with `replyToUri` for thread

### Publication Checklist
1. ✅ Render clock image first
2. ✅ Post clock image with opening "Good Morning, Cyber Soldiers" text
3. ✅ Post branch probabilities with uncertainty ranges
4. ✅ Post humanitarian numbers / casualty data
5. ✅ Post closing rally ("You're the early warning network")

**Always publish to both Discord and Bluesky unless the user explicitly limits scope.**

## References
- Methodology: `methodology/clock_methodology_v4.md`
- Related model design skill: `clock-model-evolver`
- Related skills: `social-publish-bluesky`, `social-publish-discord`, `bluesky-publish-tool`, `discord-publish-tool`
