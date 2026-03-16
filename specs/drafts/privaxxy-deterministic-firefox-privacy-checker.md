# privaxxy: deterministic Firefox privacy/analytics checker (draft)

## Goal
Provide a deterministic, offline CLI that audits a local Firefox profile for common privacy/analytics-related settings (telemetry, studies, sponsored content, suggestion leakage, and “phone-home” network helpers), producing stable machine-readable output.

## Non-goals
- No browser automation (no driving Firefox UI).
- No network calls.
- No attempt to infer Firefox *default* values across versions when a pref is unset.
- Do not parse or exfiltrate browsing history; avoid reading `places.sqlite` etc.

## Inputs
- `profiles.ini` (optional) to find profile paths.
- Profile directory:
  - `prefs.js`
  - `user.js` (overrides)
  - `extensions.json` (addon inventory only)
  - `compatibility.ini` (Firefox version hint)
- Optional enterprise policy file:
  - `/etc/firefox/policies/policies.json` or `/usr/lib/firefox/distribution/policies.json` (if present)

## Output (deterministic)
- Default: JSON to stdout with stable key ordering.
- Optional: human readable text.
- Exit codes:
  - `0` no failing checks
  - `2` at least one failing check (when `--fail-on >=warning`)
  - `3` usage error

## Checks (initial)
- Telemetry/data submission prefs (`toolkit.telemetry.*`, `datareporting.*`)
- Studies/Shield (`app.shield.optoutstudies.enabled`)
- Pocket integration (`extensions.pocket.enabled`)
- New-tab sponsored content and activity stream telemetry (`browser.newtabpage.activity-stream.*`)
- URL bar “quick suggestions”/sponsored suggestions (`browser.urlbar.suggest.quicksuggest.*`)
- Search suggestions toggles (`browser.search.suggest.enabled`, `browser.urlbar.suggest.searches`)
- Connectivity/captive portal checks (`network.connectivity-service.enabled`, `network.captive-portal-service.enabled`)
- Prefetch/speculative connect (`network.prefetch-next`, `browser.urlbar.speculativeConnect`)

## Risks
- Pref keys evolve; must treat unknown/missing prefs as `unknown` not `pass/fail`.
- Some prefs may embed identifiers/URLs; output must avoid echoing large/secret values unless requested.

## Implementation phases
1. Repo bootstrap: create `open-hax/privaxxy` GitHub repo (GPL-3.0), add as submodule at `orgs/open-hax/privaxxy`.
2. Implement `privaxxy.py` with:
   - profile discovery
   - pref parsing
   - rule evaluation
   - deterministic JSON/text output
3. Add unit tests for pref parsing + rule evaluation (minimal fixtures).

## Affected files
- `specs/drafts/privaxxy-deterministic-firefox-privacy-checker.md`
- `.gitmodules` (new submodule)
- `orgs/open-hax/privaxxy` (new submodule)

## Definition of done
- `python3 privaxxy.py --profile-path ~/.mozilla/firefox/<profile> --format json` runs.
- Output is stable across runs.
- Unit tests pass (`python3 -m unittest discover -s tests` or `make test`).
- Submodule committed in `devel`, submodule repo pushed to `open-hax/privaxxy`.
