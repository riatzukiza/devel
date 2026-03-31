#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests

WORKSPACE_ROOT = Path(os.environ.get("WORKSPACE_ROOT", "/workspace")).resolve()
BUNDLE_ROOT = WORKSPACE_ROOT / "hormuz_clock_v4_bundle"
STATE_PATH = BUNDLE_ROOT / "data" / "state.v4.json"
RUNTIME_STATE_PATH = Path(
    os.environ.get(
        "HORMUZ_AGENT_STATE_PATH",
        str(WORKSPACE_ROOT / "services" / "radar-stack" / "runtime" / "hormuz-agent-state.json"),
    )
)
RADAR_API_URL = os.environ.get("RADAR_API_URL", "http://radar-mcp:10002").rstrip("/")
RADAR_ADMIN_AUTH_KEY = os.environ["RADAR_ADMIN_AUTH_KEY"]
HORMUZ_RADAR_SLUG = os.environ.get("HORMUZ_RADAR_SLUG", "hormuz")
HORMUZ_RADAR_NAME = os.environ.get("HORMUZ_RADAR_NAME", "Hormuz Threat Clock")
HORMUZ_RADAR_CATEGORY = os.environ.get("HORMUZ_RADAR_CATEGORY", "geopolitical")
HORMUZ_CREATED_BY = os.environ.get("HORMUZ_CREATED_BY", "hormuz-agent")
HORMUZ_BLUESKY_QUERY = os.environ.get("HORMUZ_BLUESKY_QUERY", "Hormuz").strip()
HORMUZ_REDDIT_SUBREDDITS = [
    row.strip()
    for row in os.environ.get("HORMUZ_REDDIT_SUBREDDITS", "geopolitics,worldnews,oil,shipping,navy").split(",")
    if row.strip()
]
HORMUZ_SKIP_SOCIAL_COLLECTION = os.environ.get("HORMUZ_SKIP_SOCIAL_COLLECTION", "false").strip().lower() in {"1", "true", "yes", "on"}
HORMUZ_WEAVER_URL = os.environ.get("HORMUZ_WEAVER_URL", "http://fork-tales-weaver:8793").strip()
HORMUZ_WATCHLIST_PATH = Path(
    os.environ.get(
        "HORMUZ_WATCHLIST_PATH",
        str(WORKSPACE_ROOT / "services" / "radar-stack" / "watchlists" / "hormuz-watchlist.json"),
    )
)
HORMUZ_WEAVER_KEYWORDS = [
    row.strip()
    for row in os.environ.get(
        "HORMUZ_WEAVER_KEYWORDS",
        "hormuz,strait of hormuz,persian gulf,gulf of oman,shipping,maritime,jmic,ukmto,transit,energy markets",
    ).split(",")
    if row.strip()
]
HORMUZ_JETSTREAM_ENABLED = os.environ.get("HORMUZ_JETSTREAM_ENABLED", "false").strip().lower() in {"1", "true", "yes", "on"}
HORMUZ_JETSTREAM_USERS = [
    row.strip()
    for row in os.environ.get("HORMUZ_JETSTREAM_USERS", "").split(",")
    if row.strip()
]
HORMUZ_JETSTREAM_HASHTAGS = [
    row.strip()
    for row in os.environ.get("HORMUZ_JETSTREAM_HASHTAGS", "hormuz,straitofhormuz").split(",")
    if row.strip()
]
HORMUZ_JETSTREAM_KEYWORDS = [
    row.strip()
    for row in os.environ.get(
        "HORMUZ_JETSTREAM_KEYWORDS",
        "hormuz,strait of hormuz,persian gulf,gulf of oman,shipping,jmic,ukmto",
    ).split(",")
    if row.strip()
]
HORMUZ_JETSTREAM_WINDOW_SECONDS = int(os.environ.get("HORMUZ_JETSTREAM_WINDOW_SECONDS", "3600") or "3600")
HORMUZ_JETSTREAM_MAX_EVENTS = int(os.environ.get("HORMUZ_JETSTREAM_MAX_EVENTS", "250") or "250")


class ApiError(RuntimeError):
    pass


def run_command(args: list[str], cwd: Path) -> str:
    proc = subprocess.run(args, cwd=cwd, text=True, capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError(
            f"command failed ({proc.returncode}): {' '.join(args)}\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
        )
    return proc.stdout


def api_request(method: str, path: str, payload: dict[str, Any] | None = None, *, allow_error: bool = False) -> dict[str, Any]:
    response = requests.request(
        method,
        f"{RADAR_API_URL}{path}",
        headers={
            "x-admin-auth-key": RADAR_ADMIN_AUTH_KEY,
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=60,
    )
    if not response.ok and not allow_error:
        raise ApiError(f"{method} {path} -> {response.status_code}: {response.text}")
    if not response.text.strip():
        return {}
    try:
        return response.json()
    except Exception as exc:  # pragma: no cover - defensive
        raise ApiError(f"{method} {path} returned non-JSON: {response.text}") from exc


def load_runtime_state() -> dict[str, Any]:
    if not RUNTIME_STATE_PATH.exists():
        return {}
    try:
        return json.loads(RUNTIME_STATE_PATH.read_text())
    except Exception:
        return {}


def save_runtime_state(state: dict[str, Any]) -> None:
    RUNTIME_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    RUNTIME_STATE_PATH.write_text(json.dumps(state, indent=2) + "\n")


def ensure_radar() -> dict[str, Any]:
    payload = {
        "slug": HORMUZ_RADAR_SLUG,
        "name": HORMUZ_RADAR_NAME,
        "category": HORMUZ_RADAR_CATEGORY,
        "createdBy": HORMUZ_CREATED_BY,
    }
    data = api_request("POST", "/api/radars/ensure", payload)
    radar = data.get("radar") if isinstance(data, dict) else None
    if not isinstance(radar, dict):
        raise ApiError(f"ensure radar returned unexpected payload: {data}")
    return radar


def load_watchlist_domains() -> list[str]:
    if not HORMUZ_WATCHLIST_PATH.exists():
        return []
    try:
        payload = json.loads(HORMUZ_WATCHLIST_PATH.read_text())
    except Exception:
        return []

    domains: set[str] = set()
    for entry in payload.get("domains", []):
        for seed in entry.get("seed_urls", []):
            url = str(seed.get("url", "")).strip()
            if not url:
                continue
            try:
                host = urlparse(url).hostname or ""
            except Exception:
                host = ""
            if host:
                domains.add(host.lower())
    return sorted(domains)


def run_bundle_pipeline() -> dict[str, Any]:
    (BUNDLE_ROOT / "reports").mkdir(parents=True, exist_ok=True)
    (BUNDLE_ROOT / "assets").mkdir(parents=True, exist_ok=True)
    run_command(["python3", "scripts/extract_signals.py"], BUNDLE_ROOT)
    run_command(["python3", "scripts/update_state.py"], BUNDLE_ROOT)
    report = run_command(["python3", "scripts/render_snapshot_report.py"], BUNDLE_ROOT)
    (BUNDLE_ROOT / "reports" / "v4_snapshot.md").write_text(report)
    run_command(["python3", "scripts/generate_v4_clock.py"], BUNDLE_ROOT)
    run_command(["node", "scripts/social/build_social_payloads.mjs"], BUNDLE_ROOT)
    return json.loads(STATE_PATH.read_text())


def export_packet(radar_id: str, module_version_id: str) -> dict[str, Any]:
    output = run_command(
        [
            "python3",
            "scripts/export_threat_radar_packet.py",
            str(STATE_PATH),
            radar_id,
            module_version_id,
        ],
        BUNDLE_ROOT,
    )
    return json.loads(output)


def maybe_submit_packet(runtime_state: dict[str, Any], radar: dict[str, Any], bundle_state: dict[str, Any]) -> dict[str, Any]:
    as_of_utc = str(bundle_state.get("as_of_utc", "")).strip()
    if not as_of_utc:
        raise RuntimeError("bundle state missing as_of_utc")

    if runtime_state.get("last_submitted_as_of_utc") == as_of_utc:
        return {"ok": True, "skipped": True, "reason": "already-submitted", "as_of_utc": as_of_utc}

    packet = export_packet(radar["id"], radar["active_module_version_id"])
    try:
        response = api_request("POST", "/api/submit-packet", packet)
    except ApiError as err:
        message = str(err)
        if "duplicate key value" in message or "already exists" in message:
            runtime_state["last_submitted_as_of_utc"] = as_of_utc
            return {"ok": True, "skipped": True, "reason": "duplicate-packet", "as_of_utc": as_of_utc}
        raise

    runtime_state["last_submitted_as_of_utc"] = as_of_utc
    return response


def collect_social_signals(radar_id: str) -> list[dict[str, Any]]:
    if HORMUZ_SKIP_SOCIAL_COLLECTION:
        return [{"ok": True, "skipped": True, "reason": "social-collection-disabled"}]

    results: list[dict[str, Any]] = []
    if HORMUZ_BLUESKY_QUERY:
        results.append(
            api_request(
                "POST",
                "/api/collect/bluesky",
                {
                    "searchQuery": HORMUZ_BLUESKY_QUERY,
                    "limit": 25,
                    "radarId": radar_id,
                },
            )
        )
    if HORMUZ_REDDIT_SUBREDDITS:
        results.append(
            api_request(
                "POST",
                "/api/collect/reddit",
                {
                    "subreddits": HORMUZ_REDDIT_SUBREDDITS,
                    "sort": "new",
                    "limit": 15,
                    "timeframe": "day",
                    "radarId": radar_id,
                },
            )
        )
    return results


def collect_crawler_signals(radar_id: str) -> dict[str, Any]:
    domains = load_watchlist_domains()
    return api_request(
        "POST",
        "/api/collect/weaver",
        {
            "baseUrl": HORMUZ_WEAVER_URL,
            "domainAllowlist": domains,
            "keywords": HORMUZ_WEAVER_KEYWORDS,
            "domainSignalLimit": 6,
            "recentNodeLimit": 8,
            "graphNodeLimit": 1200,
            "radarId": radar_id,
        },
    )


def collect_jetstream_signals(radar_id: str) -> dict[str, Any]:
    if not HORMUZ_JETSTREAM_ENABLED:
        return {"ok": True, "skipped": True, "reason": "jetstream-disabled"}

    api_request(
        "PUT",
        f"/api/jetstream/rules/{radar_id}",
        {
            "wantedUsers": HORMUZ_JETSTREAM_USERS,
            "hashtags": HORMUZ_JETSTREAM_HASHTAGS,
            "keywords": HORMUZ_JETSTREAM_KEYWORDS,
            "windowSeconds": HORMUZ_JETSTREAM_WINDOW_SECONDS,
            "maxEvents": HORMUZ_JETSTREAM_MAX_EVENTS,
            "enabled": True,
            "allowNetworkWide": len(HORMUZ_JETSTREAM_USERS) == 0,
        },
    )
    return api_request(
        "POST",
        "/api/collect/jetstream",
        {
            "radarId": radar_id,
            "limit": HORMUZ_JETSTREAM_MAX_EVENTS,
        },
    )


def maybe_seal_daily(runtime_state: dict[str, Any], radar_id: str, bundle_state: dict[str, Any]) -> dict[str, Any]:
    as_of_utc = str(bundle_state.get("as_of_utc", "")).strip()
    current_day = as_of_utc[:10]
    if runtime_state.get("last_sealed_day") == current_day:
        return {"ok": True, "skipped": True, "reason": "already-sealed", "day": current_day}

    try:
        response = api_request("POST", f"/api/seal-daily/{radar_id}", {})
        runtime_state["last_sealed_day"] = current_day
        return response
    except ApiError as err:
        message = str(err)
        if "duplicate key value" in message or "already exists" in message:
            runtime_state["last_sealed_day"] = current_day
            return {"ok": True, "skipped": True, "reason": "duplicate-daily", "day": current_day}
        raise


def main() -> int:
    runtime_state = load_runtime_state()
    radar = ensure_radar()
    bundle_state = run_bundle_pipeline()
    submission = maybe_submit_packet(runtime_state, radar, bundle_state)
    jetstream = collect_jetstream_signals(radar["id"])
    crawler = collect_crawler_signals(radar["id"])
    social = collect_social_signals(radar["id"])
    cluster_result = api_request("POST", f"/api/cluster/{radar['id']}", {})
    live_result = api_request("POST", f"/api/reduce-live/{radar['id']}", {})
    daily_result = maybe_seal_daily(runtime_state, radar["id"], bundle_state)
    runtime_state["last_cycle_at"] = bundle_state.get("as_of_utc")
    save_runtime_state(runtime_state)

    summary = {
        "radar_id": radar["id"],
        "bundle_as_of_utc": bundle_state.get("as_of_utc"),
        "submission": submission,
        "jetstream": jetstream,
        "crawler": crawler,
        "social": social,
        "cluster": cluster_result,
        "live": live_result,
        "daily": daily_result,
    }
    json.dump(summary, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
