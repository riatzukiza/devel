## Signal
(己, p=0.86) Your docs set under `orgs/open-hax/openplanner/` does **not yet** reliably communicate “what it is / how it does it / why use it / how it differs / similar solutions”, and it contains several **accuracy regressions** (stale paths, mismatched runtime topology) plus **missing contributor guidance** for your desired CLJ/CLJS + Malli-first direction.

(己, p=0.9) The biggest blockers to accuracy/clarity/intent are:
- (己, p=0.9) **Root README is inaccurate** about repo layout and startup commands:
  - references `services/…` (directory does not exist)
  - references `packages/graph-runtime` (package does not exist; only `pseudo/graph-runtime`)
- (己, p=0.85) **Most package READMEs are “what/overview” heavy but “why/differentiation/prior art” light**, so they fail the “Why should you use it?” requirement.
- (己, p=0.9) There is **no canonical Contributing / Coding Style doc** that states:
  - “prefer Clojure/shadow-cljs for business logic”
  - “extract significant TS logic into CLJS packages”
  - “all Clojure functions have Malli schemas validating inputs/outputs”
- (己, p=0.8) Several docs include **provenance/history/scratch artifacts** (`pseudo/`, `archive/`, `READMEFLOW` blocks) that read like primary docs, which muddies intent unless explicitly labeled “reference / non-product”.

(己, p=0.78) Suggested “fix set” is: **(1) fix root docs + doc navigation + contributor doctrine, (2) standardize per-package README structure, (3) add automated doc lint to prevent regression**.

## Evidence
(己, p=0.95) Scanned documentation files under `orgs/open-hax/openplanner/` (excluding `node_modules/` + `dist/`): **756** `.md/.mdx/.txt` files (tool: `node` walker + heuristic scan).

(己, p=0.98) Root README contains stale layout + command references (tool: `read` + `rg`):
- `README.md` claims:
  - `packages/graph-runtime/` exists
  - `services/` exists
  - Quick start uses `docker compose -f services/openplanner/docker-compose.yml up -d`
- Actual repo has **no `services/` directory** (tool: `ls`, `find`), and no `packages/**/graph-runtime`.

(己, p=0.9) Verified current runtime entrypoint is `docker-compose.yml` at repo root (tool: `read orgs/open-hax/openplanner/docker-compose.yml`) and it exposes `openplanner` on `${OPENPLANNER_PORT:-7777}:7777`.

(己, p=0.9) Verified `graph-runtime` is present only as **spec/reference** at `pseudo/graph-runtime/README.md` (tool: `read`).

(己, p=0.86) Many READMEs include a “Built with GLM-5 … Ussyverse” banner (23 hits; tool: `rg`). This may be fine as credit, but it currently occupies prime “what/why/how” attention space and contributes to intent drift in multiple packages.

(己, p=0.84) Broken/missing relative links were detected (54 instances) including:
- `packages/graph/graph-weaver/README.md` links to `../knoxx/specs/…` but `knoxx` is actually under `packages/agents/knoxx/…` now (tool: link existence scan).
- `archive/persistence/docs/DEVELOPMENT_GUIDELINES.md` has self-referential `./docs/...` links that are wrong given its location (tool: link scan + `read`).

(己, p=0.8) There is **no** `CONTRIBUTING.md` at monorepo root; also no central “Coding style / contributor doctrine” page (tool: `rg` for “Contributing”, `ls`).

## Frames
(己, p=0.74) Frame 1 — “Docs accreted during monorepo cutover”: Many docs read like they were correct pre-cutover (e.g., `services/` references), and the repo moved faster than docs.
(己, p=0.7) Frame 2 — “Specs are acting as product docs”: Specs/notes/history (`specs/`, `docs/notes/`, `pseudo/`) are high quality but are not shaped as onboarding docs; without strong signposting they blur the “what should I use?” boundary.
(己, p=0.66) Frame 3 — “Package READMEs are written as internal handoff notes”: Several READMEs explain what a thing *is* but not why someone should pick it over alternatives; that’s normal in internal ecosystems but conflicts with your stated documentation contract.

## Countermoves
(己, p=0.86) Separate doc types explicitly and enforce it in navigation:
- “Product docs” (what/how/why) vs “Specs” (design commitments) vs “Notes/history” (provenance).
(己, p=0.88) Fix the root README first, because it sets the mental model and currently contains objective inaccuracies.
(己, p=0.84) Add a single canonical contributor doctrine doc and link it from every package README; don’t try to restate style in 20 READMEs.
(己, p=0.8) Add a simple doc-lint gate to prevent regressions:
- fail on references to `services/` (unless it exists)
- fail on missing “What/How/Why/Different/Prior art” headings for package READMEs (configurable for `archive/` + `pseudo/`)

## Next
(汝, p=0.76) Confirm scope: should I **(A)** apply a “minimal, high-impact doc repair” (root `README.md` + new `CONTRIBUTING.md` + fix broken `graph-weaver` link + add doc-lint script), or **(B)** do a full pass updating every `packages/**/README.md` to a standard template with “What/How/Why/Different/Prior art”?