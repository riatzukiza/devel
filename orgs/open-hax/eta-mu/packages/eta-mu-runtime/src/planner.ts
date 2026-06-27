import {
  rankCheapMuCandidates as rankCheapMuCandidatesCljs,
  selectPanelsFromContext as selectPanelsFromContextCljs,
} from "@open-hax/eta-mu-runtime/cljs";
import {
  type EtaMuPlanningContext,
  type EtaMuPlanningContextInput,
  etaMuPlanningContextSchema,
  type MuCandidate,
  muCandidateSchema,
  panelNameSchema,
  type PanelName,
} from "./types.js";

function normalizeContext(
  context: EtaMuPlanningContextInput,
): EtaMuPlanningContext {
  return etaMuPlanningContextSchema.parse(context);
}

export function selectPanelsFromContext(
  contextInput: EtaMuPlanningContextInput,
): PanelName[] {
  return panelNameSchema.array().parse(
    selectPanelsFromContextCljs(normalizeContext(contextInput)),
  );
}

export function rankCheapMuCandidates(
  contextInput: EtaMuPlanningContextInput,
): MuCandidate[] {
  return muCandidateSchema.array().parse(
    rankCheapMuCandidatesCljs(normalizeContext(contextInput)),
  );
}
