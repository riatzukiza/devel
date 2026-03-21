# Outside-structure action table — 2026-03-21

## Policy reference
- `docs/reference/outside-structure-exception-policy.md`

## Summary counts
- keep: **2**
- normalize: **4**
- retire: **0**
- explicitException: **21**
- total: **27**

## Action table

| Path | Group | Action | Exception class | Why | Reevaluate when |
|---|---|---|---|---|---|
| `desktop` | root-module | **keep** | `compatibility-alias` | Still actively referenced by launcher, desktop entry, and docs/manifests. | If launcher/docs migrate to orgs/riatzukiza/desktop and active references fall away. |
| `promethean` | root-module | **keep** | `compatibility-alias` | Heavy active dependency in shadow-cljs paths, PM2 parity tests, and docs. | If source-path/test/docs references are rewritten to orgs/riatzukiza/promethean. |
| `pm2-clj-project` | root-module | **explicit-exception** | `root-tooling-exception` | Active workspace tooling fixture but no agreed long-term structured home yet. | When its long-term home is chosen under packages/* or an org repo. |
| `reconstitute` | root-module | **explicit-exception** | `root-tooling-exception` | Active root CLI/tooling entrypoint referenced by scripts, commands, and skills. | When the tooling home is settled and compatibility command paths can be preserved elsewhere. |
| `reconstitute-mcp` | root-module | **normalize** | `planning-bundle` | Reads more like experimental/documented surface nested under reconstitute than a stable standalone root. | Once the MCP surface is either folded into reconstitute docs or promoted into a real package/service. |
| `mcp-social-publisher-live` | root-module | **normalize** | `standalone-source-deploy-root-pending-placement` | Active live deploy/source root should eventually get a canonical structured home. | When its placement under packages/services/orgs is decided and live deployment is repointed. |
| `threat-radar-deploy` | root-module | **normalize** | `standalone-source-deploy-root-pending-placement` | User explicitly directed that all threat-radar-related work normalize into orgs/open-hax/eta-mu-radar. | When canonical source is moved or mirrored into orgs/open-hax/eta-mu-radar and runtime/deploy references are updated. |
| `verathar-server` | root-module | **explicit-exception** | `foreign-fork-vendor-mirror` | Currently mostly bookkeeping; no strong active integration pressure justifies a forced move. | If active product work resumes or the repo becomes more than a preserved absorbed root. |
| `threat-radar-next-step` | root-module | **normalize** | `planning-bundle` | User explicitly directed that all threat-radar-related work, including planning bundles, consolidate into orgs/open-hax/eta-mu-radar. | When the useful planning/spec content is folded into orgs/open-hax/eta-mu-radar docs/specs and the standalone bundle becomes redundant. |
| `bevy_replicon` | root-module | **explicit-exception** | `foreign-fork-vendor-mirror` | Mostly preserved through bookkeeping artifacts, not active workspace integration. | If a dedicated vendor/forks area is created or the fork ceases to matter. |
| `egregoria` | root-module | **explicit-exception** | `foreign-fork-vendor-mirror` | Mostly preserved through bookkeeping artifacts, not active workspace integration. | If a dedicated vendor/forks area is created or the fork ceases to matter. |
| `game_network` | root-module | **explicit-exception** | `foreign-fork-vendor-mirror` | Mostly preserved through bookkeeping artifacts, not active workspace integration. | If a dedicated vendor/forks area is created or the fork ceases to matter. |
| `ggrs` | root-module | **explicit-exception** | `foreign-fork-vendor-mirror` | Mostly preserved through bookkeeping artifacts, not active workspace integration. | If a dedicated vendor/forks area is created or the fork ceases to matter. |
| `lightyear` | root-module | **explicit-exception** | `foreign-fork-vendor-mirror` | Mostly preserved through bookkeeping artifacts, not active workspace integration. | If a dedicated vendor/forks area is created or the fork ceases to matter. |
| `gates-pr35-hardening-main` | root-module | **explicit-exception** | `active-special-worktree` | Still referenced by an active skill/workflow as a work/spec source. | After the hardening branch merges, is abandoned, or the worktree-specific references are removed. |
| `orgs/agustif/codex-linux` | foreign-org | **explicit-exception** | `foreign-org-exception` | Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement. | If the repo stops being a foreign/private mirror and becomes a canonical home for your own work. |
| `orgs/anomalyco/opencode` | foreign-org | **explicit-exception** | `foreign-org-exception` | Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement. | If the repo stops being a foreign/private mirror and becomes a canonical home for your own work. |
| `orgs/badlogic/pi-mono` | foreign-org | **explicit-exception** | `foreign-org-exception` | Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement. | If the repo stops being a foreign/private mirror and becomes a canonical home for your own work. |
| `orgs/kcrommett/oc-manager` | foreign-org | **explicit-exception** | `foreign-org-exception` | Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement. | If the repo stops being a foreign/private mirror and becomes a canonical home for your own work. |
| `orgs/moofone/codex-ts-sdk` | foreign-org | **explicit-exception** | `foreign-org-exception` | Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement. | If the repo stops being a foreign/private mirror and becomes a canonical home for your own work. |
| `orgs/openai/codex` | foreign-org | **explicit-exception** | `foreign-org-exception` | Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement. | If the repo stops being a foreign/private mirror and becomes a canonical home for your own work. |
| `orgs/openai/parameter-golf` | foreign-org | **explicit-exception** | `foreign-org-exception` | Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement. | If the repo stops being a foreign/private mirror and becomes a canonical home for your own work. |
| `orgs/shuv/codex-desktop-linux` | foreign-org | **explicit-exception** | `foreign-org-exception` | Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement. | If the repo stops being a foreign/private mirror and becomes a canonical home for your own work. |
| `orgs/private/snorkel-ai` | foreign-org | **explicit-exception** | `private-org-exception` | Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement. | If the repo stops being a foreign/private mirror and becomes a canonical home for your own work. |
| `projects` | aggregation-tree | **explicit-exception** | `aggregation-projection-tree` | Appears to be a generated/staging/projection area rather than a canonical project home. | If the tree becomes obsolete or gets replaced by a more formal workflow area. |
| `workspaces` | aggregation-tree | **explicit-exception** | `aggregation-projection-tree` | Appears to be a generated/staging/projection area rather than a canonical project home. | If the tree becomes obsolete or gets replaced by a more formal workflow area. |
| `vaults` | aggregation-tree | **explicit-exception** | `aggregation-projection-tree` | Appears to be a generated/staging/projection area rather than a canonical project home. | If the tree becomes obsolete or gets replaced by a more formal workflow area. |

## Recommended immediate interpretation

### Keep
- `desktop` — Still actively referenced by launcher, desktop entry, and docs/manifests.
- `promethean` — Heavy active dependency in shadow-cljs paths, PM2 parity tests, and docs.

### Normalize next
- `reconstitute-mcp` — Reads more like experimental/documented surface nested under reconstitute than a stable standalone root.
- `mcp-social-publisher-live` — Active live deploy/source root should eventually get a canonical structured home.
- `threat-radar-deploy` — User explicitly directed that all threat-radar-related work normalize into orgs/open-hax/eta-mu-radar.
- `threat-radar-next-step` — User explicitly directed that all threat-radar-related work, including planning bundles, consolidate into orgs/open-hax/eta-mu-radar.

### Explicit exceptions
- `pm2-clj-project` (`root-tooling-exception`) — Active workspace tooling fixture but no agreed long-term structured home yet.
- `reconstitute` (`root-tooling-exception`) — Active root CLI/tooling entrypoint referenced by scripts, commands, and skills.
- `verathar-server` (`foreign-fork-vendor-mirror`) — Currently mostly bookkeeping; no strong active integration pressure justifies a forced move.
- `bevy_replicon` (`foreign-fork-vendor-mirror`) — Mostly preserved through bookkeeping artifacts, not active workspace integration.
- `egregoria` (`foreign-fork-vendor-mirror`) — Mostly preserved through bookkeeping artifacts, not active workspace integration.
- `game_network` (`foreign-fork-vendor-mirror`) — Mostly preserved through bookkeeping artifacts, not active workspace integration.
- `ggrs` (`foreign-fork-vendor-mirror`) — Mostly preserved through bookkeeping artifacts, not active workspace integration.
- `lightyear` (`foreign-fork-vendor-mirror`) — Mostly preserved through bookkeeping artifacts, not active workspace integration.
- `gates-pr35-hardening-main` (`active-special-worktree`) — Still referenced by an active skill/workflow as a work/spec source.
- `orgs/agustif/codex-linux` (`foreign-org-exception`) — Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement.
- `orgs/anomalyco/opencode` (`foreign-org-exception`) — Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement.
- `orgs/badlogic/pi-mono` (`foreign-org-exception`) — Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement.
- `orgs/kcrommett/oc-manager` (`foreign-org-exception`) — Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement.
- `orgs/moofone/codex-ts-sdk` (`foreign-org-exception`) — Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement.
- `orgs/openai/codex` (`foreign-org-exception`) — Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement.
- `orgs/openai/parameter-golf` (`foreign-org-exception`) — Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement.
- `orgs/shuv/codex-desktop-linux` (`foreign-org-exception`) — Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement.
- `orgs/private/snorkel-ai` (`private-org-exception`) — Outside the four-home model by design; reflects foreign upstream or private ownership rather than canonical internal placement.
- `projects` (`aggregation-projection-tree`) — Appears to be a generated/staging/projection area rather than a canonical project home.
- `workspaces` (`aggregation-projection-tree`) — Appears to be a generated/staging/projection area rather than a canonical project home.
- `vaults` (`aggregation-projection-tree`) — Appears to be a generated/staging/projection area rather than a canonical project home.

## Notes
- No current item was marked `retire` immediately because each still has either active usage, explicit planning value, or surviving bookkeeping value that should be adjudicated first.
- Threat-radar-related roots now normalize toward `orgs/open-hax/eta-mu-radar` per explicit user directive.
