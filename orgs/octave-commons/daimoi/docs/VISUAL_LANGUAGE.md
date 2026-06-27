# Daimoi Visual Language

## Purpose

Preserve the UI/UX grammar around daimoi before it dissolves into generic particle effects.

## Source anchor

- `orgs/octave-commons/fork_tales/docs/notes/system_design/2026-02-20-sigil-and-daimoi-visual-language.md`

## Core rule

A daimon should read as a **symbolic packet**.

Not:
- a star
- a generic node
- a background sparkle
- a decorative particle

## Anatomy of a daimon

The upstream note describes a packet with visible state:
- core glyph / packet body
- owner crest / micro-sigil
- velocity tail
- glow intensity
- size

### Suggested visual mapping

| State | Visual affordance |
|---|---|
| owner | micro-sigil crest |
| speed | tail length |
| instability/noise | tail curvature |
| intent energy | glow intensity |
| dominant intent class | hue / glow bias |
| mantle influence | halo thickness |

## Presence relationship

The note also insists each Presence has:
- a primary sigil
- a ring style
- a dominant field-layer signature

A daimon emitted by that presence should visibly carry that relation.

## Swarm vs debug rendering

### Debug mode
Render each daimon individually so state inspection is possible.

### Swarm mode
Cluster by:
- owner
- direction similarity
- spatial proximity

Then render as:
- braided ribbon
- glowing arc
- bundled strand

This is important because the original corpus treated the swarm as a **braid of intent flow**, not merely a cloud of points.

## Field rendering rule

The field should look like:
- wind
- flow grain
- subtle directional texture

It should not look like:
- tangled spaghetti lines
- generic heatmap mush
- arbitrary decorative motion

## Strong constraint

Nothing else in the UI should re-use daimoi glyph language casually.

Why:
- if generic background dots look like daimoi, the visual grammar collapses
- the observer can no longer tell meaningful packets from scene dressing

## Why this belongs in the daimoi repo

Without the visual grammar, later implementations will preserve equations and lose legibility.

The old experiment wanted daimoi to be:
- measurable
- governable
- aesthetically distinct
- readable in motion

That is part of the organism, not a cosmetic afterthought.
