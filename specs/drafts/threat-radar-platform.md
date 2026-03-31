# Threat Radar Platform Draft

## Goal

Build a general-purpose threat radar platform where agents can create, evolve, and maintain many radar modules over time, each producing deterministic daily clocks and live animated clock states for a wall-of-clocks website.

## Core Shift

The platform should move from:

`single model -> single clock`

to:

`many agents/models -> structured packets -> deterministic reduction -> daily and live clock snapshots`

## System Components

### 1. Radar Control Plane (`threat-radar-mcp`)

An MCP service that lets agents:

- create radars
- fork radars from templates
- add or disable sources
- define or evolve radar modules
- submit assessment packets
- propose module changes
- validate candidate versions
- activate approved versions
- trigger reductions and daily snapshot sealing

### 2. Shared Core (`@workspace/radar-core`)

Reusable package defining:

- radar schema
- module schema
- source adapter schema
- structured assessment packet schema
- reducer inputs/outputs
- daily snapshot schema
- live snapshot schema
- animation/render profile schema
- audit/change proposal schema

### 3. Wall App (`threat-radar-web`)

Render-hosted website that reads active radar snapshots from Postgres and renders:

- a dense wall of animated clocks
- confidence and disagreement overlays
- activity indicators
- click-through audit details
- radar lineage and version metadata

### 4. Database

Postgres stores canonical state for:

- radars
- radar module versions
- source definitions
- source observations
- assessment packets
- reduced snapshots
- daily sealed snapshots
- render profiles
- change proposals
- agent actions
- audit events

## Main Entities

### Radar

A radar is a named analytical instrument.

Fields:

- `id`
- `slug`
- `name`
- `category`
- `status` (`draft`, `active`, `paused`, `archived`)
- `template_id`
- `active_module_version_id`
- `active_render_profile_id`
- `created_at`
- `updated_at`

### Radar Module Version

Defines ontology and deterministic rules for a radar.

Fields:

- `id`
- `radar_id`
- `version`
- `signal_definitions[]`
- `branch_definitions[]`
- `source_adapter_refs[]`
- `model_weight_table`
- `reducer_config`
- `validation_rules`
- `status` (`candidate`, `validated`, `active`, `superseded`)
- `created_by`
- `created_at`

### Source Definition

Represents an ingestable source.

Fields:

- `id`
- `radar_id`
- `kind` (`rss`, `web`, `api`, `manual`, `social`, `ais`, `official`)
- `name`
- `uri`
- `adapter_config`
- `trust_profile`
- `freshness_policy`
- `status`

### Assessment Packet

Produced by a model or agent against a radar module version.

Fields:

- `thread_id`
- `radar_id`
- `module_version_id`
- `timestamp_utc`
- `model_id`
- `sources[]`
- `signal_scores`
- `branch_assessment[]`
- `uncertainties[]`

### Reduced Snapshot

Deterministic aggregation result.

Fields:

- `id`
- `radar_id`
- `module_version_id`
- `snapshot_kind` (`live`, `daily`)
- `as_of_utc`
- `signals`
- `branches`
- `agreement`
- `quality_score`
- `render_state`

## Agent Tools

Initial MCP tool surface:

- `radar_create`
- `radar_fork_template`
- `radar_list`
- `radar_get`
- `radar_add_source`
- `radar_update_source`
- `radar_disable_source`
- `radar_submit_packet`
- `radar_reduce_live`
- `radar_seal_daily_snapshot`
- `radar_list_snapshots`
- `radar_propose_module_change`
- `radar_validate_module_candidate`
- `radar_activate_module_version`
- `radar_get_audit_log`

## Safety Boundaries

Agents should not directly mutate arbitrary application code in production.

They may evolve only:

- versioned module documents
- source adapter configs from approved adapter families
- reducer configuration values within validated bounds
- render profiles within validated schemas

Activation rules:

- schema validation passes
- dry-run reduction passes
- candidate snapshot preview renders
- audit log entry is recorded
- prior active version remains recoverable

## Daily Clock Model

Each radar should maintain two state tracks:

### Live Snapshot

- mutable during the day
- updates as packets and sources arrive
- may animate continuously

### Daily Snapshot

- sealed once per UTC day
- immutable historical baseline
- used for comparisons, diffs, and trend animation

## Rendering Model

Each clock tile should support:

- main hand for central estimate
- uncertainty arc for bounded range
- disagreement halo or jitter ring
- source support intensity
- animated transitions between daily snapshots
- small model markers for spread

## Website

`threat-radar-web` should render a wall of active clocks from the database.

Views:

- wall view
- radar detail view
- audit view
- evolution/version view

The wall should prioritize:

- glanceability
- motion clarity
- density without becoming generic dashboard sludge

## Initial Templates

Start with a few templates:

- `maritime_chokepoint`
- `energy_supply_shock`
- `regional_conflict_escalation`
- `sanctions_and_trade_disruption`

`hormuz` becomes the first instantiated radar built from `maritime_chokepoint`.

## Definition of Done for Phase 1

- `@workspace/radar-core` exists and exports schemas and reducer helpers
- `threat-radar-mcp` exists with CRUD, packet, reduction, and module-evolution tools
- `threat-radar-web` exists and renders clocks from DB
- Postgres schema supports versioned radars and snapshots
- one live radar (`hormuz`) works end to end
- daily snapshot sealing works
- wall view shows multiple clocks from the same platform
