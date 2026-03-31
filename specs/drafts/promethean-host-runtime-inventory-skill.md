# Promethean host runtime inventory skill + report artifacts

## Open questions
- Should the skill target only the default Promethean fleet (`ussy`, `ussy2`, `ussy3`, `big.ussy`) or accept arbitrary explicit host lists under `*.promethean.rest`?
- What output path should be the default for machine-readable inventory artifacts in this workspace?
- How should host-process-backed routes be represented so they are not confused with container-backed routes?

## Risks
- Live host state is time-sensitive; container names and statuses may drift between inventory and report write.
- Some hosts may not be Docker-backed, so the skill must distinguish Docker/Podman inventories from systemd/Proxmox-only hosts.
- Reverse-proxy config may mention hostnames whose upstreams are host processes rather than containers; the report must label those honestly.
- Skill authoring touches both global pi state and workspace-local mirrors, so path mistakes could leave the skill undiscoverable.

## Priority
- High: preserve the just-completed host inventory as reusable operator guidance and durable artifacts.

## Phases
1. Draft the spec and define artifact paths for JSON + markdown outputs.
2. Create the reusable `promethean-host-runtime-inventory` skill in the global pi skill catalog.
3. Mirror the skill into workspace-local `.pi/skills/` and `.opencode/skill/`, and register it in the workspace/skill graph docs.
4. Write the current fleet snapshot to JSON and markdown files with host/container/route distinctions.
5. Verify the skill is discoverable and the artifact files exist with the expected content.

## Affected artifacts
- `specs/drafts/promethean-host-runtime-inventory-skill.md`
- `docs/reports/inventory/promethean-host-runtime-inventory-2026-03-21.json`
- `docs/reports/inventory/promethean-host-runtime-inventory-2026-03-21.md`
- `AGENTS.md`
- `.pi/skills/promethean-host-runtime-inventory/SKILL.md`
- `.opencode/skill/promethean-host-runtime-inventory/SKILL.md`
- `/home/err/.pi/agent/skills/promethean-host-runtime-inventory/SKILL.md`
- `/home/err/.pi/agent/skills/promethean-host-runtime-inventory/CONTRACT.edn`
- `/home/err/.pi/agent/operation-mindfuck/ημΠ.dev.v5.skill-graph.lisp`
- `receipts.log`

## Definition of done
- A reusable skill named `promethean-host-runtime-inventory` exists in the global skill catalog with clear triggers, steps, and output expectations.
- Workspace-local mirrors exist under both `.pi/skills/` and `.opencode/skill/`.
- `AGENTS.md` mentions the new skill in the workspace skill list.
- The skill graph registry references the new skill contract.
- A JSON inventory artifact exists for the four hosts requested so far.
- A markdown report exists summarizing the same inventory with evidence notes.
- Verification confirms the skill is discoverable and the artifacts exist.

## Execution log
- 2026-03-21T17:05:00Z Drafted spec for promoting Promethean host runtime inventory into a reusable skill and artifact workflow.
- 2026-03-21T17:10:00Z Authored the global skill `promethean-host-runtime-inventory` with JSON/markdown artifact expectations and runtime classification guidance.
- 2026-03-21T17:11:00Z Added workspace-local mirrors under `.pi/skills/` and `.opencode/skill/`, registered the skill in the global skill graph, and listed it in `AGENTS.md`.
- 2026-03-21T17:13:00Z Wrote the current four-host fleet snapshot to `docs/reports/inventory/promethean-host-runtime-inventory-2026-03-21.json` and the matching markdown report.
- 2026-03-21T17:14:00Z Verified JSON parsing, artifact existence, symlink mirrors, and skill-graph discoverability for `promethean-host-runtime-inventory`.
