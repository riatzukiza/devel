import {
  createBreathEpisode as createBreathEpisodeCljs,
  createEtaBelief as createEtaBeliefCljs,
  createEtaMuState as createEtaMuStateCljs,
} from "@open-hax/eta-mu-runtime/cljs";
import {
  breathEpisodeSchema,
  etaBeliefSchema,
  etaMuStateSchema,
  type BreathEpisode,
  type EtaBelief,
  type EtaMuState,
  type MuCandidate,
  type PanelName,
} from "./types.js";

export const DEFAULT_ETA_BELIEF: EtaBelief = etaBeliefSchema.parse(
  createEtaBeliefCljs(),
);

export function createEtaBelief(overrides: Partial<EtaBelief> = {}): EtaBelief {
  return etaBeliefSchema.parse(createEtaBeliefCljs(overrides));
}

export function createBreathEpisode(
  id: string,
  now = new Date().toISOString(),
  pendingCommit = false,
  activityScalar = 0,
): BreathEpisode {
  return breathEpisodeSchema.parse(
    createBreathEpisodeCljs(id, now, pendingCommit, activityScalar),
  );
}

export function createEtaMuState(options: {
  belief?: Partial<EtaBelief>;
  panels?: PanelName[];
  proposedMoves?: MuCandidate[];
  currentEpisodeId?: string;
  now?: string;
  pendingCommit?: boolean;
  activityScalar?: number;
} = {}): EtaMuState {
  return etaMuStateSchema.parse(createEtaMuStateCljs(options));
}
