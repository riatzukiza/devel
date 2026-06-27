const mod = await import("../dist-cljs/index.js");

const expected = [
  "createEtaBelief",
  "createBreathEpisode",
  "createEtaMuState",
  "selectPanelsFromContext",
  "rankCheapMuCandidates",
  "recommendBreath",
  "createActionBatch",
  "createTextContent",
  "createImageContent",
  "createAudioContent",
  "createBashExecutionMessage",
  "createCustomMessage",
  "createBranchSummaryMessage",
  "createCompactionSummaryMessage",
  "convertToLlmMessages",
  "createToolDescriptor",
  "composeToolDescriptors",
  "selectCompatibleModels",
  "createSessionContext",
  "createSurfaceCommandResult",
];

for (const key of expected) {
  if (typeof mod[key] !== "function") {
    throw new Error(`missing CLJS ESM export: ${key}`);
  }
}

const belief = mod.createEtaBelief({ urgency: 2, ambiguity: -1 });
if (belief.urgency !== 1 || belief.ambiguity !== 0) {
  throw new Error(`createEtaBelief smoke failed: ${JSON.stringify(belief)}`);
}

const batch = mod.createActionBatch({
  repo: "open-hax/proxx",
  trigger: "scheduler.tick",
  target: "open-hax/proxx",
  summary: "cheap reconcile loop found no action",
  belief: mod.createEtaBelief(),
});

if (batch.kind !== "eta-mu-action-batch.v1") {
  throw new Error(`createActionBatch smoke failed: ${JSON.stringify(batch)}`);
}

const bashMessage = mod.createBashExecutionMessage({
  command: "echo hi",
  output: "hi",
  exitCode: 0,
  cancelled: false,
  truncated: false,
  timestamp: "2026-05-30T00:00:00.000Z",
});
const llmMessages = mod.convertToLlmMessages([bashMessage]);
if (llmMessages[0]?.role !== "user" || llmMessages[0]?.content?.[0]?.type !== "text") {
  throw new Error(`convertToLlmMessages smoke failed: ${JSON.stringify(llmMessages)}`);
}

const tools = mod.composeToolDescriptors([
  [mod.createToolDescriptor({ name: "read", description: "Read files", parameters: {} })],
  [mod.createToolDescriptor({ name: "read", description: "Duplicate", parameters: {} })],
]);
if (tools.length !== 1 || tools[0].name !== "read") {
  throw new Error(`composeToolDescriptors smoke failed: ${JSON.stringify(tools)}`);
}

const versionResult = mod.createSurfaceCommandResult({ command: "version", value: "0.70.15" });
if (versionResult.stdout !== "0.70.15" || versionResult.exitCode !== 0) {
  throw new Error(`createSurfaceCommandResult smoke failed: ${JSON.stringify(versionResult)}`);
}

console.log(JSON.stringify({ ok: true, exports: expected, batchKind: batch.kind, llmMessages: llmMessages.length }));
