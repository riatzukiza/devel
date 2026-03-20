export type OptimizationObjective = "board" | "presence";
export type MetricDirection = "minimize" | "maximize";
export type CandidateStatus = "proposed" | "evaluated";

export interface DecisionDimension {
  readonly name: string;
  readonly values: readonly string[];
  readonly envVar?: string;
  readonly description: string;
}

export interface MetricGoal {
  readonly name: string;
  readonly direction: MetricDirection;
  readonly weight: number;
  readonly baseline: number;
  readonly target: number;
}

export interface StrategySeed {
  readonly id: string;
  readonly label: string;
  readonly choices: Readonly<Record<string, string>>;
  readonly hypothesis: string;
  readonly tags: readonly string[];
  readonly priorBelief: number;
  readonly riskLevel: "low" | "medium" | "high";
  readonly signalBoost?: number;
}

export interface LabProfile {
  readonly version: 1;
  readonly profileId: string;
  readonly objective: OptimizationObjective;
  readonly seed: number;
  readonly evaporationRate: number;
  readonly pheromoneDeposit: number;
  readonly antsPerStep: number;
  readonly dimensions: readonly DecisionDimension[];
  readonly metrics: readonly MetricGoal[];
  readonly seedStrategies: readonly StrategySeed[];
  readonly baseEnv: Readonly<Record<string, string>>;
  readonly command: string;
  readonly notes: readonly string[];
}

export interface CandidateRecipe {
  readonly id: string;
  readonly createdAt: string;
  readonly step: number;
  readonly choices: Readonly<Record<string, string>>;
  readonly novelty: number;
  readonly pheromoneScore: number;
  readonly heuristicScore: number;
  readonly priorScore: number;
  readonly compositeScore: number;
  readonly strategyId: string | null;
  readonly strategyLabel: string | null;
  readonly hypothesis: string;
  readonly tags: readonly string[];
  readonly riskLevel: "low" | "medium" | "high";
  readonly shellEnv: string;
  readonly command: string;
  readonly status: CandidateStatus;
}

export interface EvaluationRecord {
  readonly candidateId: string;
  readonly recordedAt: string;
  readonly metrics: Readonly<Record<string, number>>;
  readonly score: number;
}

export interface LabState {
  readonly version: 1;
  readonly profileId: string;
  readonly objective: OptimizationObjective;
  readonly step: number;
  readonly pheromones: Readonly<Record<string, Readonly<Record<string, number>>>>;
  readonly candidates: readonly CandidateRecipe[];
  readonly evaluations: readonly EvaluationRecord[];
  readonly bestCandidateId: string | null;
}

export interface SuggestionBatch {
  readonly generatedAt: string;
  readonly profileId: string;
  readonly objective: OptimizationObjective;
  readonly step: number;
  readonly candidates: readonly CandidateRecipe[];
}

export interface LabPaths {
  readonly rootDir: string;
  readonly profileDir: string;
  readonly configPath: string;
  readonly statePath: string;
  readonly suggestionsDir: string;
}
