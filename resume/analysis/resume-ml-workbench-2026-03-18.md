# Resume ML Workbench Report

Generated: 2026-03-18T04:50:21.871Z

## Resumes
- resume/aaron-beavers-jorie-ai-v2-ats.pdf
- resume/aaron-beavers-ichi-costanoa-v1-ats.pdf
- resume/aaron-beavers-devsecops-ai-ats.pdf

## Job Descriptions
- resume/analysis/tmp/jd-jorie-ai.txt
- resume/analysis/tmp/jd-ichi-costanoa.txt

## Pair Scores
### aaron-beavers-jorie-ai-v2-ats.pdf vs jd-jorie-ai.txt
- Hybrid score: 0.271
- Keyword coverage: 0.313
- Phrase coverage: 0.000
- Lexical similarity: 0.240
- Section signal: 0.857
- Recommendations:
  - Review missing JD tokens: developer, jorie, ai., intelligent, solutions, revenue, cycle, management, rcm, move
  - Review missing JD phrases: python rpa developer at jorie ai | build intelligent resilient automation solutions for revenue cycle management rcm | automate complex workflows involving ehrs claims portals and legacy systems | python rpa developer | rpa developer at

### aaron-beavers-jorie-ai-v2-ats.pdf vs jd-ichi-costanoa.txt
- Hybrid score: 0.246
- Keyword coverage: 0.250
- Phrase coverage: 0.000
- Lexical similarity: 0.241
- Section signal: 0.857
- Recommendations:
  - Review missing JD tokens: senior, fully, remote, candidates, only, ichi, large, language, models, llms
  - Review missing JD phrases: senior software engineer - full stack react rails | fully remote us based candidates only | what you need for success | - 8+ years of professional engineering experience | - ruby on rails and react expertise building production-grade applications

### aaron-beavers-ichi-costanoa-v1-ats.pdf vs jd-jorie-ai.txt
- Hybrid score: 0.160
- Keyword coverage: 0.146
- Phrase coverage: 0.000
- Lexical similarity: 0.064
- Section signal: 0.857
- Recommendations:
  - Review missing JD tokens: rpa, developer, jorie, ai., intelligent, resilient, solutions, revenue, cycle, management
  - Review missing JD phrases: python rpa developer at jorie ai | build intelligent resilient automation solutions for revenue cycle management rcm | automate complex workflows involving ehrs claims portals and legacy systems | python rpa developer | rpa developer at
  - Low lexical similarity: consider tighter JD-specific phrasing where truthful.

### aaron-beavers-ichi-costanoa-v1-ats.pdf vs jd-ichi-costanoa.txt
- Hybrid score: 0.288
- Keyword coverage: 0.287
- Phrase coverage: 0.000
- Lexical similarity: 0.348
- Section signal: 0.857
- Recommendations:
  - Review missing JD tokens: based, candidates, only, ichi, large, language, models, llms, construction, permitting
  - Review missing JD phrases: senior software engineer - full stack react rails | fully remote us based candidates only | what you need for success | - 8+ years of professional engineering experience | - ruby on rails and react expertise building production-grade applications

### aaron-beavers-devsecops-ai-ats.pdf vs jd-jorie-ai.txt
- Hybrid score: 0.175
- Keyword coverage: 0.188
- Phrase coverage: 0.000
- Lexical similarity: 0.058
- Section signal: 0.857
- Recommendations:
  - Review missing JD tokens: rpa, developer, jorie, ai., intelligent, resilient, solutions, revenue, cycle, management
  - Review missing JD phrases: python rpa developer at jorie ai | build intelligent resilient automation solutions for revenue cycle management rcm | automate complex workflows involving ehrs claims portals and legacy systems | python rpa developer | rpa developer at
  - Low lexical similarity: consider tighter JD-specific phrasing where truthful.

### aaron-beavers-devsecops-ai-ats.pdf vs jd-ichi-costanoa.txt
- Hybrid score: 0.262
- Keyword coverage: 0.263
- Phrase coverage: 0.000
- Lexical similarity: 0.287
- Section signal: 0.857
- Recommendations:
  - Review missing JD tokens: senior, fully, remote, candidates, only, ichi, large, models, llms, construction
  - Review missing JD phrases: senior software engineer - full stack react rails | fully remote us based candidates only | what you need for success | - 8+ years of professional engineering experience | - ruby on rails and react expertise building production-grade applications

## Notes
- Hybrid score currently combines lexical token coverage, phrase coverage, cosine similarity over bag-of-words frequencies, and ATS-section signal.
- Dense embedding mode is a planned extension; local Ollama was unavailable during this implementation pass.
- Use parser ensemble outputs alongside this report; do not over-trust a single score.
