# Promethean.rest DNS automation + upstream deploy handoff

## Open questions
- Cloudflare API credentials are not yet configured in this session, and the `promethean.rest` zone is still being migrated, so the automation can be implemented and locally validated, but not exercised live against Cloudflare until the zone is active there and a token exists.
- For new service subdomains under `*.promethean.rest`, the streamlined default should point at one of the allowed base hosts (`ussy`, `ussy2`, `ussy3`, `big.ussy`) by copying its current A record. Assumption: this is the desired safe default unless explicit IPs are passed.
- The upstream Battlebussy owner note should stay brief and practical, focused on deploy prerequisites, branch flow, and required GitHub settings/secrets.

## Risks
- DNS migration timing matters: until `promethean.rest` is actually active in Cloudflare, writes cannot be exercised live.
- Mis-targeting a host label could replace conflicting routing records for the same hostname; the tool should be explicit that it only changes the requested label while preserving unrelated records.
- Battlebussy upstream deployment instructions must separate repo-committed workflow support from GitHub plan limitations and missing secret/variable configuration.

## Priority
- High: provide a reliable operator flow for creating `*.promethean.rest` records without manual registrar clicking, and produce a concise upstream deploy handoff note.

## Phases
1. Resolve the current A-record IPs for the allowed base hosts `ussy`, `ussy2`, `ussy3`, and `big.ussy`.
2. Implement a Cloudflare automation tool that fetches the zone/records and updates one `*.promethean.rest` label while preserving unrelated records.
3. Create a reusable skill for `*.promethean.rest` DNS record provisioning and link it into the workspace for OpenCode discovery.
4. Write a quick deploy handoff note for the upstream Battlebussy owner covering deploy secrets, staging/main flow, and current blockers.
5. Verify the tool help/output and record the exact prerequisites needed for live Cloudflare writes.

## Affected files
- `tools/promethean_rest_dns.py`
- `~/.pi/agent/skills/promethean-rest-dns/SKILL.md`
- `.opencode/skill/promethean-rest-dns/SKILL.md`
- `AGENTS.md`
- `orgs/ussyverse/battlebussy/docs/upstream-deploy-owner-note.md`
- `specs/drafts/promethean-rest-dns-automation.md`
- `receipts.log`

## Definition of done
- A tool exists that can resolve allowed base-host IPs and prepare/apply Cloudflare DNS updates for `*.promethean.rest` while preserving unrelated zone records.
- A reusable skill exists for streamlined `*.promethean.rest` DNS record creation.
- The upstream Battlebussy owner note exists and concisely explains what they must configure for staging/production deployments.
- Verification proves the tool parses/runs locally and the allowed base-host IPs are resolved correctly.

## Execution log
- 2026-03-20T23:40:00Z Resolved the current core A-record IPs for `ussy.promethean.rest`, `ussy2.promethean.rest`, and `ussy3.promethean.rest`.
- 2026-03-20T23:40:00Z Added `tools/promethean_rest_dns.py`, a Cloudflare-aware helper that resolves the zone, compares the requested host label against existing records, and plans/applies only the create/update/delete operations needed for that label.
- 2026-03-20T23:40:00Z Created the global `promethean-rest-dns` skill and linked it into the workspace `.opencode/skill` catalog.
- 2026-03-20T23:40:00Z Wrote a short upstream Battlebussy owner note at `orgs/ussyverse/battlebussy/docs/upstream-deploy-owner-note.md` covering branch flow, secrets, deploy hosts, and the current blockers.
- 2026-03-20T23:50:00Z Added support for the zone-scoped token alias `CLOUD_FLARE_PROMETHEAN_DOT_REST_DNS_ZONE_TOKEN` and verified a real Cloudflare dry-run plan against zone `promethean.rest` using `battlebussy-smoke.promethean.rest` -> `ussy`.
- 2026-03-21T02:15:00Z Extended the helper to support nested host labels (for names like `voxx.ussy`) and applied the missing `voxx.ussy.promethean.rest` A record directly in Cloudflare with `proxied=false`.
- 2026-03-21T02:35:00Z Applied the missing `shibboleth.promethean.rest` A record directly in Cloudflare with `proxied=false` after verifying the UI on port `5197` and control-plane API on port `8787` were alive on `ussy`.

## Verification
- `python tools/promethean_rest_dns.py show-cores` ✅
- `python -m py_compile tools/promethean_rest_dns.py` ✅
- `python tools/promethean_rest_dns.py --help` ✅
- `source ~/.envrc && python tools/promethean_rest_dns.py ensure battlebussy-smoke --core ussy --dry-run` ✅
  - Verified live Cloudflare zone access with zone id `c23062988c8b6204624e9b02fa96bd13`.
- `.opencode/skill/promethean-rest-dns/SKILL.md` resolves to the global skill ✅
