export type RadarStatus = 'draft' | 'active' | 'paused' | 'archived';
export type ProposalStatus = 'draft' | 'proposed' | 'validated' | 'rejected' | 'activated';
export type ModuleKind =
  | 'ontology'
  | 'source_adapter'
  | 'prompt'
  | 'reducer_config'
  | 'render_config'
  | 'branch_catalog';
export type SnapshotKind = 'live' | 'daily';

export interface RadarRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  owner_node: string;
  status: RadarStatus;
  template_key: string | null;
  active_module_version_id: string | null;
  active_render_profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RadarModuleVersionRow {
  id: string;
  radar_id: string;
  version: number;
  parent_version_id: string | null;
  module_kind: ModuleKind;
  module_key: string;
  title: string;
  payload: Record<string, unknown>;
  checksum: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  validated_at: string | null;
}

export interface SourceDefinitionRow {
  id: string;
  radar_id: string;
  source_key: string;
  source_type: string;
  title: string;
  config: Record<string, unknown>;
  trust_weight: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReducedSnapshotRow {
  id: string;
  radar_id: string;
  snapshot_kind: SnapshotKind;
  snapshot_date: string | null;
  live_revision: number | null;
  reducer_version: string;
  packet_count: number;
  disagreement_score: number;
  snapshot: Record<string, unknown>;
  created_at: string;
}

export interface ChangeProposalRow {
  id: string;
  radar_id: string;
  target_module_kind: ModuleKind;
  proposal_status: ProposalStatus;
  title: string;
  rationale: string;
  proposed_payload: Record<string, unknown>;
  validation_report: Record<string, unknown> | null;
  proposed_by: string;
  created_at: string;
  updated_at: string;
}
