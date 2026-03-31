#!/usr/bin/env python3
"""Manage *.promethean.rest A records via Cloudflare while preserving unrelated zone records."""

from __future__ import annotations

import argparse
import json
import os
import socket
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Iterable

API_BASE = "https://api.cloudflare.com/client/v4"
DEFAULT_ZONE_NAME = "promethean.rest"
CORE_HOSTS = {
    "ussy": "ussy.promethean.rest",
    "ussy2": "ussy2.promethean.rest",
    "ussy3": "ussy3.promethean.rest",
    "big.ussy": "big.ussy.promethean.rest",
}
LAST_KNOWN_CORE_IPV4 = {
    "ussy.promethean.rest": ["104.130.31.129"],
    "ussy2.promethean.rest": ["104.130.31.121"],
    "ussy3.promethean.rest": ["104.130.31.144"],
    "big.ussy.promethean.rest": ["169.197.82.183"],
}
CONFLICTING_TYPES = {"A", "AAAA", "CNAME", "HTTPS", "SVCB"}


@dataclass(frozen=True)
class DNSRecord:
    name: str
    record_type: str
    content: str
    ttl: int = 1
    proxied: bool = False
    record_id: str | None = None

    @property
    def cloudflare_payload(self) -> dict[str, object]:
        return {
            "type": self.record_type,
            "name": self.name,
            "content": self.content,
            "ttl": self.ttl,
            "proxied": self.proxied,
        }

    @property
    def summary(self) -> dict[str, object]:
        payload = {
            "id": self.record_id,
            "name": self.name,
            "type": self.record_type,
            "content": self.content,
            "ttl": self.ttl,
            "proxied": self.proxied,
        }
        return {k: v for k, v in payload.items() if v is not None}


class CloudflareDNS:
    def __init__(self) -> None:
        self.api_token = required_any_env(
            "CLOUDFLARE_API_TOKEN",
            "CLOUD_FLARE_PROMETHEAN_DOT_REST_DNS_ZONE_TOKEN",
        )
        self.zone_name = os.getenv("CLOUDFLARE_ZONE_NAME", DEFAULT_ZONE_NAME).strip() or DEFAULT_ZONE_NAME
        self.zone_id = os.getenv("CLOUDFLARE_ZONE_ID", "").strip() or self.lookup_zone_id(self.zone_name)

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, str] | None = None,
        payload: dict[str, object] | None = None,
    ) -> object:
        url = f"{API_BASE}{path}"
        if params:
            url = f"{url}?{urllib.parse.urlencode(params)}"
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }
        data = None if payload is None else json.dumps(payload).encode()
        request = urllib.request.Request(url, data=data, method=method, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                raw = response.read()
        except Exception as exc:  # noqa: BLE001
            raise SystemExit(f"Cloudflare request failed: {exc}") from exc
        decoded = json.loads(raw)
        if not decoded.get("success", False):
            errors = decoded.get("errors") or []
            message = "; ".join(error.get("message", "unknown error") for error in errors) or "unknown Cloudflare API error"
            raise SystemExit(message)
        return decoded.get("result")

    def lookup_zone_id(self, zone_name: str) -> str:
        result = self._request("GET", "/zones", params={"name": zone_name, "status": "active", "per_page": "50"})
        zones = list(result or [])
        for zone in zones:
            if zone.get("name") == zone_name and zone.get("id"):
                return str(zone["id"])
        raise SystemExit(f"Cloudflare zone not found or not active: {zone_name}")

    def list_records(self, *, name: str | None = None) -> list[DNSRecord]:
        params = {"per_page": "500"}
        if name:
            params["name"] = name
        result = self._request("GET", f"/zones/{self.zone_id}/dns_records", params=params)
        records: list[DNSRecord] = []
        for item in list(result or []):
            records.append(
                DNSRecord(
                    name=str(item["name"]),
                    record_type=str(item["type"]),
                    content=str(item["content"]),
                    ttl=int(item.get("ttl", 1) or 1),
                    proxied=bool(item.get("proxied", False)),
                    record_id=str(item.get("id")) if item.get("id") else None,
                )
            )
        return records

    def create_record(self, record: DNSRecord) -> dict[str, object]:
        return dict(self._request("POST", f"/zones/{self.zone_id}/dns_records", payload=record.cloudflare_payload) or {})

    def update_record(self, record_id: str, record: DNSRecord) -> dict[str, object]:
        return dict(self._request("PUT", f"/zones/{self.zone_id}/dns_records/{record_id}", payload=record.cloudflare_payload) or {})

    def delete_record(self, record_id: str) -> dict[str, object]:
        return dict(self._request("DELETE", f"/zones/{self.zone_id}/dns_records/{record_id}") or {})


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def required_any_env(*names: str) -> str:
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value
    joined = ", ".join(names)
    raise SystemExit(f"Missing required environment variable; set one of: {joined}")


def resolve_ipv4s(hostname: str) -> list[str]:
    ips, _ = resolve_ipv4s_with_source(hostname)
    return ips


def resolve_ipv4s_with_source(hostname: str) -> tuple[list[str], str]:
    try:
        infos = socket.getaddrinfo(hostname, 80, type=socket.SOCK_STREAM)
    except OSError as exc:
        fallback = LAST_KNOWN_CORE_IPV4.get(hostname, [])
        if fallback:
            return list(fallback), "last_known_fallback"
        raise SystemExit(f"Failed to resolve {hostname}: {exc}") from exc
    ips: list[str] = []
    for info in infos:
        ip = info[4][0]
        if ":" in ip:
            continue
        if ip not in ips:
            ips.append(ip)
    if not ips:
        raise SystemExit(f"No IPv4 A records found for {hostname}")
    return ips, "live_dns"


def normalize_host_label(raw: str, zone_name: str) -> str:
    value = raw.strip().lower().rstrip(".")
    if not value:
        raise SystemExit("Host label is required")
    if value == zone_name:
        raise SystemExit("Root zone updates are not supported by this helper; pass a subdomain label")
    suffix = f".{zone_name}"
    if value.endswith(suffix):
        value = value[: -len(suffix)]
    if not value:
        raise SystemExit(f"Expected a subdomain under {zone_name}, got: {raw}")
    if any(part.strip() == "" for part in value.split(".")):
        raise SystemExit(f"Invalid host label under {zone_name}: {raw}")
    return value


def resolved_core_map() -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    for key, fqdn in CORE_HOSTS.items():
        ips, source = resolve_ipv4s_with_source(fqdn)
        result[key] = {"fqdn": fqdn, "ipv4": ips, "source": source}
    return result


def parse_ttl(raw: str) -> int:
    value = raw.strip().lower()
    if value in {"auto", "1"}:
        return 1
    try:
        ttl = int(value)
    except ValueError as exc:
        raise SystemExit(f"Invalid TTL value: {raw}") from exc
    if ttl <= 0:
        raise SystemExit(f"TTL must be positive or 'auto', got: {raw}")
    return ttl


def build_desired_records(fqdn: str, cores: Iterable[str], explicit_ips: Iterable[str], ttl: int, proxied: bool) -> list[DNSRecord]:
    addresses: list[str] = []
    for core in cores:
        for ip in resolve_ipv4s(CORE_HOSTS[core]):
            if ip not in addresses:
                addresses.append(ip)
    for ip in explicit_ips:
        clean = ip.strip()
        if clean and clean not in addresses:
            addresses.append(clean)
    if not addresses:
        raise SystemExit("At least one --core or --ip value is required")
    return [DNSRecord(name=fqdn, record_type="A", content=ip, ttl=ttl, proxied=proxied) for ip in addresses]


def plan_record_changes(existing: list[DNSRecord], desired: list[DNSRecord]) -> list[dict[str, object]]:
    desired_by_content = {record.content: record for record in desired}
    actions: list[dict[str, object]] = []
    matched_contents: set[str] = set()

    for record in existing:
        if record.record_type.upper() not in CONFLICTING_TYPES:
            actions.append({"action": "preserve", "record": record.summary, "reason": "non-conflicting record type"})
            continue
        desired_record = desired_by_content.get(record.content) if record.record_type.upper() == "A" else None
        if desired_record is None:
            actions.append({"action": "delete", "record": record.summary})
            continue
        matched_contents.add(record.content)
        if record.ttl != desired_record.ttl or record.proxied != desired_record.proxied:
            actions.append({"action": "update", "record": record.summary, "desired": desired_record.summary})
        else:
            actions.append({"action": "keep", "record": record.summary})

    for record in desired:
        if record.content not in matched_contents:
            actions.append({"action": "create", "desired": record.summary})

    return actions


def apply_plan(dns: CloudflareDNS, actions: list[dict[str, object]], desired: list[DNSRecord]) -> None:
    desired_by_content = {record.content: record for record in desired}
    for action in actions:
        kind = action["action"]
        if kind == "delete":
            record = action["record"]
            dns.delete_record(str(record["id"]))
        elif kind == "update":
            record = action["record"]
            desired_record = desired_by_content[str(record["content"])]
            dns.update_record(str(record["id"]), desired_record)
        elif kind == "create":
            desired_record = desired_by_content[str(action["desired"]["content"])]
            dns.create_record(desired_record)


def cmd_show_cores(_: argparse.Namespace) -> int:
    print(json.dumps(resolved_core_map(), indent=2, sort_keys=True))
    return 0


def cmd_ensure(args: argparse.Namespace) -> int:
    dns = CloudflareDNS()
    label = normalize_host_label(args.host, dns.zone_name)
    fqdn = f"{label}.{dns.zone_name}"
    ttl = parse_ttl(args.ttl)
    proxied = bool(args.proxied)
    desired = build_desired_records(fqdn, args.core or [], args.ip or [], ttl, proxied)
    existing = dns.list_records(name=fqdn)
    actions = plan_record_changes(existing, desired)

    summary = {
        "provider": "cloudflare",
        "zone_name": dns.zone_name,
        "zone_id": dns.zone_id,
        "host": label,
        "fqdn": fqdn,
        "desired_records": [record.summary for record in desired],
        "existing_records": [record.summary for record in existing],
        "actions": actions,
        "dry_run": bool(args.dry_run),
    }

    if args.dry_run:
        print(json.dumps(summary, indent=2, sort_keys=True))
        return 0

    apply_plan(dns, actions, desired)
    summary["status"] = "updated"
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage *.promethean.rest A records via Cloudflare")
    sub = parser.add_subparsers(dest="command", required=True)

    show = sub.add_parser("show-cores", help="Resolve the core promethean.rest hosts and print their current A records")
    show.set_defaults(func=cmd_show_cores)

    ensure = sub.add_parser("ensure", help="Create or replace one subdomain label under promethean.rest")
    ensure.add_argument("host", help="Host label or FQDN under promethean.rest, e.g. battlebussy or battlebussy.promethean.rest")
    ensure.add_argument("--core", action="append", choices=sorted(CORE_HOSTS.keys()), help="Copy the current A record(s) from one or more allowed base hosts")
    ensure.add_argument("--ip", action="append", help="Explicit IPv4 address to add as an A record")
    ensure.add_argument("--ttl", default="auto", help="TTL for managed records (default: auto; use seconds or 'auto')")
    ensure.add_argument("--proxied", action="store_true", help="Create/update records as Cloudflare proxied records")
    ensure.add_argument("--dry-run", action="store_true", help="Print the plan without calling the Cloudflare write APIs")
    ensure.set_defaults(func=cmd_ensure)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
