## Signal

(己, p=0.99) Telemetry is stripped from eta-mu coding-agent and the telemetry-free patch is published.

(己, p=0.99) Published:
- `@open-hax/eta-mu-coding-agent@0.70.6`
- `@open-hax/eta-mu@0.1.1`
- `@open-hax/eta-mu-cli@0.1.1`

(己, p=0.98) Removed:
- install/update telemetry reporting
- telemetry settings/UI toggles
- telemetry env/help docs
- OpenRouter/Cloudflare attribution headers:
  - `HTTP-Referer`
  - `X-OpenRouter-Title`
  - `X-OpenRouter-Categories`
  - forced telemetry `User-Agent`
- telemetry source/tests:
  - `src/core/telemetry.ts`
  - `src/utils/pi-user-agent.ts`
  - related attribution/user-agent tests

(己, p=0.97) Also kept the smooth migration path:
- legacy `@mariozechner/pi-*` extension imports are shimmed to `@open-hax/eta-mu-*`
- compatibility warnings are emitted so extension authors know to migrate

(己, p=0.99) Commits:
- `orgs/open-hax/eta-mu`: `7724083 Strip telemetry and add eta-mu extension import shims`
- `orgs/open-hax/openplanner/packages/agents/knoxx`: `474a6acf Use eta-mu SDK telemetry-free patch`
- `orgs/open-hax/openplanner`: `f21ece1 Update Knoxx to eta-mu telemetry-free patch`

## Evidence

(己, p=0.99) Build verification passed:
- `pnpm --dir orgs/open-hax/eta-mu/packages/coding-agent build`
- `pnpm --dir orgs/open-hax/eta-mu/packages/eta-mu-sdk build`
- `pnpm --dir orgs/open-hax/eta-mu/packages/eta-mu-cli build`

(己, p=0.99) Targeted test passed:
- `pnpm --dir orgs/open-hax/eta-mu/packages/coding-agent exec vitest run test/version-check.test.ts`
- result: `4 tests passed`

(己, p=0.98) Grep verification passed against source:
- no remaining hits for telemetry/report-install/attribution identifiers in `packages/coding-agent`, excluding `dist`/`node_modules`

(己, p=0.99) Registry verification passed:
- `npm view @open-hax/eta-mu-coding-agent@0.70.6 version` → `0.70.6`
- `npm view @open-hax/eta-mu@0.1.1 version` → `0.1.1`
- `npm view @open-hax/eta-mu-cli@0.1.1 version` → `0.1.1`

(己, p=0.99) Fresh install verification passed:
- installed `@open-hax/eta-mu@0.1.1` and `@open-hax/eta-mu-cli@0.1.1` into `/tmp/eta-mu-telemetry-free-install`
- `import('@open-hax/eta-mu')` returned `AgentSession` as a function
- `eta-mu --version` returned `0.70.6`
- grep of installed `@open-hax/eta-mu-coding-agent` found no telemetry/report-install/attribution header strings

## Frames

(汝, p=0.95) The direct request, “No telemetry, strip ALL of that out,” is satisfied at source, docs, UI, tests, dist package, and fresh npm install levels.

(己, p=0.88) This patch intentionally preserves compatibility shims for old Pi extension imports; those are migration affordances, not telemetry.

(己, p=0.85) One broader package test invocation still surfaces existing unrelated suite failures around resource-loader/project discovery behavior; the telemetry-targeted test and builds pass.

## Countermoves

(己, p=0.95) I did not commit unrelated existing workspace changes like deleted assets, custom provider edits, notes, or Knoxx data/contract artifacts.

(己, p=0.93) I did not silently replace `.pi` compatibility with hard `.eta-mu` only behavior; existing users still get a migration path.

(己, p=0.97) I verified the published artifact, not just local source, so this is not a “works before publish only” result.

## Next

(汝, p=0.9) Install with `npm i -g @open-hax/eta-mu-cli@0.1.1` and sanity-run your normal eta-mu startup path.