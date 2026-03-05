import { Readable } from "node:stream";

import Fastify, { type FastifyInstance, type FastifyReply } from "fastify";

import { DEFAULT_MODELS, type ProxyConfig } from "./lib/config.js";
import { KeyPool, type ProviderCredential } from "./lib/key-pool.js";
import { loadModels, toOpenAiModel } from "./lib/models.js";
import { RequestLogStore } from "./lib/request-log-store.js";
import {
  buildForwardHeaders,
  buildUpstreamHeaders,
  copyUpstreamHeaders,
  isRateLimitResponse,
  openAiError,
  parseRetryAfterMs,
} from "./lib/proxy.js";
import {
  chatCompletionToSse,
  chatRequestToResponsesRequest,
  responsesToChatCompletion,
  shouldUseResponsesUpstream,
} from "./lib/responses-compat.js";
import {
  chatRequestToMessagesRequest,
  messagesToChatCompletion,
  shouldUseMessagesUpstream,
} from "./lib/messages-compat.js";
import {
  chatRequestToOllamaRequest,
  ollamaToChatCompletion,
  shouldUseOllamaUpstream,
} from "./lib/ollama-compat.js";
import { registerUiRoutes } from "./lib/ui-routes.js";

interface ChatCompletionRequest {
  readonly model?: string;
  readonly messages?: unknown;
  readonly stream?: boolean;
  readonly [key: string]: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function appendCsvHeaderValue(headers: Headers, name: string, value: string): void {
  const existing = headers.get(name);
  if (!existing) {
    headers.set(name, value);
    return;
  }

  const existingTokens = existing
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (existingTokens.includes(value)) {
    return;
  }

  headers.set(name, `${existing}, ${value}`);
}

function shouldEnableInterleavedThinkingHeader(upstreamPayload: Record<string, unknown>): boolean {
  const thinking = isRecord(upstreamPayload["thinking"]) ? upstreamPayload["thinking"] : null;
  if (!thinking) {
    return false;
  }

  return asString(thinking["type"]) === "enabled";
}

function reasoningEffortIsDisabled(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "none" || normalized === "disable" || normalized === "disabled" || normalized === "off";
}

function includesReasoningTrace(value: unknown): boolean {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.some((entry) => asString(entry) === "reasoning.encrypted_content");
}

function requestWantsReasoningTrace(body: Record<string, unknown>): boolean {
  if (includesReasoningTrace(body["include"])) {
    return true;
  }

  const explicitThinking = isRecord(body["thinking"]) ? body["thinking"] : null;
  if (explicitThinking) {
    const type = asString(explicitThinking["type"]);
    if (type === "enabled") {
      return true;
    }

    if (type === "disabled") {
      return false;
    }
  }

  const reasoning = isRecord(body["reasoning"]) ? body["reasoning"] : null;
  const reasoningEffort = asString(reasoning?.["effort"])
    ?? asString(body["reasoning_effort"])
    ?? asString(body["reasoningEffort"]);

  if (reasoningEffort) {
    return !reasoningEffortIsDisabled(reasoningEffort);
  }

  return reasoning !== null;
}

function chatCompletionHasReasoningContent(completion: Record<string, unknown>): boolean {
  const topLevelReasoning = asString(completion["reasoning_content"]) ?? asString(completion["reasoning"]);
  if (topLevelReasoning && topLevelReasoning.length > 0) {
    return true;
  }

  const choices = Array.isArray(completion["choices"]) ? completion["choices"] : [];
  for (const choice of choices) {
    if (!isRecord(choice)) {
      continue;
    }

    const message = isRecord(choice["message"]) ? choice["message"] : null;
    if (message) {
      const reasoning = asString(message["reasoning_content"]) ?? asString(message["reasoning"]);
      if (reasoning && reasoning.length > 0) {
        return true;
      }
    }

    const delta = isRecord(choice["delta"]) ? choice["delta"] : null;
    if (delta) {
      const reasoning = asString(delta["reasoning_content"]) ?? asString(delta["reasoning"]);
      if (reasoning && reasoning.length > 0) {
        return true;
      }
    }
  }

  return false;
}

function hasBearerToken(header: string | undefined, expectedToken: string): boolean {
  if (!header) {
    return false;
  }

  const [scheme, token] = header.split(/\s+/, 2);
  return scheme.toLowerCase() === "bearer" && token === expectedToken;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function extractErrorMessage(payload: unknown): string | undefined {
  if (typeof payload === "string") {
    return payload;
  }

  if (!isRecord(payload)) {
    return undefined;
  }

  const directMessage = asString(payload["message"]);
  if (directMessage) {
    return directMessage;
  }

  const errorValue = payload["error"];
  if (typeof errorValue === "string") {
    return errorValue;
  }

  if (!isRecord(errorValue)) {
    return undefined;
  }

  return asString(errorValue["message"])
    ?? asString(errorValue["error"])
    ?? asString(errorValue["code"]);
}

function truncateForLog(value: string, maxLength = 240): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, Math.max(0, maxLength - 1))}…`;
}

interface UpstreamErrorSummary {
  readonly upstreamErrorCode?: string;
  readonly upstreamErrorType?: string;
  readonly upstreamErrorMessage?: string;
}

async function summarizeUpstreamError(response: Response): Promise<UpstreamErrorSummary> {
  let payload: unknown;
  try {
    payload = await response.clone().json();
  } catch {
    try {
      const text = await response.clone().text();
      return text.length > 0 ? { upstreamErrorMessage: truncateForLog(text) } : {};
    } catch {
      return {};
    }
  }

  if (!isRecord(payload)) {
    return {};
  }

  const errorValue = isRecord(payload.error) ? payload.error : null;
  const code = asString(errorValue?.code) ?? asString(payload.code);
  const type = asString(errorValue?.type) ?? asString(payload.type);
  const message = extractErrorMessage(payload);

  return {
    upstreamErrorCode: code ? truncateForLog(code, 80) : undefined,
    upstreamErrorType: type ? truncateForLog(type, 80) : undefined,
    upstreamErrorMessage: message ? truncateForLog(message) : undefined,
  };
}

async function responseIndicatesMissingModel(response: Response, requestedModel: string): Promise<boolean> {
  if (![400, 404, 422].includes(response.status)) {
    return false;
  }

  let payload: unknown;
  try {
    payload = await response.clone().json();
  } catch {
    try {
      payload = await response.clone().text();
    } catch {
      return false;
    }
  }

  const message = extractErrorMessage(payload);
  if (!message) {
    return false;
  }

  const lowered = message.toLowerCase();
  if (!lowered.includes("model") || !lowered.includes("not found")) {
    return false;
  }

  const normalizedRequestedModel = requestedModel.trim().toLowerCase();
  return normalizedRequestedModel.length === 0
    || lowered.includes(normalizedRequestedModel)
    || lowered.includes("model_not_found");
}

const QUOTA_ERROR_PATTERNS = [
  "outstanding_balance",
  "outstanding-balance",
  "outstanding balance",
  "outstanding balence",
  "insufficient_balance",
  "insufficient-balance",
  "insufficient balance",
  "balance_exhausted",
  "balance-exhausted",
  "balance exhausted",
  "outstanding_quota",
  "outstanding-quota",
  "outstanding quota",
  "insufficient_quota",
  "insufficient-quota",
  "insufficient quota",
  "quota_exceeded",
  "quota-exceeded",
  "quota exceeded",
  "credits_exhausted",
  "credits-exhausted",
  "credits exhausted",
  "credit_exhausted",
  "credit-exhausted",
  "credit exhausted",
  "insufficient_credits",
  "insufficient-credits",
  "insufficient credits",
  "payment_required",
  "payment-required",
  "payment required",
  "monthly limit",
];

function messageIndicatesQuotaError(message: string): boolean {
  const lowered = message.toLowerCase();
  const normalized = lowered.replace(/[\s_-]+/g, " ");

  return QUOTA_ERROR_PATTERNS.some((pattern) => {
    const normalizedPattern = pattern.replace(/[\s_-]+/g, " ");
    return lowered.includes(pattern) || normalized.includes(normalizedPattern);
  });
}

function responseIsEventStream(response: Response): boolean {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.toLowerCase().includes("text/event-stream");
}

function payloadLooksLikeError(payload: unknown): boolean {
  if (!isRecord(payload)) {
    return false;
  }

  if (payload.error !== undefined) {
    return true;
  }

  const type = asString(payload.type);
  if (type && type.toLowerCase().includes("error")) {
    return true;
  }

  const event = asString(payload.event);
  if (event && event.toLowerCase().includes("error")) {
    return true;
  }

  const object = asString(payload.object);
  if (object && object.toLowerCase().includes("error")) {
    return true;
  }

  return false;
}

async function responseIndicatesQuotaError(response: Response): Promise<boolean> {
  if (response.status === 402) {
    return true;
  }

  if (response.status === 429 || response.status === 403 || response.status === 503) {
    return false;
  }

  if (responseIsEventStream(response)) {
    return false;
  }

  let payload: unknown;
  try {
    payload = await response.clone().json();
  } catch {
    try {
      payload = await response.clone().text();
    } catch {
      return false;
    }
  }

  const payloadIsErrorLike = payloadLooksLikeError(payload);
  if (response.status >= 200 && response.status < 300 && !payloadIsErrorLike) {
    return false;
  }

  const message = extractErrorMessage(payload);
  if (message) {
    return messageIndicatesQuotaError(message);
  }

  if (!payloadIsErrorLike) {
    return false;
  }

  try {
    return messageIndicatesQuotaError(JSON.stringify(payload));
  } catch {
    return false;
  }
}

async function fetchWithResponseTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort(new DOMException("The operation was aborted due to timeout", "TimeoutError"));
  }, timeoutMs);

  const mergedSignal = init.signal
    ? AbortSignal.any([init.signal, controller.signal])
    : controller.signal;

  try {
    return await fetch(url, {
      ...init,
      signal: mergedSignal
    });
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function stripModelPrefix(model: string, prefixes: readonly string[]): string {
  const loweredModel = model.toLowerCase();

  for (const prefix of prefixes) {
    if (!prefix) {
      continue;
    }

    if (!loweredModel.startsWith(prefix.toLowerCase())) {
      continue;
    }

    const stripped = model.slice(prefix.length).trim();
    return stripped.length > 0 ? stripped : model;
  }

  return model;
}

function hasModelPrefix(model: string, prefixes: readonly string[]): boolean {
  const loweredModel = model.toLowerCase();
  return prefixes.some((prefix) => prefix.length > 0 && loweredModel.startsWith(prefix.toLowerCase()));
}

interface ProviderRoute {
  readonly providerId: string;
  readonly baseUrl: string;
}

interface ResolvedModelCatalog {
  readonly modelIds: readonly string[];
  readonly aliasTargets: Readonly<Record<string, string>>;
  readonly dynamicOllamaModelIds: readonly string[];
}

function dedupeModelIds(modelIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const modelId of modelIds) {
    const normalized = modelId.trim();
    if (normalized.length === 0 || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    deduped.push(normalized);
  }

  return deduped;
}

function parseModelIdsFromCatalogPayload(payload: unknown): string[] {
  if (Array.isArray(payload)) {
    return dedupeModelIds(
      payload.filter((entry): entry is string => typeof entry === "string")
    );
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload["data"])) {
    const dataModelIds = payload["data"]
      .map((entry) => (isRecord(entry) ? asString(entry["id"]) : undefined))
      .filter((entry): entry is string => typeof entry === "string");

    return dedupeModelIds(dataModelIds);
  }

  if (Array.isArray(payload["models"])) {
    const modelsModelIds = payload["models"]
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }

        if (!isRecord(entry)) {
          return undefined;
        }

        return asString(entry["id"]) ?? asString(entry["name"]) ?? asString(entry["model"]);
      })
      .filter((entry): entry is string => typeof entry === "string");

    return dedupeModelIds(modelsModelIds);
  }

  return [];
}

function parseModelScaleScore(modelTag: string): number | undefined {
  const match = /(\d+(?:\.\d+)?)([bt])/i.exec(modelTag);
  if (!match) {
    return undefined;
  }

  const amount = Number.parseFloat(match[1] ?? "");
  if (!Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }

  const unit = (match[2] ?? "").toLowerCase();
  return unit === "t" ? amount * 1000 : amount;
}

function buildLargestModelAliases(modelIds: readonly string[]): Record<string, string> {
  const knownModelIds = new Set(modelIds);
  const aliases = new Map<string, { readonly modelId: string; readonly score: number; readonly tagLength: number }>();

  for (const modelId of modelIds) {
    const separatorIndex = modelId.indexOf(":");
    if (separatorIndex <= 0 || separatorIndex >= modelId.length - 1) {
      continue;
    }

    const alias = modelId.slice(0, separatorIndex);
    const modelTag = modelId.slice(separatorIndex + 1);
    const score = parseModelScaleScore(modelTag);
    if (!score || score <= 0) {
      continue;
    }

    const current = aliases.get(alias);
    if (!current) {
      aliases.set(alias, {
        modelId,
        score,
        tagLength: modelTag.length
      });
      continue;
    }

    const shouldReplace = score > current.score
      || (score === current.score && modelTag.length < current.tagLength)
      || (score === current.score && modelTag.length === current.tagLength && modelId < current.modelId);

    if (shouldReplace) {
      aliases.set(alias, {
        modelId,
        score,
        tagLength: modelTag.length
      });
    }
  }

  const aliasTargets: Record<string, string> = {};
  for (const [alias, selected] of aliases.entries()) {
    if (!knownModelIds.has(alias)) {
      aliasTargets[alias] = selected.modelId;
    }
  }

  return aliasTargets;
}

interface ProviderAccountCandidate {
  readonly providerId: string;
  readonly baseUrl: string;
  readonly account: ProviderCredential;
}

function buildProviderRoutes(config: ProxyConfig, useOpenAiUpstream: boolean): ProviderRoute[] {
  if (useOpenAiUpstream) {
    return [{
      providerId: config.openaiProviderId,
      baseUrl: config.openaiBaseUrl
    }];
  }

  const routes: ProviderRoute[] = [];
  const seen = new Set<string>();
  const providerIds = [config.upstreamProviderId, ...config.upstreamFallbackProviderIds];

  for (const providerId of providerIds) {
    if (seen.has(providerId)) {
      continue;
    }
    seen.add(providerId);

    const baseUrl = (config.upstreamProviderBaseUrls[providerId] ?? "").trim().replace(/\/+$/, "");
    if (baseUrl.length === 0) {
      continue;
    }

    routes.push({
      providerId,
      baseUrl
    });
  }

  return routes;
}

async function minMsUntilAnyProviderKeyReady(keyPool: KeyPool, routes: readonly ProviderRoute[]): Promise<number> {
  let minReadyInMs = 0;

  for (const route of routes) {
    try {
      const retryInMs = await keyPool.msUntilAnyKeyReady(route.providerId);
      if (retryInMs > 0 && (minReadyInMs === 0 || retryInMs < minReadyInMs)) {
        minReadyInMs = retryInMs;
      }
    } catch {
      // Ignore status errors and keep evaluating other providers.
    }
  }

  return minReadyInMs;
}

function buildOllamaCatalogRoutes(config: ProxyConfig): ProviderRoute[] {
  return Object.entries(config.upstreamProviderBaseUrls)
    .filter(([providerId]) => providerId.toLowerCase().includes("ollama"))
    .map(([providerId, baseUrl]) => ({
      providerId,
      baseUrl: baseUrl.replace(/\/+$/, "")
    }))
    .filter((route) => route.baseUrl.length > 0);
}

function providerIdLooksLikeOllama(providerId: string): boolean {
  return providerId.toLowerCase().includes("ollama");
}

function shouldUseLocalOllama(model: string, patterns: readonly string[]): boolean {
  const lowered = model.toLowerCase();
  for (const pattern of patterns) {
    if (lowered.includes(pattern.toLowerCase())) {
      return true;
    }
  }
  return false;
}

function resolveProviderRoutesForModel(
  routes: readonly ProviderRoute[],
  routedModel: string,
  catalog: ResolvedModelCatalog
): ProviderRoute[] {
  if (routes.length <= 1) {
    return [...routes];
  }

  const dynamicOllamaModels = new Set(
    catalog.dynamicOllamaModelIds.map((modelId) => modelId.trim().toLowerCase()).filter((modelId) => modelId.length > 0)
  );
  if (dynamicOllamaModels.size === 0) {
    return [...routes];
  }

  const normalizedModel = routedModel.trim().toLowerCase();
  const modelKnownOnOllama = dynamicOllamaModels.has(normalizedModel);

  if (!modelKnownOnOllama) {
    const nonOllamaRoutes = routes.filter((route) => !providerIdLooksLikeOllama(route.providerId));
    return nonOllamaRoutes.length > 0 ? nonOllamaRoutes : [...routes];
  }

  const ollamaRoutes = routes.filter((route) => providerIdLooksLikeOllama(route.providerId));
  const nonOllamaRoutes = routes.filter((route) => !providerIdLooksLikeOllama(route.providerId));
  return [...ollamaRoutes, ...nonOllamaRoutes];
}

const SUPPORTED_V1_ENDPOINTS = [
  "POST /v1/chat/completions",
  "GET /v1/models",
  "GET /v1/models/:model"
] as const;

function sendOpenAiError(
  reply: FastifyReply,
  statusCode: number,
  message: string,
  type: string,
  code?: string
): void {
  if (code) {
    reply.header("x-open-hax-error-code", code);
  }
  reply.code(statusCode).send(openAiError(message, type, code));
}

export async function createApp(config: ProxyConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    bodyLimit: 300 * 1024 * 1024
  });

  const keyPool = new KeyPool({
    keysFilePath: config.keysFilePath,
    reloadIntervalMs: config.keyReloadMs,
    defaultCooldownMs: config.keyCooldownMs,
    defaultProviderId: config.upstreamProviderId
  });
  try {
    await keyPool.warmup();
  } catch (error) {
    app.log.warn({ error: toErrorMessage(error) }, "failed to warm up provider accounts; non-keyed routes may still work");
  }
  const requestLogStore = new RequestLogStore(5000);

  const ollamaCatalogRoutes = buildOllamaCatalogRoutes(config);
  const modelCatalogTtlMs = 30_000;
  let cachedModelCatalog: { readonly expiresAt: number; readonly value: ResolvedModelCatalog } | null = null;

  async function fetchProviderModelCatalog(route: ProviderRoute): Promise<string[]> {
    let accounts: ProviderCredential[];
    try {
      accounts = await keyPool.getRequestOrder(route.providerId);
    } catch {
      return [];
    }

    if (accounts.length === 0) {
      return [];
    }

    const candidatePaths = ["/v1/models", "/api/tags"];

    for (const account of accounts) {
      for (const candidatePath of candidatePaths) {
        const url = new URL(candidatePath, `${route.baseUrl}/`).toString();
        let response: Response;
        try {
          response = await fetchWithResponseTimeout(url, {
            method: "GET",
            headers: {
              authorization: `Bearer ${account.token}`,
              accept: "application/json"
            }
          }, Math.min(config.requestTimeoutMs, 45_000));
        } catch {
          continue;
        }

        if (!response.ok) {
          try {
            await response.arrayBuffer();
          } catch {
            // ignore body read failures while probing model catalogs
          }
          continue;
        }

        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          continue;
        }

        const modelIds = parseModelIdsFromCatalogPayload(payload);
        if (modelIds.length > 0) {
          return modelIds;
        }
      }
    }

    return [];
  }

  async function getResolvedModelCatalog(forceRefresh = false): Promise<ResolvedModelCatalog> {
    const now = Date.now();
    if (!forceRefresh && cachedModelCatalog && cachedModelCatalog.expiresAt > now) {
      return cachedModelCatalog.value;
    }

    const configuredModels = await loadModels(config.modelsFilePath, DEFAULT_MODELS);
    const dynamicOllamaModels: string[] = [];

    for (const route of ollamaCatalogRoutes) {
      const providerModels = await fetchProviderModelCatalog(route);
      if (providerModels.length > 0) {
        dynamicOllamaModels.push(...providerModels);
      }
    }

    const aliasTargets = buildLargestModelAliases(dynamicOllamaModels);
    const aliasIds = Object.keys(aliasTargets);

    const resolvedCatalog: ResolvedModelCatalog = {
      modelIds: dedupeModelIds([
        ...configuredModels,
        ...dynamicOllamaModels,
        ...aliasIds
      ]),
      aliasTargets,
      dynamicOllamaModelIds: dedupeModelIds(dynamicOllamaModels)
    };

    cachedModelCatalog = {
      expiresAt: now + modelCatalogTtlMs,
      value: resolvedCatalog
    };

    return resolvedCatalog;
  }

  if (config.allowUnauthenticated) {
    app.log.warn("proxy auth disabled via PROXY_ALLOW_UNAUTHENTICATED=true");
  }

  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    reply.header("Access-Control-Allow-Origin", origin ?? "*");
    reply.header("Vary", "Origin");
    reply.header("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, X-Requested-With");
    reply.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    if (config.proxyAuthToken) {
      const rawPath = (request.raw.url ?? request.url).split("?", 1)[0] ?? request.url;
      const allowUnauthenticatedRoute =
        rawPath === "/api/ui/credentials/openai/oauth/browser/callback";

      if (allowUnauthenticatedRoute) {
        return;
      }

      const authorization = request.headers.authorization;
      const ok = hasBearerToken(authorization, config.proxyAuthToken);
      if (!ok) {
        sendOpenAiError(reply, 401, "Unauthorized", "invalid_request_error", "unauthorized");
        return;
      }
    }
  });

  app.options("/", async (_request, reply) => {
    reply.code(204).send();
  });

  app.options("/health", async (_request, reply) => {
    reply.code(204).send();
  });

  app.options("/v1/chat/completions", async (_request, reply) => {
    reply.code(204).send();
  });

  app.options("/v1/models", async (_request, reply) => {
    reply.code(204).send();
  });

  app.options("/v1/models/:model", async (_request, reply) => {
    reply.code(204).send();
  });

  app.get("/", async () => ({ ok: true, name: "open-hax-openai-proxy", version: "0.1.0" }));
  app.get("/health", async () => {
    let keyPoolStatus: unknown;
    let keyPoolProviders: unknown;
    try {
      const status = await keyPool.getStatus(config.upstreamProviderId);
      keyPoolStatus = {
        providerId: status.providerId,
        authType: status.authType,
        totalKeys: status.totalAccounts,
        availableKeys: status.availableAccounts,
        cooldownKeys: status.cooldownAccounts,
        nextReadyInMs: status.nextReadyInMs
      };

      const allStatuses = await keyPool.getAllStatuses();
      keyPoolProviders = Object.fromEntries(
        Object.entries(allStatuses).map(([providerId, providerStatus]) => [
          providerId,
          {
            providerId: providerStatus.providerId,
            authType: providerStatus.authType,
            totalAccounts: providerStatus.totalAccounts,
            availableAccounts: providerStatus.availableAccounts,
            cooldownAccounts: providerStatus.cooldownAccounts,
            nextReadyInMs: providerStatus.nextReadyInMs
          }
        ])
      );
    } catch (error) {
      keyPoolStatus = {
        error: toErrorMessage(error)
      };
      keyPoolProviders = {};
    }

    return {
      ok: true,
      service: "open-hax-openai-proxy",
      authMode: config.proxyAuthToken ? "token" : "unauthenticated",
      keyPool: keyPoolStatus,
      keyPoolProviders
    };
  });

  app.get("/v1/models", async (_request, reply) => {
    const catalog = await getResolvedModelCatalog();
    reply.send({
      object: "list",
      data: catalog.modelIds.map(toOpenAiModel)
    });
  });

  app.get<{ Params: { model: string } }>("/v1/models/:model", async (request, reply) => {
    const catalog = await getResolvedModelCatalog();
    const model = catalog.modelIds.find((entry) => entry === request.params.model);
    if (!model) {
      sendOpenAiError(reply, 404, `Model not found: ${request.params.model}`, "invalid_request_error", "model_not_found");
      return;
    }

    reply.send(toOpenAiModel(model));
  });

  app.post<{ Body: ChatCompletionRequest }>("/v1/chat/completions", async (request, reply) => {
    if (!isRecord(request.body)) {
      sendOpenAiError(reply, 400, "Request body must be a JSON object", "invalid_request_error", "invalid_body");
      return;
    }

    const requestedModelInput = typeof request.body.model === "string" ? request.body.model : "";
    let requestedModel = requestedModelInput;
    let resolvedModelCatalog: ResolvedModelCatalog | null = null;
    try {
      const catalog = await getResolvedModelCatalog();
      resolvedModelCatalog = catalog;
      const aliasTarget = catalog.aliasTargets[requestedModelInput];
      if (typeof aliasTarget === "string" && aliasTarget.length > 0) {
        requestedModel = aliasTarget;
        reply.header("x-open-hax-model-alias", `${requestedModelInput}->${aliasTarget}`);
      }
    } catch (error) {
      request.log.warn({ error: toErrorMessage(error) }, "failed to resolve dynamic model aliases; using requested model as-is");
    }

    const useOllamaUpstream = shouldUseOllamaUpstream(requestedModel, config.ollamaModelPrefixes);
    const useOpenAiUpstream = hasModelPrefix(requestedModel, config.openaiModelPrefixes);
    const useLocalOllama = !useOllamaUpstream
      && !useOpenAiUpstream
      && config.localOllamaEnabled
      && shouldUseLocalOllama(requestedModel, config.localOllamaModelPatterns);

    const routedModel = useOllamaUpstream
      ? stripModelPrefix(requestedModel, config.ollamaModelPrefixes)
      : useOpenAiUpstream
        ? stripModelPrefix(requestedModel, config.openaiModelPrefixes)
        : requestedModel;

    const useMessagesUpstream = !useOpenAiUpstream && !useLocalOllama && shouldUseMessagesUpstream(routedModel, config.messagesModelPrefixes);
    const useResponsesUpstream = !useOllamaUpstream && !useLocalOllama && shouldUseResponsesUpstream(routedModel, config.responsesModelPrefixes);

    const upstreamMode = useLocalOllama
      ? "local_ollama_chat"
      : useOllamaUpstream
        ? "ollama_chat"
        : useOpenAiUpstream
          ? useResponsesUpstream
            ? "openai_responses"
            : "openai_chat_completions"
          : useMessagesUpstream
            ? "messages"
            : useResponsesUpstream
              ? "responses"
              : "chat_completions";

    const upstreamPath = useLocalOllama
      ? config.ollamaV1ChatPath
      : useOllamaUpstream
        ? config.ollamaChatPath
        : useOpenAiUpstream
          ? useResponsesUpstream
            ? config.openaiResponsesPath
            : config.openaiChatCompletionsPath
          : useMessagesUpstream
            ? config.messagesPath
            : useResponsesUpstream
              ? config.responsesPath
              : config.chatCompletionsPath;

    reply.header("x-open-hax-upstream-mode", upstreamMode);

    const requestBodyForUpstream = routedModel !== requestedModelInput
      ? {
        ...request.body,
        model: routedModel
      }
      : request.body;

    let upstreamPayload: Record<string, unknown>;
    try {
      upstreamPayload = useLocalOllama
        ? requestBodyForUpstream
        : useOllamaUpstream
          ? chatRequestToOllamaRequest(request.body, config.ollamaModelPrefixes)
        : useMessagesUpstream
          ? chatRequestToMessagesRequest(requestBodyForUpstream)
          : useResponsesUpstream
            ? chatRequestToResponsesRequest(requestBodyForUpstream)
            : requestBodyForUpstream;
    } catch (error) {
      sendOpenAiError(reply, 400, toErrorMessage(error), "invalid_request_error", "invalid_provider_options");
      return;
    }

    const bodyText = JSON.stringify(upstreamPayload);
    const clientWantsStream = request.body.stream === true;
    const needsReasoningTrace = requestWantsReasoningTrace(request.body);
    const upstreamAttemptTimeoutMs = clientWantsStream
      ? Math.min(config.requestTimeoutMs, config.streamBootstrapTimeoutMs)
      : config.requestTimeoutMs;

    if (useLocalOllama) {
      reply.header("x-open-hax-upstream-provider", "local-ollama");
      const upstreamUrl = new URL(upstreamPath, `${config.ollamaBaseUrl}/`).toString();
      const upstreamHeaders = buildForwardHeaders(request.headers);
      const attemptStartedAt = Date.now();

      let upstreamResponse: Response;
      try {
        upstreamResponse = await fetchWithResponseTimeout(upstreamUrl, {
          method: "POST",
          headers: upstreamHeaders,
          body: bodyText
        }, upstreamAttemptTimeoutMs);
      } catch (error) {
        requestLogStore.record({
          providerId: "ollama",
          accountId: "local",
          authType: "local",
          model: routedModel,
          upstreamMode,
          upstreamPath,
          status: 0,
          latencyMs: Date.now() - attemptStartedAt,
          error: toErrorMessage(error)
        });
        request.log.error({ error: toErrorMessage(error), upstreamMode }, "ollama upstream request failed");
        sendOpenAiError(
          reply,
          502,
          "Ollama upstream request failed due to a network or transport error.",
          "server_error",
          "ollama_upstream_unavailable"
        );
        return;
      }

      requestLogStore.record({
        providerId: "ollama",
        accountId: "local",
        authType: "local",
        model: routedModel,
        upstreamMode,
        upstreamPath,
        status: upstreamResponse.status,
        latencyMs: Date.now() - attemptStartedAt
      });

      if (!upstreamResponse.ok) {
        reply.code(upstreamResponse.status);
        copyUpstreamHeaders(reply, upstreamResponse.headers);

        const contentType = upstreamResponse.headers.get("content-type") ?? "";
        const isEventStream = contentType.toLowerCase().includes("text/event-stream");

        if (!upstreamResponse.body) {
          const responseText = await upstreamResponse.text();
          reply.send(responseText);
          return;
        }

        if (isEventStream) {
          const stream = Readable.fromWeb(upstreamResponse.body as any);
          reply.removeHeader("content-length");
          reply.send(stream);
          return;
        }

        const bytes = Buffer.from(await upstreamResponse.arrayBuffer());
        reply.send(bytes);
        return;
      }

      reply.code(upstreamResponse.status);
      copyUpstreamHeaders(reply, upstreamResponse.headers);

      const contentType = upstreamResponse.headers.get("content-type") ?? "";
      const isEventStream = contentType.toLowerCase().includes("text/event-stream");

      if (!upstreamResponse.body) {
        const responseText = await upstreamResponse.text();
        reply.send(responseText);
        return;
      }

      if (isEventStream) {
        const stream = Readable.fromWeb(upstreamResponse.body as any);
        reply.removeHeader("content-length");
        reply.send(stream);
        return;
      }

      const bytes = Buffer.from(await upstreamResponse.arrayBuffer());
      reply.send(bytes);
      return;
    }

    let providerRoutes = buildProviderRoutes(config, useOpenAiUpstream);
    if (!useOpenAiUpstream && resolvedModelCatalog) {
      providerRoutes = resolveProviderRoutesForModel(providerRoutes, routedModel, resolvedModelCatalog);
    }

    const candidatesByProvider: Record<string, ProviderAccountCandidate[]> = {};
    let sawConfiguredProvider = false;

    for (const route of providerRoutes) {
      try {
        const status = await keyPool.getStatus(route.providerId);
        if (status.totalAccounts > 0) {
          sawConfiguredProvider = true;
        }
      } catch {
        // Ignore status lookup errors and continue collecting candidates.
      }

      let routeAccounts: ProviderCredential[];
      try {
        routeAccounts = await keyPool.getRequestOrder(route.providerId);
      } catch (error) {
        request.log.warn(
          {
            error: toErrorMessage(error),
            providerId: route.providerId,
            upstreamMode
          },
          "failed to load provider accounts; trying next provider"
        );
        continue;
      }

      const routeCandidates: ProviderAccountCandidate[] = routeAccounts.map((account) => ({
        providerId: route.providerId,
        baseUrl: route.baseUrl,
        account
      }));

      if (routeCandidates.length > 0) {
        candidatesByProvider[route.providerId] = routeCandidates;
      }
    }

    const candidates = providerRoutes.flatMap((route) => candidatesByProvider[route.providerId] ?? []);

    if (candidates.length === 0) {
      const retryInMs = await minMsUntilAnyProviderKeyReady(keyPool, providerRoutes);
      if (retryInMs > 0) {
        reply.header("retry-after", Math.ceil(retryInMs / 1000));
      }

      if (!sawConfiguredProvider) {
        sendOpenAiError(reply, 500, "Proxy is missing upstream account configuration", "server_error", "keys_unavailable");
        return;
      }

      sendOpenAiError(
        reply,
        429,
        "All upstream accounts are currently rate-limited. Retry after the cooldown window.",
        "rate_limit_error",
        "all_keys_rate_limited"
      );
      return;
    }

    const attemptCandidates = candidates;

    let sawRateLimit = false;
    let sawRequestError = false;
    let sawUpstreamServerError = false;
    let sawUpstreamInvalidRequest = false;
    let sawModelNotFound = false;
    let attempts = 0;

    for (const [candidateIndex, candidate] of attemptCandidates.entries()) {
      const { providerId, baseUrl, account } = candidate;
      const hasMoreCandidates = candidateIndex < attemptCandidates.length - 1;
      attempts += 1;
      const upstreamUrl = new URL(upstreamPath, `${baseUrl}/`).toString();
      const upstreamHeaders = buildUpstreamHeaders(request.headers, account.token);
      if (useMessagesUpstream && config.messagesInterleavedThinkingBeta && shouldEnableInterleavedThinkingHeader(upstreamPayload)) {
        appendCsvHeaderValue(upstreamHeaders, "anthropic-beta", config.messagesInterleavedThinkingBeta);
      }
      const attemptStartedAt = Date.now();

      let upstreamResponse: Response;
      try {
        upstreamResponse = await fetchWithResponseTimeout(upstreamUrl, {
          method: "POST",
          headers: upstreamHeaders,
          body: bodyText
        }, upstreamAttemptTimeoutMs);
      } catch (error) {
        requestLogStore.record({
          providerId,
          accountId: account.accountId,
          authType: account.authType,
          model: routedModel,
          upstreamMode,
          upstreamPath,
          status: 0,
          latencyMs: Date.now() - attemptStartedAt,
          error: toErrorMessage(error)
        });
        sawRequestError = true;
        request.log.warn({ error: toErrorMessage(error), providerId }, "upstream request failed for one account");
        continue;
      }

      requestLogStore.record({
        providerId,
        accountId: account.accountId,
        authType: account.authType,
        model: routedModel,
        upstreamMode,
        upstreamPath,
        status: upstreamResponse.status,
        latencyMs: Date.now() - attemptStartedAt
      });

      if (isRateLimitResponse(upstreamResponse)) {
        sawRateLimit = true;
        const retryAfter = parseRetryAfterMs(upstreamResponse.headers.get("retry-after"));
        keyPool.markRateLimited(account, retryAfter);

        request.log.warn(
          {
            status: upstreamResponse.status,
            providerId,
            accountId: account.accountId,
            attempt: attempts,
            upstreamMode
          },
          "rate limited by upstream account; trying next account"
        );
        continue;
      }

      const isQuotaError = await responseIndicatesQuotaError(upstreamResponse);
      if (isQuotaError) {
        sawRateLimit = true;
        keyPool.markRateLimited(account, Math.min(config.keyCooldownMs, 60_000));

        request.log.warn(
          {
            status: upstreamResponse.status,
            providerId,
            accountId: account.accountId,
            attempt: attempts,
            upstreamMode
          },
          "upstream account has outstanding balance/quota error; trying next account"
        );

        try {
          await upstreamResponse.arrayBuffer();
        } catch {
          // Ignore body read failures while failing over.
        }

        continue;
      }

      if (upstreamResponse.status >= 500 && upstreamResponse.status <= 599) {
        sawUpstreamServerError = true;
        keyPool.markRateLimited(account, Math.min(config.keyCooldownMs, 5000));

        request.log.warn(
          {
            status: upstreamResponse.status,
            providerId,
            accountId: account.accountId,
            attempt: attempts,
            upstreamMode
          },
          "upstream server error for account; trying next account"
        );

        try {
          await upstreamResponse.arrayBuffer();
        } catch {
          // Ignore body read failures while failing over.
        }

        continue;
      }

      if ((useResponsesUpstream || useMessagesUpstream) && upstreamResponse.ok) {
        let upstreamJson: unknown;
        try {
          upstreamJson = await upstreamResponse.json();
        } catch (error) {
          sawRequestError = true;
          request.log.warn({ error: toErrorMessage(error) }, "failed to parse transformed upstream JSON");
          continue;
        }

        const chatCompletion = useMessagesUpstream
          ? messagesToChatCompletion(upstreamJson, routedModel)
          : responsesToChatCompletion(upstreamJson, routedModel);

        if (needsReasoningTrace && !chatCompletionHasReasoningContent(chatCompletion) && hasMoreCandidates) {
          sawRequestError = true;
          keyPool.markRateLimited(account, Math.min(config.keyCooldownMs, 10_000));

          request.log.warn(
            {
              providerId,
              accountId: account.accountId,
              attempt: attempts,
              upstreamMode,
              reason: "reasoning_missing"
            },
            "upstream payload missing requested reasoning trace; trying next account"
          );

          continue;
        }

        reply.header("x-open-hax-upstream-provider", providerId);
        if (clientWantsStream) {
          reply.code(200);
          reply.header("content-type", "text/event-stream; charset=utf-8");
          reply.header("cache-control", "no-cache");
          reply.header("x-accel-buffering", "no");
          reply.send(chatCompletionToSse(chatCompletion));
          return;
        }

        reply.code(upstreamResponse.status);
        reply.header("content-type", "application/json");
        reply.send(chatCompletion);
        return;
      }

      if (!clientWantsStream && upstreamResponse.ok && needsReasoningTrace) {
        let upstreamJson: unknown;
        try {
          upstreamJson = await upstreamResponse.json();
        } catch (error) {
          sawRequestError = true;
          keyPool.markRateLimited(account, Math.min(config.keyCooldownMs, 10_000));
          request.log.warn(
            {
              error: toErrorMessage(error),
              providerId,
              accountId: account.accountId,
              attempt: attempts,
              upstreamMode,
              reason: "reasoning_unparseable"
            },
            "unable to verify reasoning trace from upstream payload; trying next account"
          );
          continue;
        }

        const hasReasoning = isRecord(upstreamJson) && chatCompletionHasReasoningContent(upstreamJson);
        if (!hasReasoning && hasMoreCandidates) {
          sawRequestError = true;
          keyPool.markRateLimited(account, Math.min(config.keyCooldownMs, 10_000));

          request.log.warn(
            {
              providerId,
              accountId: account.accountId,
              attempt: attempts,
              upstreamMode,
              reason: "reasoning_missing"
            },
            "upstream payload missing requested reasoning trace; trying next account"
          );

          continue;
        }

        reply.header("x-open-hax-upstream-provider", providerId);
        reply.code(upstreamResponse.status);
        copyUpstreamHeaders(reply, upstreamResponse.headers);
        reply.header("content-type", "application/json");
        reply.send(upstreamJson);
        return;
      }

      if (clientWantsStream && upstreamResponse.ok) {
        if (!upstreamResponse.body) {
          sawRequestError = true;
          keyPool.markRateLimited(account, Math.min(config.keyCooldownMs, 10_000));

          request.log.warn(
            {
              providerId,
              accountId: account.accountId,
              attempt: attempts,
              upstreamMode,
              reason: "stream_body_missing"
            },
            "upstream stream payload missing body; trying next account"
          );

          continue;
        }

        reply.header("x-open-hax-upstream-provider", providerId);
        request.log.info(
          {
            providerId,
            accountId: account.accountId,
            attempt: attempts,
            upstreamMode,
            status: upstreamResponse.status,
            stream: true
          },
          "upstream account succeeded"
        );
        reply.code(upstreamResponse.status);
        copyUpstreamHeaders(reply, upstreamResponse.headers);
        reply.removeHeader("content-length");
        reply.header("cache-control", "no-cache");
        reply.header("x-accel-buffering", "no");
        reply.header("content-type", "text/event-stream; charset=utf-8");
        reply.hijack();
        const rawResponse = reply.raw;
        rawResponse.statusCode = upstreamResponse.status;
        for (const [name, value] of Object.entries(reply.getHeaders())) {
          if (value !== undefined) {
            rawResponse.setHeader(name, value as any);
          }
        }
        rawResponse.flushHeaders();
        const reader = upstreamResponse.body.getReader();
        void (async () => {
          try {
            while (true) {
              const next = await reader.read();
              if (next.done) {
                rawResponse.end();
                break;
              }

              const value = next.value;
              if (!value || value.length === 0) {
                continue;
              }

              rawResponse.write(Buffer.from(value));
            }
          } catch (error) {
            if (!rawResponse.destroyed) {
              rawResponse.destroy(error instanceof Error ? error : new Error(String(error)));
            }
          }
        })();
        return;
      }

      if (!upstreamResponse.ok && hasMoreCandidates) {
        const isMissingModel = await responseIndicatesMissingModel(upstreamResponse, routedModel);
        if (isMissingModel) {
          sawModelNotFound = true;

          request.log.warn(
            {
              status: upstreamResponse.status,
              providerId,
              accountId: account.accountId,
              attempt: attempts,
              upstreamMode,
              reason: "model_not_found"
            },
            "upstream reported model missing; trying next account/provider"
          );

          try {
            await upstreamResponse.arrayBuffer();
          } catch {
            // Ignore body read failures while failing over.
          }

          continue;
        }
      }

      if (!upstreamResponse.ok && hasMoreCandidates) {
        sawRequestError = true;
        if (upstreamResponse.status === 400 || upstreamResponse.status === 422) {
          sawUpstreamInvalidRequest = true;
        }
        if (upstreamResponse.status === 401 || upstreamResponse.status === 403) {
          keyPool.markRateLimited(account, Math.min(config.keyCooldownMs, 10_000));
        }

        const upstreamError = await summarizeUpstreamError(upstreamResponse);

        request.log.warn(
          {
            status: upstreamResponse.status,
            providerId,
            accountId: account.accountId,
            attempt: attempts,
            upstreamMode,
            reason: "upstream_rejected",
            ...upstreamError
          },
          "upstream rejected request; trying next account/provider"
        );

        try {
          await upstreamResponse.arrayBuffer();
        } catch {
          // Ignore body read failures while failing over.
        }

        continue;
      }

      reply.header("x-open-hax-upstream-provider", providerId);
      reply.code(upstreamResponse.status);
      copyUpstreamHeaders(reply, upstreamResponse.headers);

      const contentType = upstreamResponse.headers.get("content-type") ?? "";
      const isEventStream = contentType.toLowerCase().includes("text/event-stream");

      if (!upstreamResponse.body) {
        const responseText = await upstreamResponse.text();
        reply.send(responseText);
        return;
      }

      if (isEventStream) {
        const stream = Readable.fromWeb(upstreamResponse.body as any);
        reply.removeHeader("content-length");
        reply.send(stream);
        return;
      }

      const bytes = Buffer.from(await upstreamResponse.arrayBuffer());
      reply.send(bytes);
      return;
    }

    if (sawUpstreamInvalidRequest) {
      request.log.warn({ providerRoutes, attempts, upstreamMode }, "all attempts exhausted due to upstream invalid-request responses");
      sendOpenAiError(
        reply,
        400,
        "No upstream account accepted the request payload. Check model availability and request parameters.",
        "invalid_request_error",
        "upstream_rejected_request"
      );
      return;
    }

    if (sawRateLimit) {
      const retryInMs = await minMsUntilAnyProviderKeyReady(keyPool, providerRoutes);
      if (retryInMs > 0) {
        reply.header("retry-after", Math.ceil(retryInMs / 1000));
      }

      request.log.warn({ providerRoutes, attempts, upstreamMode }, "all attempts exhausted due to upstream rate limits");
      sendOpenAiError(
        reply,
        429,
        "No upstream account succeeded. Accounts may be rate-limited, quota-exhausted, or have outstanding balances.",
        "rate_limit_error",
        "no_available_key"
      );
      return;
    }

    if (sawUpstreamServerError) {
      request.log.warn({ providerRoutes, attempts, upstreamMode }, "all attempts exhausted due to upstream server errors");
      sendOpenAiError(
        reply,
        502,
        "Upstream returned transient server errors across all available accounts.",
        "server_error",
        "upstream_server_error"
      );
      return;
    }

    if (sawModelNotFound && !sawRequestError) {
      request.log.warn({ providerRoutes, attempts, upstreamMode }, "all attempts exhausted due to model-not-found responses");
      sendOpenAiError(
        reply,
        404,
        `Model not found across available upstream providers: ${routedModel}`,
        "invalid_request_error",
        "model_not_found"
      );
      return;
    }

    const message = sawRequestError
      ? "All upstream attempts failed due to network/transport errors."
      : "Upstream rejected the request with no successful fallback.";

    request.log.error({ providerRoutes, attempts, upstreamMode, sawRequestError }, "all upstream attempts exhausted");
    sendOpenAiError(reply, 502, message, "server_error", "upstream_unavailable");
  });

  await registerUiRoutes(app, {
    config,
    keyPool,
    requestLogStore
  });

  app.setNotFoundHandler(async (request, reply) => {
    const rawUrl = request.raw.url ?? request.url;
    const path = rawUrl.split("?", 1)[0] ?? rawUrl;

    if (path.startsWith("/v1/")) {
      sendOpenAiError(
        reply,
        404,
        `Unsupported endpoint: ${request.method} ${path}. Supported endpoints: ${SUPPORTED_V1_ENDPOINTS.join(", ")}`,
        "invalid_request_error",
        "unsupported_endpoint"
      );
      return;
    }

    reply.code(404).send({ ok: false, error: "Not Found" });
  });

  return app;
}
