# packages/ + services/ → orgs/ migration

## Rule
- Canonical promoted modules live under `orgs/<org>/<repo>` (git submodules).
- `packages/<name>` and `services/<name>` remain in this repo as:
  - prototypes (real directories), or
  - compatibility symlinks to canonical modules.

## Source of truth
- `migration-map.yaml` — what should be promoted, where it lives, and upstreams.
- `links.yaml` — which compatibility symlinks should exist.
