import type { ThreadAssessmentPacket, SignalScore, BranchAssessment } from "./packet.js";

export type ModelSubmission = {
  packet: ThreadAssessmentPacket;
  weight: number;
  receivedAt: string;
};

export type AggregatedSignal = {
  median: number;
  range: [number, number];
  agreement: number;
  sampleSize: number;
  weightedValues: Array<{
    value: number;
    weight: number;
    modelId: string;
  }>;
};

export type AggregatedBranch = {
  name: string;
  support: "very_low" | "low" | "moderate" | "high" | "very_high";
  agreement: number;
  sampleSize: number;
  triggers: string[];
};

export type ReducedThreadState = {
  threadId: string;
  asOfUtc: string;
  signals: Record<string, AggregatedSignal>;
  branches: AggregatedBranch[];
  modelCount: number;
  disagreementIndex: number;
  qualityScore: number;
};

function weightedMedian(values: Array<{ value: number; weight: number }>): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
  let accumulated = 0;
  for (const entry of sorted) {
    accumulated += entry.weight;
    if (accumulated >= totalWeight / 2) {
      return entry.value;
    }
  }
  return sorted[sorted.length - 1]?.value ?? 0;
}

function weightedPercentile(
  values: Array<{ value: number; weight: number }>,
  percentile: number,
): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
  const targetWeight = totalWeight * percentile;
  let accumulated = 0;
  for (const entry of sorted) {
    accumulated += entry.weight;
    if (accumulated >= targetWeight) {
      return entry.value;
    }
  }
  return sorted[sorted.length - 1]?.value ?? 0;
}

function computeDisagreement(
  values: Array<{ value: number; weight: number }>,
  median: number,
): number {
  if (values.length <= 1) return 0;
  const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
  const weightedVariance = values.reduce((sum, v) => {
    const diff = v.value - median;
    return sum + v.weight * diff * diff;
  }, 0) / totalWeight;
  const stdDev = Math.sqrt(weightedVariance);
  const normalizedDisagreement = Math.min(1, stdDev / 2);
  return Math.round(normalizedDisagreement * 100) / 100;
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

export function reducePackets(
  submissions: ModelSubmission[],
  signalNames: string[],
  branchNames: string[],
): ReducedThreadState {
  if (submissions.length === 0) {
    throw new Error("Cannot reduce empty submissions");
  }

  const threadId = submissions[0]?.packet.thread_id ?? "unknown";
  const asOfUtc = new Date().toISOString();

  const signals: Record<string, AggregatedSignal> = {};

  for (const signalName of signalNames) {
    const values: Array<{ value: number; weight: number; modelId: string }> = [];
    const ranges: Array<[number, number]> = [];

    for (const submission of submissions) {
      const score = submission.packet.signal_scores[signalName];
      if (score) {
        values.push({
          value: score.value,
          weight: submission.weight,
          modelId: submission.packet.model_id,
        });
        ranges.push(score.range);
      }
    }

    if (values.length === 0) continue;

    const median = weightedMedian(values);
    const lowerBound = weightedPercentile(values, 0.25);
    const upperBound = weightedPercentile(values, 0.75);
    const disagreement = computeDisagreement(values, median);

    signals[signalName] = {
      median: Math.round(median * 100) / 100,
      range: [Math.round(lowerBound), Math.round(upperBound)],
      agreement: Math.round((1 - disagreement) * 100) / 100,
      sampleSize: values.length,
      weightedValues: values,
    };
  }

  const branches: AggregatedBranch[] = [];

  for (const branchName of branchNames) {
    const bandWeights: Record<string, number> = {};
    const triggers: Set<string> = new Set();

    for (const submission of submissions) {
      const branch = submission.packet.branch_assessment.find(
        (b) => b.branch === branchName,
      );
      if (branch) {
        const band = branch.likelihood_band;
        bandWeights[band] = (bandWeights[band] ?? 0) + submission.weight;
        for (const trigger of branch.key_triggers) {
          triggers.add(trigger);
        }
      }
    }

    const entries = Object.entries(bandWeights);
    if (entries.length === 0) continue;

    const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
    let bestBand = "moderate";
    let bestWeight = 0;

    for (const [band, weight] of entries) {
      if (weight > bestWeight) {
        bestBand = band;
        bestWeight = weight;
      }
    }

    const supportNumeric = bandToNumeric(bestBand);
    const disagreement = computeDisagreement(
      entries.map(([band, weight]) => ({
        value: bandToNumeric(band),
        weight,
      })),
      supportNumeric,
    );

    branches.push({
      name: branchName,
      support: numericToBand(supportNumeric),
      agreement: Math.round((1 - disagreement) * 100) / 100,
      sampleSize: entries.length,
      triggers: Array.from(triggers),
    });
  }

  const modelCount = submissions.length;

  const overallDisagreement =
    Object.values(signals).reduce((sum, s) => sum + (1 - s.agreement), 0) /
    (Object.keys(signals).length || 1);

  const qualityScore = Math.round(
    ((1 - overallDisagreement) *
      submissions.reduce((sum, s) => sum + s.weight, 0) *
      submissions.filter((s) => s.packet.sources.length > 0).length) /
      submissions.length,
  );

  return {
    threadId,
    asOfUtc,
    signals,
    branches,
    modelCount,
    disagreementIndex: Math.round(overallDisagreement * 100) / 100,
    qualityScore,
  };
}