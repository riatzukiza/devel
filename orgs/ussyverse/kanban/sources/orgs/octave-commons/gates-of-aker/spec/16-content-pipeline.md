# Content Pipeline & Moddability

This document was created with the assistance of an AI.

## Goals
- Be mod-friendly from day one.
- Content defined as data + scripts with strong validation.

## Content types
- Buildings, jobs, resources
- Miracles and costs
- Pantheon gods (domains, constraints, dialogue)
- Events (rift storms, councils)
- Lore texts, omens, symbols
- Audio motifs and stingers

## Authoring format (suggested)
- JSON/YAML/TOML for data
- Optional scripting (Lua/JS) for behaviors
- Deterministic RNG seeds for replayable events

## Validation
- Schema validation in CI
- In-game content linter with “what will break” warnings
