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

const normalizePheromone = (value: number): number => clamp(Math.min(value, 3) / 3, 0, 1);

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

const effectivePrior = (strategy: { readonly priorBelief: number; readonly signalBoost?: number }): number =>
  clamp(strategy.priorBelief + (strategy.signalBoost ?? 0), 0, 1);

const valuePriorAffinity = (profile: LabProfile, dimensionName: string, value: string): number => {
  const matches = profile.seedStrategies.filter((strategy) => strategy.choices[dimensionName] === value);
  if (matches.length === 0) {
    return 0.5;
  }
  return average(matches.map((strategy) => effectivePrior(strategy)));
};

const chooseWeightedValue = (
  values: readonly string[],
  pheromoneByValue: Readonly<Record<string, number>>,
  frequencies: Readonly<Record<string, number>>,
  priorAffinities: Readonly<Record<string, number>>,
  rng: () => number
): { readonly value: string; readonly explorationScore: number; readonly pheromoneScore: number } => {
  const weights = values.map((value) => {
    const pheromone = pheromoneByValue[value] ?? 1;
    const frequency = frequencies[value] ?? 0;
    const exploration = 1 / (1 + frequency);
    const priorAffinity = priorAffinities[value] ?? 0.5;
    return {
      value,
      pheromone,
      exploration,
      weight: pheromone * (0.35 + 0.45 * exploration + 0.20 * priorAffinity)
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

const estimatePriorFromSeeds = (profile: LabProfile, choices: Readonly<Record<string, string>>): { readonly priorBelief: number; readonly label: string; readonly riskLevel: "low" | "medium" | "high" } => {
  const dimensions = profile.dimensions.length;
  const ranked = profile.seedStrategies.map((strategy) => {
    const matches = profile.dimensions.filter((dimension) => strategy.choices[dimension.name] === choices[dimension.name]).length;
    const similarity = dimensions === 0 ? 0 : matches / dimensions;
    return {
      strategy,
      similarity,
      score: effectivePrior(strategy) * (0.45 + 0.55 * similarity)
    };
  }).sort((left, right) => right.score - left.score);

  const best = ranked[0];
  if (!best) {
    return { priorBelief: 0.5, label: "free-ant", riskLevel: "medium" };
  }
  return {
    priorBelief: best.score,
    label: `free-ant≈${best.strategy.label}`,
    riskLevel: best.strategy.riskLevel
  };
};

const buildCandidateId = (
  profile: LabProfile,
  step: number,
  strategyId: string | null,
  attempt: number,
  choices: Readonly<Record<string, string>>
): string => hashText(`${profile.profileId}|${step}|${strategyId ?? "free"}|${attempt}|${JSON.stringify(choices)}`).slice(0, 12);

const buildCandidateFromChoices = (
  profile: LabProfile,
  step: number,
  createdAt: string,
  choices: Readonly<Record<string, string>>,
  noveltyScores: readonly number[],
  pheromoneScores: readonly number[],
  strategy: { readonly id: string; readonly label: string; readonly hypothesis: string; readonly tags: readonly string[]; readonly priorBelief: number; readonly riskLevel: "low" | "medium" | "high" } | null,
  attempt: number
): CandidateRecipe => {
  const id = buildCandidateId(profile, step, strategy?.id ?? null, attempt, choices);
  const novelty = average(noveltyScores);
  const pheromoneScore = average(pheromoneScores);
  const fallbackPrior = estimatePriorFromSeeds(profile, choices);
  const priorScore = strategy ? effectivePrior(strategy) : fallbackPrior.priorBelief;
  const heuristicScore = 0.55 * priorScore + 0.30 * novelty + 0.15 * normalizePheromone(pheromoneScore);
  const compositeScore = 0.60 * priorScore + 0.25 * normalizePheromone(pheromoneScore) + 0.15 * novelty;
  return {
    id,
    createdAt,
    step,
    choices,
    novelty,
    pheromoneScore,
    heuristicScore,
    priorScore,
    compositeScore,
    strategyId: strategy?.id ?? null,
    strategyLabel: strategy?.label ?? fallbackPrior.label,
    hypothesis: strategy?.hypothesis ?? "Explore an unseeded path suggested by current pheromones and under-covered values.",
    tags: strategy?.tags ?? ["free-ant"],
    riskLevel: strategy?.riskLevel ?? fallbackPrior.riskLevel,
    shellEnv: buildShellEnv(profile, choices, id),
    command: profile.command,
    status: "proposed"
  };
};

const buildSeededCandidate = (
  profile: LabProfile,
  state: LabState,
  step: number,
  createdAt: string,
  strategyIndex: number
): CandidateRecipe | null => {
  const strategy = profile.seedStrategies[strategyIndex];
  if (!strategy) {
    return null;
  }

  const seen = new Set(state.candidates.map((candidate) => candidateKey(candidate.choices)));
  if (seen.has(candidateKey(strategy.choices))) {
    return null;
  }

  const historicalCandidates = state.candidates.filter((candidate) => candidate.step < step);
  const noveltyScores = profile.dimensions.map((dimension) => 1 / (1 + historicalCandidates.filter((candidate) => candidate.choices[dimension.name] === strategy.choices[dimension.name]).length));
  const pheromoneScores = profile.dimensions.map((dimension) => state.pheromones[dimension.name]?.[strategy.choices[dimension.name] ?? ""] ?? 1);
  return buildCandidateFromChoices(profile, step, createdAt, strategy.choices, noveltyScores, pheromoneScores, strategy, strategyIndex);
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
      const priorAffinities = Object.fromEntries(dimension.values.map((value) => [value, valuePriorAffinity(profile, dimension.name, value)]));
      const selected = chooseWeightedValue(
        dimension.values,
        state.pheromones[dimension.name] ?? {},
        valueFrequencies[dimension.name] ?? {},
        priorAffinities,
        rng
      );
      choices[dimension.name] = selected.value;
      noveltyScores.push(selected.explorationScore);
      pheromoneScores.push(selected.pheromoneScore);
    }

    if (seen.has(candidateKey(choices))) {
      continue;
    }

    return buildCandidateFromChoices(profile, step, createdAt, choices, noveltyScores, pheromoneScores, null, attempt);
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
  const candidates: CandidateRecipe[] = [];
  let workingState = state;
  for (let index = 0; index < count; index += 1) {
    const seeded = step === 1 ? buildSeededCandidate(profile, workingState, step, generatedAt, index) : null;
    const candidate = seeded ?? buildCandidate(profile, workingState, step, index, generatedAt);
    candidates.push(candidate);
    workingState = {
      ...workingState,
      candidates: [...workingState.candidates, candidate]
    };
  }
  const nextState: LabState = {
    ...state,
    step,
    candidates: [...state.candidates, ...candidates].sort((left, right) => right.compositeScore - left.compositeScore)
  };
  return {
    batch: {
      generatedAt,
      profileId: profile.profileId,
      objective: profile.objective,
      step,
      candidates: [...candidates].sort((left, right) => right.compositeScore - left.compositeScore)
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
