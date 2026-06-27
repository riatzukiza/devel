# Signal Extraction Foundation

This document defines the first extraction pass for moving stable signal-system
infrastructure out of Fork Tales and into reusable `@open-hax/*` modules.

## Goal

Make the stable edges of the experiment importable from Fork Tales so the
experiment shrinks while contracts harden.

## First-pass packages

- `@open-hax/signal-contracts`
  - stable JSON-friendly record constants and normalization helpers
  - designed to keep snake_case record fields compatible with Python and JS
- `@open-hax/signal-watchlists`
  - sync watchlist parsing/loading/merging helpers for current crawler bootstrap
  - intentionally CommonJS-consumable so `part64/code/web_graph_weaver.js` can use it now
- `@open-hax/signal-radar-core`
  - deterministic reusable radar helpers extracted from the threat-radar policy layer
- `@open-hax/signal-source-utils`
  - reusable source/url/feed/semantic extraction helpers extracted from the Node weaver
  - keeps Fork Tales runtime focused on orchestration instead of canonical source parsing

## Not in this pass

- full crawler extraction
- full radar extraction
- MCP threat tools
- correlation engine extraction

Those layers are still entangled with large `part64` modules and need more
stabilization before extraction.

## Consumption target in Fork Tales

The immediate consumer is `part64/code/web_graph_weaver.js`, which can now
import watchlist normalization from `@open-hax/signal-watchlists` without a
larger module-system rewrite.

## Follow-on extraction order

1. move more watchlist/bootstrap helpers
2. extract crawler graph record contracts
3. extract threat-radar scoring cores by profile
4. extract cross-domain correlation contracts and logic
5. expose the stabilized slices through MCP and a smaller signal API
