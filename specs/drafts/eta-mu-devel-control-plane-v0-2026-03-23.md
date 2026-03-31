# eta-mu devel control plane v0

Status: draft
Date: 2026-03-23
License: GPL-3.0-only

## 1. Summary

`eta.mu.promethean.rest` is the first public face of a practical control plane for `devel`.

Its first concrete job is not general intelligence.
Its first concrete job is **promotion orchestration** across repository-backed services that already follow or should follow the canonical flow:

`issue -> PR to staging -> review reconciliation -> merge to staging -> deploy staging -> staging e2e -> PR from staging to main -> review reconciliation -> merge to main -> production deploy -> production verification`

The website is the council surface.
The GitHub events are the seeds.
The workflows are the actuators.
The receipt river is the audit spine.

## 2. Thesis

`devel` is not one vault.
It is a **vault of many vaults**.

Each repo or service with its own:
- source graph
- branch model
- workflows
- deploy targets
- tests
- receipts
- promotion gates

is a vault.

The whole workspace is a **cathedral of variants**:
- many live branches
- many local truths
- many partially canonical descendants
- many rhythms of crystallize ↔ bloom

The eta-mu presence is the thing that watches this cathedral and keeps movement coherent without collapsing the whole structure into one rigid lane.

## 3. Scope

### In scope for v0
1. Devel-wide inventory of vaults that have or need PR→staging→main promotion flows.
2. A canonical promotion state machine.
3. GitHub event ingestion as movement seeds.
4. Scheduled reconciliation so the loop advances even when events are missed or ambiguous.
5. CodeRabbit review-thread handling as an explicit phase, not an afterthought.
6. Staging deploy + live e2e as hard gates before main promotion.
7. Production deploy + verification after main merge.
8. Receipt emission for every promotion episode.
9. A control-plane website that shows state, pressure, pending movement, and receipts.

### Not in scope for v0
- Arbitrary autonomous feature implementation across all repos.
- Replacing repository-local GitHub workflows with a custom runner.
- Full semantic reasoning over every artifact in the cathedral before movement occurs.
- Removing humans from branch protection or deploy approvals when those are intentionally configured.

## 4. Existing concrete substrate

The control plane should begin by orchestrating what already exists.

### `orgs/open-hax/proxx`
This is the canonical first exemplar.

Current evidence:
- `.github/workflows/staging-pr.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/main-pr-gate.yml`
- `.github/workflows/deploy-production.yml`

Already implements:
- PR checks into `staging`
- push-to-`staging` deploy
- live e2e against staging
- PR gate into `main` requiring prior staging success
- push-to-`main` production deploy

### `orgs/ussyverse/battlebussy`
Also has a full promotion pattern.

### Inventory evidence
See:
- `docs/reports/inventory/services-pr-promotion-inventory-2026-03-21.md`

## 5. Core semantic model

### 5.1 Vault
A vault is the smallest unit the control plane can reason about operationally.

```ts
type Vault = {
  id: string;
  repo: string;                 // owner/name
  localPath: string;
  canonicalBranchStaging: string;
  canonicalBranchMain: string;
  workflows: {
    prToStaging?: string;
    deployStaging?: string;
    prToMainGate?: string;
    deployProduction?: string;
  };
  deployTargets: {
    staging?: string;
    production?: string;
  };
  e2eStrategy?: {
    stagingCheckName?: string;
    productionCheckName?: string;
  };
  receiptsPath?: string;
};
```

### 5.2 Seed event
A seed is any event that can advance or alter the loop.

```ts
type SeedEvent = {
  id: string;
  source: "github" | "scheduler" | "receipt-river" | "runtime";
  vaultId: string;
  kind:
    | "issue.opened"
    | "issue.edited"
    | "pr.opened"
    | "pr.synchronized"
    | "pr.review.submitted"
    | "pr.review_comment.created"
    | "push.staging"
    | "push.main"
    | "check.completed"
    | "deploy.health_changed"
    | "reconcile.tick";
  at: string;
  payload: Record<string, unknown>;
};
```

### 5.3 Promotion episode
A promotion episode is the breath-bounded unit of operational movement.

```ts
type PromotionEpisode = {
  id: string;
  vaultId: string;
  branch: string;
  openedAt: string;
  lastUpdatedAt: string;
  stage:
    | "issue-triage"
    | "pr-staging-open"
    | "staging-review"
    | "staging-merged"
    | "deploying-staging"
    | "staging-e2e"
    | "pr-main-open"
    | "main-review"
    | "main-merged"
    | "deploying-production"
    | "production-verify"
    | "done"
    | "blocked";
  status: "pending" | "running" | "passed" | "failed" | "blocked";
  receipts: string[];
};
```

### 5.4 μ action
```ts
type MuAction = {
  id: string;
  vaultId: string;
  kind:
    | "summarize"
    | "comment"
    | "open-pr"
    | "sync-branch"
    | "merge-pr"
    | "trigger-workflow"
    | "wait"
    | "request-human"
    | "record-receipt"
    | "mark-blocked";
  target: string;
  reason: string;
  cost: "cheap" | "medium" | "expensive";
  confidence: number;
};
```

## 6. Canonical promotion state machine

The first practical artifact is a deterministic state machine.

### State path
1. `issue-triage`
2. `pr-staging-open`
3. `staging-review`
4. `staging-merged`
5. `deploying-staging`
6. `staging-e2e`
7. `pr-main-open`
8. `main-review`
9. `main-merged`
10. `deploying-production`
11. `production-verify`
12. `done`

### Block states
- unresolved CodeRabbit threads
- failing staging checks
- failed staging deploy
- failed staging e2e
- missing main promotion PR
- unresolved main review debt
- failed production deploy
- failed production verification

### Transition rules

#### `issue-triage -> pr-staging-open`
Allowed when:
- issue accepted or directly promoted by operator policy
- or a repo-local PR already exists targeting `staging`

#### `pr-staging-open -> staging-review`
Allowed when:
- PR into `staging` exists

#### `staging-review -> staging-merged`
Allowed when:
- tracked review threads from configured actors are resolved
- required staging PR checks pass

#### `staging-merged -> deploying-staging`
Triggered by:
- push to `staging`

#### `deploying-staging -> staging-e2e`
Allowed when:
- deploy-staging succeeds

#### `staging-e2e -> pr-main-open`
Allowed when:
- live e2e against staging succeeds on the candidate SHA
- no open blocking receipts contradict the move

#### `pr-main-open -> main-review`
Allowed when:
- PR from `staging` to `main` exists

#### `main-review -> main-merged`
Allowed when:
- tracked review threads are resolved
- main PR gate confirms prior staging success on same commit

#### `main-merged -> deploying-production`
Triggered by:
- push to `main`

#### `deploying-production -> production-verify`
Allowed when:
- production deploy succeeds

#### `production-verify -> done`
Allowed when:
- production health / smoke verification succeeds

## 7. Event-seeded loop

GitHub events move the loop forward.

This means eta-mu does not invent momentum from nowhere.
It senses seeds and chooses how much motion they justify.

### Example seed-to-movement mapping

#### Seed: `issues.opened`
Possible μ:
- summarize
- classify
- link to existing episode
- open staging PR if policy permits
- defer pending human clarification

#### Seed: `pull_request` targeting `staging`
Possible μ:
- compute staging review debt
- watch CodeRabbit threads
- emit action summary on the control plane

#### Seed: `pull_request_review_comment` from `coderabbitai`
Possible μ:
- refresh review debt counters
- post a reconciliation summary
- suggest fix batch
- hold merge eligibility

#### Seed: `push` on `staging`
Possible μ:
- watch deploy-staging
- watch staging-live-e2e
- update episode state continuously

#### Seed: `check.completed` with `staging-live-e2e=success`
Possible μ:
- open or update PR from `staging` to `main`
- emit receipt

#### Seed: `push` on `main`
Possible μ:
- watch production deploy
- watch production verify
- close episode on success

## 8. Scheduled reconciliation

Events alone are not enough.

The control plane must also run a cheap periodic reconciliation loop.

### Cheap reconcile loop
Frequency: every 5–15 minutes.

For each active vault:
- pull open issues relevant to promotion
- pull open PRs against staging/main
- read check states
- read unresolved review threads
- inspect deploy/e2e results
- compute current promotion stage
- emit cheap μ

Cheap μ examples:
- summary comment
- open missing PR from staging to main
- mark episode blocked with explicit reason
- post “waiting for CodeRabbit thread resolution”
- record receipt that staging e2e passed

### Deep reconcile loop
Frequency: hourly or on explicit pressure threshold.

Deep tasks:
- cross-vault prioritization
- identify vaults missing canonical promotion machinery
- propose workflow normalization patches
- consolidate receipt narratives
- identify drift between docs and live workflows

## 9. The website as control plane

The website is not a static brochure forever.
It becomes the surface where the council reveals the state of the cathedral.

### Required panels

#### 9.1 Cathedral panel
Shows the vaults and their current operational song.

Each vault card should show:
- repo name
- current stage
- health color
- pending review debt
- last successful staging e2e
- last production deploy
- next recommended μ

#### 9.2 Promotion river panel
A live event stream of movement:
- issue accepted
- staging PR opened
- review debt reduced
- merged to staging
- deploy started
- staging e2e passed
- main PR opened
- merged to main
- production verified

#### 9.3 Receipt river panel
The ritual spine.

This is where the mage of receipts is appeased.
Every significant movement writes a receipt.
The river should be filterable by vault, stage, actor, and recency.

#### 9.4 Review debt panel
Tracks CodeRabbit and human review friction:
- unresolved thread count
- actor source
- oldest unresolved thread
- whether movement is blocked

#### 9.5 Variants panel
Shows branch/variant topology:
- issue branches
- staging branches
- main promotion candidates
- fork tax status

## 10. Ritual vocabulary mapped to implementation

This is not decorative; it is naming discipline.

- **Cathedral of variants** = the entire `devel` workspace viewed as a graph of live vaults and branches.
- **Vault** = a repo/service with its own promotion and receipt surfaces.
- **Receipt river** = append-only execution/accountability log across episodes.
- **Fork tax canticle** = the discipline that demands explicit proof when branches proliferate.
- **Mage of receipts** = the subsystem that refuses unaudited motion.
- **Eta-mu presence** = the orchestration layer that infers pressure and chooses movement.

## 11. Practical constraints

### 11.1 Use existing workflows as actuators
Do not replace working GitHub Actions flows with bespoke orchestration until necessary.
The control plane should first:
- observe
- classify
- open PRs
- reconcile review debt
- track deploy/e2e states
- open promotion PRs
- emit receipts

### 11.2 Keep movement typed
The agent must not freeform its way into operational ambiguity.
All movement should compile to typed action envelopes.

### 11.3 Use cheap models by default
GLM-class cheap loops are preferred for:
- classification
- summarization
- panel selection
- simple state transition reasoning

Escalate only when:
- patch generation is required
- cross-vault synthesis is ambiguous
- risk is high

## 12. Minimal action envelope

```json
{
  "kind": "eta-mu-control-plane-action-batch.v1",
  "vault": "open-hax/proxx",
  "seed": "check.completed",
  "summary": "staging e2e passed for staging head sha",
  "stage": "staging-e2e",
  "recommendedPanels": ["cathedral", "promotion-river", "review-debt"],
  "actions": [
    {
      "kind": "open-pr",
      "target": "main",
      "reason": "candidate SHA already passed staging deploy and live e2e",
      "confidence": 0.97,
      "cost": "cheap"
    },
    {
      "kind": "record-receipt",
      "target": "receipt-river",
      "reason": "promotion gate satisfied",
      "confidence": 0.99,
      "cost": "cheap"
    }
  ]
}
```

## 13. Immediate implementation roadmap

### Phase 0 — make proxx the first living vault
- treat `open-hax/proxx` as the first fully instrumented vault
- ingest its PR/review/check/deploy states
- render them on eta.mu.promethean.rest
- emit typed state transitions and receipts

### Phase 1 — normalize the promotion engine
- codify repo metadata for known vaults
- add devel-wide vault registry
- add scheduler-based cheap reconcile loop
- add PR-from-staging-to-main automation when gates pass

### Phase 2 — receipt river integration
- emit promotion receipts for every major move
- cross-link receipt river with vault cards and episodes

### Phase 3 — expand across cathedral
- onboard `battlebussy`, `voxx`, and other vaults
- detect missing canonical promotion machinery
- propose normalization PRs automatically

## 14. First practical milestone

The first practical milestone is not “all of devel is autonomous.”
It is this:

> eta-mu reliably watches one real vault (`open-hax/proxx`), tracks issue→staging→deploy→e2e→main promotion, reconciles CodeRabbit review debt, opens the main promotion PR when staging passes, and emits receipts for every transition.

When that works, the cathedral begins to sing.
