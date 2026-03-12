import type { RadarAssessmentPacket, RadarModuleVersion, ReducedSnapshot } from "./schema.js";

export type ModelSubmission = {
  packet: RadarAssessmentPacket;
  weight: number;
  receivedAt: string;
};

function weightedMedian(values: Array<{ value: number; weight: number }>): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
  let accumulated = 0;
  for (const entry of sorted) {
    accumulated += entry.weight;
    if (accumulated >= totalWeight / 2) return entry.value;
  }
  return sorted[sorted.length - 1]?.value ?? 0;
}

function weightedPercentile(values: Array<{ value: number; weight: number }>, percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
  const targetWeight = totalWeight * percentile;
  let accumulated = 0;
  for (const entry of sorted) {
    accumulated += entry.weight;
    if (accumulated >= targetWeight) return entry.value;
  }
  return sorted[sorted.length - 1]?.value ?? 0;
}

function computeDisagreement(values: Array<{ value: number; weight: number }>, anchor: number, divisor: number): number {
  if (values.length <= 1) return 0;
  const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
  const weightedVariance = values.reduce((sum, v) => {
    const diff = v.value - anchor;
    return sum + v.weight * diff * diff;
  }, 0) / totalWeight;
  return Math.round(Math.min(1, Math.sqrt(weightedVariance) / divisor) * 100) / 100;
}

function bandToNumeric(band: string): number {
  const map: Record<string, number> = {
    very_low: 0.1,
    low: 0.3,
    moderate: 0.5,
    high: 0.7,
    very_high: 0.9,
  };
  return map[band] ?? 0.5;
}

function numericToBand(value: number): "very_low" | "low" | "moderate" | "high" | "very_high" {
  if (value < 0.2) return "very_low";
  if (value < 0.4) return "low";
  if (value < 0.6) return "moderate";
  if (value < 0.8) return "high";
  return "very_high";
}

export function reduceRadarPackets(args: {
  radarId: string;
  moduleVersion: RadarModuleVersion;
  submissions: ModelSubmission[];
  snapshotKind: "live" | "daily";
  snapshotId: string;
}): ReducedSnapshot {
  const { radarId, moduleVersion, submissions, snapshotKind, snapshotId } = args;
  if (submissions.length === 0) {
    throw new Error("Cannot reduce empty submissions");
  }

  const signals = Object.fromEntries(
    moduleVersion.signal_definitions.flatMap((signal) => {
      const values = submissions.flatMap((submission) => {
        const score = submission.packet.signal_scores[signal.id];
        if (!score) return [];
        return [{
          value: score.value,
          weight: submission.weight,
          model_id: submission.packet.model_id,
        }];
      });

      if (values.length === 0) return [];
      const median = weightedMedian(values);
      const disagreement = computeDisagreement(values, median, moduleVersion.reducer_config.disagreement_divisor);
      const range: [number, number] = [
        Math.round(weightedPercentile(values, moduleVersion.reducer_config.signal_quantile_low)),
        Math.round(weightedPercentile(values, moduleVersion.reducer_config.signal_quantile_high)),
      ];
      return [[signal.id, {
        median: Math.round(median * 100) / 100,
        range,
        agreement: Math.round((1 - disagreement) * 100) / 100,
        sample_size: values.length,
        weighted_values: values,
      }]];
    }),
  );

  const branches = moduleVersion.branch_definitions.flatMap((branch) => {
    const entries = new Map<string, number>();
    const triggers = new Set<string>();
    for (const submission of submissions) {
      const assessment = submission.packet.branch_assessment.find((candidate) => candidate.branch === branch.id);
      if (!assessment) continue;
      entries.set(assessment.likelihood_band, (entries.get(assessment.likelihood_band) ?? 0) + submission.weight);
      for (const trigger of assessment.key_triggers) {
        triggers.add(trigger);
      }
    }
    if (entries.size === 0) return [];
    const weightedBands = [...entries.entries()].map(([band, weight]) => ({ value: bandToNumeric(band), weight }));
    const supportValue = weightedMedian(weightedBands);
    const disagreement = computeDisagreement(weightedBands, supportValue, 0.5);
    return [{
      name: branch.id,
      support: numericToBand(supportValue),
      agreement: Math.round((1 - disagreement) * 100) / 100,
      sample_size: entries.size,
      triggers: [...triggers],
    }];
  });

  const signalValues = Object.values(signals);
  const disagreementIndex = Math.round(((signalValues.reduce((sum, signal) => sum + (1 - signal.agreement), 0) / (signalValues.length || 1)) * 100)) / 100;
  const qualityScore = Math.round(
    ((1 - disagreementIndex) * submissions.reduce((sum, submission) => sum + submission.weight, 0) * submissions.filter((submission) => submission.packet.sources.length > 0).length) /
      submissions.length,
  );

  return {
    id: snapshotId,
    radar_id: radarId,
    module_version_id: moduleVersion.id,
    snapshot_kind: snapshotKind,
    as_of_utc: new Date().toISOString(),
    signals,
    branches,
    model_count: submissions.length,
    disagreement_index: disagreementIndex,
    quality_score: qualityScore,
    render_state: {},
  };
}
