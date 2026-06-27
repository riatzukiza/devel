# Fork Tales Source Map

`daimoi` is the doc-first extraction of the **packet / field / measurement** layer that was previously entangled inside `fork_tales`.

## Primary upstream sources

### Runtime code surfaces
These are the most direct implementation sources in `fork_tales`:
- `orgs/octave-commons/fork_tales/part64/code/world_web/daimoi_probabilistic.py`
- `orgs/octave-commons/fork_tales/part64/code/world_web/daimoi_quadtree.py`
- `orgs/octave-commons/fork_tales/part64/code/world_web/daimoi_collision_semantics.py`
- `orgs/octave-commons/fork_tales/part64/code/world_web/constants.py`

Together they cover:
- force accumulation and motion
- quadtree-based spatial queries
- collision semantics
- profile definitions and tunable parameters

### System-design notes
- `orgs/octave-commons/fork_tales/docs/notes/system_design/2026-02-20-hybrid-field-graph-formalism.md`
- `orgs/octave-commons/fork_tales/docs/notes/system_design/2026-02-20-design-hole-responses-field-and-collisions.md`
- `orgs/octave-commons/fork_tales/docs/notes/system_design/2026-02-20-sigil-and-daimoi-visual-language.md`

These notes explain the intent behind the runtime code:
- daimoi as semantic packets
- ownership and handoff semantics
- collision / absorption behavior
- field readability and UI implications
- the relationship between daimoi, presences, and nexus nodes

### Decomposition specs in the workspace
- `specs/eta-mu-extraction-vault.md`
- `specs/daimoi-core-spec.md`

These documents were written during decomposition and are useful because they convert the dense `fork_tales` implementation into named responsibilities.

## What this repo currently captures
- `docs/snr-metrics.md` captures the **measurement / observability** side:
  - non-arbitrary length scales
  - spatial clumpiness
  - field-following vs motion noise
  - signal-to-noise interpretation

## What still lives upstream
The repo does **not** yet fully capture:
- concrete profile tables from `constants.py`
- collision rule taxonomies from `daimoi_collision_semantics.py`
- the mapping from daimoi dynamics into specific Part64 UI panels

Those should be added incrementally as future docs rather than copied wholesale from the coupled runtime.
