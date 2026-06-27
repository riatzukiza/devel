# @open-hax/signal-watchlists

Dependency-free helpers for loading and normalizing watchlist seed payloads.

This package is designed to be consumable from both ESM and CommonJS so older
Fork Tales runtime code can import it without a larger module-system migration.

Current exports cover:

- HTTP(S) URL normalization
- `world_watchlist.json`-style payload parsing
- sync file loading for runtime bootstrap paths
- deterministic merging of requested seeds and watchlist seeds
