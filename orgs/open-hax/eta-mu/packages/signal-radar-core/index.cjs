function clamp01(value) {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function resolveThreatProximityStrategy({ pActiveMax, pCriticalMax }) {
  const active = clamp01(Number.isFinite(Number(pActiveMax)) ? Number(pActiveMax) : 0);
  const critical = clamp01(Number.isFinite(Number(pCriticalMax)) ? Number(pCriticalMax) : 0);
  let boost = 0;
  if (critical >= 0.75) {
    boost = 2;
  } else if (critical >= 0.55) {
    boost = 1;
  }
  if (active >= 0.7 && boost < 2) {
    boost += 1;
  }

  let signal = "";
  if (critical >= 0.55) {
    signal = "proximity_critical_state";
  } else if (active >= 0.55) {
    signal = "proximity_active_state";
  }

  return {
    boost: Math.max(0, Math.min(2, boost)),
    signal,
    p_active_max: Number(active.toFixed(6)),
    p_critical_max: Number(critical.toFixed(6)),
  };
}

function applyThreatSignalStrategy({
  signals,
  sourceTierBoost,
  corroborationBoost,
  proximitySignal,
}) {
  const merged = new Set(
    (Array.isArray(signals) ? signals : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean),
  );
  if (Number(sourceTierBoost) > 0) {
    merged.add("source_tier_boost");
  }
  if (Number(corroborationBoost) > 0) {
    merged.add("corroborated_signal");
  }
  if (String(proximitySignal || "").trim()) {
    merged.add(String(proximitySignal).trim());
  }
  return [...merged].sort();
}

function buildThreatLlmFallback({ llmRequested, allowLlm, llmItemCap, llmModel }) {
  let llmError = "";
  if (llmRequested && !allowLlm) {
    llmError = "disabled_by_compute_budget";
  } else if (llmRequested && Number(llmItemCap) <= 0) {
    llmError = "disabled_by_compute_budget";
  } else if (!llmRequested) {
    llmError = "disabled_by_query";
  }

  return {
    enabled: false,
    applied: false,
    model: String(llmModel || ""),
    error: llmError,
    metrics: {},
  };
}

function resolveThreatRiskLevel(score) {
  const levelScore = Number.isFinite(Number(score)) ? Number(score) : 0;
  if (levelScore >= 11) {
    return "critical";
  }
  if (levelScore >= 8) {
    return "high";
  }
  if (levelScore >= 5) {
    return "medium";
  }
  return "low";
}

function resolveThreatScoringMode({ llmEnabled, llmApplied, classifierEnabled }) {
  if (llmEnabled && llmApplied) {
    return "llm_blend";
  }
  if (classifierEnabled) {
    return "classifier";
  }
  return "deterministic";
}

module.exports = {
  clamp01,
  resolveThreatProximityStrategy,
  applyThreatSignalStrategy,
  buildThreatLlmFallback,
  resolveThreatRiskLevel,
  resolveThreatScoringMode,
};
