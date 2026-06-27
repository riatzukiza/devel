export interface ThreatProximityStrategy {
  readonly boost: number;
  readonly signal: string;
  readonly p_active_max: number;
  readonly p_critical_max: number;
}

export interface ThreatLlmFallback {
  readonly enabled: boolean;
  readonly applied: boolean;
  readonly model: string;
  readonly error: string;
  readonly metrics: Record<string, never>;
}

export declare function clamp01(value: number): number;
export declare function resolveThreatProximityStrategy(input: {
  readonly pActiveMax: number;
  readonly pCriticalMax: number;
}): ThreatProximityStrategy;
export declare function applyThreatSignalStrategy(input: {
  readonly signals: readonly string[];
  readonly sourceTierBoost: number;
  readonly corroborationBoost: number;
  readonly proximitySignal: string;
}): string[];
export declare function buildThreatLlmFallback(input: {
  readonly llmRequested: boolean;
  readonly allowLlm: boolean;
  readonly llmItemCap: number;
  readonly llmModel: string;
}): ThreatLlmFallback;
export declare function resolveThreatRiskLevel(score: number): "low" | "medium" | "high" | "critical";
export declare function resolveThreatScoringMode(input: {
  readonly llmEnabled: boolean;
  readonly llmApplied: boolean;
  readonly classifierEnabled: boolean;
}): "deterministic" | "classifier" | "llm_blend";

declare const signalRadarCore: {
  readonly clamp01: typeof clamp01;
  readonly resolveThreatProximityStrategy: typeof resolveThreatProximityStrategy;
  readonly applyThreatSignalStrategy: typeof applyThreatSignalStrategy;
  readonly buildThreatLlmFallback: typeof buildThreatLlmFallback;
  readonly resolveThreatRiskLevel: typeof resolveThreatRiskLevel;
  readonly resolveThreatScoringMode: typeof resolveThreatScoringMode;
};

export default signalRadarCore;
