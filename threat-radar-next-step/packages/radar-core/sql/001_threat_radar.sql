-- Threat Radar platform schema
-- PostgreSQL 15+

create extension if not exists pgcrypto;

create type radar_status as enum ('draft', 'active', 'paused', 'archived');
create type proposal_status as enum ('draft', 'proposed', 'validated', 'rejected', 'activated');
create type module_kind as enum (
  'ontology',
  'source_adapter',
  'prompt',
  'reducer_config',
  'render_config',
  'branch_catalog'
);
create type snapshot_kind as enum ('live', 'daily');

create table radar (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  owner_node text not null default 'local',
  status radar_status not null default 'draft',
  template_key text,
  active_module_version_id uuid,
  active_render_profile_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table radar_module_version (
  id uuid primary key default gen_random_uuid(),
  radar_id uuid not null references radar(id) on delete cascade,
  version integer not null,
  parent_version_id uuid references radar_module_version(id) on delete set null,
  module_kind module_kind not null,
  module_key text not null,
  title text not null,
  payload jsonb not null,
  checksum text not null,
  is_active boolean not null default false,
  created_by text not null default 'system',
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  unique (radar_id, module_kind, version),
  unique (radar_id, module_kind, module_key, checksum)
);

create table render_profile (
  id uuid primary key default gen_random_uuid(),
  radar_id uuid not null references radar(id) on delete cascade,
  profile_key text not null,
  title text not null,
  payload jsonb not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (radar_id, profile_key)
);

create table source_definition (
  id uuid primary key default gen_random_uuid(),
  radar_id uuid not null references radar(id) on delete cascade,
  source_key text not null,
  source_type text not null,
  title text not null,
  config jsonb not null,
  trust_weight numeric(6,3) not null default 1.0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (radar_id, source_key)
);

create table assessment_packet (
  id uuid primary key default gen_random_uuid(),
  radar_id uuid not null references radar(id) on delete cascade,
  module_version_id uuid references radar_module_version(id) on delete set null,
  model_id text not null,
  packet_timestamp timestamptz not null,
  packet jsonb not null,
  evidence_hash text not null,
  support_weight numeric(8,4) not null default 1.0,
  created_at timestamptz not null default now()
);

create index assessment_packet_radar_created_idx on assessment_packet (radar_id, created_at desc);
create index assessment_packet_radar_packet_ts_idx on assessment_packet (radar_id, packet_timestamp desc);
create index assessment_packet_packet_gin_idx on assessment_packet using gin (packet jsonb_path_ops);

create table reduced_snapshot (
  id uuid primary key default gen_random_uuid(),
  radar_id uuid not null references radar(id) on delete cascade,
  snapshot_kind snapshot_kind not null,
  snapshot_date date,
  live_revision integer,
  reducer_version text not null,
  packet_count integer not null default 0,
  disagreement_score numeric(8,4) not null default 0,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique nulls not distinct (radar_id, snapshot_kind, snapshot_date),
  unique nulls not distinct (radar_id, snapshot_kind, live_revision)
);

create index reduced_snapshot_radar_kind_created_idx on reduced_snapshot (radar_id, snapshot_kind, created_at desc);

create table change_proposal (
  id uuid primary key default gen_random_uuid(),
  radar_id uuid not null references radar(id) on delete cascade,
  target_module_kind module_kind not null,
  proposal_status proposal_status not null default 'draft',
  title text not null,
  rationale text not null default '',
  proposed_payload jsonb not null,
  validation_report jsonb,
  proposed_by text not null default 'agent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_event (
  id uuid primary key default gen_random_uuid(),
  radar_id uuid references radar(id) on delete cascade,
  event_type text not null,
  actor_id text not null default 'system',
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index audit_event_radar_created_idx on audit_event (radar_id, created_at desc);

alter table radar
  add constraint radar_active_module_version_fk
  foreign key (active_module_version_id)
  references radar_module_version(id)
  on delete set null;

alter table radar
  add constraint radar_active_render_profile_fk
  foreign key (active_render_profile_id)
  references render_profile(id)
  on delete set null;

create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger radar_touch_updated_at
before update on radar
for each row execute function touch_updated_at();

create trigger source_definition_touch_updated_at
before update on source_definition
for each row execute function touch_updated_at();

create trigger change_proposal_touch_updated_at
before update on change_proposal
for each row execute function touch_updated_at();
