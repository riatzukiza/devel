export interface RepoSlug {
  readonly owner: string;
  readonly name: string;
}

export interface RemoteInfo {
  readonly name: string;
  readonly fetchUrl: string;
  readonly pushUrl: string;
  readonly slug: RepoSlug | null;
}

export interface ForkTarget {
  readonly source: RepoSlug;
  readonly desiredOrigin: RepoSlug;
  readonly sourceRemoteUrl: string;
}

export interface SubmoduleForkPlan {
  readonly path: string;
  readonly remotes: readonly RemoteInfo[];
  readonly origin: RemoteInfo | null;
  readonly upstream: RemoteInfo | null;
  readonly target: ForkTarget | null;
  readonly needsFork: boolean;
  readonly needsOriginRewrite: boolean;
  readonly needsUpstream: boolean;
  readonly localOnly: boolean;
  readonly reasons: readonly string[];
}

export interface AutoForkTaxState {
  readonly version: number;
  readonly lastRunAt?: string;
  readonly lastSnapshotBranch?: string;
  readonly lastSnapshotTag?: string;
  readonly lastSnapshotHead?: string;
  readonly lastPullRequestUrl?: string;
  readonly lastPullRequestNumber?: number;
}

export interface SnapshotResult {
  readonly branch: string;
  readonly tag: string;
  readonly head: string;
  readonly baseBranch: string;
  readonly pullRequestUrl: string;
  readonly pullRequestNumber: number;
  readonly reviewCommentUrl?: string;
}
