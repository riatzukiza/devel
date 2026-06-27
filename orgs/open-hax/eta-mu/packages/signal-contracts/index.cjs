const WORLD_WATCHLIST_RECORD = "eta-mu.world-watchlist.v1";
const WORLD_WATCHLIST_SCHEMA_VERSION = "world.watchlist.v1";
const SIGNAL_OBSERVATION_RECORD = "open-hax.signal-observation.v1";
const SIGNAL_OBSERVATION_SCHEMA_VERSION = "signal.observation.v1";
const CORRELATION_EDGE_RECORD = "open-hax.signal-correlation-edge.v1";
const CORRELATION_EDGE_SCHEMA_VERSION = "signal.correlation-edge.v1";
const RADAR_FINDING_RECORD = "open-hax.radar-finding.v1";
const RADAR_FINDING_SCHEMA_VERSION = "signal.radar-finding.v1";

const RISK_LEVELS = ["low", "medium", "high", "critical"];
const SIGNAL_DIRECTIONS = ["stabilizing", "destabilizing", "neutral"];

function isObjectRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  const output = [];
  const seen = new Set();
  for (const item of value) {
    const token = normalizeString(item);
    if (!token || seen.has(token)) {
      continue;
    }
    seen.add(token);
    output.push(token);
  }
  return output;
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeRiskLevel(value, fallback = "low") {
  const token = normalizeString(value).toLowerCase();
  return RISK_LEVELS.includes(token) ? token : fallback;
}

function normalizeSignalDirection(value, fallback = "neutral") {
  const token = normalizeString(value).toLowerCase();
  return SIGNAL_DIRECTIONS.includes(token) ? token : fallback;
}

function normalizeWatchlistSeed(value) {
  if (!isObjectRecord(value)) {
    return null;
  }
  const url = normalizeString(value.url);
  if (!url) {
    return null;
  }
  return {
    url,
    kind: normalizeString(value.kind).toLowerCase(),
    title: normalizeString(value.title),
    source_type: normalizeString(value.source_type).toLowerCase(),
    domain_id: normalizeString(value.domain_id).toLowerCase(),
    tags: normalizeStringArray(value.tags),
  };
}

function normalizeSignalObservation(value) {
  if (!isObjectRecord(value)) {
    return null;
  }
  const id = normalizeString(value.id);
  const category = normalizeString(value.category);
  if (!id || !category) {
    return null;
  }
  return {
    record: normalizeString(value.record) || SIGNAL_OBSERVATION_RECORD,
    schema_version:
      normalizeString(value.schema_version) || SIGNAL_OBSERVATION_SCHEMA_VERSION,
    id,
    scope: normalizeString(value.scope).toLowerCase() || "global",
    profile: normalizeString(value.profile).toLowerCase(),
    category,
    severity: normalizeNumber(value.severity, 0),
    confidence: normalizeNumber(value.confidence, 0),
    direction: normalizeSignalDirection(value.direction),
    subject_refs: normalizeStringArray(value.subject_refs),
    evidence_refs: normalizeStringArray(value.evidence_refs),
    tags: normalizeStringArray(value.tags),
    observed_at: normalizeString(value.observed_at),
    summary: normalizeString(value.summary),
  };
}

function normalizeCorrelationEdge(value) {
  if (!isObjectRecord(value)) {
    return null;
  }
  const id = normalizeString(value.id);
  const kind = normalizeString(value.kind).toLowerCase();
  const fromSignalId = normalizeString(value.from_signal_id);
  const toSignalId = normalizeString(value.to_signal_id);
  if (!id || !kind || !fromSignalId || !toSignalId) {
    return null;
  }
  return {
    record: normalizeString(value.record) || CORRELATION_EDGE_RECORD,
    schema_version:
      normalizeString(value.schema_version) || CORRELATION_EDGE_SCHEMA_VERSION,
    id,
    kind,
    from_signal_id: fromSignalId,
    to_signal_id: toSignalId,
    score: normalizeNumber(value.score, 0),
    confidence: normalizeNumber(value.confidence, 0),
    rationale: normalizeStringArray(value.rationale),
    tags: normalizeStringArray(value.tags),
  };
}

function normalizeRadarFinding(value) {
  if (!isObjectRecord(value)) {
    return null;
  }
  const id = normalizeString(value.id);
  const profile = normalizeString(value.profile).toLowerCase();
  const title = normalizeString(value.title);
  if (!id || !profile || !title) {
    return null;
  }
  return {
    record: normalizeString(value.record) || RADAR_FINDING_RECORD,
    schema_version:
      normalizeString(value.schema_version) || RADAR_FINDING_SCHEMA_VERSION,
    id,
    profile,
    domain: normalizeString(value.domain).toLowerCase() || "global",
    risk_score: normalizeNumber(value.risk_score, 0),
    risk_level: normalizeRiskLevel(value.risk_level),
    signal_ids: normalizeStringArray(value.signal_ids),
    correlation_ids: normalizeStringArray(value.correlation_ids),
    title,
    summary: normalizeString(value.summary),
    evidence_refs: normalizeStringArray(value.evidence_refs),
    tags: normalizeStringArray(value.tags),
  };
}

function isWorldWatchlistPayload(value) {
  if (!isObjectRecord(value)) {
    return false;
  }
  const record = normalizeString(value.record);
  const schemaVersion = normalizeString(value.schema_version);
  return (
    (!record || record === WORLD_WATCHLIST_RECORD) &&
    (!schemaVersion || schemaVersion === WORLD_WATCHLIST_SCHEMA_VERSION) &&
    Array.isArray(value.domains)
  );
}

function isWatchlistSeed(value) {
  return normalizeWatchlistSeed(value) !== null;
}

function isSignalObservation(value) {
  return normalizeSignalObservation(value) !== null;
}

function isCorrelationEdge(value) {
  return normalizeCorrelationEdge(value) !== null;
}

function isRadarFinding(value) {
  return normalizeRadarFinding(value) !== null;
}

module.exports = {
  WORLD_WATCHLIST_RECORD,
  WORLD_WATCHLIST_SCHEMA_VERSION,
  SIGNAL_OBSERVATION_RECORD,
  SIGNAL_OBSERVATION_SCHEMA_VERSION,
  CORRELATION_EDGE_RECORD,
  CORRELATION_EDGE_SCHEMA_VERSION,
  RADAR_FINDING_RECORD,
  RADAR_FINDING_SCHEMA_VERSION,
  RISK_LEVELS,
  SIGNAL_DIRECTIONS,
  isObjectRecord,
  normalizeStringArray,
  normalizeRiskLevel,
  normalizeSignalDirection,
  normalizeWatchlistSeed,
  normalizeSignalObservation,
  normalizeCorrelationEdge,
  normalizeRadarFinding,
  isWorldWatchlistPayload,
  isWatchlistSeed,
  isSignalObservation,
  isCorrelationEdge,
  isRadarFinding,
};
