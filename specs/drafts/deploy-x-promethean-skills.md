# Deploy X Promethean skills

## Status
Complete

## Summary
Codify the user's standing meaning for requests like `Deploy X` by authoring reusable agent skills that bootstrap a local -> PR -> staging -> PR -> production delivery flow for any service, with Promethean subdomain conventions, Cloudflare DNS automation, allowed base-host selection, and GitHub workflow/protection follow-through.

## User contract
When the user says `Deploy X`, agents should interpret it as:
- inspect the target project for an existing local -> PR -> staging -> PR -> prod delivery flow
- if the flow is missing or incomplete, create it
- use subdomain naming:
  - staging: `staging.<service-name>.promethean.rest`
  - production: `<service-name>.promethean.rest`
- use `CLOUD_FLARE_PROMETHEAN_DOT_REST_DNS_ZONE_TOKEN` for DNS changes under `promethean.rest`
- place staging/production on one or more of the allowed base hosts:
  - `ussy.promethean.rest`
  - `ussy2.promethean.rest`
  - `ussy3.promethean.rest`
  - `big.ussy.promethean.rest`

## Goals
1. Add reusable global skills under `~/.pi/agent/skills/` for this deployment convention.
2. Make the skills visible in this workspace via `.opencode/skill/...` links.
3. Update workspace guidance so future agents know `Deploy X` invokes these skills.
4. Ensure the DNS helper/tooling and docs match the new allowed-host set, including `big.ussy.promethean.rest`.

## Non-goals
- Standing up a new service right now.
- Picking a single universal host-allocation policy without documenting uncertainty/fallbacks.
- Rewriting every existing deployment skill from scratch if extension/composition is sufficient.

## Resolved decisions
1. `Deploy X` should prefer separate staging and production hosts when a safe reachable pair exists, but still allow same-host placement when isolated by path, compose project, and public hostname.
2. The new skill set should use a top-level orchestrator (`promethean-service-deploy`) plus a host-selection helper (`promethean-host-slotting`) while composing existing DNS and PR-promotion skills.
3. The DNS helper/tooling must support `big.ussy.promethean.rest` so the deployment skills remain truthful.

## Risks
- The workspace currently has stale wording in some docs about DNS provider details; the new skills must not inherit that drift.
- A skill that promises `big.ussy.promethean.rest` support is misleading unless the DNS helper/tooling also supports it.
- Overly vague skill text would fail the user's desire for a deterministic `Deploy X` meaning.

## Phases

### Phase 1: Research + contract extraction
- Inspect existing deploy-related skills and DNS helper/tooling.
- Infer the minimum new skills needed.
- Decide what existing docs/guidance must be updated.

### Phase 2: Skill authoring
- Create new Promethean deploy skills in `~/.pi/agent/skills/`.
- Add `CONTRACT.edn` where useful for activation/triggers.
- Link them into `.opencode/skill/`.

### Phase 3: Workspace guidance + tool alignment
- Update `AGENTS.md` with an explicit `Deploy X` interpretation.
- Update the DNS helper/skill/docs for `big.ussy.promethean.rest` support if needed.
- Verify lint/loadability and summarize future-agent usage.

## Definition of done
- New skills exist and are readable under `~/.pi/agent/skills/<name>/SKILL.md`.
- `.pi/skills/<name>/SKILL.md` links exist for the deploy-related skills used in this workspace.
- `.opencode/skill/<name>/SKILL.md` links exist for each new skill where OpenCode discovery still matters.
- Workspace `AGENTS.md` tells future agents that `Deploy X` means the full Promethean deploy bootstrap flow.
- DNS/tooling/docs no longer contradict the allowed base-host set.
- Verification recorded in `receipts.log`.

## Execution log
- Authored `promethean-service-deploy` as the top-level `Deploy X` orchestrator skill.
- Authored `promethean-host-slotting` to choose Promethean staging/prod hosts, subdomains, runtime paths, and compose-project names.
- Added `CONTRACT.edn` files so `promethean-service-deploy`, `promethean-host-slotting`, `promethean-rest-dns`, and `pr-promotion-workflows` show up in the skill graph.
- Linked `promethean-service-deploy`, `promethean-host-slotting`, and related deploy skills into `.pi/skills/` for pi-native workspace discovery.
- Linked `promethean-service-deploy`, `promethean-host-slotting`, and `pr-promotion-workflows` into `.opencode/skill/` as secondary compatibility mirrors.
- Updated `tools/promethean_rest_dns.py` and supporting docs to include `big.ussy.promethean.rest` in the allowed base-host set.
- Updated `AGENTS.md` so future agents interpret `Deploy X` using this convention and know to use `/skill:promethean-service-deploy` in pi when they need to force-load the orchestrator.

## Verification
- `python -m py_compile tools/promethean_rest_dns.py` ✅
- `python tools/promethean_rest_dns.py show-cores` ✅
- `skill_graph list` includes `promethean-service-deploy`, `promethean-rest-dns`, and `pr-promotion-workflows` ✅
- `.pi/skills/promethean-service-deploy/SKILL.md` symlink exists ✅
- `.pi/skills/promethean-host-slotting/SKILL.md` symlink exists ✅
- `.pi/skills/promethean-rest-dns/SKILL.md` symlink exists ✅
- `.pi/skills/pr-promotion-workflows/SKILL.md` symlink exists ✅
- `.opencode/skill/promethean-service-deploy/SKILL.md` symlink exists ✅
- `.opencode/skill/promethean-host-slotting/SKILL.md` symlink exists ✅
- `.opencode/skill/pr-promotion-workflows/SKILL.md` symlink exists ✅
