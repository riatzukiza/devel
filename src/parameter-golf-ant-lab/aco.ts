import { createHash } from "node:crypto";
import type { CandidateRecipe, EvaluationRecord, LabProfile, LabState, SuggestionBatch } from "./types";

const hashText = (value: string): string => createHash("sha256").update(value).digest("hex");

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const average = (values: readonly number[]): number => {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const candidateKey = (choices: Readonly<Record<string, string>>): string =>
  JSON.stringify(Object.entries(choices).sort(([left], [right]) => left.localeCompare(right)));

const countValueFrequency = (state: LabState): Readonly<Record<string, Readonly<Record<string, number>>>> => {
  const counts: Record<string, Record<string, number>> = {};
  for (const candidate of state.candidates) {
    for (const [name, value] of Object.entries(candidate.choices)) {
      counts[name] ??= {};
      counts[name][value] = (counts[name][value] ?? 0) + 1;
    }
  }
  return counts;
};

const chooseWeightedValue = (
  values: readonly string[],
  pheromoneByValue: Readonly<Record<string, number>>,
  frequencies: Readonly<Record<string, number>>,
  rng: () => number
): { readonly value: string; readonly explorationScore: number; readonly pheromoneScore: number } => {
  const weights = values.map((value) => {
    const pheromone = pheromoneByValue[value] ?? 1;
    const frequency = frequencies[value] ?? 0;
    const exploration = 1 / (1 + frequency);
    return {
      value,
      pheromone,
      exploration,
      weight: pheromone * (0.45 + 0.55 * exploration)
    };
  });

  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = rng() * total;
  for (const entry of weights) {
    cursor -= entry.weight;
    if (cursor <= 0) {
      return {
        value: entry.value,
        explorationScore: entry.exploration,
        pheromoneScore: entry.pheromone
      };
    }
  }

  const fallback = weights[weights.length - 1];
  return {
    value: fallback.value,
    explorationScore: fallback.exploration,
    pheromoneScore: fallback.pheromone
  };
};

const buildShellEnv = (profile: LabProfile, choices: Readonly<Record<string, string>>, candidateId: string): string => {
  const envEntries = Object.entries(profile.baseEnv).map(([name, value]) => `${name}=${value}`);
  envEntries.push(`RUN_ID=${profile.profileId}-${candidateId.slice(0, 12)}`);
  for (const dimension of profile.dimensions) {
    const selected = choices[dimension.name];
    if (dimension.envVar && selected) {
      envEntries.push(`${dimension.envVar}=${selected}`);
    }
  }
  return envEntries.join(" \\\n");
};

const buildCandidate = (
  profile: LabProfile,
  state: LabState,
  step: number,
  index: number,
  createdAt: string
): CandidateRecipe => {
  const rng = mulberry32(profile.seed + step * 1009 + index * 9173);
  const seen = new Set(state.candidates.map((candidate) => candidateKey(candidate.choices)));
  const valueFrequencies = countValueFrequency(state);

  for (let attempt = 0; attempt < 256; attempt += 1) {
    const choices: Record<string, string> = {};
    const noveltyScores: number[] = [];
    const pheromoneScores: number[] = [];

    for (const dimension of profile.dimensions) {
      const selected = chooseWeightedValue(
        dimension.values,
        state.pheromones[dimension.name] ?? {},
        valueFrequencies[dimension.name] ?? {},
        rng
      );
      choices[dimension.name] = selected.value;
      noveltyScores.push(selected.explorationScore);
      pheromoneScores.push(selected.pheromoneScore);
    }

    if (seen.has(candidateKey(choices))) {
      continue;
    }

    const material = `${profile.profileId}|${step}|${attempt}|${JSON.stringify(choices)}`;
    const id = hashText(material).slice(0, 12);
    const novelty = average(noveltyScores);
    const pheromoneScore = average(pheromoneScores);
    const heuristicScore = 0.5 * novelty + 0.5 * Math.min(pheromoneScore, 3) / 3;
    return {
      id,
      createdAt,
      step,
      choices,
      novelty,
      pheromoneScore,
      heuristicScore,
      shellEnv: buildShellEnv(profile, choices, id),
      command: profile.command,
      status: "proposed"
    };
  }

  throw new Error(`Unable to produce a unique candidate for profile ${profile.profileId} at step ${step}`);
};

export const createInitialState = (profile: LabProfile): LabState => ({
  version: 1,
  profileId: profile.profileId,
  objective: profile.objective,
  step: 0,
  pheromones: Object.fromEntries(
    profile.dimensions.map((dimension) => [
      dimension.name,
      Object.fromEntries(dimension.values.map((value) => [value, 1]))
    ])
  ),
  candidates: [],
  evaluations: [],
  bestCandidateId: null
});

export const generateSuggestionBatch = (
  profile: LabProfile,
  state: LabState,
  count: number,
  generatedAt: string
): { readonly batch: SuggestionBatch; readonly nextState: LabState } => {
  const step = state.step + 1;
  const candidates = Array.from({ length: count }, (_, index) => buildCandidate(profile, state, step, index, generatedAt));
  const nextState: LabState = {
    ...state,
    step,
    candidates: [...state.candidates, ...candidates]
  };
  return {
    batch: {
      generatedAt,
      profileId: profile.profileId,
      objective: profile.objective,
      step,
      candidates
    },
    nextState
  };
};

const normalizeMetric = (value: number, baseline: number, target: number, direction: "minimize" | "maximize"): number => {
  const span = Math.abs(target - baseline);
  if (span === 0) {
    return 0;
  }
  const raw = direction === "minimize"
    ? (baseline - value) / span
    : (value - baseline) / span;
  return clamp(raw, -1, 2);
};

export const scoreMetrics = (profile: LabProfile, metrics: Readonly<Record<string, number>>): number => profile.metrics.reduce((sum, goal) => {
  const value = metrics[goal.name];
  if (typeof value !== "number" || Number.isNaN(value)) {
    return sum;
  }
  return sum + goal.weight * normalizeMetric(value, goal.baseline, goal.target, goal.direction);
}, 0);

export const recordEvaluation = (
  profile: LabProfile,
  state: LabState,
  candidateId: string,
  metrics: Readonly<Record<string, number>>,
  recordedAt: string
): LabState => {
  const candidate = state.candidates.find((entry) => entry.id === candidateId);
  if (!candidate) {
    throw new Error(`Unknown candidate id: ${candidateId}`);
  }

  const score = scoreMetrics(profile, metrics);
  const deposit = Math.max(0.05, 1 + score) * profile.pheromoneDeposit;
  const evaporated = Object.fromEntries(
    Object.entries(state.pheromones).map(([dimensionName, values]) => [
      dimensionName,
      Object.fromEntries(
        Object.entries(values).map(([value, pheromone]) => [value, Math.max(0.05, pheromone * (1 - profile.evaporationRate))])
      )
    ])
  ) as Readonly<Record<string, Readonly<Record<string, number>>>>;

  const deposited = Object.fromEntries(
    Object.entries(evaporated).map(([dimensionName, values]) => {
      const selected = candidate.choices[dimensionName];
      if (!selected) {
        return [dimensionName, values];
      }
      return [
        dimensionName,
        {
          ...values,
          [selected]: (values[selected] ?? 0.05) + deposit
        }
      ];
    })
  ) as Readonly<Record<string, Readonly<Record<string, number>>>>;

  const evaluation: EvaluationRecord = {
    candidateId,
    recordedAt,
    metrics,
    score
  };

  const candidates = state.candidates.map((entry) => entry.id === candidateId ? { ...entry, status: "evaluated" as const } : entry);
  const evaluations = [...state.evaluations, evaluation];
  const bestEvaluation = evaluations.reduce<EvaluationRecord | null>((best, current) => best === null || current.score > best.score ? current : best, null);

  return {
    ...state,
    pheromones: deposited,
    candidates,
    evaluations,
    bestCandidateId: bestEvaluation?.candidateId ?? null
  };
};

export const summarizeState = (state: LabState): Readonly<Record<string, unknown>> => {
  const proposed = state.candidates.filter((candidate) => candidate.status === "proposed");
  const evaluated = state.candidates.filter((candidate) => candidate.status === "evaluated");
  const bestEvaluation = state.bestCandidateId
    ? state.evaluations.find((entry) => entry.candidateId === state.bestCandidateId) ?? null
    : null;

  return {
    profileId: state.profileId,
    objective: state.objective,
    step: state.step,
    candidateCount: state.candidates.length,
    proposedCount: proposed.length,
    evaluatedCount: evaluated.length,
    bestCandidateId: state.bestCandidateId,
    bestScore: bestEvaluation?.score ?? null,
    bestMetrics: bestEvaluation?.metrics ?? null
  };
};
