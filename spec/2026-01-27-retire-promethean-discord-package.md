# Retire Promethean Discord package (2026-01-27)

## Summary
Exclude the Promethean Discord package from the workspace and expand workspace patterns to cover moved packages (cli/services/experimental/pipelines/tools).

## Requirements
- `@promethean-os/discord` is excluded from the pnpm workspace.
- Workspace patterns include moved Promethean packages (cli/services/experimental/pipelines/tools).
- Workspace installs no longer fail on missing internal package relocations.
- Promethean MCP no longer depends on the deprecated Discord package.

## Existing issues/PRs
- Issues: none found.
- PRs: none found.

## Files & locations
- `pnpm-workspace.yaml:1-19`
- `package.json:55-70`
- `orgs/riatzukiza/promethean/services/mcp/package.json:40-47`
- `orgs/riatzukiza/promethean/services/mcp/src/index.ts:101-233`
- `orgs/riatzukiza/promethean/services/mcp/src/tests/mcp-endpoint-integration.test.ts:397-446`

## Plan
### Phase 1: Exclude discord package
- Add a pnpm workspace exclude for `orgs/riatzukiza/promethean/packages/discord`.

### Phase 2: Include moved packages
- Add pnpm workspace patterns for `cli`, `services`, `experimental`, `pipelines`, and `tools` under Promethean.

### Phase 3: Remove Discord MCP wiring
- Drop `@promethean-os/discord` from MCP dependencies and remove Discord tool/test coverage.

### Phase 4: Validate install
- Run `pnpm install` at the root and confirm it proceeds past the discord dependency.

## Definition of done
- pnpm no longer tries to resolve `@promethean-os/discord` as a workspace package.
- `pnpm install` succeeds or fails for unrelated reasons.
- MCP service builds without Discord tool references.

## Changelog
- 2026-01-27: Spec created.
- 2026-01-27: Expanded workspace globs for moved Promethean packages.
- 2026-01-27: Updated ecosystem-dsl path to cli location.
- 2026-01-27: Removed Discord MCP dependency and tests.
