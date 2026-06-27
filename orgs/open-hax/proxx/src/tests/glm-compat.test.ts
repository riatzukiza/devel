import assert from "node:assert/strict";
import test from "node:test";

import { isGlmModel, applyGlmThinking } from "../lib/glm-compat.js";

test("isGlmModel matches glm- prefixed models", () => {
  assert.equal(isGlmModel("glm-4.5"), true);
  assert.equal(isGlmModel("glm-4.6"), true);
  assert.equal(isGlmModel("glm-4.7"), true);
  assert.equal(isGlmModel("glm-5"), true);
  assert.equal(isGlmModel("glm-4.5v"), true);
  assert.equal(isGlmModel("glm-4.7-flash"), true);
  assert.equal(isGlmModel("GLM-4.5"), true);
  assert.equal(isGlmModel(" glm-4.5 "), true);
  assert.equal(isGlmModel("gpt-4"), false);
  assert.equal(isGlmModel("claude-3"), false);
  assert.equal(isGlmModel("gemini-2.5"), false);
  assert.equal(isGlmModel("qwen3.5"), false);
});

test("applyGlmThinking sets enable_thinking=false for none effort", () => {
  const body = {
    model: "glm-4.7",
    messages: [{ role: "user", content: "hello" }],
    reasoning: { effort: "none" },
  };

  const result = applyGlmThinking(body, "glm-4.7") as Record<string, unknown>;

  assert.equal(result["enable_thinking"], false);
  assert.equal((body as Record<string, unknown>)["enable_thinking"], undefined);
});

test("applyGlmThinking sets enable_thinking=true for low effort", () => {
  const body = {
    model: "glm-4.7",
    messages: [{ role: "user", content: "hello" }],
    reasoning: { effort: "low" },
  };

  const result = applyGlmThinking(body, "glm-4.7");

  assert.equal(result["enable_thinking"], true);
});

test("applyGlmThinking sets enable_thinking=true for medium effort", () => {
  const body = {
    model: "glm-4.7",
    messages: [{ role: "user", content: "hello" }],
    reasoning: { effort: "medium" },
  };

  const result = applyGlmThinking(body, "glm-4.7");

  assert.equal(result["enable_thinking"], true);
});

test("applyGlmThinking sets enable_thinking=true for high effort", () => {
  const body = {
    model: "glm-4.7",
    messages: [{ role: "user", content: "hello" }],
    reasoning: { effort: "high" },
  };

  const result = applyGlmThinking(body, "glm-4.7");

  assert.equal(result["enable_thinking"], true);
});

test("applyGlmThinking sets enable_thinking=true for xhigh effort", () => {
  const body = {
    model: "glm-4.7",
    messages: [{ role: "user", content: "hello" }],
    reasoning: { effort: "xhigh" },
  };

  const result = applyGlmThinking(body, "glm-4.7");

  assert.equal(result["enable_thinking"], true);
});

test("applyGlmThinking handles reasoning_effort top-level field", () => {
  const body = {
    model: "glm-4.7",
    messages: [{ role: "user", content: "hello" }],
    reasoning_effort: "high",
  };

  const result = applyGlmThinking(body, "glm-4.7");

  assert.equal(result["enable_thinking"], true);
});

test("applyGlmThinking handles reasoningEffort camelCase field", () => {
  const body = {
    model: "glm-4.7",
    messages: [{ role: "user", content: "hello" }],
    reasoningEffort: "low",
  };

  const result = applyGlmThinking(body, "glm-4.7");

  assert.equal(result["enable_thinking"], true);
});

test("applyGlmThinking handles thinking.type=disabled", () => {
  const body = {
    model: "glm-4.7",
    messages: [{ role: "user", content: "hello" }],
    thinking: { type: "disabled" },
  };

  const result = applyGlmThinking(body, "glm-4.7");

  assert.equal(result["enable_thinking"], false);
  assert.equal(result["thinking"], undefined);
});

test("applyGlmThinking handles thinking.type=enabled", () => {
  const body = {
    model: "glm-4.7",
    messages: [{ role: "user", content: "hello" }],
    thinking: { type: "enabled" },
  };

  const result = applyGlmThinking(body, "glm-4.7");

  assert.equal(result["enable_thinking"], true);
});

test("applyGlmThinking does not add enable_thinking when no reasoning requested", () => {
  const body = {
    model: "glm-4.7",
    messages: [{ role: "user", content: "hello" }],
  };

  const result = applyGlmThinking(body, "glm-4.7");

  assert.equal(result["enable_thinking"], undefined);
});

test("applyGlmThinking does not modify non-GLM models", () => {
  const body = {
    model: "gpt-5",
    messages: [{ role: "user", content: "hello" }],
    reasoning: { effort: "high" },
  };

  const result = applyGlmThinking(body, "gpt-5");

  assert.equal(result["enable_thinking"], undefined);
  assert.equal((result["reasoning"] as Record<string, unknown>)?.["effort"], "high");
});

test("applyGlmThinking handles disabled variants: disable, disabled, off", () => {
  const variants = ["disable", "disabled", "off"];

  for (const variant of variants) {
    const body = {
      model: "glm-4.7",
      messages: [{ role: "user", content: "hello" }],
      reasoning: { effort: variant },
    };

    const result = applyGlmThinking(body, "glm-4.7");

    assert.equal(result["enable_thinking"], false, `expected false for effort="${variant}"`);
  }
});

test("applyGlmThinking preserves other body fields", () => {
  const body = {
    model: "glm-4.7",
    messages: [{ role: "user", content: "hello" }],
    temperature: 0.7,
    max_tokens: 4096,
    stream: true,
    reasoning: { effort: "high" },
  };

  const result = applyGlmThinking(body, "glm-4.7");

  assert.equal(result["model"], "glm-4.7");
  assert.equal(result["temperature"], 0.7);
  assert.equal(result["max_tokens"], 4096);
  assert.equal(result["stream"], true);
  assert.equal(result["enable_thinking"], true);
});

test("applyGlmThinking does not mutate the original body", () => {
  const body = {
    model: "glm-4.7",
    messages: [{ role: "user", content: "hello" }],
    thinking: { type: "disabled" },
    reasoning: { effort: "high" },
  };
  const original = JSON.parse(JSON.stringify(body));

  applyGlmThinking(body, "glm-4.7");

  assert.deepEqual(body, original);
  assert.equal((body as Record<string, unknown>)["enable_thinking"], undefined);
  assert.ok((body as Record<string, unknown>)["reasoning"] !== undefined);
});
