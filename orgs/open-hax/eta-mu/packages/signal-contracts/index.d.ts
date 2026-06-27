export interface WatchlistSeedRow {
  readonly url: string;
  readonly kind: string;
  readonly title: string;
  readonly source_type: string;
  readonly domain_id: string;
  readonly tags: readonly string[];
}

export interface SignalObservation {
  readonly record: string;
  readonly schema_version: string;
  readonly id: string;
  readonly scope: string;
  readonly profile: string;
  readonly category: string;
  readonly severity: number;
  readonly confidence: number;
  readonly direction: string;
  readonly subject_refs: readonly string[];
  readonly evidence_refs: readonly string[];
  readonly tags: readonly string[];
  readonly observed_at: string;
  readonly summary: string;
}

export interface CorrelationEdge {
  readonly record: string;
  readonly schema_version: string;
  readonly id: string;
  readonly kind: string;
  readonly from_signal_id: string;
  readonly to_signal_id: string;
  readonly score: number;
  readonly confidence: number;
  readonly rationale: readonly string[];
  readonly tags: readonly string[];
}

export interface RadarFinding {
  readonly record: string;
  readonly schema_version: string;
  readonly id: string;
  readonly profile: string;
  readonly domain: string;
  readonly risk_score: number;
  readonly risk_level: string;
  readonly signal_ids: readonly string[];
  readonly correlation_ids: readonly string[];
  readonly title: string;
  readonly summary: string;
  readonly evidence_refs: readonly string[];
  readonly tags: readonly string[];
}

export declare const WORLD_WATCHLIST_RECORD: "eta-mu.world-watchlist.v1";
export declare const WORLD_WATCHLIST_SCHEMA_VERSION: "world.watchlist.v1";
export declare const SIGNAL_OBSERVATION_RECORD: "open-hax.signal-observation.v1";
export declare const SIGNAL_OBSERVATION_SCHEMA_VERSION: "signal.observation.v1";
export declare const CORRELATION_EDGE_RECORD: "open-hax.signal-correlation-edge.v1";
export declare const CORRELATION_EDGE_SCHEMA_VERSION: "signal.correlation-edge.v1";
export declare const RADAR_FINDING_RECORD: "open-hax.radar-finding.v1";
export declare const RADAR_FINDING_SCHEMA_VERSION: "signal.radar-finding.v1";
export declare const RISK_LEVELS: readonly string[];
export declare const SIGNAL_DIRECTIONS: readonly string[];

export declare function isObjectRecord(value: unknown): value is Record<string, unknown>;
export declare function normalizeStringArray(value: unknown): string[];
export declare function normalizeRiskLevel(value: unknown, fallback?: string): string;
export declare function normalizeSignalDirection(value: unknown, fallback?: string): string;
export declare function normalizeWatchlistSeed(value: unknown): WatchlistSeedRow | null;
export declare function normalizeSignalObservation(value: unknown): SignalObservation | null;
export declare function normalizeCorrelationEdge(value: unknown): CorrelationEdge | null;
export declare function normalizeRadarFinding(value: unknown): RadarFinding | null;
export declare function isWorldWatchlistPayload(value: unknown): boolean;
export declare function isWatchlistSeed(value: unknown): value is WatchlistSeedRow;
export declare function isSignalObservation(value: unknown): value is SignalObservation;
export declare function isCorrelationEdge(value: unknown): value is CorrelationEdge;
export declare function isRadarFinding(value: unknown): value is RadarFinding;

declare const signalContracts: {
  readonly WORLD_WATCHLIST_RECORD: typeof WORLD_WATCHLIST_RECORD;
  readonly WORLD_WATCHLIST_SCHEMA_VERSION: typeof WORLD_WATCHLIST_SCHEMA_VERSION;
  readonly SIGNAL_OBSERVATION_RECORD: typeof SIGNAL_OBSERVATION_RECORD;
  readonly SIGNAL_OBSERVATION_SCHEMA_VERSION: typeof SIGNAL_OBSERVATION_SCHEMA_VERSION;
  readonly CORRELATION_EDGE_RECORD: typeof CORRELATION_EDGE_RECORD;
  readonly CORRELATION_EDGE_SCHEMA_VERSION: typeof CORRELATION_EDGE_SCHEMA_VERSION;
  readonly RADAR_FINDING_RECORD: typeof RADAR_FINDING_RECORD;
  readonly RADAR_FINDING_SCHEMA_VERSION: typeof RADAR_FINDING_SCHEMA_VERSION;
  readonly RISK_LEVELS: typeof RISK_LEVELS;
  readonly SIGNAL_DIRECTIONS: typeof SIGNAL_DIRECTIONS;
  readonly isObjectRecord: typeof isObjectRecord;
  readonly normalizeStringArray: typeof normalizeStringArray;
  readonly normalizeRiskLevel: typeof normalizeRiskLevel;
  readonly normalizeSignalDirection: typeof normalizeSignalDirection;
  readonly normalizeWatchlistSeed: typeof normalizeWatchlistSeed;
  readonly normalizeSignalObservation: typeof normalizeSignalObservation;
  readonly normalizeCorrelationEdge: typeof normalizeCorrelationEdge;
  readonly normalizeRadarFinding: typeof normalizeRadarFinding;
  readonly isWorldWatchlistPayload: typeof isWorldWatchlistPayload;
  readonly isWatchlistSeed: typeof isWatchlistSeed;
  readonly isSignalObservation: typeof isSignalObservation;
  readonly isCorrelationEdge: typeof isCorrelationEdge;
  readonly isRadarFinding: typeof isRadarFinding;
};

export default signalContracts;
