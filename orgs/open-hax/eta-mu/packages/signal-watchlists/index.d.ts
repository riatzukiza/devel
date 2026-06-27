export interface WatchlistSeedRow {
  readonly url: string;
  readonly kind: string;
  readonly title: string;
  readonly source_type: string;
  readonly domain_id: string;
  readonly tags: readonly string[];
}

export interface MergedSeedRow {
  readonly url: string;
  readonly source: "request" | "watchlist";
  readonly kind: string;
  readonly domain_id: string;
  readonly source_type: string;
  readonly tags: readonly string[];
}

export interface WatchlistPayload {
  readonly record?: string;
  readonly schema_version?: string;
  readonly enabled?: boolean;
  readonly domains?: readonly {
    readonly id?: string;
    readonly enabled?: boolean;
    readonly seed_urls?: readonly (string | Record<string, unknown>)[];
  }[];
}

export interface MergeSeedOptions {
  readonly requestedUrls?: readonly string[];
  readonly watchlistRows?: readonly WatchlistSeedRow[];
  readonly normalizeUrlFn?: (rawUrl: string, base?: string | undefined) => string;
}

export declare function normalizeHttpUrl(rawUrl: string, base?: string): string;
export declare function normalizeWatchlistSeedRow(
  seedRow: unknown,
  domainId?: string,
): WatchlistSeedRow | null;
export declare function parseWatchlistSeeds(payload: WatchlistPayload | unknown): WatchlistSeedRow[];
export declare function loadWatchlistSeedsFromFile(filePath: string): WatchlistSeedRow[];
export declare function filterWatchlistSeedsByDomainId(
  rows: readonly WatchlistSeedRow[] | unknown,
  domainId: string,
): WatchlistSeedRow[];
export declare function mergeRequestedAndWatchlistSeeds(options?: MergeSeedOptions): MergedSeedRow[];

declare const signalWatchlists: {
  readonly normalizeHttpUrl: typeof normalizeHttpUrl;
  readonly normalizeWatchlistSeedRow: typeof normalizeWatchlistSeedRow;
  readonly parseWatchlistSeeds: typeof parseWatchlistSeeds;
  readonly loadWatchlistSeedsFromFile: typeof loadWatchlistSeedsFromFile;
  readonly filterWatchlistSeedsByDomainId: typeof filterWatchlistSeedsByDomainId;
  readonly mergeRequestedAndWatchlistSeeds: typeof mergeRequestedAndWatchlistSeeds;
};

export default signalWatchlists;
