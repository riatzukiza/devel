import type { DiscoveredLink, FetchBackend } from "./fetch-backend.js";

export type WeaverUrl = string;

export type WeaverPageEvent = {
  type: "page";
  url: WeaverUrl;
  status: number;
  contentType: string;
  fetchedAt: number;
  outgoing: WeaverUrl[];
  outgoingLinks?: DiscoveredLink[];
  content?: string;
  title?: string;
  metadata?: Record<string, unknown>;
};

export type WeaverErrorEvent = {
  type: "error";
  url: WeaverUrl;
  fetchedAt: number;
  message: string;
};

export type WeaverEvent = WeaverPageEvent | WeaverErrorEvent;

export type GraphWeaverAcoOptions = {
  userAgent?: string;
  ants?: number;
  dispatchIntervalMs?: number;
  maxDispatchBurst?: number;
  maxConcurrency?: number;
  perHostMinIntervalMs?: number;
  requestTimeoutMs?: number;

  /** How long before a visited URL becomes interesting again (staleness). */
  revisitAfterMs?: number;

  /** ACO parameters. */
  alpha?: number;
  beta?: number;
  evaporation?: number;
  deposit?: number;

  /** Hard cap on stored frontier size (drops least-relevant). */
  maxFrontier?: number;

  /** Penalize hosts that dominate the current candidate set so sitemap-heavy domains do not monopolize traversal. */
  hostBalanceExponent?: number;

  /** Startup jitter to avoid synchronized background bursts. */
  startupJitterMs?: number;

  /** Custom fetch backend. Defaults to simple fetch() + HTML link extraction. */
  fetchBackend?: FetchBackend;
};
