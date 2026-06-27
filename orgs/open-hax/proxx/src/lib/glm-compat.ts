import { isRecord, asString } from "./provider-utils.js";

const GLM_MODEL_PREFIX = "glm-";

function reasoningEffortIsDisabled(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "none" ||
    normalized === "disable" ||
    normalized === "disabled" ||
    normalized === "off"
  );
}

function extractReasoningEffort(body: Record<string, unknown>): string | undefined {
  const reasoning = isRecord(body["reasoning"]) ? body["reasoning"] : null;
  const effort =
    asString(reasoning?.["effort"]) ??
    asString(body["reasoning_effort"]) ??
    asString(body["reasoningEffort"]);
  return effort;
}

function extractThinkingType(body: Record<string, unknown>): string | undefined {
  const thinking = isRecord(body["thinking"]) ? body["thinking"] : null;
  if (thinking) {
    return asString(thinking["type"]);
  }
  return undefined;
}

function requestWantsReasoning(body: Record<string, unknown>): boolean {
  const thinkingType = extractThinkingType(body);
  if (thinkingType === "enabled") return true;
  if (thinkingType === "disabled") return false;

  const effort = extractReasoningEffort(body);
  if (effort) {
    return !reasoningEffortIsDisabled(effort);
  }

  if (isRecord(body["reasoning"])) return true;

  return false;
}

export function isGlmModel(model: string): boolean {
  return model.trim().toLowerCase().startsWith(GLM_MODEL_PREFIX);
}

export function applyGlmThinking(body: Record<string, unknown>, model?: string): Record<string, unknown> {
  if (model !== undefined && !isGlmModel(model)) {
    return body;
  }

  const result = { ...body };

  const thinkingType = extractThinkingType(result);
  if (thinkingType === "disabled") {
    result["enable_thinking"] = false;
    delete result["thinking"];
    return result;
  }

  const effort = extractReasoningEffort(result);
  if (effort !== undefined) {
    result["enable_thinking"] = !reasoningEffortIsDisabled(effort);
    return result;
  }

  if (requestWantsReasoning(result)) {
    result["enable_thinking"] = true;
    return result;
  }

  return result;
}
