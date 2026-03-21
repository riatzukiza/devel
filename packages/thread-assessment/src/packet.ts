import { z } from "zod";

export const sourceCitationSchema = z.object({
  type: z.enum(["official", "news", "social", "analyst", "ais", "other"]),
  name: z.string().min(1),
  url: z.string().url().optional(),
  confidence: z.number().min(0).max(1),
  retrieved_at: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type SourceCitation = z.infer<typeof sourceCitationSchema>;

export const signalScoreSchema = z.object({
  value: z.number().int().min(0).max(4),
  range: z.tuple([z.number().int().min(0).max(4), z.number().int().min(0).max(4)]),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  supporting_sources: z.array(z.string()).default([]),
});

export type SignalScore = z.infer<typeof signalScoreSchema>;

export const branchAssessmentSchema = z.object({
  branch: z.string().min(1),
  likelihood_band: z.enum(["very_low", "low", "moderate", "high", "very_high"]),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  key_triggers: z.array(z.string()).default([]),
  disconfirming_signals: z.array(z.string()).default([]),
});

export type BranchAssessment = z.infer<typeof branchAssessmentSchema>;

export const uncertaintyStatementSchema = z.object({
  category: z.enum(["measurement", "model", "temporal", "coverage", "other"]),
  description: z.string().min(1),
  impact: z.enum(["low", "moderate", "high"]),
  mitigation: z.string().optional(),
});

export type UncertaintyStatement = z.infer<typeof uncertaintyStatementSchema>;

export const threadAssessmentPacketSchema = z.object({
  thread_id: z.string().min(1),
  timestamp_utc: z.string().datetime(),
  model_id: z.string().min(1),
  model_version: z.string().optional(),
  sources: z.array(sourceCitationSchema).default([]),
  signal_scores: z.record(signalScoreSchema),
  branch_assessment: z.array(branchAssessmentSchema).default([]),
  uncertainties: z.array(uncertaintyStatementSchema).default([]),
  calibration_notes: z.string().optional(),
});

export type ThreadAssessmentPacket = z.infer<typeof threadAssessmentPacketSchema>;

export const SIGNAL_SCALE = ["normal", "stressed", "degraded", "impaired", "broken"] as const;
export type SignalScaleValue = (typeof SIGNAL_SCALE)[number];

export function signalValueToLabel(value: number): SignalScaleValue {
  const index = Math.max(0, Math.min(4, Math.round(value)));
  return SIGNAL_SCALE[index];
}

export const LIKELIHOOD_BANDS = ["very_low", "low", "moderate", "high", "very_high"] as const;
export type LikelihoodBand = (typeof LIKELIHOOD_BANDS)[number];