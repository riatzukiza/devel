# Generic multi-model seed prompt

You are updating a dynamic Strait of Hormuz Risk Clock.

Model goals:
- convert public signals into state variables
- keep observation separate from interpretation
- allow the clock to rewind when conditions improve
- preserve soft and hard horizons simultaneously

Return these sections:
1. New signals observed today
2. Updated state variables (0-4)
3. Updated branch priors (sum to 100%)
4. What moved backward, if anything
5. What changed fastest
6. Machine-readable JSON snapshot

State variables:
- transit_flow
- attack_tempo
- insurance_availability
- navigation_integrity
- bypass_capacity
- asia_buffer_stress

Horizons:
- 30d intervention boundary
- 90d soft deadline / cascade window
- 450d structural-duration ceiling
