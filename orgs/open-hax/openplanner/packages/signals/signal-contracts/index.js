import signalContracts from "./index.cjs";

export const WORLD_WATCHLIST_RECORD = signalContracts.WORLD_WATCHLIST_RECORD;
export const WORLD_WATCHLIST_SCHEMA_VERSION =
  signalContracts.WORLD_WATCHLIST_SCHEMA_VERSION;
export const SIGNAL_OBSERVATION_RECORD =
  signalContracts.SIGNAL_OBSERVATION_RECORD;
export const SIGNAL_OBSERVATION_SCHEMA_VERSION =
  signalContracts.SIGNAL_OBSERVATION_SCHEMA_VERSION;
export const CORRELATION_EDGE_RECORD =
  signalContracts.CORRELATION_EDGE_RECORD;
export const CORRELATION_EDGE_SCHEMA_VERSION =
  signalContracts.CORRELATION_EDGE_SCHEMA_VERSION;
export const RADAR_FINDING_RECORD = signalContracts.RADAR_FINDING_RECORD;
export const RADAR_FINDING_SCHEMA_VERSION =
  signalContracts.RADAR_FINDING_SCHEMA_VERSION;
export const RISK_LEVELS = signalContracts.RISK_LEVELS;
export const SIGNAL_DIRECTIONS = signalContracts.SIGNAL_DIRECTIONS;
export const isObjectRecord = signalContracts.isObjectRecord;
export const normalizeStringArray = signalContracts.normalizeStringArray;
export const normalizeRiskLevel = signalContracts.normalizeRiskLevel;
export const normalizeSignalDirection = signalContracts.normalizeSignalDirection;
export const normalizeWatchlistSeed = signalContracts.normalizeWatchlistSeed;
export const normalizeSignalObservation =
  signalContracts.normalizeSignalObservation;
export const normalizeCorrelationEdge =
  signalContracts.normalizeCorrelationEdge;
export const normalizeRadarFinding = signalContracts.normalizeRadarFinding;
export const isWorldWatchlistPayload = signalContracts.isWorldWatchlistPayload;
export const isWatchlistSeed = signalContracts.isWatchlistSeed;
export const isSignalObservation = signalContracts.isSignalObservation;
export const isCorrelationEdge = signalContracts.isCorrelationEdge;
export const isRadarFinding = signalContracts.isRadarFinding;

export default signalContracts;
