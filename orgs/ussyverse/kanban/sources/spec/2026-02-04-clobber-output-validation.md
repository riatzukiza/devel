---
uuid: c122c2e5-c0fc-4916-85c3-f046577614a9
title: "Clobber Output Validation and Ecosystem Comments"
slug: 2026-02-04-clobber-output-validation
status: incoming
priority: P2
tags: []
created_at: "2026-02-04T07:00:16.118642Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Clobber Output Validation and Ecosystem Comments

## Context
- A recent ecosystem update pointed PM2 at a non-existent script path, which was not caught during generation.
- Ecosystem definitions are a DSL, so inline guidance will reduce common mistakes.

## Requirements
- Add a validation step for clobber output that verifies generated app definitions.
- Validation must fail if file-backed scripts are missing.
- Add automated tests to cover validation behavior.
- Add inline comments to ecosystem DSL files to clarify common pitfalls.
- Keep changes scoped to the clobber generation workflow and ecosystem files.

## Files
- `scripts/validate-clobber-output.mjs:1`
- `scripts/tests/validate-clobber-output.test.mjs:1`
- `package.json:7`
- `ecosystems/services_cephalon.cljs:1`
- `ecosystems/index.cljs:1`
- `ecosystems/ecosystem.cljs:1`
- `ecosystems/opencode_indexer.cljs:1`
- `ecosystems/promethean_frontend.cljs:1`
- `ecosystems/ollama_benchmarks.cljs:1`
- `ecosystems/gates_of_aker.cljs:1`
- `ecosystems/cephalon.cljs:1`
- `ecosystems/sentinel.cljs:1`
- `ecosystems/promethean.cljs:1`
- `ecosystems/riatzukiza_github_io.cljs:1`
- `ecosystems/promethean_agent_system.cljs:1`
- `ecosystems/openhax.cljs:1`
- `ecosystems/openhax_clients.cljs:1`

## Existing Issues / PRs
- Issues: not checked.
- PRs: not checked.

## Definition of Done
- `pnpm generate-ecosystem` runs and validates clobber output.
- Validation reports missing script paths and exits non-zero.
- `pnpm test:clobber` covers validator success/failure scenarios.
- Ecosystem files include brief inline comments about script/cwd and regeneration.

## Change Log
- 2026-02-04: Add clobber output validator and ecosystem guidance comments.
