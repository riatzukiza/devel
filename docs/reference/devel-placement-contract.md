# Devel placement contract

## Purpose
Keep the workspace legible by separating:
- rapid prototyping
- canonical project identity
- deployment and runtime operations

This contract is the default unless the user explicitly says otherwise for a specific project.

## Core model
Project placement is **not a single linear pipeline**.

A project has at least two independent dimensions:
1. **stage** — prototype vs mature
2. **identity** — internal integration, research/artifact, product, or collective/community work

## Default birthplace
### `packages/*`
`packages/*` is the default home for new work.

Use `packages/*` for:
- rapid prototyping
- early experiments
- volatile local iteration
- work that has not yet earned an independent repo boundary

If the user does not explicitly request another home, start new projects in `packages/*`.

## Devops layer
### `services/*`
`services/*` is **devops-exclusive**.

Use `services/*` for:
- Docker Compose and runtime wrappers
- deployment config
- operator docs and env examples
- host/runtime overlays
- workspace-specific orchestration glue
- stable runtime paths and compatibility aliases when needed

Do **not** treat `services/*` as the default canonical home for application source code.

A service may have:
- canonical source in `orgs/<org>/<repo>`
- runtime/devops home in `services/<name>`

That split is intentional.

## Canonical project homes
After rapid prototyping, projects graduate into one of four org namespaces.
This is a choice about **identity and intent**, not just maturity.

### `orgs/riatzukiza/*`
Use for mature internal devel-only integrations.

These projects:
- are beyond the prototype stage
- deserve their own git history and independent timeline
- remain primarily coupled to the `devel` ecosystem
- do not need to optimize first for outside adoption

### `orgs/octave-commons/*`
Use for mature experimental, narrative-driven, myth-encoded, or research-oriented work.

These projects:
- are real and mature
- may be exploratory rather than practical
- may compress novel ideas through narrative or aesthetic framing
- should be legible as research/artifact work rather than production products

### `orgs/open-hax/*`
Use for production-grade products that are fully yours and intended to be useful to others.

These projects should aim for:
- strong docs
- real tests
- hardened production posture
- easy local operation for developers outside your personal workspace
- portability beyond `devel`

### `orgs/ussyverse/*`
Use for collective/community works that are not owned solely by you.

These projects:
- may be collaborative or socially shared
- should not be framed as exclusively yours
- can still be production-capable, but their governance is communal

## Promethean as corpus; devel as crucible
`orgs/octave-commons/promethean` is a special case.

Treat Promethean as:
- a corpus of living documentation
- documentation-as-code
- a regenerative source of ideas, specs, concepts, and partially formalized architectures
- a place where useful kernels may exist before they have a stable product identity

Do **not** force Promethean to behave like a finished product repo.
It is allowed to contain:
- idea fragments
- speculative modules
- half-formalized patterns
- living design material that has not yet earned canonical extraction

`devel` exists partly to prevent a self-referential loop where the imagined operating system is only used to imagine the operating system.
In this contract, `devel` is the **crucible** that:
- extracts code and concepts from the corpus
- reality-checks them with runnable packages and services
- decides what becomes internal infrastructure, research artifact, product, or collective work

When the same module or concept appears in Promethean and elsewhere, classify the relationship explicitly:
- **slop** — low-signal leftovers or dead ends with no verified value
- **corpus artifact** — valuable conceptual material that should remain in Promethean as living documentation
- **verified extraction** — code or patterns whose usefulness was proven after extraction from Promethean
- **canonical descendant** — extracted code that now has a stable long-term home outside Promethean

Promethean-derived duplication is therefore **not automatically bad drift**.
Some duplication is evidence of successful extraction from the corpus.
The real question is whether the descendant now has a canonical home and clear provenance.

## Ownership of deploy truth
The canonical org repo should own its own:
- source of truth
- build/test contract
- release/deploy contract
- GitHub staging -> main PR promotion flow when the project is deployable on its own

`devel` should own:
- composition across many repos
- local integration
- fleet placement
- shared runtime overlays
- operator convenience paths
- cross-service orchestration

In short:
- **org repo owns deployability**
- **devel owns composition and operations**

## Anti-patterns
Avoid these states:
- canonical source split ambiguously between `orgs/*` and `services/*`
- box-only deploy knowledge with no corresponding source tree in `devel`
- treating `services/*` as a dumping ground for prototypes and deploy wrappers at the same time
- making `devel` responsible for a service's only real deploy contract when the service is supposed to be independently reusable

## Practical rule of thumb
```text
prototype -> packages/*
identity -> orgs/{riatzukiza|octave-commons|open-hax|ussyverse}/*
operations -> services/*
```

## Notes for migration work
Older migration drafts may assume `services/*` can act as both a prototype layer and a symlink layer.
This contract supersedes that assumption:
- `packages/*` is the prototype default
- `services/*` is the runtime/devops layer
- org repos remain the canonical long-term homes for mature projects
