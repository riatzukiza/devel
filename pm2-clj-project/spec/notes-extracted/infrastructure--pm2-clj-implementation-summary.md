---
title: "PM2-CLJ DSL Implementation Summary"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-implementation-summary.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# PM2-CLJ DSL Implementation Summary

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-implementation-summary.md`
- Category: `infrastructure`

## Draft Requirements
- Added `exports-key` constant: `(def exports ::exports)`
- Provides utility functions:
- `internal-key?` - Check if a keyword is an internal DSL key
- `sentinel?` - Check if value is the remove sentinel
- `remove-internal-keys` - Remove all internal keys from a map
- `has-internal-keys?` - Check if a map contains any internal keys
- `::remove` - Sentinel for key removal
- `::type` - Type marker for prototype objects
- `::kind` - Kind marker for prototype variants (:app, :profile, :mixin, :stack)
- `::id` - ID for tracking prototypes
- `::base` - Base prototype reference
- `::patch` - Patch operations

## Summary Snippets
- This document summarizes the implementation of the pm2-clj DSL (clobber) based on the infrastructure notes in `docs/notes/infrastructure/`.
- **Status:** ✅ Complete

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
