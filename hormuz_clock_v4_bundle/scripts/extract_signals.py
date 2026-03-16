#!/usr/bin/env python3
"""Extract raw public signals for the Hormuz Risk Clock.

This script is intentionally adapter-based so you can add or remove sources over time.
Current adapters are conservative and scrape only stable public pages.
"""

from __future__ import annotations
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from html import unescape
from typing import Callable, Dict, List
import requests

TIMEOUT = 20
HEADERS = {"User-Agent": "HormuzRiskClock/0.1"}


@dataclass
class Signal:
    id: str
    timestamp_utc: str
    source: str
    category: str
    value: object
    confidence: float
    direction: str
    notes: str = ""
    url: str = ""

    def asdict(self):
        return self.__dict__


def now_utc_iso() -> str:
    return (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def html_to_text(html: str) -> str:
    html = re.sub(
        r"<(script|style)\b.*?</\1>", " ", html, flags=re.IGNORECASE | re.DOTALL
    )
    html = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", unescape(html)).strip()


def fetch(url: str) -> str:
    r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    r.raise_for_status()
    return r.text


def extract_marad_keep_clear(url: str) -> List[Signal]:
    text = html_to_text(fetch(url))
    out: List[Signal] = []
    if "keep clear of this area if possible" in text.lower():
        out.append(
            Signal(
                id="marad_keep_clear",
                timestamp_utc=now_utc_iso(),
                source="MARAD",
                category="attack_tempo",
                value="keep_clear_if_possible",
                confidence=0.95,
                direction="destabilizing",
                notes="advisory language indicates severe operating risk",
                url=url,
            )
        )
    return out


def extract_iea_topic(url: str) -> List[Signal]:
    text = html_to_text(fetch(url))
    out: List[Signal] = []
    if re.search(
        r"less than\s+10%\s+of\s+pre-conflict\s+levels", text, flags=re.IGNORECASE
    ):
        out.append(
            Signal(
                id="iea_transit_flow_below_10pct",
                timestamp_utc=now_utc_iso(),
                source="IEA",
                category="transit_flow",
                value={"current": 9, "baseline": 100},
                confidence=0.95,
                direction="destabilizing",
                notes="IEA says export volumes of crude oil and refined products are currently at less than 10% of pre-conflict levels",
                url=url,
            )
        )

    range_match = re.search(
        r"estimated\s+([0-9]+(?:\.[0-9]+)?)\s*mb/d\s*to\s*([0-9]+(?:\.[0-9]+)?)\s*mb/d\s*of available capacity",
        text,
        flags=re.IGNORECASE,
    )
    baseline_match = re.search(
        r"average of\s+([0-9]+(?:\.[0-9]+)?)\s+million barrels per day(?:\s*\(mb/d\))?.*?transited the Strait of Hormuz",
        text,
        flags=re.IGNORECASE,
    )
    if range_match and baseline_match:
        bypass_min = float(range_match.group(1))
        bypass_max = float(range_match.group(2))
        hormuz_mbpd = float(baseline_match.group(1))
        out.append(
            Signal(
                id="iea_bypass_capacity_range",
                timestamp_utc=now_utc_iso(),
                source="IEA",
                category="bypass_capacity",
                value={
                    "bypass_min_mbpd": bypass_min,
                    "bypass_max_mbpd": bypass_max,
                    "hormuz_mbpd": hormuz_mbpd,
                },
                confidence=0.95,
                direction="neutral",
                notes=f"IEA cites {bypass_min:g}-{bypass_max:g} mb/d of bypass capacity versus about {hormuz_mbpd:g} mb/d normal Hormuz flow",
                url=url,
            )
        )
    return out


def extract_iea_stock_release(url: str) -> List[Signal]:
    text = html_to_text(fetch(url))
    out: List[Signal] = []
    match = re.search(
        r"make\s+([0-9]+)\s+million barrels of oil from their emergency reserves available",
        text,
        flags=re.IGNORECASE,
    )
    if match:
        out.append(
            Signal(
                id="iea_emergency_stock_release",
                timestamp_utc=now_utc_iso(),
                source="IEA",
                category="asia_buffer_stress",
                value={"release_million_barrels": int(match.group(1))},
                confidence=0.95,
                direction="stabilizing",
                notes=f"IEA members approved a {match.group(1)} million barrel emergency stock release to cushion market disruptions",
                url=url,
            )
        )
    return out


def extract_ukmto_jmic_keywords(url: str) -> List[Signal]:
    text = html_to_text(fetch(url)).lower()
    out: List[Signal] = []
    if "critical" in text:
        out.append(
            Signal(
                id="jmic_critical_keyword",
                timestamp_utc=now_utc_iso(),
                source="JMIC/UKMTO",
                category="attack_tempo",
                value="critical",
                confidence=0.8,
                direction="destabilizing",
                notes="keyword hit for threat level critical",
                url=url,
            )
        )
    if "interference" in text or "gnss" in text or "gps" in text:
        out.append(
            Signal(
                id="ukmto_navigation_interference",
                timestamp_utc=now_utc_iso(),
                source="JMIC/UKMTO",
                category="navigation_integrity",
                value="interference_present",
                confidence=0.8,
                direction="destabilizing",
                notes="keyword hit for interference / GNSS / GPS",
                url=url,
            )
        )
    return out


def main():
    adapters: Dict[str, Callable[[str], List[Signal]]] = {
        "marad": extract_marad_keep_clear,
        "iea_topic": extract_iea_topic,
        "iea_stock_release": extract_iea_stock_release,
        "ukmto_or_jmic": extract_ukmto_jmic_keywords,
    }

    sources = {
        "marad": "https://www.maritime.dot.gov/msci/2026-001a-strait-hormuz-persian-gulf-gulf-oman-and-arabian-sea-military-operations-and",
        "iea_topic": "https://www.iea.org/topics/the-middle-east-and-global-energy-markets",
        "iea_stock_release": "https://www.iea.org/news/iea-member-countries-to-carry-out-largest-ever-oil-stock-release-amid-market-disruptions-from-middle-east-conflict",
        "ukmto_or_jmic": "https://www.ukmto.org/ukmto-products/advisories/2026",
    }

    signals: List[Signal] = []
    for name, url in sources.items():
        try:
            signals.extend(adapters[name](url))
        except Exception as exc:
            signals.append(
                Signal(
                    id=f"{name}_fetch_error",
                    timestamp_utc=now_utc_iso(),
                    source=name,
                    category="meta",
                    value="error",
                    confidence=0.0,
                    direction="neutral",
                    notes=str(exc),
                    url=url,
                )
            )

    print(json.dumps([s.asdict() for s in signals], indent=2))


if __name__ == "__main__":
    main()
