# Services PR-promotion inventory — 2026-03-21

## Open questions
- Does "all of services" mean strictly the top-level `services/*` directories, or should the inventory also include service source repos under `orgs/**` that back some runtime directories?
- For runtime directories like `services/proxx` and `services/voxx`, should the desired GitHub flow live in the runtime wrapper here, the source repo under `orgs/**`, or both?
- Which box-resident apps under `~/apps` or host-process services should be considered in-scope for future promotion into GitHub deploy flows?

## Risks
- Many `services/*` entries may be deployment/runtime directories inside the workspace root rather than standalone GitHub repos, so a naive per-directory flow inventory could overstate what is directly automatable.
- Some live services are deployed from org submodules or host-only app trees rather than `services/*`, so the workspace-vs-box distinction must be explicit.
- Existing workflow names may not exactly match `staging`/`main` conventions even when a promotion pattern exists.

## Priority
- High: inventory the current service/deploy-flow landscape before standardizing all services onto a staging -> main PR deploy model.

## Phases
1. Enumerate `services/*` and classify each as root-owned directory, nested repo, or root git submodule.
2. Inventory existing GitHub workflows in devel that match PR-promotion/deploy patterns for service-related repos.
3. Compare current live box services against local `services/*` and known org repos to identify box-exclusive services.
4. Summarize which services already have flows, which are submodules, and which need repo-boundary decisions before automation.

## Affected artifacts
- `specs/drafts/services-pr-promotion-inventory-2026-03-21.md`
- `receipts.log`
- optional report artifact if the inventory becomes durable enough to save

## Definition of done
- All top-level `services/*` directories are enumerated.
- Existing service-related staging/main PR deploy workflows available in devel are identified.
- Service directories that are submodules or separate repos are called out explicitly.
- Box-exclusive service/runtime cases are identified with evidence and scope caveats.

## Execution log
- 2026-03-21T17:24:00Z Began inventory of `services/*`, existing PR deploy workflows in devel, and box-exclusive runtime cases.
- 2026-03-21T17:40:00Z Classified the 30 top-level service directories: 28 root-owned, 1 root submodule (`services/vivgrid-openai-proxy`), 1 nested git-pointer path (`services/kronos`), and 1 symlink alias (`services/open-hax-openai-proxy` -> `services/proxx`).
- 2026-03-21T17:47:00Z Verified that no top-level `services/*` path directly contains a staging/main GitHub promotion workflow; the strongest existing service flow in devel is `orgs/open-hax/proxx`, with `orgs/open-hax/voxx` only having main-side automation.
- 2026-03-21T17:52:00Z Cross-checked remote host directories and prior host inventory to identify box-only runtime paths versus services that still have local source trees in devel.
- 2026-03-21T17:58:00Z Wrote JSON and markdown inventory artifacts under `docs/reports/inventory/` and verified they parse and mention the key flow repos and box-only runtime paths.
