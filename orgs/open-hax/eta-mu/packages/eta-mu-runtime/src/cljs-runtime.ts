import type {
  BreathEpisode,
  BreathRecommendation,
  EtaBelief,
  EtaMuActionBatch,
  EtaMuPlanningContextInput,
  EtaMuState,
  MuCandidate,
  PanelName,
} from "./types.js";

export type SurfaceCommandName = "version";

export interface SurfaceCommandInput {
  command: SurfaceCommandName;
  value: string;
}

export interface SurfaceCommandResult {
  command: SurfaceCommandName;
  stdout: string;
  exitCode: number;
}

export declare function createEtaBelief(
  overrides?: Partial<EtaBelief>,
): EtaBelief;

export declare function createBreathEpisode(
  id: string,
  now?: string,
  pendingCommit?: boolean,
  activityScalar?: number,
): BreathEpisode;

export declare function createEtaMuState(options?: {
  belief?: Partial<EtaBelief>;
  panels?: PanelName[];
  proposedMoves?: MuCandidate[];
  currentEpisodeId?: string;
  now?: string;
  pendingCommit?: boolean;
  activityScalar?: number;
}): EtaMuState;

export declare function selectPanelsFromContext(
  context: EtaMuPlanningContextInput,
): PanelName[];

export declare function rankCheapMuCandidates(
  context: EtaMuPlanningContextInput,
): MuCandidate[];

export declare function recommendBreath(
  context: EtaMuPlanningContextInput,
  actions?: MuCandidate[],
): BreathRecommendation;

export declare function createActionBatch(
  context: EtaMuPlanningContextInput,
): EtaMuActionBatch;

export declare function createSurfaceCommandResult(
  input: SurfaceCommandInput,
): SurfaceCommandResult;
