# privaxxy

Deterministic Firefox privacy/analytics checker (offline).

## What it does

`privaxxy` reads a Firefox profile directory (no Firefox launch required) and
reports whether common telemetry/analytics-ish prefs are explicitly enabled.

Design constraints:

- offline (no network)
- deterministic output (stable JSON)
- safe by default (does not dump your full prefs)

## Usage

Audit a specific profile directory:

```bash
python3 privaxxy.py --profile-path ~/.mozilla/firefox/xxxxx.default-release --format json
```

Auto-pick default profile from `profiles.ini`:

```bash
python3 privaxxy.py --format text
```

Fail CI when there are warnings/errors:

```bash
python3 privaxxy.py --profile-path ... --fail-on warning
```

## Notes

Firefox defaults change over time. If a preference is not explicitly present in
`prefs.js`/`user.js`, `privaxxy` reports it as `unknown` instead of guessing.

## Development

```bash
make test
```
