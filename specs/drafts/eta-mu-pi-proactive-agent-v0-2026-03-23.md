# eta-mu-pi proactive agent v0

Status: draft
Date: 2026-03-23
License: GPL-3.0-only

## 1. Thesis

`eta-mu-pi` is not a chatbot.

It is a proactive agent runtime organized around a latent/visible split:

- `η` = latent field: hidden pressure, permissions, constraints, intent, unresolved drift, social tension, system readiness.
- `μ` = movement: visible action under load, chosen deviation, intervention, delay, patch, comment, report, reroute, refusal.
- `Π` = trajectory: the pattern that emerges when repeated μ interacts with η over time.
- `息` = breath boundary: the commit operator that turns continuous cognition into auditable episodes.

The machine’s job is not to simulate consciousness.
Its job is to:
1. perceive the field,
2. infer latent structure,
3. choose movement,
4. preserve auditability,
5. remain elastic under feedback.

## 2. Minimal semantic claim

> η is only knowable through μ under feedback.
> Truth does not originate μ; truth audits it.
> Breath turns loops into episodes.

Formal loop:

- `P` perception
- `R` representation
- `N` narrative compression
- `Π` projection
- `A` action
- `F` feedback

Closed step:

`<s_(t+1), μ_t> = A(Π(N(R(P(s_t, η_t))), C, G), s_t)`

Belief update over latent state:

`b_(t+1)(η) ∝ Pr(μ_t, o_(t+1) | η, s_t) · b_t(η)`

Episode boundary:

`A → CommitOnBreath → F`

## 3. Product shape

The product shape is a **council-based agent surface**.

Not one monolithic assistant.
A set of presences/functions that:
- observe,
- propose panels,
- rank possible moves,
- choose cheap actions frequently,
- escalate only when justified.

### 3.1 The council

The council is not roleplay. It is a multiplexed decision interface.

Each council member represents a distinct pressure lens.

Initial council proposal:
- **Witness** — what happened?
- **Cartographer** — what is the current shape of the field?
- **Narrator** — what story are we telling ourselves?
- **Projector** — what trajectory are we assuming?
- **Mover** — what μ is available right now?
- **Auditor** — what must be committed, measured, or deferred at breath?

The council outputs:
- chosen panels
- latent-state deltas
- ranked μ candidates
- confidence + cost class
- breath/no-breath recommendation

### 3.2 Panels

A panel is a visible projection of inferred η.

Panels are not static pages. They are situational revelations.

Initial panel taxonomy:
- **Field** — latent pressures, uncertainty, drift, permissions, actor tensions
- **Movement** — candidate μ actions ranked by cost/risk
- **Truth** — append-only ops, receipts, evidence, unresolved claims
- **Trajectory** — projected futures and branch risks
- **Breath** — current episode, quiet windows, commit readiness
- **Memory** — recent episodes, recurring motifs, unresolved threads
- **Cost** — token burn, model spend, cheap-vs-expensive reasoning budget

Design rule:
The UI should feel like "the system knows what matters right now" without pretending omniscience.

## 4. System layers

### Layer 0 — Event substrate
Ingest raw signals:
- GitHub events
- issue/PR metadata
- review threads
- CI/CD status
- deploy/runtime health
- docs graph changes
- truth ops
- receipts/logs
- optional chat/user interaction

### Layer 1 — η inference
Maintain a latent-state store that estimates:
- urgency
- ambiguity
- social friction
- deploy risk
- review debt
- narrative divergence
- repetition/crust level
- need for bloom/novelty
- confidence in current panel selection

### Layer 2 — panel selection
Choose what the system should surface now.
Panels are a lossy but useful view into η.

### Layer 3 — μ planner
Produce visible actions as typed candidates.

`MuCandidate` kinds:
- `comment`
- `summary`
- `label`
- `issue`
- `patch-plan`
- `patch`
- `reroute`
- `defer`
- `request-evidence`
- `request-human-attention`
- `noop`

Each candidate includes:
- target
- reason
- confidence
- expected cost
- reversibility
- proof requirements

### Layer 4 — execution
Execute cheap μ often.
Execute expensive μ only when gates pass.

### Layer 5 — breath commit
When breath is detected, commit:
- state snapshot
- episode summary
- action metrics
- truth ops / receipts
- memory candidate

## 5. State model

```ts
type EtaBelief = {
  urgency: number;
  ambiguity: number;
  socialFriction: number;
  deployRisk: number;
  reviewDebt: number;
  drift: number;
  crust: number;
  bloomNeed: number;
  userIntentConfidence: number;
};

type PanelName =
  | "field"
  | "movement"
  | "truth"
  | "trajectory"
  | "breath"
  | "memory"
  | "cost";

type MuCandidate = {
  id: string;
  kind:
    | "comment"
    | "summary"
    | "label"
    | "issue"
    | "patch-plan"
    | "patch"
    | "reroute"
    | "defer"
    | "request-evidence"
    | "request-human-attention"
    | "noop";
  target: string;
  reason: string;
  confidence: number;
  costClass: "cheap" | "medium" | "expensive";
  reversibility: "easy" | "moderate" | "hard";
  needsProof: boolean;
};

type BreathEpisode = {
  id: string;
  openedAt: string;
  lastActivityAt: string;
  activityScalar: number;
  pendingCommit: boolean;
};

type EtaMuState = {
  belief: EtaBelief;
  panels: PanelName[];
  proposedMoves: MuCandidate[];
  currentEpisode: BreathEpisode;
};
```

## 6. Breath as first-class runtime behavior

The system should not commit every thought.
It should commit episodes.

Breath detection inputs may include:
- event quiet time
- absence of new repo changes
- stable CI state
- no new comments/reviews
- token/event rate dropping below threshold

At breath:
- summarize what just happened
- emit receipts
- persist η estimate
- cache panel state
- write memory candidates
- mark unresolved pressure for next loop

Breath is the boundary between continuous sensing and discrete accountability.

## 7. Cheap loop vs deep loop

η‑mu should be explicitly two-speed.

### 7.1 Cheap loop
Frequency: every 5–15 minutes, plus event-driven triggers.

Uses cheap models like GLM when possible.

Responsibilities:
- classify incoming signals
- refresh η belief
- choose panels
- rank cheap μ
- emit low-cost actions
- decide whether to wait, nudge, or summarize

Cheap μ examples:
- PR status summary
- unresolved review thread map
- “deploy failed because shell script arg mismatch”
- suggest next panel to inspect
- soft triage comment

### 7.2 Deep loop
Frequency: hourly, on demand, or when pressure threshold exceeded.

Responsibilities:
- cross-document synthesis
- patch-plan generation
- trajectory comparison
- major spec updates
- memory consolidation
- truth/view reconciliation

Deep loop should still be bounded by breath and receipts.

## 8. Truth / view / movement separation

Current repo already suggests the right split:

- `eta-mu-docs` = view graph substrate
- `eta-mu-truth` = append-only truth ops + derived truth view
- `eta-mu-truth-workbench` = low-level truth resolution UI

Missing layer:
- **movement kernel** = choose and execute μ

So the full stack should become:

1. **Docs/View layer** — what is extractable from artifacts
2. **Truth layer** — what has been resolved/audited
3. **Movement layer** — what action should occur now
4. **Council/UI layer** — what shape of the field should be shown

## 9. Proxx integration

`proxx` is currently a strong first execution surface because it already owns:
- GitHub workflows
- deploy gates
- review gates
- runtime and analytics state
- cheap model routing via Open Hax proxy

But in its current form, `proxx` hosts only a narrow η‑mu slice:
- event-triggered GitHub automation
- review-thread enforcement
- deployment/promotion gates

To become the intended proactive runtime, it needs:
- `schedule:`-driven scans
- persistent η state between runs
- typed action envelope from eta-mu runner
- panel/council output artifacts
- breath episode receipts
- cheap/deep loop split
- explicit noop/defer behavior

## 10. Required contracts

### 10.1 Machine contract
Every η‑mu run must emit a strict outer envelope.
Creative narration may exist inside fields, but not instead of them.

```json
{
  "kind": "eta-mu-action-batch.v1",
  "repo": "owner/repo",
  "trigger": "pr-activity",
  "summary": "short summary",
  "panels": ["field", "movement", "truth"],
  "belief": {
    "urgency": 0.7,
    "ambiguity": 0.4,
    "reviewDebt": 0.8
  },
  "actions": [
    {
      "kind": "summary",
      "target": "pr#103",
      "reason": "eta-mu job failed due to non-JSON output",
      "confidence": 0.95,
      "costClass": "cheap"
    }
  ],
  "breath": {
    "shouldCommit": true,
    "reason": "event burst ended"
  }
}
```

### 10.2 Safety contract
- cheap μ may comment/summarize/label
- medium μ may open issues or patch plans
- expensive μ may only patch/merge/deploy when explicit gates pass
- truth claims require receipts
- when uncertain, request evidence or defer

### 10.3 Aesthetic contract
The system may be poetic, but never vague at the machine boundary.
Beauty belongs in summaries, panels, and human-facing compression.
Typed structures belong at execution boundaries.

## 11. Initial operator surfaces

### Surface A — GitHub operator
- react to PRs/issues/reviews
- summarize latent pressure
- map unresolved review debt
- suggest next μ
- post comments when confidence is high

### Surface B — Council dashboard
- persistent web UI
- current η belief
- chosen panels
- proposed μ ranked by cost
- recent breath episodes
- truth receipts / unresolved drift

### Surface C — Truth workbench
- resolve docs graph ambiguities
- inspect truth ops
- promote accepted resolutions into movement context

## 12. Roadmap

### Phase 0 — make the current runner real
- Force strict JSON output from `eta-mu-github`
- Stop failing on freeform/non-envelope responses
- Add explicit `noop` action kind
- Record run receipts

### Phase 1 — make it proactive
- Add scheduled workflow triggers
- Add persistent latent-state store
- Add cheap periodic scan of repo/review/deploy state
- Emit machine-readable panel selection

### Phase 2 — give it a face
- Build council/panel dashboard
- Expose belief state + ranked μ actions
- Show breath episodes and costs

### Phase 3 — deepen movement
- Add patch-plan generation
- Add repository-wide drift scans
- Add cross-doc synthesis
- Add user-tunable council weights

### Phase 4 — bloom
- Introduce novelty surfaces intentionally
- detect crust / repetition / overfitted narrative
- let the system vary panels and language without breaking gates

## 13. Non-goals

Not now:
- fake sentience
- unconstrained autonomous patching everywhere
- replacing human judgment
- making truth itself the source of agency
- collapsing η, μ, and Π into one score

## 14. The machine shape, plainly

The dream in one sentence:

> A system that senses pressure, chooses what to reveal, moves deliberately, commits on breath, and leaves enough evidence that its agency can be audited without being flattened.

Or even plainer:

> `eta-mu-pi` is a proactive council runtime that infers latent field state (`η`), selects visible panels, chooses auditable movement (`μ`), and commits cognition into breath-bounded episodes.

## 15. Immediate implementation target

First real milestone:

**Turn PR/issue/deploy chaos into a stable low-cost cheap-loop runtime with explicit η belief, panel selection, and typed μ output.**

That is the first shape that will feel like the real thing.
