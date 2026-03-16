# Perplexity scheduled update prompt

Use only primary and high-quality analytical sources to update the Strait of Hormuz Risk Clock.

Tasks:
1. Check UKMTO / JMIC / MARAD / IEA / Reuters / Lloyd's List / BIMCO / Gard / Windward / Kpler / Wood Mackenzie / Rystad.
2. Extract only source-backed signals into these buckets:
   - transit_flow
   - attack_tempo
   - insurance_availability
   - navigation_integrity
   - bypass_capacity
   - asia_buffer_stress
3. For each bucket, output:
   - score 0-4
   - trend (improving / flat / worsening)
   - confidence 0-1
   - 1-2 sentence justification with citations
4. Update working branch priors:
   - reopening
   - effective_closure
   - wider_escalation
5. Distinguish clearly between:
   - observed facts
   - working model choices
6. End with a compact JSON block that another system can ingest.

Formatting requirements:
- no hype
- no "everything is fine" language
- no certainty inflation
- cite all factual claims
