import { normalizeLogin } from "./config.js";
import type { EtaMuConfig, EventClassification } from "./types.js";

const asNumber = (value: unknown): number | undefined => (typeof value === "number" ? value : undefined);
const asString = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);

const includesToken = (body: string | undefined, tokens: readonly string[]): boolean => {
  if (!body) return false;
  const lowered = body.toLowerCase();
  return tokens.some((token) => lowered.includes(token.toLowerCase()));
};

export const classifyGithubEvent = (
  eventName: string,
  payload: Record<string, unknown>,
  config: EtaMuConfig,
  repoSlug: string,
): EventClassification => {
  const action = asString(payload.action) ?? "unknown";
  const sender = normalizeLogin(asString((payload.sender as { login?: unknown } | undefined)?.login));
  if (sender && config.ignoreLogins.map(normalizeLogin).includes(sender)) {
    return {
      trigger: "noop",
      shouldRun: false,
      reason: `ignored actor ${sender}`,
      debounceKey: `${repoSlug}:noop:${sender}`,
    };
  }

  const issue = payload.issue as { number?: unknown; pull_request?: unknown } | undefined;
  const pullRequest = payload.pull_request as { number?: unknown } | undefined;
  const issueNumber = asNumber(issue?.number);
  const pullRequestNumber = asNumber(pullRequest?.number) ?? (issue?.pull_request ? issueNumber : undefined);
  const commentBody = asString((payload.comment as { body?: unknown } | undefined)?.body);

  if (eventName === "issues" && (action === "opened" || action === "edited")) {
    return {
      trigger: "issue-opened",
      shouldRun: true,
      reason: `issue ${action}`,
      issueNumber,
      debounceKey: `${repoSlug}:issue:${issueNumber ?? 0}`,
    };
  }

  if (eventName === "issue_comment") {
    if (includesToken(commentBody, config.mentionTokens)) {
      return {
        trigger: "mention",
        shouldRun: true,
        reason: `mention in issue comment (${action})`,
        issueNumber,
        pullRequestNumber,
        debounceKey: `${repoSlug}:mention:${pullRequestNumber ?? issueNumber ?? 0}`,
      };
    }
    return {
      trigger: "noop",
      shouldRun: false,
      reason: "issue comment without eta-mu mention",
      issueNumber,
      pullRequestNumber,
      debounceKey: `${repoSlug}:noop:issue-comment:${pullRequestNumber ?? issueNumber ?? 0}`,
    };
  }

  if (eventName === "pull_request" && ["opened", "reopened", "synchronize", "edited", "ready_for_review"].includes(action)) {
    return {
      trigger: "pr-activity",
      shouldRun: true,
      reason: `pull request ${action}`,
      pullRequestNumber,
      debounceKey: `${repoSlug}:pr:${pullRequestNumber ?? 0}`,
    };
  }

  if (eventName === "pull_request_review" && action === "submitted") {
    return {
      trigger: "review-activity",
      shouldRun: true,
      reason: "pull request review submitted",
      pullRequestNumber,
      debounceKey: `${repoSlug}:review:${pullRequestNumber ?? 0}`,
    };
  }

  if (eventName === "pull_request_review_comment" && action === "created") {
    return {
      trigger: includesToken(commentBody, config.mentionTokens) ? "mention" : "review-activity",
      shouldRun: true,
      reason: includesToken(commentBody, config.mentionTokens)
        ? "mention in review comment"
        : "review comment created",
      pullRequestNumber,
      debounceKey: `${repoSlug}:${includesToken(commentBody, config.mentionTokens) ? "mention" : "review"}:${pullRequestNumber ?? 0}`,
    };
  }

  return {
    trigger: "noop",
    shouldRun: false,
    reason: `unsupported event ${eventName}:${action}`,
    issueNumber,
    pullRequestNumber,
    debounceKey: `${repoSlug}:noop:${eventName}:${action}`,
  };
};
