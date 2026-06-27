import { z } from "zod";

export const sourceKindSchema = z.enum(["rss", "web", "api", "manual", "social", "ais", "official"]);
export const likelihoodBandSchema = z.enum(["very_low", "low", "moderate", "high", "very_high"]);
export const uncertaintyCategorySchema = z.enum(["measurement", "model", "temporal", "coverage", "other"]);
export const impactBandSchema = z.enum(["low", "moderate", "high"]);
export const radarStatusSchema = z.enum(["draft", "active", "paused", "archived"]);
export const moduleStatusSchema = z.enum(["candidate", "validated", "active", "superseded"]);
export const snapshotKindSchema = z.enum(["live", "daily"]);

export const signalDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  min: z.number().int().default(0),
  max: z.number().int().default(4),
  scale_labels: z.array(z.string().min(1)).min(2),
});

export const branchDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
});

export const sourceDefinitionSchema = z.object({
  id: z.string().min(1),
  radar_id: z.string().min(1),
  kind: sourceKindSchema,
  name: z.string().min(1),
  uri: z.string().min(1),
  adapter_config: z.record(z.unknown()).default({}),
  trust_profile: z.object({
    default_confidence: z.number().min(0).max(1),
    quality: z.enum(["primary", "secondary", "tertiary", "unreliable"]),
  }),
  freshness_policy: z.object({
    expected_interval_minutes: z.number().int().positive().optional(),
    stale_after_minutes: z.number().int().positive().optional(),
  }).default({}),
  status: z.enum(["active", "disabled", "staging"]).default("active"),
});

export const radarModuleVersionSchema = z.object({
  id: z.string().min(1),
  radar_id: z.string().min(1),
  version: z.number().int().positive(),
  signal_definitions: z.array(signalDefinitionSchema).min(1),
  branch_definitions: z.array(branchDefinitionSchema).default([]),
  source_adapter_refs: z.array(z.string()).default([]),
  model_weight_table: z.record(z.number().min(0).max(1)).default({}),
  reducer_config: z.object({
    signal_quantile_low: z.number().min(0).max(1).default(0.25),
    signal_quantile_high: z.number().min(0).max(1).default(0.75),
    disagreement_divisor: z.number().positive().default(2),
  }).default({}),
  validation_rules: z.record(z.unknown()).default({}),
  status: moduleStatusSchema,
  created_by: z.string().min(1),
  created_at: z.string().datetime(),
});

export const renderProfileSchema = z.object({
  id: z.string().min(1),
  radar_id: z.string().min(1),
  theme: z.string().min(1),
  motion_profile: z.enum(["calm", "active", "urgent"]).default("active"),
  palette: z.object({
    background: z.string().min(1),
    face: z.string().min(1),
    hand: z.string().min(1),
    uncertainty: z.string().min(1),
    disagreement: z.string().min(1),
  }),
  layout: z.object({
    show_model_markers: z.boolean().default(true),
    show_uncertainty_arc: z.boolean().default(true),
    show_disagreement_halo: z.boolean().default(true),
  }).default({}),
});

export const radarSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  status: radarStatusSchema,
  template_id: z.string().optional(),
  active_module_version_id: z.string().optional(),
  active_render_profile_id: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const sourceCitationSchema = z.object({
  type: z.enum(["official", "news", "social", "analyst", "ais", "other"]),
  name: z.string().min(1),
  url: z.string().url().optional(),
  confidence: z.number().min(0).max(1),
  retrieved_at: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const signalScoreSchema = z.object({
  value: z.number().int().min(0).max(4),
  range: z.tuple([z.number().int().min(0).max(4), z.number().int().min(0).max(4)]),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  supporting_sources: z.array(z.string()).default([]),
});

export const branchAssessmentSchema = z.object({
  branch: z.string().min(1),
  likelihood_band: likelihoodBandSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  key_triggers: z.array(z.string()).default([]),
  disconfirming_signals: z.array(z.string()).default([]),
});

export const uncertaintyStatementSchema = z.object({
  category: uncertaintyCategorySchema,
  description: z.string().min(1),
  impact: impactBandSchema,
  mitigation: z.string().optional(),
});

export const radarAssessmentPacketSchema = z.object({
  thread_id: z.string().min(1),
  radar_id: z.string().min(1),
  module_version_id: z.string().min(1),
  timestamp_utc: z.string().datetime(),
  model_id: z.string().min(1),
  model_version: z.string().optional(),
  sources: z.array(sourceCitationSchema).default([]),
  signal_scores: z.record(signalScoreSchema),
  branch_assessment: z.array(branchAssessmentSchema).default([]),
  uncertainties: z.array(uncertaintyStatementSchema).default([]),
  calibration_notes: z.string().optional(),
});

export const reducedSignalSchema = z.object({
  median: z.number(),
  range: z.tuple([z.number(), z.number()]),
  agreement: z.number().min(0).max(1),
  sample_size: z.number().int().nonnegative(),
  weighted_values: z.array(z.object({
    value: z.number(),
    weight: z.number(),
    model_id: z.string(),
  })),
});

export const reducedBranchSchema = z.object({
  name: z.string().min(1),
  support: likelihoodBandSchema,
  agreement: z.number().min(0).max(1),
  sample_size: z.number().int().nonnegative(),
  triggers: z.array(z.string()),
});

export const reducedSnapshotSchema = z.object({
  id: z.string().min(1),
  radar_id: z.string().min(1),
  module_version_id: z.string().min(1),
  snapshot_kind: snapshotKindSchema,
  as_of_utc: z.string().datetime(),
  signals: z.record(reducedSignalSchema),
  branches: z.array(reducedBranchSchema),
  model_count: z.number().int().nonnegative(),
  disagreement_index: z.number().min(0).max(1),
  quality_score: z.number().min(0),
  render_state: z.record(z.unknown()).default({}),
});

export type Radar = z.infer<typeof radarSchema>;
export type RadarModuleVersion = z.infer<typeof radarModuleVersionSchema>;
export type SourceDefinition = z.infer<typeof sourceDefinitionSchema>;
export type RenderProfile = z.infer<typeof renderProfileSchema>;
export type RadarAssessmentPacket = z.infer<typeof radarAssessmentPacketSchema>;
export type ReducedSnapshot = z.infer<typeof reducedSnapshotSchema>;
export type SignalDefinition = z.infer<typeof signalDefinitionSchema>;
export type BranchDefinition = z.infer<typeof branchDefinitionSchema>;
export type SourceCitation = z.infer<typeof sourceCitationSchema>;
