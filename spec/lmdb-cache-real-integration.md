---
uuid: 163af08b-520c-4f77-8e88-15ecce4ed9e3
title: "LMDB Cache Real Integration"
slug: lmdb-cache-real-integration
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T06:36:00.408448Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# LMDB Cache Real Integration

## Context
- packages/lmdb-cache/src/cache.ts:1-205 currently implements a Map-based cache while advertising LMDB support.
- Tests in packages/lmdb-cache/src/tests/cache.test.ts:1-209 exercise TTL, namespaces, batching, and iteration semantics assuming persistence on disk.
- Downstream packages such as packages/ollama-queue/src/persistent-store.ts:4-212 depend on openLmdbCache for reliable persistence.

## Existing Issues / PRs
- No tracked issues or PRs reference this work (searched for lmdb-cache and Database
