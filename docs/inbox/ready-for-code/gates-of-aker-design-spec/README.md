# Gates of Aker — Design Specification (v1.0)

Generated: 2026-02-09

This package is a **comprehensive design specification** for the *Gates of Aker* instruction-layer project, based on what has been specified in our current working context (tooling, safety, web-browsing/citation rules, artifact generation, and output contracts).

## What this spec covers
- The **Gate Engine** concept: how “gates” are triggered, evaluated, and enforced.
- A **feature spec for each gate** currently in scope (see `gates/`).
- A unified **tooling contract** for runtime tools and document/artifact generation skills.
- **Safety, trustworthiness, and citation** requirements.
- **UI output contracts**, including email “writing blocks”.
- **Testing + evaluation** guidance and governance for ongoing changes.

## What this spec does *not* cover
- Any *additional* product features that might exist in a private repository or off-chat notes that are not present in the current context.
  - If you share a feature list / issues / roadmap, you can extend the gate catalog and append feature specs using `templates/feature-spec-template.md`.

## Directory
- `spec/` — overall design docs
- `gates/` — one file per gate (feature-level specs)
- `adrs/` — architecture decision records
- `templates/` — reusable templates for new gates/features
- `diagrams/` — mermaid diagrams used by the docs

## How to read
1. Start with `spec/00-context.md` and `spec/03-architecture.md`
2. Read `spec/04-gate-engine.md`
3. Review each file in `gates/` (the “feature specs”)
