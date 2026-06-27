# @open-hax/signal-contracts

Stable JSON-friendly contracts for extracted signal, correlation, and radar records.

This package is intentionally dependency-free so other repositories can consume it
through a local file dependency during extraction work.

Current exports cover:

- record and schema-version constants
- normalization helpers for common record shapes
- lightweight shape guards for watchlist, signal, correlation, and radar payloads

The record fields stay snake_case so JavaScript and Python consumers can share the
same serialized shapes.
