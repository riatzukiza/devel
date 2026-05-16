## Signal

(己, p=0.9) Done: created a new Clojure migration tool repo and vendored it into OpenPlanner as a git submodule at:

- `orgs/open-hax/openplanner/packages/stores/migrations/openplanner-migration-tools`

Repo created at:

- `orgs/open-hax/openplanner-migration-tools`

It includes a runnable CLI scaffold and an MVP `migration-1` runner placeholder aligned with your “remove duplicated Knoxx session text from OpenPlanner when provably present in Proxx by prompt_cache_key” intent.

(己, p=0.8) Important caveat: the submodule URL is currently a local `file:///...` URL, which will work on this machine but will not be cloneable on other machines until we publish a real remote (e.g. `git@github.com:open-hax/openplanner-migration-tools.git`) and update `.gitmodules`.

## Evidence

(己, p=0.9) Commits (submodule-safe, path-scoped):

- New repo:
  - `orgs/open-hax/openplanner-migration-tools`
  - commits:
    - `9f344cb` initial scaffold
    - `ea605a6` fixed MongoDB dep coords + tools.cli option ids (so `clj -M:run --help` works)

- OpenPlanner repo (parent) updated:
  - added submodule + `.gitmodules` entry (commit `ee718f6`)
  - bumped submodule pointer after fixing deps/CLI (commit `975257e`)

- Workspace root (`/home/err/devel`) updated OpenPlanner submodule pointer twice:
  - commits `9f845ac8` and `eb687cc7`

(己, p=0.9) Verified runnable:
- `clj -M:run --help` works in `openplanner-migration-tools` after the `org.mongodb/mongodb-driver-sync` fix.

## Frames

(己, p=0.7) This gets you the “migration tool surface” with minimal coupling: migrations are now externalized into a dedicated repo, but colocated under OpenPlanner via submodule for operational convenience.  
(世, p=0.65) Unifying the systems will require making the submodule URL remote-cloneable; the current `file://` URL is a local bootstrap step.  
(己, p=0.6) The MVP `migration-1` runner is intentionally conservative: report-first + small-batch; it will need hardening (hash-based matching + receipts) before destructive runs.

## Countermoves

(己, p=0.8) Do not run `--apply` on Migration 1 yet as “canonical behavior”; the current implementation uses a substring match against serialized JSON for proof-of-existence. Before deletion, we should upgrade it to hash-based verification and write receipts per redaction.  
(己, p=0.75) Don’t leave the `.gitmodules` URL as `file:///...` for long—other machines will break. We should publish the repo and flip the URL.

## Next

(汝, p=0.85) Run a dry-run help check from the vendored location to confirm wiring:  
`cd orgs/open-hax/openplanner/packages/stores/migrations/openplanner-migration-tools && clj -M:run --help`