export type RequestAuthType = "api_key" | "oauth_bearer" | "local" | "none";

export interface RequestLogEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly providerId: string;
  readonly accountId: string;
  readonly authType: RequestAuthType;
  readonly model: string;
  readonly upstreamMode: string;
  readonly upstreamPath: string;
  readonly status: number;
  readonly latencyMs: number;
  readonly error?: string;
}

export interface RequestLogFilters {
  readonly providerId?: string;
  readonly accountId?: string;
  readonly limit?: number;
}

export interface RequestLogRecordInput {
  readonly providerId: string;
  readonly accountId: string;
  readonly authType: RequestAuthType;
  readonly model: string;
  readonly upstreamMode: string;
  readonly upstreamPath: string;
  readonly status: number;
  readonly latencyMs: number;
  readonly error?: string;
  readonly timestamp?: number;
}

function sanitizeLimit(limit: number | undefined, fallback: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return fallback;
  }

  const normalized = Math.floor(limit);
  if (normalized <= 0) {
    return fallback;
  }

  return normalized;
}

export class RequestLogStore {
  private readonly entries: RequestLogEntry[] = [];

  public constructor(private readonly maxEntries: number = 1000) {}

  public record(input: RequestLogRecordInput): RequestLogEntry {
    const entry: RequestLogEntry = {
      id: crypto.randomUUID(),
      timestamp: input.timestamp ?? Date.now(),
      providerId: input.providerId,
      accountId: input.accountId,
      authType: input.authType,
      model: input.model,
      upstreamMode: input.upstreamMode,
      upstreamPath: input.upstreamPath,
      status: input.status,
      latencyMs: input.latencyMs,
      error: input.error,
    };

    this.entries.push(entry);
    const overflow = this.entries.length - this.maxEntries;
    if (overflow > 0) {
      this.entries.splice(0, overflow);
    }

    return entry;
  }

  public list(filters: RequestLogFilters = {}): RequestLogEntry[] {
    const limit = sanitizeLimit(filters.limit, 200);

    const filtered = this.entries.filter((entry) => {
      if (filters.providerId && entry.providerId !== filters.providerId) {
        return false;
      }

      if (filters.accountId && entry.accountId !== filters.accountId) {
        return false;
      }

      return true;
    });

    return filtered.slice(-limit).reverse();
  }

  public providerSummary(): Record<string, { readonly count: number; readonly lastTimestamp: number }> {
    const summary: Record<string, { count: number; lastTimestamp: number }> = {};

    for (const entry of this.entries) {
      const existing = summary[entry.providerId];
      if (!existing) {
        summary[entry.providerId] = {
          count: 1,
          lastTimestamp: entry.timestamp,
        };
        continue;
      }

      existing.count += 1;
      existing.lastTimestamp = Math.max(existing.lastTimestamp, entry.timestamp);
    }

    return summary;
  }
}
