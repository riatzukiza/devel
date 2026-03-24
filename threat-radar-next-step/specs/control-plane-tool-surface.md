# Threat Radar MCP — Proposed tool surface

## Safe mutation rule

Agents may evolve:
- source definitions
- prompt modules
- ontology modules
- reducer configs
- render configs
- branch catalogs

Agents may **not** mutate arbitrary code in production repos.

## Core tools

### `radar_create`
Create a new radar from a template.

### `radar_fork`
Clone a radar into a new slug while preserving history linkage.

### `radar_add_source`
Attach a typed source adapter definition.

### `radar_submit_packet`
Submit a `RadarAssessmentPacket` from a model.

### `radar_reduce_live`
Run deterministic aggregation across recent packets and save a `live_snapshot`.

### `radar_seal_daily_snapshot`
Freeze the canonical end-of-day state.

### `radar_create_proposal`
Create a versioned module-change proposal.

### `radar_validate_proposal`
Run schema validation, dry-run reduction, and render preview.

### `radar_activate_proposal`
Promote a validated proposal into a new active module version.

### `radar_get_audit_log`
Expose the sequence of submissions, proposals, validations, activations, and snapshot events.

## Validation gates

A proposal can be activated only if:
- payload schema passes
- dry-run reduction succeeds
- preview render serializes cleanly
- packet ontology still resolves all required signals
- branch catalog stays within the allowed likelihood/support vocabulary

## Daily clock lifecycle

1. sources collect data
2. agents submit packets
3. reducer produces rolling `live_snapshot`
4. wall site animates from `live_snapshot`
5. end-of-day seal writes immutable `daily_snapshot`
6. next day continues from the same radar with new live revisions
