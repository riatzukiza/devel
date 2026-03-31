# Packages org-placement inventory — 2026-03-21

## Scope
- Top-level `packages/*` only
- Applies the active placement contract plus the new org promotion checklists
- Produces **provisional** destination-org recommendations, not automatic move decisions

Machine-readable companion artifact:
- `docs/reports/inventory/packages-org-placement-inventory-2026-03-21.json`

## Summary
- Total packages: **25**
- Keep in `packages/*` for now: **4**
- Candidate promotions: **21**
- Top candidate org counts:
  - `riatzukiza`: **10**
  - `octave-commons`: **2**
  - `open-hax`: **13**
  - `ussyverse`: **0**
- Packages whose names already exist under current org monorepos: **7**

## Promethean corpus note
- The user clarified that the overlapping foundational packages sourced from Promethean are not generic bad drift.
- Treat overlaps with `orgs/octave-commons/promethean` as **verified extraction from a living documentation corpus** unless later review proves a case is just slop.
- The remaining governance question is usually: what is the canonical descendant home now?

## Eta-mu-radar normalization note
- User directed that all threat-radar-related work normalize into `orgs/open-hax/eta-mu-radar`.
- This overrides earlier provisional org guesses for the radar-related package set.

## Highest-confidence promotion candidates

### `riatzukiza`
- `packages/cephalon-clj` — Internal cognitive-system architecture with reproducible run docs points most strongly at riatzukiza.
- `packages/cephalon-ts` — Mature enough to leave packages, but still primarily coupled to your internal ecosystem.

### `octave-commons`
- `packages/eta-mu-docs` — The symbolic framing and substrate focus fit octave-commons better than a purely internal integration bucket.
- `packages/eta-mu-truth` — Strongest current fit is octave-commons because the package identity is concept-heavy rather than productized.

### `open-hax`
- `packages/npu-top` — This already reads like an independently useful open-hax tool.
- `packages/omni-top` — Portable operator/developer tool with product-ish posture.
- `packages/opencode-cljs-client` — Strong open-hax candidate because the package promise is externally reusable.
- `packages/opencode-openplanner-plugin-cljs` — Looks like a reusable integration product rather than a purely internal binding.
- `packages/openplanner-cljs-client` — Fits open-hax better than an internal-only bucket.
- `packages/radar-core` — User directive now makes radar-core part of the eta-mu-radar normalization under open-hax.
- `packages/reconstituter` — One of the clearest open-hax candidates in packages/*.
- `packages/signal-atproto` — Because it is part of the current radar stack, signal-atproto should normalize with eta-mu-radar under open-hax.
- `packages/signal-embed-browser` — Because it is part of the active radar web dependency surface, signal-embed-browser should normalize with eta-mu-radar under open-hax.
- `packages/thread-assessment` — Because it participates in the current radar-adjacent runtime surface, thread-assessment should consolidate into eta-mu-radar under open-hax.

## Packages that should stay in `packages/*` for now

- `packages/aether` -> tentative future org `riatzukiza` (low); Minimal metadata and no README keep it in packages for now.
- `packages/hermes` -> tentative future org `riatzukiza` (low); Too little surface area and documentation to justify promotion yet.
- `packages/mcp-foundation` -> tentative future org `open-hax` (medium-low); Promise points toward open-hax, but the maturity gate is not cleared yet.
- `packages/mcp-oauth` -> tentative future org `open-hax` (medium-low); Likely future open-hax material, but not ready to leave packages.

## Full inventory

| Package | Stage recommendation | Top candidate org | Confidence | Home type | Notes |
|---|---|---|---|---|---|
| `packages/aether` | stay-prototype | `riatzukiza` | low | standalone-repo | Minimal metadata and no README keep it in packages for now.; @workspace scope |
| `packages/cephalon-clj` | candidate-promote | `riatzukiza` | high | standalone-repo | Internal cognitive-system architecture with reproducible run docs points most strongly at riatzukiza. |
| `packages/cephalon-ts` | candidate-promote | `riatzukiza` | high | standalone-repo | Mature enough to leave packages, but still primarily coupled to your internal ecosystem. |
| `packages/embedding` | candidate-promote | `riatzukiza` | medium | existing-monorepo-package | Existing Promethean monorepo matches imply internal canonical-home drift more than a new standalone public package.; existing org package match(es) present; Promethean verified-extraction overlap |
| `packages/eta-mu-docs` | candidate-promote | `octave-commons` | medium-high | standalone-repo | The symbolic framing and substrate focus fit octave-commons better than a purely internal integration bucket.; @workspace scope |
| `packages/eta-mu-truth` | candidate-promote | `octave-commons` | high | standalone-repo | Strongest current fit is octave-commons because the package identity is concept-heavy rather than productized.; @workspace scope |
| `packages/event` | candidate-promote | `riatzukiza` | medium | existing-monorepo-package | Today it looks like mature Promethean plumbing; later it may deserve open-hax treatment if extracted cleanly.; existing org package match(es) present; Promethean verified-extraction overlap |
| `packages/fsm` | candidate-promote | `riatzukiza` | medium | existing-monorepo-package | Current best fit is internal monorepo package with open-hax potential later.; existing org package match(es) present; Promethean verified-extraction overlap |
| `packages/hermes` | stay-prototype | `riatzukiza` | low | standalone-repo | Too little surface area and documentation to justify promotion yet.; @workspace scope |
| `packages/logger` | candidate-promote | `riatzukiza` | medium | existing-monorepo-package | Looks like internal ecosystem infrastructure more than a finished public library.; existing org package match(es) present; Promethean verified-extraction overlap |
| `packages/mcp-foundation` | stay-prototype | `open-hax` | medium-low | standalone-repo | Promise points toward open-hax, but the maturity gate is not cleared yet.; @workspace scope |
| `packages/mcp-oauth` | stay-prototype | `open-hax` | medium-low | standalone-repo | Likely future open-hax material, but not ready to leave packages.; @workspace scope |
| `packages/npu-top` | candidate-promote | `open-hax` | high | standalone-repo | This already reads like an independently useful open-hax tool. |
| `packages/omni-top` | candidate-promote | `open-hax` | high | standalone-repo | Portable operator/developer tool with product-ish posture. |
| `packages/opencode-cljs-client` | candidate-promote | `open-hax` | high | standalone-repo | Strong open-hax candidate because the package promise is externally reusable. |
| `packages/opencode-openplanner-plugin-cljs` | candidate-promote | `open-hax` | medium-high | standalone-repo | Looks like a reusable integration product rather than a purely internal binding. |
| `packages/openplanner-cljs-client` | candidate-promote | `open-hax` | high | standalone-repo | Fits open-hax better than an internal-only bucket. |
| `packages/persistence` | candidate-promote | `open-hax` | medium | standalone-repo | Strong open-hax potential, but existing Promethean copies indicate cleanup is needed before canonization.; existing org package match(es) present; Promethean verified-extraction overlap |
| `packages/radar-core` | candidate-promote | `open-hax` | high | existing-monorepo-package | User directive now makes radar-core part of the eta-mu-radar normalization under open-hax.; eta-mu-radar target; @workspace scope |
| `packages/reconstituter` | candidate-promote | `open-hax` | high | standalone-repo | One of the clearest open-hax candidates in packages/*. |
| `packages/signal-atproto` | candidate-promote | `open-hax` | medium-high | existing-monorepo-package | Because it is part of the current radar stack, signal-atproto should normalize with eta-mu-radar under open-hax.; eta-mu-radar target |
| `packages/signal-embed-browser` | candidate-promote | `open-hax` | medium-high | existing-monorepo-package | Because it is part of the active radar web dependency surface, signal-embed-browser should normalize with eta-mu-radar under open-hax.; eta-mu-radar target |
| `packages/test-utils` | candidate-promote | `riatzukiza` | medium | existing-monorepo-package | Shared internal helper more than standalone public product right now.; existing org package match(es) present; Promethean verified-extraction overlap |
| `packages/thread-assessment` | candidate-promote | `open-hax` | medium-high | existing-monorepo-package | Because it participates in the current radar-adjacent runtime surface, thread-assessment should consolidate into eta-mu-radar under open-hax.; eta-mu-radar target; @workspace scope |
| `packages/utils` | candidate-promote | `riatzukiza` | medium | existing-monorepo-package | Looks mature, but current evidence points to internal ecosystem utility first.; existing org package match(es) present; Promethean verified-extraction overlap |

## Eta-mu-radar related package set
- `packages/radar-core` -> `orgs/open-hax/eta-mu-radar/packages/radar-core`
- `packages/signal-atproto` -> `orgs/open-hax/eta-mu-radar/packages/signal-atproto`
- `packages/signal-embed-browser` -> `orgs/open-hax/eta-mu-radar/packages/signal-embed-browser`
- `packages/thread-assessment` -> `orgs/open-hax/eta-mu-radar/packages/thread-assessment`

## Promethean-derived overlaps
### `packages/embedding`
- classification: **verified-extraction**
- source corpus: `orgs/octave-commons/promethean`
- matching Promethean package path: `orgs/octave-commons/promethean/packages/embedding`
- matching Promethean package path: `orgs/riatzukiza/promethean/packages/embedding`
- provisional top candidate org: `riatzukiza`
- rationale: Existing Promethean monorepo matches imply internal canonical-home drift more than a new standalone public package.
- User clarified that these overlapping modules were extracted because their usefulness was verified from Promethean.
- Treat this overlap as Promethean corpus extraction rather than automatic slop or accidental duplication.

### `packages/event`
- classification: **verified-extraction**
- source corpus: `orgs/octave-commons/promethean`
- matching Promethean package path: `orgs/octave-commons/promethean/packages/event`
- matching Promethean package path: `orgs/riatzukiza/promethean/packages/event`
- provisional top candidate org: `riatzukiza`
- rationale: Today it looks like mature Promethean plumbing; later it may deserve open-hax treatment if extracted cleanly.
- User clarified that these overlapping modules were extracted because their usefulness was verified from Promethean.
- Treat this overlap as Promethean corpus extraction rather than automatic slop or accidental duplication.

### `packages/fsm`
- classification: **verified-extraction**
- source corpus: `orgs/octave-commons/promethean`
- matching Promethean package path: `orgs/octave-commons/promethean/packages/fsm`
- matching Promethean package path: `orgs/riatzukiza/promethean/packages/fsm`
- provisional top candidate org: `riatzukiza`
- rationale: Current best fit is internal monorepo package with open-hax potential later.
- User clarified that these overlapping modules were extracted because their usefulness was verified from Promethean.
- Treat this overlap as Promethean corpus extraction rather than automatic slop or accidental duplication.

### `packages/logger`
- classification: **verified-extraction**
- source corpus: `orgs/octave-commons/promethean`
- matching Promethean package path: `orgs/octave-commons/promethean/packages/logger`
- matching Promethean package path: `orgs/riatzukiza/promethean/packages/logger`
- provisional top candidate org: `riatzukiza`
- rationale: Looks like internal ecosystem infrastructure more than a finished public library.
- User clarified that these overlapping modules were extracted because their usefulness was verified from Promethean.
- Treat this overlap as Promethean corpus extraction rather than automatic slop or accidental duplication.

### `packages/persistence`
- classification: **verified-extraction**
- source corpus: `orgs/octave-commons/promethean`
- matching Promethean package path: `orgs/octave-commons/promethean/packages/persistence`
- matching Promethean package path: `orgs/riatzukiza/promethean/packages/persistence`
- provisional top candidate org: `open-hax`
- rationale: Strong open-hax potential, but existing Promethean copies indicate cleanup is needed before canonization.
- User clarified that these overlapping modules were extracted because their usefulness was verified from Promethean.
- Treat this overlap as Promethean corpus extraction rather than automatic slop or accidental duplication.

### `packages/test-utils`
- classification: **verified-extraction**
- source corpus: `orgs/octave-commons/promethean`
- matching Promethean package path: `orgs/octave-commons/promethean/packages/test-utils`
- matching Promethean package path: `orgs/riatzukiza/promethean/packages/test-utils`
- provisional top candidate org: `riatzukiza`
- rationale: Shared internal helper more than standalone public product right now.
- User clarified that these overlapping modules were extracted because their usefulness was verified from Promethean.
- Treat this overlap as Promethean corpus extraction rather than automatic slop or accidental duplication.

### `packages/utils`
- classification: **verified-extraction**
- source corpus: `orgs/octave-commons/promethean`
- matching Promethean package path: `orgs/octave-commons/promethean/packages/utils`
- matching Promethean package path: `orgs/riatzukiza/promethean/packages/utils`
- provisional top candidate org: `riatzukiza`
- rationale: Looks mature, but current evidence points to internal ecosystem utility first.
- User clarified that these overlapping modules were extracted because their usefulness was verified from Promethean.
- Treat this overlap as Promethean corpus extraction rather than automatic slop or accidental duplication.

## Packages with existing org-package matches
### `packages/embedding`
- existing match: `orgs/octave-commons/promethean/packages/embedding`
- existing match: `orgs/riatzukiza/promethean/packages/embedding`
- provisional top candidate org: `riatzukiza`
- rationale: Existing Promethean monorepo matches imply internal canonical-home drift more than a new standalone public package.

### `packages/event`
- existing match: `orgs/octave-commons/promethean/packages/event`
- existing match: `orgs/riatzukiza/promethean/packages/event`
- provisional top candidate org: `riatzukiza`
- rationale: Today it looks like mature Promethean plumbing; later it may deserve open-hax treatment if extracted cleanly.

### `packages/fsm`
- existing match: `orgs/octave-commons/promethean/packages/fsm`
- existing match: `orgs/riatzukiza/promethean/packages/fsm`
- provisional top candidate org: `riatzukiza`
- rationale: Current best fit is internal monorepo package with open-hax potential later.

### `packages/logger`
- existing match: `orgs/octave-commons/promethean/packages/logger`
- existing match: `orgs/riatzukiza/promethean/packages/logger`
- provisional top candidate org: `riatzukiza`
- rationale: Looks like internal ecosystem infrastructure more than a finished public library.

### `packages/persistence`
- existing match: `orgs/octave-commons/pantheon/packages/persistence`
- existing match: `orgs/octave-commons/promethean/packages/persistence`
- existing match: `orgs/riatzukiza/promethean/packages/persistence`
- provisional top candidate org: `open-hax`
- rationale: Strong open-hax potential, but existing Promethean copies indicate cleanup is needed before canonization.

### `packages/test-utils`
- existing match: `orgs/octave-commons/promethean/packages/test-utils`
- existing match: `orgs/riatzukiza/promethean/packages/test-utils`
- provisional top candidate org: `riatzukiza`
- rationale: Shared internal helper more than standalone public product right now.

### `packages/utils`
- existing match: `orgs/octave-commons/promethean/packages/utils`
- existing match: `orgs/riatzukiza/promethean/packages/utils`
- provisional top candidate org: `riatzukiza`
- rationale: Looks mature, but current evidence points to internal ecosystem utility first.

## No current strong `ussyverse` package candidates

- From the currently visible package metadata, none of the top-level `packages/*` entries clearly read as community-governed collective works.
- That may change later, but there is not enough evidence to recommend `ussyverse` for any current package today.

## Interpretation
- `riatzukiza` currently dominates where a package is clearly mature but still ecosystem-coupled.
- `open-hax` is now also the explicit target for the eta-mu-radar package set.
- `octave-commons` fits the symbolic or research-oriented `eta-mu` line best, but some of those packages are still too under-documented to promote immediately.
- Several foundational packages already have name-matches under current Promethean monorepos, so the next governance question is often whether to bless an existing monorepo home or extract a new standalone repo.
