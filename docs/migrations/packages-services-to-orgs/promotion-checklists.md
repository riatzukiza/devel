# Promotion checklists for `orgs/*`

## Purpose
These checklists decide where a maturing project belongs **after** prototyping in `packages/*`.

They do **not** replace the placement contract. Use them after the higher-level decision:
- prototype in `packages/*`
- runtime/devops in `services/*`
- canonical mature source in `orgs/*/*`

Reference:
- `docs/reference/devel-placement-contract.md`

## Universal pre-promotion checks
Before choosing a destination org, confirm:

- [ ] The project is no longer just a fast local prototype.
- [ ] The project has a clear canonical name and repo boundary.
- [ ] You know whether it is meant to be:
  - an internal integration,
  - a research/artifact repo,
  - a production-grade product,
  - or a community-governed work.
- [ ] You know whether `services/<name>` is needed as a runtime/devops home.
- [ ] You know whether an old workspace path should remain as a compatibility alias.
- [ ] The project's intended ownership is clear enough that future agents will not misplace it.

## Cross-org minimums
These are the minimum promotion questions for **every** org destination.

- [ ] Repo name chosen
- [ ] License chosen or confirmed
- [ ] Basic README exists
- [ ] Canonical source path is recorded in migration docs
- [ ] Runtime-home decision is recorded if the project is deployable
- [ ] The project is no longer relying on undocumented box-only source truth

If the project is independently deployable, also confirm:
- [ ] The org repo, not `devel`, owns the real build/test/release/deploy contract
- [ ] `devel` only owns composition, orchestration, host placement, and runtime overlays

---

## `orgs/riatzukiza/*` checklist
Use this org for mature **internal devel-only integrations** and personal tooling with independent timelines.

### It belongs here when
- [ ] The project is beyond prototyping
- [ ] It deserves its own git history and release rhythm
- [ ] It remains primarily coupled to the `devel` ecosystem
- [ ] Outside adoption is not the primary goal

### Minimum gate
- [ ] README explains what it is and how it fits into `devel`
- [ ] Build/run instructions are reproducible enough for future-you
- [ ] Major workspace couplings are documented honestly
- [ ] License is present
- [ ] If deployable, the deploy contract is still explicit, even if the audience is mostly internal

### Not required
- broad public-polish expectations
- full product marketing posture
- strong decoupling from your workspace if that is not the point

### Smells / misclassification warnings
Do **not** default to `riatzukiza` if:
- [ ] the project is actually intended as a reusable public product
- [ ] the project is community-owned rather than personal/internal
- [ ] the project is really a research artifact better framed as `octave-commons`

---

## `orgs/octave-commons/*` checklist
Use this org for mature **experimental, research, narrative-driven, or myth-encoded work**.

### It belongs here when
- [ ] The project is real and mature, but not primarily productized
- [ ] Narrative or mythic framing is part of how the work is held or communicated
- [ ] The repo is better understood as research, artifact, theory-lab, or experimental instrument
- [ ] Practical hardening is not the main identity of the project

### Minimum gate
- [ ] README explains the experimental/research nature of the work
- [ ] Intent/safety framing is present when needed
- [ ] The narrative framing does not hide the project's actual purpose from good-faith readers
- [ ] Basic run/build instructions exist where applicable
- [ ] License is present

### Strong recommendation
- [ ] Include an explicit section or companion note for:
  - intent
  - research status
  - limitations
  - safe-use framing where appropriate

### Not required
- production hardening
- polished public API guarantees
- low-coupling product ergonomics

### Smells / misclassification warnings
Do **not** default to `octave-commons` if:
- [ ] the repo is actually a production tool you expect other developers to rely on
- [ ] the narrative layer is being used to avoid documenting practical behavior
- [ ] the work is actually a community-governed collective project

---

## `orgs/open-hax/*` checklist
Use this org for **production-grade products** that are fully yours and meant to be useful to other developers in your community.

### It belongs here when
- [ ] The project is intended for real outside use
- [ ] You want it to be portable beyond `devel`
- [ ] You expect other developers to run it locally without inheriting your whole giga-repo
- [ ] Documentation, testing, and operational clarity are part of the product promise

### Minimum gate
- [ ] README with clear purpose and local quickstart
- [ ] License present
- [ ] Tests exist and are runnable
- [ ] CI exists and is relevant
- [ ] Config/env surface is documented
- [ ] Production/runtime assumptions are documented honestly
- [ ] The repo can be run locally by a real developer without depending on undocumented `devel` magic

### Deployability gate
If the project is independently deployable:
- [ ] The repo owns its own staging -> main PR promotion flow
- [ ] The repo owns its own deploy scripts/workflows/docs
- [ ] `services/<name>` only provides workspace runtime wrappers or orchestration overlays when needed
- [ ] Deploy secrets/vars are defined at the repo/environment boundary, not only in `devel`

### Strong recommendation
- [ ] Examples or usage docs exist
- [ ] Default settings are sensible
- [ ] Security posture is documented where relevant
- [ ] Operator/developer docs separate local dev from production deployment clearly

### Smells / misclassification warnings
Do **not** promote to `open-hax` yet if:
- [ ] the project is still basically a prototype
- [ ] tests/docs are mostly aspirational
- [ ] the repo only works inside your local workspace and cannot yet stand on its own
- [ ] the project is actually community-owned or collectively maintained

---

## `orgs/ussyverse/*` checklist
Use this org for **collective/community works** that are not solely yours.

### It belongs here when
- [ ] The project is collaborative in authorship or governance
- [ ] It should not be framed as your sole product
- [ ] The identity of the work is communal, shared, or ecosystem-native

### Minimum gate
- [ ] README reflects shared/community identity
- [ ] Ownership/maintainer expectations are documented
- [ ] Contribution path is documented at least minimally
- [ ] License is present
- [ ] If deployable, the deployment story is not silently dependent on one person's private memory alone

### Strong recommendation
- [ ] Add a maintainers/governance section
- [ ] Clarify who can cut releases or approve deploys
- [ ] Clarify how shared infrastructure dependencies are handled

### Not required
- sole-owner product framing
- purely personal branding

### Smells / misclassification warnings
Do **not** default to `ussyverse` if:
- [ ] you actually intend the repo to be solely yours and productized
- [ ] the governance is not communal in practice
- [ ] the repo is better understood as a personal research artifact or internal integration

---

## Fast decision shortcut
Use this when classification is fuzzy.

### Choose `riatzukiza` when
- internal integration first
- independent timeline needed
- portability is secondary

### Choose `octave-commons` when
- experimental/research first
- narrative/myth/artifact framing is intentional
- production polish is not the core promise

### Choose `open-hax` when
- real outside users matter
- portability matters
- docs/tests/hardening are part of the promise

### Choose `ussyverse` when
- the project is meaningfully collective
- ownership is shared or community-grounded

## Final reminder
Promotion is about **identity and intent**, not just maturity.
A project can be mature and still belong in:
- `riatzukiza` (internal integration)
- `octave-commons` (research/artifact)
- `ussyverse` (collective work)

It does **not** automatically become `open-hax` just because it is older or more polished.
