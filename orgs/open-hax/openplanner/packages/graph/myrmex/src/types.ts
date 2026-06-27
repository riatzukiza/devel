export type MyrmexDiscoveredLink = {
  url: string;
  edgeType: string;
  discoveryChannel?: string;
  anchorText?: string | null;
  anchorContext?: string | null;
  rel?: string | null;
  domPath?: string | null;
  blockSignature?: string | null;
  blockRole?: string | null;
};

export type MyrmexPageEvent = {
  type: "page";
  url: string;
  title: string;
  content: string;
  contentHash: string;
  metadata: Record<string, unknown>;
  outgoing: string[];
  outgoingLinks: MyrmexDiscoveredLink[];
  graphNodeId: string;
  fetchedAt: number;
};

export type MyrmexErrorEvent = {
  type: "error";
  url: string;
  message: string;
  fetchedAt: number;
};

export type MyrmexCheckpointEvent = {
  type: "checkpoint";
  frontierSize: number;
  nodeCount: number;
  edgeCount: number;
  savedAt: number;
};

export type MyrmexEvent = MyrmexPageEvent | MyrmexErrorEvent | MyrmexCheckpointEvent;

export interface MyrmexStats {
  running: boolean;
  paused: boolean;
  pauseReason?: string;
  frontierSize: number;
  inFlight: number;
  pageCount: number;
  errorCount: number;
  lastCheckpointAt: number;
  pendingGraphWrites: number;
  graphBackpressure: GraphStoreBackpressureState;
  heartbeat: MyrmexHeartbeatSnapshot;
}

export interface MyrmexHeartbeatSnapshot {
  state: "resting" | "working" | "surge" | "strained";
  churnScore: number;
  activityScore: number;
  frontierPressure: number;
  queuePressure: number;
  errorPressure: number;
  pacingMultiplier: number;
  suggestedDispatchIntervalMs: number;
  statusLine: string;
}

export interface GraphStoreBackpressureState {
  active: boolean;
  untilMs: number;
  waitMs: number;
  streak: number;
  reason?: string;
  lastSuccessAt?: number;
}

export interface MyrmexConfig {
  ants?: number;
  dispatchIntervalMs?: number;
  maxDispatchBurst?: number;
  maxFrontier?: number;
  maxConcurrency?: number;
  perHostMinIntervalMs?: number;
  requestTimeoutMs?: number;
  revisitAfterMs?: number;
  alpha?: number;
  beta?: number;
  evaporation?: number;
  deposit?: number;
  hostBalanceExponent?: number;
  startupJitterMs?: number;

  shuvCrawlBaseUrl: string;
  shuvCrawlToken?: string;

  proxxBaseUrl?: string;
  proxxAuthToken?: string;

  openPlannerBaseUrl?: string;
  openPlannerApiKey?: string;

  project?: string;
  source?: string;

  includePatterns?: string[];
  excludePatterns?: string[];
  maxContentLength?: number;
  allowedContentTypes?: string[];

  checkpointIntervalMs?: number;
  graphStoreUrl?: string;
  openPlannerMaxPendingWrites?: number;
  openPlannerResumePendingWrites?: number;
  openPlannerMaxEventsPerWrite?: number;
  openPlannerHealthTimeoutMs?: number;
  openPlannerWriteTimeoutMs?: number;
  openPlannerHealthPollMs?: number;
  openPlannerBackoffBaseMs?: number;
  openPlannerBackoffMaxMs?: number;
}
