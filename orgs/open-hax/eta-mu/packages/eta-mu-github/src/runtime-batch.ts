import {
  createActionBatch,
  createEtaBelief,
  etaMuActionBatchSchema,
  type EtaMuActionBatch,
  type EtaMuPlanningContextInput,
  type MuCandidate,
  type PanelName,
} from "@open-hax/eta-mu-runtime";

import type {
  EtaMuAgentDecision,
  EtaMuActionBatchRecord,
  EventClassification,
  GitHubEventContext,
} from "./types.js";

const clampUnit = (value: number): number => Math.max(0, Math.min(1, value));

const eventTarget = (context: GitHubEventContext): string => {
  if (context.pullRequestNumber) {
    return `pr#${context.pullRequestNumber}`;
  }
  if (context.issueNumber) {
    return `issue#${context.issueNumber}`;
  }
  return `${context.repo.owner}/${context.repo.name}`;
};

const eventSummary = (
  classification: EventClassification,
  context: GitHubEventContext,
): string => {
  switch (classification.trigger) {
    case "mention":
      return `Direct mention received on ${eventTarget(context)}.`;
    case "review-activity":
      return `Review activity updated on ${eventTarget(context)}.`;
    case "pr-activity":
      return `Pull request activity updated on ${eventTarget(context)}.`;
    case "issue-opened":
      return `Issue intake opened on ${eventTarget(context)}.`;
    default:
      return `No actionable eta-mu trigger detected for ${eventTarget(context)}.`;
  }
};

const inferBelief = (
  classification: EventClassification,
  context: GitHubEventContext,
) => {
  const unresolvedReviewThreads = context.unresolvedReviewThreads?.length ?? 0;
  const hasMainBase = context.pullRequestBase?.ref === "main";
  const isMention = classification.trigger === "mention";
  const isReview = classification.trigger === "review-activity";
  const isPr = classification.trigger === "pr-activity";
  const isIssue = classification.trigger === "issue-opened";

  return createEtaBelief({
    urgency: clampUnit(
      (isMention ? 0.8 : 0) +
        (isReview ? 0.75 : 0) +
        (isPr ? 0.55 : 0) +
        (isIssue ? 0.45 : 0),
    ),
    ambiguity: clampUnit(isIssue ? 0.55 : isMention ? 0.35 : 0.25),
    socialFriction: clampUnit(
      unresolvedReviewThreads > 0 ? 0.45 + unresolvedReviewThreads * 0.1 : 0.1,
    ),
    deployRisk: clampUnit(hasMainBase ? 0.6 : isPr ? 0.3 : 0.1),
    reviewDebt: clampUnit(unresolvedReviewThreads / 4),
    drift: clampUnit(isIssue ? 0.45 : isReview ? 0.3 : 0.2),
    crust: 0.15,
    bloomNeed: 0.2,
    userIntentConfidence: clampUnit(isMention ? 0.9 : isIssue ? 0.75 : 0.6),
  });
};

export const buildPlanningContext = (
  classification: EventClassification,
  context: GitHubEventContext,
): EtaMuPlanningContextInput => ({
  repo: `${context.repo.owner}/${context.repo.name}`,
  trigger: classification.trigger,
  target: eventTarget(context),
  summary: eventSummary(classification, context),
  belief: inferBelief(classification, context),
  unresolvedReviewThreads: context.unresolvedReviewThreads?.length ?? 0,
  failingChecks: [],
  hasPendingHumanAttention:
    classification.trigger === "mention" || classification.trigger === "issue-opened",
  quietWindowDetected: false,
  pendingCommit: false,
});

export const parseActionBatch = (
  value: string,
  fallback: EtaMuActionBatch,
): EtaMuActionBatch => {
  try {
    return etaMuActionBatchSchema.parse(JSON.parse(value) as Record<string, unknown>);
  } catch {
    return fallback;
  }
};

const primaryAction = (batch: EtaMuActionBatch): MuCandidate | undefined =>
  batch.actions.find((action: MuCandidate) => action.kind !== "noop") ?? batch.actions[0];

const renderActionLines = (batch: EtaMuActionBatch): string[] => {
  const actions = batch.actions.slice(0, 4).map((action: MuCandidate) =>
    `- \`${action.kind}\` (${action.costClass}, confidence ${action.confidence.toFixed(2)}): ${action.reason}`,
  );
  return actions.length > 0 ? actions : ["- `noop`: continue sensing the field."];
};

export const formatActionBatchMarkdown = (batch: EtaMuActionBatch): string => {
  const lines = [
    "## eta-mu",
    "",
    batch.summary,
    "",
    `- panels: ${batch.panels.map((panel: PanelName) => `\`${panel}\``).join(", ")}`,
    `- breath: ${batch.breath.shouldCommit ? "commit" : "continue"} (${batch.breath.reason})`,
    "",
    "### proposed movement",
    ...renderActionLines(batch),
  ];

  return lines.join("\n");
};

export const mapActionBatchToDecision = (
  batch: EtaMuActionBatch,
): EtaMuAgentDecision => {
  const action = primaryAction(batch);
  if (!action || action.kind === "noop") {
    return {
      shouldRespond: false,
      mode: "noop",
      body: "",
    };
  }

  if (action.kind === "patch") {
    return {
      shouldRespond: true,
      mode: "autofix",
      body: action.reason,
    };
  }

  if (action.kind === "summary") {
    return {
      shouldRespond: true,
      mode: "upsert-state",
      body: formatActionBatchMarkdown(batch),
    };
  }

  return {
    shouldRespond: true,
    mode: "reply",
    body: formatActionBatchMarkdown(batch),
  };
};

export const buildDraftActionBatch = (
  classification: EventClassification,
  context: GitHubEventContext,
): EtaMuActionBatch => createActionBatch(buildPlanningContext(classification, context));

export const publishActionBatch = async (
  controlPlaneUrl: string | undefined,
  record: EtaMuActionBatchRecord,
): Promise<void> => {
  if (!controlPlaneUrl) {
    return;
  }

  const endpoint = new URL("/api/control-plane/action-batches", controlPlaneUrl).toString();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error(`control plane action-batch publish failed: ${response.status}`);
  }
}
