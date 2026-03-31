#!/usr/bin/env python3
"""Extract raw public signals for the Hormuz Risk Clock.

This script stays adapter-based, but now prefers sources that remain fetchable from a
plain CLI environment. When official HTML endpoints block scraping, it falls back to
accessible public PDFs or reporting that is explicit enough to remain auditable.
"""

from __future__ import annotations

import json
import re
import subprocess
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from html import unescape
from typing import Callable, Dict, List

import requests

TIMEOUT = 20
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; HormuzRiskClock/0.2; +https://example.invalid)"
}


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
    experimental: bool = False

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


def fetch_pdf_text(url: str) -> str:
    r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    r.raise_for_status()
    with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp:
        tmp.write(r.content)
        tmp.flush()
        result = subprocess.run(
            ["pdftotext", tmp.name, "-"],
            check=True,
            capture_output=True,
            text=True,
        )
    return re.sub(r"\s+", " ", result.stdout).strip()


def extract_iea_topic(url: str) -> List[Signal]:
    text = html_to_text(fetch(url))
    out: List[Signal] = []

    range_match = re.search(
        r"estimated\s+([0-9]+(?:\.[0-9]+)?)\s*mb/d\s*to\s*([0-9]+(?:\.[0-9]+)?)\s*mb/d\s*of available capacity",
        text,
        flags=re.IGNORECASE,
    )
    if range_match:
        bypass_min = float(range_match.group(1))
        bypass_max = float(range_match.group(2))
        out.append(
            Signal(
                id="iea_bypass_capacity_range",
                timestamp_utc=now_utc_iso(),
                source="IEA",
                category="bypass_capacity",
                value={
                    "bypass_min_mbpd": bypass_min,
                    "bypass_max_mbpd": bypass_max,
                    "hormuz_mbpd": 20.0,
                },
                confidence=0.95,
                direction="neutral",
                notes=(
                    f"IEA cites {bypass_min:g}-{bypass_max:g} mb/d of available bypass capacity "
                    "versus roughly 20 mb/d normal Hormuz flow"
                ),
                url=url,
            )
        )
    return out


def extract_iea_stock_release(url: str) -> List[Signal]:
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
                notes=(
                    "IEA says export volumes of crude and refined products are currently "
                    "at less than 10% of pre-conflict levels"
                ),
                url=url,
            )
        )

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
                notes=(
                    f"IEA members approved a {match.group(1)} million barrel emergency stock release "
                    "to cushion market disruptions"
                ),
                url=url,
            )
        )
    return out


def extract_jmic_pdf(url: str) -> List[Signal]:
    text = fetch_pdf_text(url)
    out: List[Signal] = []

    if re.search(
        r"Threat remains assessed at CRITICAL, indicating attacks are likely and conditions remain highly hazardous for commercial shipping",
        text,
        flags=re.IGNORECASE,
    ):
        out.append(
            Signal(
                id="jmic_threat_critical",
                timestamp_utc=now_utc_iso(),
                source="JMIC",
                category="attack_tempo",
                value={"ordinal": 4, "threat_level": "critical"},
                confidence=0.9,
                direction="destabilizing",
                notes=(
                    "JMIC Update 006 says the threat remains CRITICAL and attacks are likely "
                    "for commercial shipping"
                ),
                url=url,
            )
        )

    transit_match = re.search(
        r"Historical Average Daily Transit:\s*~?(\d+)\s+vessels per 24-hour period\..*?only\s+0?(\d+)\s+confirmed commercial transits observed in the past 24 hours",
        text,
        flags=re.IGNORECASE,
    )
    if transit_match:
        baseline = float(transit_match.group(1))
        current = float(transit_match.group(2))
        out.append(
            Signal(
                id="jmic_single_digit_transits",
                timestamp_utc=now_utc_iso(),
                source="JMIC",
                category="transit_flow",
                value={"current": current, "baseline": baseline},
                confidence=0.9,
                direction="destabilizing",
                notes=(
                    f"JMIC Update 006 reports only {int(current):02d} confirmed commercial transits in the past 24 hours "
                    f"versus a historical average of about {int(baseline)} vessels"
                ),
                url=url,
            )
        )

    if re.search(
        r"Significant GNSS interference continues across the Strait of Hormuz approaches, Gulf of Oman, and the Arabian Gulf",
        text,
        flags=re.IGNORECASE,
    ):
        out.append(
            Signal(
                id="jmic_gnss_interference_persistent",
                timestamp_utc=now_utc_iso(),
                source="JMIC",
                category="navigation_integrity",
                value={"ordinal": 3, "issues": ["gnss_interference", "ais_anomalies"]},
                confidence=0.88,
                direction="destabilizing",
                notes=(
                    "JMIC Update 006 says significant GNSS interference continues, with positional offsets, "
                    "AIS anomalies, and intermittent signal degradation"
                ),
                url=url,
            )
        )

    return out


def extract_insurance_journal(url: str) -> List[Signal]:
    text = html_to_text(fetch(url))
    out: List[Signal] = []

    premium_match = re.search(
        r"between\s+([0-9]+(?:\.[0-9]+)?)%\s+and\s+([0-9]+(?:\.[0-9]+)?)%\s+of vessel value",
        text,
        flags=re.IGNORECASE,
    )
    surge_match = re.search(r"more than\s+([0-9]+)%", text, flags=re.IGNORECASE)
    cover_available = bool(re.search(r"cover remains available", text, flags=re.IGNORECASE))

    if premium_match or surge_match or cover_available:
        low = float(premium_match.group(1)) if premium_match else 0.0
        high = float(premium_match.group(2)) if premium_match else low
        surge_pct = float(surge_match.group(1)) if surge_match else 0.0
        out.append(
            Signal(
                id="insurance_war_risk_spike",
                timestamp_utc=now_utc_iso(),
                source="Insurance Journal / Reuters",
                category="insurance_availability",
                value={
                    "premium_pct_of_value_low": low,
                    "premium_pct_of_value_high": high,
                    "surge_percent": surge_pct,
                    "cover_available": cover_available,
                },
                confidence=0.85,
                direction="destabilizing",
                notes=(
                    "War-risk cover remains available but premiums surged more than 1000%, "
                    f"with reported rates around {low:g}% to {high:g}% of vessel value"
                ),
                url=url,
            )
        )
    return out


def extract_ap_energy_escalation(url: str) -> List[Signal]:
    text = html_to_text(fetch(url))
    out: List[Signal] = []

    if re.search(r"dangerous escalation", text, flags=re.IGNORECASE):
        out.append(
            Signal(
                id="ap_gulf_energy_sites_escalation",
                timestamp_utc=now_utc_iso(),
                source="AP",
                category="regional_escalation",
                value={"strength": 0.9, "ordinal": 4},
                confidence=0.8,
                direction="destabilizing",
                notes=(
                    "AP reports Iranian attacks on Gulf energy sites, additional vessel damage off the UAE and Qatar, "
                    "and regional officials calling it a dangerous escalation"
                ),
                url=url,
                experimental=True,
            )
        )
    return out


def extract_escort_planning(url: str) -> List[Signal]:
    text = html_to_text(fetch(url))
    out: List[Signal] = []

    if re.search(r"purely defensive, purely escort mission", text, flags=re.IGNORECASE):
        out.append(
            Signal(
                id="escort_mission_reopening_pressure",
                timestamp_utc=now_utc_iso(),
                source="ABC11 / AP",
                category="reopening_pressure",
                value={"strength": 0.55},
                confidence=0.72,
                direction="stabilizing",
                notes=(
                    "Officials describe a coalition-backed defensive escort mission intended to gradually reopen Hormuz "
                    "for container ships and tankers after the most intense phase of the conflict"
                ),
                url=url,
                experimental=True,
            )
        )
    return out


def main():
    adapters: Dict[str, Callable[[str], List[Signal]]] = {
        "iea_topic": extract_iea_topic,
        "iea_stock_release": extract_iea_stock_release,
        "jmic_update_006": extract_jmic_pdf,
        "insurance_journal": extract_insurance_journal,
        "ap_energy_escalation": extract_ap_energy_escalation,
        "escort_planning": extract_escort_planning,
    }

    sources = {
        "iea_topic": "https://www.iea.org/topics/the-middle-east-and-global-energy-markets",
        "iea_stock_release": "https://www.iea.org/news/iea-member-countries-to-carry-out-largest-ever-oil-stock-release-amid-market-disruptions-from-middle-east-conflict",
        "jmic_update_006": "https://mscio.eu/media/documents/Update_006_JMIC_Advisory_Note_06_MAR_2026_FINAL.pdf",
        "insurance_journal": "https://www.insurancejournal.com/news/international/2026/03/06/860842.htm",
        "ap_energy_escalation": "https://apnews.com/article/52e94398f2432b3aba9b02b51fbe5000",
        "escort_planning": "https://abc11.com/live-updates/iran-war-news-live-updates-mojtaba-khamenei-chosen-irans-supreme-leader/18696218/entry/18696260",
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
