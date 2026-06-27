const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyThreatSignalStrategy,
  buildThreatLlmFallback,
  resolveThreatProximityStrategy,
  resolveThreatRiskLevel,
  resolveThreatScoringMode,
} = require("../index.cjs");

test("resolveThreatProximityStrategy mirrors the existing boost thresholds", () => {
  assert.deepEqual(resolveThreatProximityStrategy({ pActiveMax: 0.4, pCriticalMax: 0.8 }), {
    boost: 2,
    signal: "proximity_critical_state",
    p_active_max: 0.4,
    p_critical_max: 0.8,
  });
  assert.deepEqual(resolveThreatProximityStrategy({ pActiveMax: 0.7, pCriticalMax: 0.2 }), {
    boost: 1,
    signal: "proximity_active_state",
    p_active_max: 0.7,
    p_critical_max: 0.2,
  });
});

test("applyThreatSignalStrategy merges deterministic and contextual signals", () => {
  assert.deepEqual(
    applyThreatSignalStrategy({
      signals: ["base_signal", "base_signal"],
      sourceTierBoost: 1,
      corroborationBoost: 2,
      proximitySignal: "proximity_critical_state",
    }),
    [
      "base_signal",
      "corroborated_signal",
      "proximity_critical_state",
      "source_tier_boost",
    ],
  );
});

test("LLM fallback and risk helpers stay deterministic", () => {
  assert.equal(
    buildThreatLlmFallback({
      llmRequested: true,
      allowLlm: false,
      llmItemCap: 0,
      llmModel: "demo-model",
    }).error,
    "disabled_by_compute_budget",
  );
  assert.equal(resolveThreatRiskLevel(11), "critical");
  assert.equal(resolveThreatRiskLevel(8), "high");
  assert.equal(resolveThreatRiskLevel(5), "medium");
  assert.equal(resolveThreatRiskLevel(2), "low");
  assert.equal(
    resolveThreatScoringMode({ llmEnabled: true, llmApplied: false, classifierEnabled: true }),
    "classifier",
  );
});
