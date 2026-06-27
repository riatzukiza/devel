# Threat Radar — Postgres + Wall Next Slice

This bundle is the next platform step after the in-memory `threat-radar-mcp` and wall-of-clocks scaffold.

It assumes three layers:

1. `@workspace/radar-core` owns schemas and deterministic reduction contracts.
2. `threat-radar-mcp` owns the control plane, packet intake, validation, reduction, and daily snapshot sealing.
3. `threat-radar-web` owns the public wall view and radar detail pages.

## What this slice adds

- A Postgres schema for radars, module versions, sources, packets, snapshots, and change proposals.
- Repository interfaces and a concrete Postgres repository skeleton.
- A clean API contract for the wall app so the clocks can animate from `live_snapshot` while still preserving `daily_snapshot` history.
- A proposal / validate / activate workflow for agent-driven radar evolution.

## Core principle

Agents do **not** mutate production code.
They create and evolve **versioned modules and records** in the database.

That keeps the reducer deterministic and the wall site stable.

## Immediate integration targets

- Put the SQL schema into the new threat-radar control-plane repo.
- Wire `pg` into the MCP repo and replace in-memory state with `PostgresRadarRepository`.
- Point the wall app at `/api/radars` + `/api/radars/:slug` + `/api/snapshots/latest`.

## Safe rollout plan

1. Keep the current in-memory store as a fallback implementation.
2. Add `RADAR_STORAGE=memory|postgres`.
3. Start with writes to Postgres only for new radars.
4. Keep the live snapshot reducer deterministic and stateless.
5. Add a one-shot backfill path later if needed.
