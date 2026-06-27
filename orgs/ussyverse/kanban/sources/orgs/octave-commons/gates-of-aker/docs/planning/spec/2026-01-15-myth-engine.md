# Myth Engine Spec

---
Type: design
Component: myth
Priority: high
Status: approved
Related-Issues: [8, 19]
Milestone: 7
Estimated-Effort: 60 hours
---

## Related Documentation
- [[README.md]] - Project overview
- [[AGENTS.md]] - Coding standards
- [[spec/2026-01-15-core-loop.md]] - Day/night cycle
- [[docs/notes/planning/2026-01-15-roadmap.md]] - Roadmap
- [[docs/notes/design/2026-01-15-world-schema.md]] - World schema
- [[docs/notes/design/2026-01-15-aker-boundry-control-flow.md]] - Card system
- [[docs/notes/design/2026-01-15-semantic-packets.md]] - Semantic packets
- [[docs/notes/dsl/2026-01-11-event-dsl-macro-based-like-defgroup-event-archetypes-miracle.md]] - Event DSL

## Purpose
Capture how raw simulation events become cultural narratives, miracles, and reusable pantheon powers. Source notes:
- `docs/notes/2026-01-11-fantasia-tightening-what-you-have-and-making-it-gamey.md` (faith network, attestation loop)
- `docs/notes/2026-01-11-miracle-system-make-it-sim-first-story-rich-and-tunable.md` (miracle pipeline, awe math, verification/attribution, myth ledger)
- `docs/notes/2026-01-11-organizations-as-first-class-belief-machines-groups-have-fac.md` & `docs/notes/2026-01-11-clojure-macro-dsl-for-institutions-groups-as-belief-machines.md` (institutions/groups DSL)
- `docs/notes/2026-01-11-event-dsl-macro-based-like-defgroup-event-archetypes-miracle.md` & `docs/notes/2026-01-11-a-good-place-to-start-prototyping-the-smallest-slice-that-pr.md` (event DSL, awe scoring, canonical tiers)
- `docs/notes/2026-01-15-yea-let-s-do-it-major-deities-get-3-abilities-each-night-abi.md` & `docs/notes/2026-01-15-continue-3.md` (deity cards emitting signs/modifiers, event families)

## Semantic Packets & Mentions
- Every utterance/rumor/sign is represented as a **packet**: `{intent, tone, facets, origin, credibility, spread-multiplier}` (18.42.50.md:135-206, 20.53.00.md context).
- Packets flow along communication edges (voice, messenger, signal towers, texts) with latency, entropy, interception risk (17.48.43.md:100-118).
- Mentions accumulate into two ledgers per claim/event:
  - **Buzz (B)**: fast-rising, fast-decay, indicates current chatter (19.35.48.md:169-205).
  - **Tradition (T)**: slow to grow, slow to fade, requires rituals + institutional support; unlocks miracle tiers (19.35.48.md:189-218).

## Awe & Miracle Candidate Pipeline (`19.35.48.md:14-187`, `20.53.00.md`)
1. **Sim Event** occurs; compute **Awe score** `W = rarity * impact * needMatch * witnessFactor` (19.35.48.md:34-50, 20.53.00.md:214-230).
2. If awe > threshold ⇒ emit **candidate miracle record** with evidence, witness set, symbolic tags.
3. Witness + rival witnesses seed rumors (19.35.48.md:18-33, 20.53.00.md registries).
4. Verification loop updates consensus score `V` using mention weight, clergy endorsements, rebuttals, memory decay (19.35.48.md:70-87).
5. Attribution uses cosine fit between event signature and deity iconography plus witness priors & prayer matches (19.35.48.md:90-134).
6. Canonization tiers: Minor (faith/morale bump), Significant (unlocks/boosts powers), Foundational (doctrine/ritual/world change) (19.35.48.md:189-218, 20.53.00.md:153-165).
7. Low fit + high awe + syncretism ⇒ spawn new deity/cult (19.35.48.md:137-166).

## Event DSL (`20.53.00.md`)
- `defeventtype` macro registers archetypes with `match`, `signature`, `awe`, `claims`, `evidence`, `tiers`, `synthesis`.
- `awe-score` uses DSL expressions referencing raw event context (fields, metrics, witness scores).
- Example archetypes: **Lightning Commander**, **Mercy Flood**, **Winter Pyre** (20.53.00.md:268-400).
- Canonization hints specify domain/outcome facets to derive new powers when tradition threshold crossed.

## Institution & Group DSL (`20.34.22.md`, `20.40.39.md`)
- **Groups** have facets, charters, roles, rituals, services, sacrality per deity, and typed relationships (membership, patronage, rivalry, doctrine alignment).
- `defgroup` DSL builds institutions with membership gates (`requires`, `forbids`, `vow`), rituals, broadcasts (canonical packets), sacrality growth/decay rules.
- Sacralization state machine handles secular→influenced→syncretic→dedicated→theocratic branches with schism/decay hooks.
- Institutions amplify packets: low entropy, high reach, higher credibility; membership gates control who receives broadcasts.
- Miracle verification is modeled as institutional processes (councils, clinics, councils vs gossip) (20.34.22.md:188-204).

## Faith Network & Alignment (`18.42.50.md`)
- Faith modeled as graph: nodes (agents, shrines, relics, storytellers, institutions) with edge weights for influence.
- Alignment vector = `(loyalty, faith, trust)`; controls night vision coverage, priority compliance, willingness to privilege champion needs (18.42.50.md:87-119, 217-266).
- Doubt introduces factions: skeptics reduce alignment (shrinks vision network), heretics redirect faith to rivals, cynics obey but ignore champion priorities (18.42.50.md:185-227).

## Myth Ledger UI (`19.35.48.md:309-325`)
- Night panel lists candidate miracles with: awe score, verification %, attribution leaderboard, buzz/tradition trend, competing narratives, suggested interventions (shrines, rites, texts, suppression).
- Enables strategic investment (appoint priests, build shrines, host festivals, preserve relics, counter rumors).

## Signs, Modifiers, Event Families (`17.07.57.md`, `17.08.00.md`)
- Playing deity cards emits **Signs** (omens, gossip, patrol prep, price spikes) annotated with origin + visibility (17.08.00.md:183-210).
- Effects attach **Modifiers** (threaded state such as `:veil`, `:tomorrow-law`, `:public-claim`, `:contract-edge`) which bias event-family generators.
- Event families (ultimatum→raid→feud, trial→verdict, schism→cult, trade boom→scarcity, wild reckoning, succession) each have trigger conditions, telegraphs, escalation, resolution, aftermath edits (17.08.00.md:214-359).
- `gen-event-candidates` scores candidates on plausibility, pressure, telegraph clarity, novelty; top candidate enqueued for world reaction (17.08.00.md:345-415).

## Data Interfaces
- **Snapshot additions**: myth ledger summary, sign queue, institutional sacrality states, packet backlog.
- **APIs**:
  - `myth/register-event`, `myth/update-mentions`, `myth/resolve-canonization`.
  - `institution/apply-ritual`, `institution/adjust-sacrality`.
  - `deity/play-card` returns emitted signs + modifiers for downstream generators.

## Open Questions
- Exact formula for buzz→tradition conversion rate per culture type.
- Default religion structure sliders (centralization, orthodoxy, syncretism, evangelism, literacy) for baseline pantheon.
- How rival pantheons interfere (rebuttals, counter-signs, sabotage via institutions).
- UI granularity for packet inspection vs aggregated stats.
