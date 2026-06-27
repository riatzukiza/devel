# @open-hax/signal-source-utils

Reusable source-ingestion helpers extracted from Fork Tales.

This package keeps the stable source-facing logic outside the experiment runtime:

- URL normalization
- arXiv search and canonicalization helpers
- feed parsing and feed-entry extraction
- knowledge-source classification
- readable-text and summary normalization
- semantic-reference extraction for arXiv and Wikipedia pages
- LLM auth-header normalization

The package is dependency-free and exported for both CommonJS and ESM so
Fork Tales can consume it immediately.
