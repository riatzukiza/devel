# Semantic Packet & Mention System Spec

---
Type: spec
Component: myth
Priority: high
Status: proposed
Milestone: 6
Estimated-Effort: 40 hours
---

## Purpose
Formalize how agent communications become structured packets that feed the mention ledger, facet activations, and myth engine. Sources:
- `docs/notes/2026-01-11-agent-info-transmission.md`
- `docs/notes/2026-01-11-you-ve-basically-described-a-semantic-activation-network-whe.md`
- `docs/notes/2026-01-11-facets-the-missing-gear-that-makes-association-reliable-and-.md`
- `docs/notes/2026-01-11-fantasia-tightening-what-you-have-and-making-it-gamey.md`

## Packet Structure
Each utterance/rumor/sign is a packet emitted by an agent (or institution broadcast). Minimal fields:
```edn
{:id uuid
 :time tick
 :speaker agent-id
 :channel :voice|:messenger|:signal|:text|:omen|:gossip
 :intent :warn/:boast/:recruit/:pray/:accuse/:report/etc
 :topic-vec [float]*
 :tone {:arousal float :valence float :fear float}
 :salience 0.0-1.0
 :anchors #{concept-id}
 :attribution-hint deity-id?  ; if speaker frames it toward a specific deity/claim
 :credibility {:speaker-reputation float :channel-mod float}
 :spread {:base-radius tiles :entropy float :delay ticks}
}
```
- `topic-vec` derived from LLM summary of the utterance (or template vector for low-fidelity packets).
- `anchors` optional explicit references (event IDs, facet IDs, claim IDs).
- `spread` parameters drive how communications travel; physical channels add latency, error, interception risk (from `docs/notes/2026-01-11-fantasia-design-pass-turning-the-vibe-into-a-runnable-loop.md`).

## Transmission & Fidelity
- F0 background: packets only, no generated text.
- F1 (near player/high salience): short text snippet cached for UI logs.
- F2 spotlight: full dialogue + inner monologue (rare, triggered by miracle/critical events).
- Packet propagation pipelines per channel (voice adjacency, messenger route graph, signal towers, texts) with optional noise injection.

## Listener Processing
1. **Seed Facets**: compute similarity between packet `topic-vec` and listener’s facet embeddings, choose top-K seeds.
2. **Spread Activation**: blend packet-driven seeds with graph edges (experience-based) and bias by current needs/emotions (hunger, fear, awe) per `docs/notes/2026-01-11-you-ve-basically-described-a-semantic-activation-network-whe.md`.
3. **Recall Events/Claims**: event nodes activate if enough of their facet signature lights up; claims/deities follow via attribution edges.
4. **Mention Determination**:
   ```
   mention?(event) = (Δa_event > θ_mention) && (a_event > θ_recall)
   weight = Δa_event * speaker_reputation * listener_attention * listener_confidence
   ```
   Record per `docs/notes/2026-01-11-facets-the-missing-gear-that-makes-association-reliable-and-.md` with `facets_recalled`, `claim_selected`.

## Mention Ledger Entry
```edn
{:event event-id
 :speaker speaker-id
 :listener listener-id
 :time tick
 :channel :voice ...
 :facets_recalled [{:facet facet-id :delta activation}]
 :claim claim-id?
 :weight float
}
```
- Buzz ledger increments by `weight` with fast decay (`λ_b`), tradition increments via ritual support and clergy endorsements (see myth-engine spec).

## Facet Taxonomy & Management
- Four buckets: Physical, Social, Outcome, Affective/Symbolic.
- Each event has a canonical signature weighting facets (`:signature {:fire 1.0 :winter 0.6 ...}`) per event DSL.
- Agents maintain active set (top N facets) plus pinned identity nodes; Hebbian learning strengthens co-activation edges (cold↔fire, fire↔patron) as described in `2026-01-11-you-ve-basically-described-a-semantic-activation-network-whe.md`.
- Ephemeral facets promoted to canonical when repeated across agents; merges triggered by high embedding similarity + co-activation metrics.

## Packet Generation Rules
- Trigger sources: observation (LOS event), rumor retelling (when event node active), ritual broadcasts, panic triggers (needs-critical), miracles, institutional charters.
- Outgoing packet built from top-N active facets + speaker intent; tone derived from emotional state (fear/hope), salience from perceived importance.
- Social modifiers:
  - Higher prestige = higher `speaker-reputation` → packets travel farther and weigh more in mentions.
  - Panic reduces clarity (higher entropy, lower anchor use).
  - Institutions broadcast with low entropy/high reach if sacrality is high.

## Interaction with Gameplay Systems
- Champion agency: autopilot cues include packets (calls for help, messenger alerts) weighted by champion’s alignment.
- Night pantheon view: myth ledger panel aggregates packet-driven mentions with telegraph text (F1 snippets) and suggests interventions (build shrine, host festival, counter-narrative).
- Deity cards: certain signs produce synthetic packets (omens) with guaranteed anchors (e.g., `:veil` mod generates whispers referencing `:deity/moon`).

## APIs / Data Flows
- `packets/emit {:speaker ...}`: registers packet, schedules propagation.
- `packets/process-listener {:listener ... :packet ...}`: performs seed/spread/mention logic.
- `mentions/log` writes ledger entries, updating buzz/tradition.
- `facets/update` handles Hebbian reinforcement and pruning.
- Snapshot surfaces aggregated stats: total packets, active mentions per event, top facets per region.

## Open Questions
1. Packet rate caps per agent (to prevent combinatorial explosion).
2. How to tune spread parameters per channel (messenger vs signal vs text).
3. Where to draw the line between canonical and ephemeral facets in data storage.
4. Whether packet tone should influence myth ledger verification directly (fear vs awe weighting).
5. Visualization: best UI to inspect packet flow without overwhelming players.
