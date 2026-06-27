#!/usr/bin/env python3
"""privaxxy: deterministic Firefox privacy/analytics checker (offline).

This tool reads Firefox profile configuration from disk and emits a stable
report of common privacy/analytics-related preferences.

Constraints:
  - No network access
  - Deterministic output (stable sorting, no timestamps)
  - Safe output by default (do not dump full prefs)
"""

from __future__ import annotations

import argparse
import configparser
import json
import re
import sys
from dataclasses import dataclass
from enum import IntEnum
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


VERSION = "0.1.0"


class Severity(IntEnum):
    off = 100
    info = 10
    warning = 20
    error = 30


@dataclass(frozen=True)
class PrefValue:
    value: Any
    source: str  # e.g. "prefs.js" | "user.js" | "policies.json"


@dataclass(frozen=True)
class Finding:
    id: str
    title: str
    severity: str  # "info"|"warning"|"error"
    status: str  # "pass"|"fail"|"unknown"|"info"
    pref: Optional[str] = None
    current: Any = None
    expected: Any = None
    source: Optional[str] = None
    rationale: str = ""
    remediation: str = ""


_PREF_LINE_RE = re.compile(
    r"^\s*(?:user_pref|pref|lockPref)\(\s*\"([^\"]+)\"\s*,\s*(.+?)\s*\)\s*;\s*$"
)


def _unescape_js_string(s: str) -> str:
    """Best-effort unescape for Firefox prefs.js/user.js quoted strings.

    prefs.js strings are JS string literals. We only implement the common
    sequences we actually see in prefs:
      - \\ \", \n, \r, \t
    Anything else is left as-is.
    """

    out: List[str] = []
    i = 0
    while i < len(s):
        ch = s[i]
        if ch != "\\":
            out.append(ch)
            i += 1
            continue

        # escape
        if i + 1 >= len(s):
            out.append("\\")
            i += 1
            continue

        nxt = s[i + 1]
        if nxt in ("\\", '"', "'"):
            out.append(nxt)
            i += 2
        elif nxt == "n":
            out.append("\n")
            i += 2
        elif nxt == "r":
            out.append("\r")
            i += 2
        elif nxt == "t":
            out.append("\t")
            i += 2
        else:
            # Unknown escape; keep it verbatim.
            out.append("\\" + nxt)
            i += 2
    return "".join(out)


def parse_pref_value(raw: str) -> Any:
    raw = raw.strip()
    if raw == "true":
        return True
    if raw == "false":
        return False
    if raw.startswith('"') and raw.endswith('"') and len(raw) >= 2:
        inner = raw[1:-1]
        return _unescape_js_string(inner)

    # ints/floats
    try:
        if raw.lower().startswith("0x"):
            return int(raw, 16)
        return int(raw)
    except ValueError:
        pass
    try:
        return float(raw)
    except ValueError:
        pass

    # Fallback to string token.
    return raw


def read_prefs_file(path: Path, source_name: str) -> Dict[str, PrefValue]:
    prefs: Dict[str, PrefValue] = {}
    if not path.exists():
        return prefs

    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return prefs

    for line in text.splitlines():
        m = _PREF_LINE_RE.match(line)
        if not m:
            continue
        key = m.group(1)
        raw_val = m.group(2)
        prefs[key] = PrefValue(parse_pref_value(raw_val), source_name)
    return prefs


def merge_prefs(*maps: Dict[str, PrefValue]) -> Dict[str, PrefValue]:
    out: Dict[str, PrefValue] = {}
    for m in maps:
        out.update(m)
    return out


def read_compatibility_version(profile_dir: Path) -> Optional[str]:
    ini_path = profile_dir / "compatibility.ini"
    if not ini_path.exists():
        return None
    cp = configparser.ConfigParser()
    try:
        cp.read(ini_path, encoding="utf-8")
    except Exception:
        return None
    if cp.has_option("Compatibility", "LastVersion"):
        return cp.get("Compatibility", "LastVersion")
    return None


def find_profile_from_profiles_ini(
    profiles_ini: Path, profile_name: Optional[str]
) -> Tuple[Optional[str], Optional[Path]]:
    if not profiles_ini.exists():
        return None, None

    cp = configparser.RawConfigParser()
    try:
        cp.read(profiles_ini, encoding="utf-8")
    except Exception:
        return None, None

    profile_sections = [s for s in cp.sections() if s.startswith("Profile")]
    candidates: List[Tuple[str, Path, bool]] = []
    base = profiles_ini.parent
    for sec in profile_sections:
        name = cp.get(sec, "Name", fallback=sec)
        path_raw = cp.get(sec, "Path", fallback="")
        is_rel = cp.getint(sec, "IsRelative", fallback=1) == 1
        default = cp.getint(sec, "Default", fallback=0) == 1
        if not path_raw:
            continue
        p = (base / path_raw) if is_rel else Path(path_raw)
        candidates.append((name, p, default))

    if not candidates:
        return None, None

    # If Firefox is configured with an install-specific locked default profile,
    # prefer it over the per-profile Default=1 flag.
    #
    # Example (profiles.ini):
    #   [InstallXXXX]
    #   Default=abcd.default-release
    #   Locked=1
    if not profile_name:
        locked_default_raw: Optional[str] = None
        for sec in cp.sections():
            if not sec.startswith("Install"):
                continue
            locked = cp.getint(sec, "Locked", fallback=0) == 1
            default_raw = cp.get(sec, "Default", fallback="").strip()
            if locked and default_raw:
                locked_default_raw = default_raw
                break

        if locked_default_raw:
            locked_p = (base / locked_default_raw).resolve()
            for name, p, _default in candidates:
                try:
                    if p.resolve() == locked_p:
                        return name, p
                except Exception:
                    continue
            return None, locked_p

    if profile_name:
        for name, p, default in candidates:
            if name == profile_name:
                return name, p

    # Pick default if possible
    for name, p, default in candidates:
        if default:
            return name, p

    # Fall back to first.
    name, p, _default = candidates[0]
    return name, p


def load_enterprise_policies() -> Tuple[Optional[Path], Dict[str, Any]]:
    """Attempt to read system Firefox enterprise policies.

    We only return parsed JSON if it exists and is valid.
    """

    candidates = [
        Path("/etc/firefox/policies/policies.json"),
        Path("/usr/lib/firefox/distribution/policies.json"),
        Path("/usr/lib64/firefox/distribution/policies.json"),
    ]
    for p in candidates:
        if not p.exists():
            continue
        try:
            data = json.loads(p.read_text(encoding="utf-8", errors="replace"))
            if isinstance(data, dict):
                return p, data
        except Exception:
            continue
    return None, {}


def read_addons(profile_dir: Path) -> List[Dict[str, Any]]:
    path = profile_dir / "extensions.json"
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except Exception:
        return []

    addons = data.get("addons") if isinstance(data, dict) else None
    if not isinstance(addons, list):
        return []

    out: List[Dict[str, Any]] = []
    for a in addons:
        if not isinstance(a, dict):
            continue
        # Keep this minimal; extensions.json can be large.
        out.append(
            {
                "id": a.get("id"),
                "name": a.get("defaultLocale", {}).get("name")
                if isinstance(a.get("defaultLocale"), dict)
                else a.get("name"),
                "version": a.get("version"),
                "type": a.get("type"),
                "active": a.get("active"),
                "userDisabled": a.get("userDisabled"),
                "appDisabled": a.get("appDisabled"),
            }
        )

    out.sort(key=lambda x: (str(x.get("id") or ""), str(x.get("name") or "")))
    return out


def _bool_check(
    *,
    id: str,
    title: str,
    severity: str,
    pref_key: str,
    desired: bool,
    prefs: Dict[str, PrefValue],
    rationale: str,
    remediation: str,
) -> Finding:
    pv = prefs.get(pref_key)
    if pv is None:
        return Finding(
            id=id,
            title=title,
            severity=severity,
            status="unknown",
            pref=pref_key,
            current=None,
            expected=desired,
            source=None,
            rationale=rationale,
            remediation=remediation,
        )
    if isinstance(pv.value, bool) and pv.value == desired:
        return Finding(
            id=id,
            title=title,
            severity=severity,
            status="pass",
            pref=pref_key,
            current=pv.value,
            expected=desired,
            source=pv.source,
            rationale=rationale,
            remediation=remediation,
        )
    return Finding(
        id=id,
        title=title,
        severity=severity,
        status="fail",
        pref=pref_key,
        current=pv.value,
        expected=desired,
        source=pv.source,
        rationale=rationale,
        remediation=remediation,
    )


def evaluate_checks(prefs: Dict[str, PrefValue]) -> List[Finding]:
    checks: List[Finding] = []

    def b(
        id: str,
        title: str,
        severity: str,
        key: str,
        desired: bool,
        rationale: str,
        remediation: str,
    ) -> None:
        checks.append(
            _bool_check(
                id=id,
                title=title,
                severity=severity,
                pref_key=key,
                desired=desired,
                prefs=prefs,
                rationale=rationale,
                remediation=remediation,
            )
        )

    # Telemetry / data submission.
    b(
        "telemetry.toolkit.enabled",
        "Firefox telemetry",
        "warning",
        "toolkit.telemetry.enabled",
        False,
        "Telemetry can send technical and interaction data to Mozilla.",
        "Disable ‘Firefox Data Collection and Use’ or set toolkit.telemetry.enabled=false.",
    )
    b(
        "telemetry.healthreport.upload",
        "Health report upload",
        "warning",
        "datareporting.healthreport.uploadEnabled",
        False,
        "Health report upload is a data submission channel.",
        "Set datareporting.healthreport.uploadEnabled=false.",
    )
    b(
        "telemetry.dataSubmission",
        "Data submission policy",
        "warning",
        "datareporting.policy.dataSubmissionEnabled",
        False,
        "Controls whether Firefox is allowed to submit data.",
        "Set datareporting.policy.dataSubmissionEnabled=false.",
    )
    b(
        "telemetry.ping-centre",
        "Ping Centre telemetry",
        "warning",
        "browser.ping-centre.telemetry",
        False,
        "Ping centre is used for certain interaction pings.",
        "Set browser.ping-centre.telemetry=false.",
    )

    # Studies / Shield.
    b(
        "studies.shield",
        "Firefox studies/experiments",
        "warning",
        "app.shield.optoutstudies.enabled",
        False,
        "Studies can install variation/experiment code.",
        "Disable ‘Allow Firefox to install and run studies’.",
    )

    # Pocket / content services.
    b(
        "content.pocket",
        "Pocket integration",
        "info",
        "extensions.pocket.enabled",
        False,
        "Pocket provides content recommendations/integration.",
        "If unused, set extensions.pocket.enabled=false.",
    )

    # New Tab Activity Stream.
    b(
        "newtab.activity-stream.telemetry",
        "New tab telemetry",
        "warning",
        "browser.newtabpage.activity-stream.telemetry",
        False,
        "New Tab page can emit interaction telemetry.",
        "Disable New Tab telemetry or set browser.newtabpage.activity-stream.telemetry=false.",
    )
    b(
        "newtab.activity-stream.feeds.telemetry",
        "New tab feeds telemetry",
        "warning",
        "browser.newtabpage.activity-stream.feeds.telemetry",
        False,
        "Activity Stream feeds can emit telemetry.",
        "Set browser.newtabpage.activity-stream.feeds.telemetry=false.",
    )
    b(
        "newtab.sponsored",
        "Sponsored content on new tab",
        "warning",
        "browser.newtabpage.activity-stream.showSponsored",
        False,
        "Sponsored tiles are an ads/sponsored content surface.",
        "Disable sponsored content in Firefox Home settings.",
    )
    b(
        "newtab.snippets",
        "New tab snippets",
        "info",
        "browser.newtabpage.activity-stream.feeds.snippets",
        False,
        "Snippets are remote content injected into the New Tab.",
        "Disable snippets in Firefox Home settings.",
    )

    # URL bar suggestions.
    b(
        "urlbar.search-suggestions",
        "Search suggestions in URL bar",
        "warning",
        "browser.urlbar.suggest.searches",
        False,
        "Search suggestions can send what you type to the search provider.",
        "Disable ‘Search Suggestions’ in Search settings.",
    )
    b(
        "search.search-suggestions",
        "Search suggestions in search fields",
        "warning",
        "browser.search.suggest.enabled",
        False,
        "Search suggestions can send what you type to the search provider.",
        "Disable ‘Provide search suggestions’.",
    )
    b(
        "urlbar.quicksuggest",
        "Firefox Suggest / QuickSuggest",
        "warning",
        "browser.urlbar.suggest.quicksuggest",
        False,
        "Firefox Suggest may fetch or match suggestions; policies differ by version.",
        "Disable Firefox Suggest in Address Bar settings.",
    )
    b(
        "urlbar.quicksuggest.sponsored",
        "Firefox Suggest sponsored",
        "warning",
        "browser.urlbar.suggest.quicksuggest.sponsored",
        False,
        "Sponsored suggestions are an advertising surface.",
        "Disable sponsored suggestions.",
    )
    b(
        "urlbar.quicksuggest.nonsponsored",
        "Firefox Suggest non-sponsored",
        "info",
        "browser.urlbar.suggest.quicksuggest.nonsponsored",
        False,
        "Non-sponsored suggestions still involve remote suggestion systems.",
        "Disable non-sponsored Firefox Suggest if you want minimal outbound lookups.",
    )

    # “Phone-home” helper checks.
    b(
        "network.captive-portal",
        "Captive portal detection",
        "info",
        "network.captive-portal-service.enabled",
        False,
        "Captive portal checks can make periodic outbound requests.",
        "Set network.captive-portal-service.enabled=false.",
    )
    b(
        "network.connectivity-check",
        "Connectivity service",
        "info",
        "network.connectivity-service.enabled",
        False,
        "Connectivity checks can make periodic outbound requests.",
        "Set network.connectivity-service.enabled=false.",
    )

    # Prefetching / speculative connects.
    b(
        "network.prefetch-next",
        "Link prefetching",
        "info",
        "network.prefetch-next",
        False,
        "Prefetching can contact sites you haven't explicitly clicked.",
        "Set network.prefetch-next=false.",
    )
    b(
        "network.speculative-connect",
        "URL bar speculative connect",
        "info",
        "browser.urlbar.speculativeConnect",
        False,
        "Speculative connections can contact sites while typing.",
        "Set browser.urlbar.speculativeConnect=false.",
    )

    checks.sort(key=lambda f: f.id)
    return checks


def summarize(findings: Iterable[Finding]) -> Dict[str, int]:
    counts = {"pass": 0, "fail": 0, "unknown": 0, "info": 0}
    for f in findings:
        counts[f.status] = counts.get(f.status, 0) + 1
    return counts


def max_failing_severity(findings: Iterable[Finding]) -> Optional[str]:
    worst: Optional[Severity] = None
    worst_s: Optional[str] = None
    for f in findings:
        if f.status != "fail":
            continue
        sev = Severity[f.severity]
        if worst is None or sev > worst:
            worst = sev
            worst_s = f.severity
    return worst_s


def severity_at_least(a: str, b: str) -> bool:
    return Severity[a] >= Severity[b]


def render_text(report: Dict[str, Any]) -> str:
    lines: List[str] = []
    profile = report.get("profile", {})
    lines.append(f"privaxxy {report.get('privaxxy_version')}")
    lines.append(f"profile_path: {profile.get('path')}")
    if profile.get("name"):
        lines.append(f"profile_name: {profile.get('name')}")
    if profile.get("firefox_version_hint"):
        lines.append(f"firefox_version_hint: {profile.get('firefox_version_hint')}")
    lines.append("")

    summary = report.get("summary", {})
    lines.append(
        "summary: "
        + ", ".join(
            f"{k}={summary.get(k, 0)}" for k in ("pass", "fail", "unknown", "info")
        )
    )
    lines.append("")

    for f in report.get("findings", []):
        status = f.get("status")
        sev = f.get("severity")
        if status == "pass":
            continue
        lines.append(f"[{status.upper()}] ({sev}) {f.get('id')}: {f.get('title')}")
        if f.get("pref"):
            lines.append(
                f"  pref: {f.get('pref')} current={json.dumps(f.get('current'))} expected={json.dumps(f.get('expected'))}"
            )
        if f.get("source"):
            lines.append(f"  source: {f.get('source')}")
        if f.get("rationale"):
            lines.append(f"  why: {f.get('rationale')}")
        if f.get("remediation"):
            lines.append(f"  fix: {f.get('remediation')}")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def build_report(
    *,
    profile_dir: Path,
    profile_name: Optional[str],
    policies_path: Optional[Path],
    policies: Dict[str, Any],
) -> Dict[str, Any]:
    prefs_js = read_prefs_file(profile_dir / "prefs.js", "prefs.js")
    user_js = read_prefs_file(profile_dir / "user.js", "user.js")
    prefs = merge_prefs(prefs_js, user_js)

    findings = evaluate_checks(prefs)

    # Keep output small/safe: only include prefs referenced by findings.
    observed_keys = sorted({f.pref for f in findings if f.pref})
    observed_prefs: Dict[str, Any] = {}
    for k in observed_keys:
        pv = prefs.get(k)
        if pv is None:
            observed_prefs[k] = None
        else:
            # Avoid spewing giant strings; cap length.
            v = pv.value
            if isinstance(v, str) and len(v) > 200:
                v = v[:200] + "…"
            observed_prefs[k] = {"value": v, "source": pv.source}

    report: Dict[str, Any] = {
        "privaxxy_version": VERSION,
        "profile": {
            "path": str(profile_dir),
            "name": profile_name,
            "firefox_version_hint": read_compatibility_version(profile_dir),
        },
        "policies": {
            "path": str(policies_path) if policies_path else None,
            "keys": sorted(list(policies.keys())) if isinstance(policies, dict) else [],
        },
        "observed_prefs": observed_prefs,
        "findings": [f.__dict__ for f in findings],
        "summary": summarize(findings),
        "addons": read_addons(profile_dir),
    }
    return report


def parse_args(argv: List[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(prog="privaxxy", add_help=True)
    p.add_argument(
        "--profiles-ini",
        default=str(Path("~/.mozilla/firefox/profiles.ini").expanduser()),
        help="Path to Firefox profiles.ini (default: ~/.mozilla/firefox/profiles.ini)",
    )
    p.add_argument(
        "--profile",
        default=None,
        help="Profile Name from profiles.ini to use (otherwise: default profile)",
    )
    p.add_argument(
        "--profile-path",
        default=None,
        help="Direct path to a Firefox profile directory (overrides --profiles-ini)",
    )
    p.add_argument(
        "--format",
        choices=["json", "text"],
        default="json",
        help="Output format (default: json)",
    )
    p.add_argument(
        "--fail-on",
        choices=["off", "info", "warning", "error"],
        default="off",
        help="Exit non-zero if any failing check has severity >= this threshold",
    )
    return p.parse_args(argv)


def main(argv: List[str]) -> int:
    args = parse_args(argv)

    profile_name: Optional[str] = None
    profile_dir: Optional[Path] = None
    if args.profile_path:
        profile_dir = Path(args.profile_path).expanduser().resolve()
    else:
        profile_name, profile_dir = find_profile_from_profiles_ini(
            Path(args.profiles_ini).expanduser(), args.profile
        )

    if profile_dir is None:
        sys.stderr.write("privaxxy: could not determine Firefox profile directory\n")
        return 3
    if not profile_dir.exists() or not profile_dir.is_dir():
        sys.stderr.write(f"privaxxy: profile dir does not exist: {profile_dir}\n")
        return 3

    policies_path, policies = load_enterprise_policies()
    report = build_report(
        profile_dir=profile_dir,
        profile_name=profile_name,
        policies_path=policies_path,
        policies=policies,
    )

    if args.format == "json":
        sys.stdout.write(json.dumps(report, sort_keys=True, indent=2))
        sys.stdout.write("\n")
    else:
        sys.stdout.write(render_text(report))

    if args.fail_on != "off":
        worst = max_failing_severity(
            Finding(**f) if isinstance(f, dict) else f for f in report["findings"]
        )
        if worst is not None and severity_at_least(worst, args.fail_on):
            return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
