export interface RepoSlug {
  owner: string;
  name: string;
}

export interface EtaMuConfig {
  readonly reviewActors: readonly string[];
  readonly mentionTokens: readonly string[];
  readonly ignoreLogins: readonly string[];
  readonly appLogin: string;
  readonly reviewCheckName: string;
  readonly stateCommentMarker: string;
  readonly autofixCommentMarker: string;
  readonly controlPlaneUrl?: string;
  readonly commitAuthorName: string;
  readonly commitAuthorEmail: string;
  readonly modelProvider?: string;
  readonly modelId?: string;
}

export type EtaMuTrigger = "issue-opened" | "mention" | "pr-activity" | "review-activity" | "noop";

export interface EventClassification {
  readonly trigger: EtaMuTrigger;
  readonly shouldRun: boolean;
  readonly reason: string;
  readonly issueNumber?: number;
  readonly pullRequestNumber?: number;
  readonly debounceKey: string;
}

export interface ReviewThreadCommentSummary {
  readonly authorLogin?: string;
  readonly body?: string;
  readonly path?: string;
  readonly url?: string;
}

export interface ReviewThreadSummary {
  readonly id: string;
  readonly isResolved: boolean;
  readonly comments: readonly ReviewThreadCommentSummary[];
}

export interface ReviewGateResult {
  readonly trackedActors: readonly string[];
  readonly unresolvedThreads: readonly ReviewThreadSummary[];
}

export interface EventCommentContext {
  readonly body?: string;
  readonly url?: string;
  readonly authorLogin?: string;
}

export interface PullRequestRefContext {
  readonly repoFullName?: string;
  readonly ref?: string;
  readonly sha?: string;
}

export interface GitHubEventContext {
  readonly repo: RepoSlug;
  readonly trigger: EtaMuTrigger;
  readonly issueNumber?: number;
  readonly pullRequestNumber?: number;
  readonly issueTitle?: string;
  readonly issueBody?: string;
  readonly issueUrl?: string;
  readonly pullRequestTitle?: string;
  readonly pullRequestBody?: string;
  readonly pullRequestUrl?: string;
  readonly pullRequestFiles?: readonly string[];
  readonly pullRequestHead?: PullRequestRefContext;
  readonly pullRequestBase?: PullRequestRefContext;
  readonly comment?: EventCommentContext;
  readonly reviewSummary?: string;
  readonly unresolvedReviewThreads?: readonly ReviewThreadSummary[];
}

export interface EtaMuAgentDecision {
  readonly shouldRespond: boolean;
  readonly mode: "reply" | "upsert-state" | "autofix" | "noop";
  readonly body: string;
}

export interface EtaMuActionBatchRecord {
  readonly source?: string;
  readonly issue_number?: number;
  readonly pull_request_number?: number;
  readonly batch: Record<string, unknown>;
}

export interface AutofixResult {
  readonly applied: boolean;
  readonly pushed: boolean;
  readonly reason: string;
  readonly changedFiles: readonly string[];
  readonly commitSha?: string;
  readonly summary: string;
}
