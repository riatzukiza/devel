---
title: "Aaron Beavers — Resume"
---

# Aaron Beavers
Python Automation / RPA Engineer (Browser Automation + OCR Integration)

West Des Moines, IA 50265 · 515-388-0539 · foamy125@gmail.com  
GitHub: https://github.com/riatzukiza · Upwork: https://www.upwork.com/freelancers/~01d661364c3f86022f

## Summary
Automation-focused engineer building resilient, production-grade workflows: browser automation, background processing, retries/timeouts, secure file handling, and repeatable pipelines. Integrated a proprietary OCR system into a screenshot product (bounding boxes + click-to-extract text). Extensive recent experience with Playwright/Cypress-style E2E workflows and CI-driven regression prevention. Comfortable with Selenium-era patterns; prefer modern tooling for reliability and debuggability.

## Skills
- **Python**: Django, DRF, Celery, pytest, requests (Retry/backoff), file processing
- **Browser automation**: Playwright (strong), Cypress (federal/DoD context), Puppeteer (personal), Selenium (legacy)
- **OCR / vision**: OCR feature integration (proprietary engine), bounding boxes, text extraction UX
- **Reliability**: timeouts, retries/backoff, queue-based async processing, idempotent job design, structured logging/audit trails
- **DevOps / CI**: Docker Compose, CircleCI, cloud.gov / Cloud Foundry workflows

## Experience

### Raft Technologies — Full Stack Engineer (Python/Django + React)  
*Jul 2020 – Sep 2023*
- Built and maintained **Celery-based automation** for uploaded-file processing: parse → validate → summarize → generate error reports → notify stakeholders; designed for safe failure modes and operational visibility.
- Implemented robust **file type + encoding detection** (extension fallback, charset detection, magic-based sniffing) to route inputs to correct decoders and reduce manual support burden.
- Developed **case-level consistency validation** with caching and explicit guardrails to prevent pathological inputs from causing OOM; produced structured validation errors for end users and analysts.
- Integrated **anti-malware scanning automation** via ClamAV REST using a retrying HTTP session (Retry/backoff + timeouts) and persisted scan outcomes for auditability.
- Supported **end-to-end browser automation** practice: Cypress E2E (Gherkin feature files + step definitions) and CI execution against deployed environments.

### CloudApp — Full Stack Engineer (Ruby on Rails)  
*Sep 2018 – Feb 2019*
- Integrated a **proprietary OCR system** (Java-based service maintained by an internal team) into a screenshot/screengrab platform.
- Implemented UI workflows to **render OCR bounding boxes** over screenshots and return **recognized text on click**, enabling interactive “text in screenshot” functionality.
- Applied **Selenium-era browser automation** patterns to validate user flows and reduce manual regression effort.

### Additional Experience
1brand (Full Stack Engineer, 2019–2020) · Birdseed (Full Stack Engineer, 2019) · Freelance Software Engineer (2014–Present)

## Education
Valley Springs High School — Diploma (2012)

## Work Authorization
Authorized to work in the U.S. for any employer · Willing to relocate

```text
fnord:v1 proof=gh(open-hax/proxx octave-commons/shibboleth shuv1337/battlebussy) caps=llm-gw(r->chat m->chat ollama oauth-pkce sse-synth reasoning-content rot429 chroma)
eval(sbert hdbscan parquet sha256) ops(docker compose oci-tf ghcr-multiarch jetstream)
```
