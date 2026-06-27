---
uuid: "orgs-open-hax-openplanner-packages-graph-myrmex-kanban-orgs-open-hax-openplanner-packages-graph-myrmex-specs-adaptive-frontier-salience-and-template-aware-pruning-md"
title: "Adaptive Frontier Salience + Template-Aware Pruning Contract"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:39.559Z"
source: "orgs/open-hax/openplanner/packages/graph/myrmex/specs/adaptive-frontier-salience-and-template-aware-pruning.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/graph/myrmex/specs/adaptive-frontier-salience-and-template-aware-pruning.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/graph/myrmex/kanban/adaptive-frontier-salience-and-template-aware-pruning.md`

# Adaptive Frontier Salience + Template-Aware Pruning Contract

## Status
Draft

## Parent spec

- `orgs/open-hax/knoxx/specs/knowledge-ops-adaptive-web-frontier-and-multiscale-backbone.md`

## Purpose

Specify how `Myrmex` should turn raw discovered links into:

1. rich edge receipts,
2. scored frontier candidates,
3. bounded follow sets,
4. stable pause/resume behavior under downstream pressure.

---

## Design rule

`Myrmex` must not treat every outgoing link as an equal frontier edge.

It must reason over:

- source page productivity,
- block origin,
- template recurrence,
- target novelty,
- host diversity,
- backpressure headroom.

---

## Inputs required from fetch/extract layer

The ideal per-link payload from `ShuvCrawlFetchBackend` is:

```json
{
  "targetUrl": "https://example.com/target",
  "anchorText": "read more",
  "anchorContext": "adjacent sentence or block excerpt",
  "domPath": "body/main/article/p/a",
  "blockSignature": "host:example.com:block:abc123",
  "blockRole": "main_content",
  "visualRegion": "center",
  "discoveryChannel": "html"
}
```

If these fields are unavailable, Myrmex may fall back to URL-only heuristics, but the downgrade must be explicit in logs/metrics.

---

## Core runtime memories

## 1. Page productivity state

For each source page `p`, maintain rolling features:

- `visits`
- `newTargetsFirstSeen`
- `usefulTargetsRetained`
- `recentNewOutlinkRate`
- `neighborRecentNewOutlinkRate`
- `opicCash`
- `opicHistory`
- `lastYieldAt`

## 2. Host block template memory

For each `(host, blockSignature)` maintain:

- `pagesSeen`
- `hostCoverage`
- `historicalYield`
- `targetSetSketch`
- `dominantTargetHosts`
- `dominantTargetPathPrefixes`
- `role`
- `roleConfidence`

## 3. Edge salience state

For each `(source,target)` maintain derived scores:

- `contentBlockScore`
- `templateRepeatPenalty`
- `sourceProductivityScore`
- `neighborProductivityScore`
- `targetNoveltyScore`
- `targetClassBonus`
- `hostDiversityBonus`
- `actionPenalty`
- `explorationFlag`
- `followScore`

---

## Follow-score contract

A first production version may use:

```text
follow_score =
  + sourceProductivity
  + neighborProductivity
  + contentBlockScore
  + targetNovelty
  + targetClassBonus
  + hostDiversityBonus
  - templateRepeatPenalty
  - actionPenalty
```

Where:

### Positive factors

- `sourceProductivity`
  - high when the source page recently produced retained/novel targets
- `neighborProductivity`
  - high when pages near the source in graph or host/path family are productive
- `contentBlockScore`
  - high for links from main-content or related-content blocks
- `targetNovelty`
  - high for new hosts, new path families, or rarely observed targets
- `targetClassBonus`
  - high for issues, PRs, releases, changelogs, papers, advisories, docs, feed entries
- `hostDiversityBonus`
  - high when the target host is underrepresented in recent crawl budget

### Negative factors

- `templateRepeatPenalty`
  - high when block signature repeats widely across host pages and yields little
- `actionPenalty`
  - high for auth/share/session/store/legal/static endpoints

---

## Mandatory classes

Regardless of score, the frontier should strongly preserve edges matching these classes:

- issue
- pull request
- release
- changelog
- advisory
- paper / abstract / DOI landing page
- docs index / reference page
- feed entry
- standards / spec / RFC-like page

These are not exempt from politeness or backpressure, but they bypass ordinary low-salience cuts.

---

## Retention policy

For each fetched page:

1. keep mandatory-class edges only up to `MAX_mandatory_per_page` per page and still pass them through the host-budget gate,
2. keep top `K_page` by `followScore`,
3. keep top `K_block` inside each block signature,
4. keep first edges into new host/path families,
5. sample `ε` from the remainder.

### Recommended first defaults

- `K_page = min(48, ceil(sqrt(outgoing_count)) + 8)`
- `K_block = 8` for `main_content` / `related_content`
- `K_block = 2` for `nav` / `footer` / `promo`
- `MAX_mandatory_per_page = min(K_page, 16)` before host-budget gating
- `ε = 0.05` floor with decay allowed above that floor

These are starting points, not immutable constants.

---

## Host-budget contract

The scheduler must avoid domain monopolization.

Required controls:

- max concurrent requests per host
- minimum interval per host
- host-balance penalty in candidate selection
- recent-host budget window
- path-family budget window for giant hosts

Example invariant:

> A host with 4,000 discovered links may not consume 4,000 times the effective frontier budget of a host with 40 links.

---

## Exploration contract

Exploration must be explicit.

- Use epsilon-greedy or equivalent exploration.
- Allow decay, but never to zero.
- Exploration should prefer underrepresented hosts/path families over random noise.

Recommended ordering:

1. exploit within high-confidence candidates,
2. explore among medium-confidence diverse candidates,
3. only rarely sample low-confidence junk.

---

## Backpressure contract

Pause/resume remains mandatory and reversible.

Additional invariant for adaptive frontier mode:

> effective pending load = queued writes + in-flight fetches likely to produce writes

Myrmex should pause before overshoot becomes pathological.

Required surfaced fields:

- pending writes
- in-flight fetches
- effective pending load
- limit
- resume threshold
- pause reason

---

## Failure semantics

No silent downgrades.

If any scoring/input layer is missing, logs/stats must show it explicitly, e.g.:

- `edge-context-mode=url-only`
- `block-role-mode=unknown`
- `template-memory-cold=true`
- `frontier-score-mode=degraded`

---

## Metrics

Track at least:

- useful new targets per fetch
- retained targets per fetched page
- host diversity over rolling window
- dominant-host share
- share of followed edges by block role
- share of followed edges by target class
- exploration yield
- false-positive template follow rate
- queue overshoot frequency

---

## Phases

### Phase A — Receipt enrichment

- extend backend/API types for link receipts
- add block signature and role capture
- add target class heuristics

### Phase B — Salience engine

- compute page productivity memory
- compute template repeat memory
- compute derived follow score

### Phase C — Adaptive frontier

- replace raw link equality with tiered retention
- add `K_page`, `K_block`, `ε`, host budgets
- emit decision receipts for why an edge survived or not

### Phase D — Evaluation loop

- compare new frontier vs raw-fanout baseline
- inspect discovery yield, diversity, and backpressure stability

---

## Verification

1. A giant page no longer injects all outgoing links equally into the frontier.
2. Main-content and mandatory-class edges are overrepresented among followed edges.
3. Repeated template blocks are underrepresented among followed edges.
4. Host diversity rises relative to raw-fanout baseline.
5. Pause/resume continues working under load.
6. Decision receipts explain why representative edges were followed or suppressed.
