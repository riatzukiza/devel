#!/usr/bin/env python3
"""Extract raw public signals for the Hormuz Risk Clock.

This script is intentionally adapter-based so you can add or remove sources over time.
Current adapters are conservative and scrape only stable public pages.
"""
from __future__ import annotations
import json
import re
from dataclasses import dataclass
from typing import Callable, Dict, List
import requests
from bs4 import BeautifulSoup

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


def fetch(url: str) -> str:
    r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    r.raise_for_status()
    return r.text


def extract_marad_keep_clear(url: str) -> List[Signal]:
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True)
    out: List[Signal] = []
    if "keep clear of this area if possible" in text.lower():
        out.append(Signal(
            id="marad_keep_clear",
            timestamp_utc="",
            source="MARAD",
            category="attack_tempo",
            value="keep_clear_if_possible",
            confidence=0.95,
            direction="destabilizing",
            notes="advisory language indicates severe operating risk",
            url=url,
        ))
    return out


def extract_iea_bypass(url: str) -> List[Signal]:
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True)
    out: List[Signal] = []
    m = re.search(r"(3\.5\s*mb/d\s*to\s*5\.5\s*mb/d)", text)
    if m:
        out.append(Signal(
            id="iea_bypass_capacity_range",
            timestamp_utc="",
            source="IEA",
            category="bypass_capacity",
            value=m.group(1),
            confidence=0.95,
            direction="neutral",
            notes="available bypass capacity cited on IEA page",
            url=url,
        ))
    return out


def extract_ukmto_jmic_keywords(url: str) -> List[Signal]:
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True).lower()
    out: List[Signal] = []
    if "critical" in text:
        out.append(Signal(
            id="jmic_critical_keyword",
            timestamp_utc="",
            source="JMIC/UKMTO",
            category="attack_tempo",
            value="critical",
            confidence=0.8,
            direction="destabilizing",
            notes="keyword hit for threat level critical",
            url=url,
        ))
    if "interference" in text or "gnss" in text or "gps" in text:
        out.append(Signal(
            id="ukmto_navigation_interference",
            timestamp_utc="",
            source="JMIC/UKMTO",
            category="navigation_integrity",
            value="interference_present",
            confidence=0.8,
            direction="destabilizing",
            notes="keyword hit for interference / GNSS / GPS",
            url=url,
        ))
    return out


def main():
    adapters: Dict[str, Callable[[str], List[Signal]]] = {
        "marad": extract_marad_keep_clear,
        "iea": extract_iea_bypass,
        "ukmto_or_jmic": extract_ukmto_jmic_keywords,
    }

    sources = {
        "marad": "https://www.maritime.dot.gov/msci/2026-001a-strait-hormuz-persian-gulf-gulf-oman-and-arabian-sea-military-operations-and",
        "iea": "https://www.iea.org/topics/the-middle-east-and-global-energy-markets",
        "ukmto_or_jmic": "https://www.ukmto.org/ukmto-products/advisories/2026",
    }

    signals: List[Signal] = []
    for name, url in sources.items():
        try:
            signals.extend(adapters[name](url))
        except Exception as exc:
            signals.append(Signal(
                id=f"{name}_fetch_error",
                timestamp_utc="",
                source=name,
                category="meta",
                value="error",
                confidence=0.0,
                direction="neutral",
                notes=str(exc),
                url=url,
            ))

    print(json.dumps([s.asdict() for s in signals], indent=2))


if __name__ == "__main__":
    main()
