export type RenderConfig = {
  maxRenderNodes: number;
  maxRenderEdges: number;
};

export type WeaverConfig = {
  ants: number;
  dispatchIntervalMs: number;
  maxConcurrency: number;
  perHostMinIntervalMs: number;
  revisitAfterMs: number;

  alpha: number;
  beta: number;
  evaporation: number;
  deposit: number;

  requestTimeoutMs: number;
};

export type ScanConfig = {
  maxFileBytes: number;
  rescanIntervalMs: number;
};

export type RuntimeConfig = {
  render: RenderConfig;
  weaver: WeaverConfig;
  scan: ScanConfig;
};

export type ConfigPatch = {
  render?: Partial<RenderConfig>;
  weaver?: Partial<WeaverConfig>;
  scan?: Partial<ScanConfig>;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function num(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeRender(input: Partial<RenderConfig> | undefined, prev: RenderConfig): RenderConfig {
  const maxRenderNodes = clamp(Math.floor(num(input?.maxRenderNodes, prev.maxRenderNodes)), 200, 60000);
  const maxRenderEdges = clamp(Math.floor(num(input?.maxRenderEdges, prev.maxRenderEdges)), 200, 240000);
  return { maxRenderNodes, maxRenderEdges };
}

function normalizeWeaver(input: Partial<WeaverConfig> | undefined, prev: WeaverConfig): WeaverConfig {
  const ants = clamp(Math.floor(num(input?.ants, prev.ants)), 1, 64);
  const dispatchIntervalMs = clamp(Math.floor(num(input?.dispatchIntervalMs, prev.dispatchIntervalMs)), 250, 300_000);
  const maxConcurrency = clamp(Math.floor(num(input?.maxConcurrency, prev.maxConcurrency)), 1, 32);
  const perHostMinIntervalMs = clamp(Math.floor(num(input?.perHostMinIntervalMs, prev.perHostMinIntervalMs)), 0, 120_000);
  const revisitAfterMs = clamp(Math.floor(num(input?.revisitAfterMs, prev.revisitAfterMs)), 30_000, 1000 * 60 * 60 * 24 * 90);

  const alpha = clamp(num(input?.alpha, prev.alpha), 0, 4);
  const beta = clamp(num(input?.beta, prev.beta), 0, 6);
  const evaporation = clamp(num(input?.evaporation, prev.evaporation), 0, 0.2);
  const deposit = clamp(num(input?.deposit, prev.deposit), 0, 5);
  const requestTimeoutMs = clamp(Math.floor(num(input?.requestTimeoutMs, prev.requestTimeoutMs)), 1500, 60_000);

  return {
    ants,
    dispatchIntervalMs,
    maxConcurrency,
    perHostMinIntervalMs,
    revisitAfterMs,
    alpha,
    beta,
    evaporation,
    deposit,
    requestTimeoutMs,
  };
}

function normalizeScan(input: Partial<ScanConfig> | undefined, prev: ScanConfig): ScanConfig {
  const maxFileBytes = clamp(Math.floor(num(input?.maxFileBytes, prev.maxFileBytes)), 10_000, 5_000_000);
  const rescanIntervalMs = clamp(Math.floor(num(input?.rescanIntervalMs, prev.rescanIntervalMs)), 30_000, 1000 * 60 * 60 * 12);
  return { maxFileBytes, rescanIntervalMs };
}

export function defaultConfigFromEnv(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const render: RenderConfig = {
    maxRenderNodes: num(env.MAX_RENDER_NODES, 6000),
    maxRenderEdges: num(env.MAX_RENDER_EDGES, 12000),
  };

  const weaver: WeaverConfig = {
    ants: num(env.WEAVER_ANTS, 4),
    dispatchIntervalMs: num(env.WEAVER_DISPATCH_INTERVAL_MS, 15000),
    maxConcurrency: num(env.WEAVER_MAX_CONCURRENCY, 2),
    perHostMinIntervalMs: num(env.WEAVER_PER_HOST_MIN_INTERVAL_MS, 4000),
    revisitAfterMs: num(env.WEAVER_REVISIT_AFTER_MS, 1000 * 60 * 60 * 8),

    alpha: num(env.WEAVER_ALPHA, 1.2),
    beta: num(env.WEAVER_BETA, 3.0),
    evaporation: num(env.WEAVER_EVAPORATION, 0.03),
    deposit: num(env.WEAVER_DEPOSIT, 0.35),

    requestTimeoutMs: num(env.WEAVER_REQUEST_TIMEOUT_MS, 15000),
  };

  const scan: ScanConfig = {
    maxFileBytes: num(env.SCAN_MAX_FILE_BYTES, 512_000),
    rescanIntervalMs: num(env.SCAN_RESCAN_INTERVAL_MS, 5 * 60 * 1000),
  };

  return {
    render: normalizeRender(render, render),
    weaver: normalizeWeaver(weaver, weaver),
    scan: normalizeScan(scan, scan),
  };
}

export function applyConfigPatch(prev: RuntimeConfig, patch: ConfigPatch): RuntimeConfig {
  return {
    render: normalizeRender(patch.render, prev.render),
    weaver: normalizeWeaver(patch.weaver, prev.weaver),
    scan: normalizeScan(patch.scan, prev.scan),
  };
}
