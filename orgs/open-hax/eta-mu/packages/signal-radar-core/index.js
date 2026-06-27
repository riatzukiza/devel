import signalRadarCore from "./index.cjs";

export const clamp01 = signalRadarCore.clamp01;
export const resolveThreatProximityStrategy =
  signalRadarCore.resolveThreatProximityStrategy;
export const applyThreatSignalStrategy =
  signalRadarCore.applyThreatSignalStrategy;
export const buildThreatLlmFallback =
  signalRadarCore.buildThreatLlmFallback;
export const resolveThreatRiskLevel = signalRadarCore.resolveThreatRiskLevel;
export const resolveThreatScoringMode = signalRadarCore.resolveThreatScoringMode;

export default signalRadarCore;
