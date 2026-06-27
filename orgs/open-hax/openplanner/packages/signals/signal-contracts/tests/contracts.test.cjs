const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isWorldWatchlistPayload,
  normalizeCorrelationEdge,
  normalizeRadarFinding,
  normalizeSignalObservation,
  normalizeWatchlistSeed,
} = require("../index.cjs");

test("normalizeWatchlistSeed normalizes common seed fields", () => {
  const row = normalizeWatchlistSeed({
    url: "https://example.com/feed",
    kind: "FEED:RSS",
    title: "Example Feed",
    source_type: "RSS",
    domain_id: "Global",
    tags: ["news", "news", "ops"],
  });

  assert.deepEqual(row, {
    url: "https://example.com/feed",
    kind: "feed:rss",
    title: "Example Feed",
    source_type: "rss",
    domain_id: "global",
    tags: ["news", "ops"],
  });
});

test("signal, correlation, and radar normalizers preserve stable snake_case fields", () => {
  const observation = normalizeSignalObservation({
    id: "sig-1",
    category: "shipping_disruption",
    evidence_refs: ["doc:1"],
  });
  assert.equal(observation?.record, "open-hax.signal-observation.v1");
  assert.equal(observation?.schema_version, "signal.observation.v1");

  const edge = normalizeCorrelationEdge({
    id: "edge-1",
    kind: "global_to_local",
    from_signal_id: "sig-1",
    to_signal_id: "sig-2",
  });
  assert.equal(edge?.kind, "global_to_local");

  const finding = normalizeRadarFinding({
    id: "finding-1",
    profile: "hormuz",
    title: "Severe disruption",
    risk_level: "CRITICAL",
  });
  assert.equal(finding?.risk_level, "critical");
});

test("isWorldWatchlistPayload recognizes the current watchlist record shape", () => {
  assert.equal(
    isWorldWatchlistPayload({
      record: "eta-mu.world-watchlist.v1",
      schema_version: "world.watchlist.v1",
      domains: [],
    }),
    true,
  );
  assert.equal(isWorldWatchlistPayload({ record: "other", domains: [] }), false);
});
