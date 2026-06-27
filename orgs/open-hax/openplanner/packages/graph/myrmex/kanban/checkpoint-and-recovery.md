---
uuid: "orgs-open-hax-openplanner-packages-graph-myrmex-kanban-orgs-open-hax-openplanner-packages-graph-myrmex-specs-checkpoint-and-recovery-md"
title: "Checkpoint and Recovery Spec"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:39.561Z"
source: "orgs/open-hax/openplanner/packages/graph/myrmex/specs/checkpoint-and-recovery.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/graph/myrmex/specs/checkpoint-and-recovery.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/graph/myrmex/kanban/checkpoint-and-recovery.md`

# Checkpoint and Recovery Spec

## Purpose

Name the current gap plainly and specify what a real checkpoint layer should do.

## Current reality

### What exists
- `Myrmex` schedules periodic checkpoint events
- `CheckpointManager.save()` exists
- checkpoint events are emitted to listeners

### What does not yet exist
- durable checkpoint persistence
- frontier restoration
- replay of prior graph state
- recovery from partial failure

The current implementation is deliberately skeletal:
- `CheckpointManager.save()` is a no-op
- `restoreCheckpoint()` is stubbed

## Why this is still valuable

The repo already has the orchestration seam in the right place.
That means the missing work is now explicit and documentable rather than being hidden inside a monolith.

## Desired checkpoint payload

A serious checkpoint should eventually preserve:
- frontier URLs and pheromone state
- ant positions (if meaningful)
- in-flight / recent visit metadata
- node/edge counts
- last successful downstream ingestion watermark
- configuration snapshot

## Desired restore behavior

On startup:
1. load most recent valid checkpoint
2. reconstruct frontier state
3. reseed engine if checkpoint missing or corrupt
4. emit explicit recovery event
5. continue crawl with bounded duplicate risk

## Suggested event shapes

- `myrmex.checkpoint.saved`
- `myrmex.checkpoint.failed`
- `myrmex.recovery.started`
- `myrmex.recovery.completed`
- `myrmex.recovery.fallback_seeded`

## Design warning

If checkpointing is added later without explicit versioning, the orchestrator will become deceptively stateful and hard to recover. Versioned checkpoints are mandatory.
