# Creative invocation contract

## Purpose
Make a small set of user phrases mean something operationally consistent instead of forcing the user to restate the same meta-instructions every session.

These invocations are not permission for random flourish.
They are routing cues.

## Core principle
Creativity in this workspace must remain:
- tied to user intent
- bounded by truth
- recoverable from repo/session context
- useful enough to change what gets built

## Invocation map

### `engage in total creative freedom`
Interpret as:
- widen the search space
- search notes, sessions, repo patterns, and neighboring artifacts aggressively
- generate multiple internal frames
- choose the strongest one
- ship a real artifact, not just vibes

Expected outputs:
- concrete design direction
- architecture/spec
- naming lattice
- implementation plan
- copy deck or information architecture

### `sing the songs of your people`
Interpret as:
- use the workspace's own motifs, phrases, tensions, and symbols
- sound native to the corpus rather than generic assistant prose
- keep beauty in service of clarity

Expected outputs:
- manifesto-like framing
- homepage/brand voice
- poetic technical synthesis
- lore-compressed explanation tied back to actual repo context

### `grok my intention`
Interpret as:
- recover the latent task from surrounding context
- search notes, sessions, specs, and repo structures before asking the user to restate
- translate density into an operational shape

Expected outputs:
- recovered intent summary
- chosen manifestation
- one strong next move

### `manifest the dream`
Interpret as:
- do not stop at interpretation
- turn the recovered intention into structure
- choose the correct form: spec, site, task lattice, architecture, or scaffold

Expected outputs:
- a shape the machine can act on
- preferably a file, plan, structure, or implementation-ready path

### `intent is now densely compressed`
Interpret as:
- the user believes enough context already exists in the workspace
- the agent should decompress from notes/session/repo context rather than bounce the prompt back

## Truth binding
When using these invocations, maintain this split when it matters:

- **Facts**: directly supported by files, sessions, tests, or observable repo state
- **Interpretations**: best-fit reading of what the user is asking for
- **Manifestation**: the concrete structure chosen to move the work forward

The more symbolic the prompt, the more important this separation becomes.

## Primary source anchors
- `docs/notes/poetry/prelude-to-epiphany.md`
- `docs/notes/research/creative-protocol-manifest.md`
- relevant `~/.pi/agent/sessions/**/*.jsonl` prompts using these phrases
- `docs/reference/devel-placement-contract.md` when project structure is implicated

## Anti-patterns
Avoid:
- treating creative freedom as license for unsupported claims
- asking the user to unpack context that is already in the workspace
- returning pure poetry when the task needed a plan
- returning pure planning when the task needed native voice and compression
- confusing mythic framing with factual evidence

## Minimal contract
When one of these phrases appears, the agent should usually do three things:
1. recover more context than normal
2. synthesize more boldly than normal
3. return something more structured and usable than normal