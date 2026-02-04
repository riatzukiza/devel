# SonarQube coverage for all submodules

## Context & references
- .gitmodules:1-89 — submodule inventory and paths under `orgs/` (GitHub-hosted).
- .github/workflows: current workflows (`codex-release-watch.yml`, `mdlint-agent.yml`); no Sonar coverage.
- orgs/riatzukiza/promethean/sonar-project.properties:1-19 — only present Sonar config (uses `sonar.projectKey=hacks`).
- orgs/riatzukiza/promethean/pipelines/sonarflow/pipeline.yml:1-36 — existing Sonar pipeline definition for Promethean.
- orgs/riatzukiza/promethean/docker-compose.sonarqube.yml:2-17 — local SonarQube service setup (optional).

## Requirements
- Run SonarQube analysis for every submodule recursively from the parent repo.
- Prefer a single SonarQube project keyed to the parent repo; avoid per-submodule projects.
- If unique projects per submodule are unavoidable, creation must be automated (no manual project setup).
- Minimize duplication: workflows should be generated/templated and live in the parent repo.
- Ensure submodules are checked out recursively and analyzed without local manual steps.

## Constraints / open questions
- SonarQube generally requires unique `sonar.projectKey` per analyzed codebase; aggregating all submodules under one key yields shared metrics (no per-submodule gating).
- Token and host origin (SonarCloud vs self-hosted) not yet chosen; `SONAR_HOST_URL`/`SONAR_TOKEN` secrets needed at parent level.
- Language mix across submodules may exceed SonarCloud limits; may need exclusions for non-supported or large dirs.

## Definition of Done
- Parent repo contains a reusable workflow (or generator) that:
  - Checks out submodules recursively.
  - Runs Sonar analysis across all targeted submodules using provided secrets.
  - Emits unique `sonar.projectKey` names deterministically (either single aggregated key or per-submodule keys derived from paths).
  - Automates project creation when keys are missing (via SonarQube API) if per-submodule mode is selected.
- Documentation in repo on how to run/maintain the workflow and required secrets.
- No manual per-submodule project provisioning required after setup.

## Plan (phases)
1) Decide strategy
   - Confirm whether aggregated single-project metrics are acceptable; if not, enable per-submodule keys.
   - Set naming convention for `sonar.projectKey` (e.g., `parent::<path-slug>`).
2) Workflow design
   - Add `.github/workflows/sonar-submodules.yml` that checks out submodules recursively.
   - Generate `sonar-project.properties` on-the-fly for aggregated mode, or run matrix jobs per submodule with `sonar.projectBaseDir` set.
   - Inject `SONAR_HOST_URL`/`SONAR_TOKEN`/`SONAR_ORG` from repo secrets.
3) Automation (if per-submodule required)
   - Add script (e.g., `scripts/sonar-bootstrap.ts`) that reads `.gitmodules`, slugs keys, and calls SonarQube API (`/api/projects/search/create`) to create missing projects idempotently.
   - Use the script inside the workflow before scanning to ensure projects exist.
4) Hardening
   - Add exclusions for vendored/large directories; ensure scan time and language plugins remain within limits.
   - Document operational steps in `docs/` and wire cache for `~/.sonar/cache` in CI.
