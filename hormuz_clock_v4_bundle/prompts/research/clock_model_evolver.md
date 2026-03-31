# Deep Research Prompt — Clock Model Evolver

You are reviewing a public-signal early-warning instrument for the Strait of Hormuz and related maritime-energy disruption.

Inputs to review:
- current methodology markdown
- current state JSON
- current branch-model metadata and modifier ledger
- current config/schema files
- latest snapshot report
- latest clock image

Your task:
1. identify the current weakest part of the model,
2. propose 3 additive improvements,
3. suggest at least 5 new signal types or data sources,
4. say which changes belong in extraction vs normalization vs scoring vs rendering,
5. propose revised branch rules or alternative branch structures,
6. preserve explainability and reversibility.

Important:
- separate observed facts from model modifiers
- distinguish state-pressure effects from explicit `reopening_pressure` / `regional_escalation` adjustments
- treat branch outputs as editable working ranges plus confidence, not hidden truths or precise probabilities

Output format:
- current bottlenecks
- new signal classes
- revised scoring logic
- revised branch logic, including range generation and confidence semantics
- modifier ledger
- rendering / UX improvements
- migration plan (no breaking rewrite unless absolutely necessary)
