# Hormuz Risk Clock Snapshot

As of: 2026-03-19T18:44:20Z

## Observed state (facts folded into scored conditions)
- **transit_flow**: 4/4 (flat-high, confidence 95%) — JMIC Update 006 reports only 04 confirmed commercial transits in the past 24 hours versus a historical average of about 138 vessels
  - Sources: IEA (2026-03-19); JMIC (2026-03-19)
- **attack_tempo**: 4/4 (flat-high, confidence 90%) — JMIC Update 006 says the threat remains CRITICAL and attacks are likely for commercial shipping
  - Sources: JMIC (2026-03-19)
- **insurance_availability**: 3/4 (easing, confidence 85%) — War-risk cover remains available but premiums surged more than 1000%, with reported rates around 1% to 1.5% of vessel value
  - Sources: Insurance Journal / Reuters (2026-03-19)
- **navigation_integrity**: 3/4 (flat-high, confidence 88%) — JMIC Update 006 says significant GNSS interference continues, with positional offsets, AIS anomalies, and intermittent signal degradation
  - Sources: JMIC (2026-03-19)
- **bypass_capacity**: 3/4 (flat-high, confidence 95%) — IEA cites 3.5-5.5 mb/d of available bypass capacity versus roughly 20 mb/d normal Hormuz flow
  - Sources: IEA (2026-03-19)
- **asia_buffer_stress**: 1/4 (flat, confidence 95%) — IEA members approved a 400 million barrel emergency stock release to cushion market disruptions
  - Sources: IEA (2026-03-19)

## Working branch priors (model choice, not fact)
- **reopening**: 22%
- **effective_closure**: 51%
- **wider_escalation**: 27%

## Model notes
- Version: weighted-state-priors-v1
- Note: Working priors derived from state pressure plus named modifiers; these are model choices, not observed facts.
- Explicit modifiers:
  - **regional_escalation** from AP (strength 0.90) — AP reports Iranian attacks on Gulf energy sites, additional vessel damage off the UAE and Qatar, and regional officials calling it a dangerous escalation
  - **reopening_pressure** from ABC11 / AP (strength 0.55) — Officials describe a coalition-backed defensive escort mission intended to gradually reopen Hormuz for container ships and tankers after the most intense phase of the conflict
