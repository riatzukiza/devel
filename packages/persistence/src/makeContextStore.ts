import type { ContextMessage } from './actions/context-store/types.js';
import type { DualStoreEntry, DualStoreTimestamp } from './types.js';

const DEFAULT_ASSISTANT_NAME = 'Pantheon';
const DEFAULT_RECENT_LIMIT = 10;
const DEFAULT_QUERY_LIMIT = 5;
const DEFAULT_RESULT_LIMIT = 20;
const DEFAULT_FORMAT_TIME = (ms: number) => new Date(ms).toISOString();

type MaybePromise<T> = T | Promise<T>;

type ContextEntry = DualStoreEntry<'text', 'timestamp'>;

type CollectionAdapter = {
    name?: string;
    getMostRecent: (limit?: number) => Promise<ContextEntry[]>;
    getMostRelevant: (queryTexts: string[], limit: number, where?: Record<string, unknown>) => Promise<ContextEntry[]>;
};

type EntryMetadata = Record<string, unknown> & {
    userName?: string;
    displayName?: string;
    name?: string;
    role?: ContextMessage['role'];
    type?: string;
    caption?: string;
    isThought?: boolean;
};

export type CompileContextOptions = {
    texts?: readonly string[];
    recentLimit?: number;
    queryLimit?: number;
    limit?: number;
};

export type MakeContextStoreDeps = {
    getCollections: () => MaybePromise<readonly unknown[]>;
    resolveRole?: (meta?: Record<string, unknown>) => ContextMessage['role'];
    resolveDisplayName?: (meta?: Record<string, unknown>) => string | undefined;
    resolveName?: (meta?: Record<string, unknown>) => string | undefined;
    formatTime?: (epochMs: number) => string;
    assistantName?: string;
};

export type MakeContextStoreResult = {
    compileContext: (options?: CompileContextOptions) => Promise<ContextMessage[]>;
};

export const makeContextStore = (deps: MakeContextStoreDeps): MakeContextStoreResult => {
    const assistantName = deps.assistantName ?? DEFAULT_ASSISTANT_NAME;
    const providedResolveDisplayName = deps.resolveDisplayName ?? deps.resolveName;
    const formatTime = deps.formatTime ?? DEFAULT_FORMAT_TIME;

    const compileContext = async (options?: CompileContextOptions): Promise<ContextMessage[]> => {
        const adapters = toCollectionAdapters(await Promise.resolve(deps.getCollections()));
        if (!adapters.length) {
            return [];
        }

        const normalised = normaliseCompileOptions(options);
        const latestEntries = await collectLatestEntries(adapters, normalised.recentLimit);
        const querySeeds = buildQuerySeeds(normalised.texts, latestEntries, normalised.queryLimit);

        const relatedEntries = querySeeds.length
            ? await collectRelatedEntries(adapters, querySeeds, normalised.limit)
            : [];
        const relatedImages = querySeeds.length
            ? await collectRelatedEntries(adapters, querySeeds, normalised.limit, { type: 'image' })
            : [];

        const preparedEntries = prepareEntries(relatedEntries, latestEntries, relatedImages);
        const filteredEntries = filterValidEntries(preparedEntries);
        const dedupedEntries = dedupeByText(filteredEntries);
        const sortedEntries = sortByTimestamp(dedupedEntries);
        const limitedEntries = limitByCollectionCount(sortedEntries, normalised.limit, adapters.length);

        return limitedEntries.map((entry) =>
            toContextMessage(entry, {
                assistantName,
                formatTime,
                resolveRole: deps.resolveRole,
                resolveDisplayName: providedResolveDisplayName,
            }),
        );
    };

    return { compileContext };
};

type NormalisedCompileOptions = {
    texts: string[];
    recentLimit: number;
    queryLimit: number;
    limit: number;
};

const normaliseCompileOptions = (options?: CompileContextOptions): NormalisedCompileOptions => {
    const texts = Array.isArray(options?.texts) ? options.texts.filter(isNonEmptyString) : [];
    return {
        texts,
        recentLimit: normalisePositiveNumber(options?.recentLimit, DEFAULT_RECENT_LIMIT),
        queryLimit: normalisePositiveNumber(options?.queryLimit, DEFAULT_QUERY_LIMIT),
        limit: normalisePositiveNumber(options?.limit, DEFAULT_RESULT_LIMIT),
    } satisfies NormalisedCompileOptions;
};

const normalisePositiveNumber = (value: number | undefined, fallback: number): number => {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return Math.floor(value);
    }
    return fallback;
};

const toCollectionAdapters = (collections: readonly unknown[]): CollectionAdapter[] =>
    collections.reduce<CollectionAdapter[]>((acc, candidate) => {
        if (
            candidate &&
            typeof candidate === 'object' &&
            typeof (candidate as CollectionAdapter).getMostRecent === 'function' &&
            typeof (candidate as CollectionAdapter).getMostRelevant === 'function'
        ) {
            acc.push(candidate as CollectionAdapter);
        }
        return acc;
    }, []);

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const collectLatestEntries = async (adapters: readonly CollectionAdapter[], limit: number): Promise<ContextEntry[]> => {
    if (!adapters.length || limit <= 0) {
        return [];
    }

    const batches = await Promise.all(adapters.map((adapter) => safeGetMostRecent(adapter, limit)));
    return batches.flat();
};

const safeGetMostRecent = async (adapter: CollectionAdapter, limit: number): Promise<ContextEntry[]> => {
    try {
        return await adapter.getMostRecent(limit);
    } catch (error) {
        console.warn(
            `makeContextStore failed to read recent entries from ${adapter.name ?? 'unknown'} collection`,
            error,
        );
        return [];
    }
};

const collectRelatedEntries = async (
    adapters: readonly CollectionAdapter[],
    queries: readonly string[],
    limit: number,
    where?: Record<string, unknown>,
): Promise<ContextEntry[]> => {
    if (!adapters.length || limit <= 0 || queries.length === 0) {
        return [];
    }

    const batches = await Promise.all(adapters.map((adapter) => safeGetMostRelevant(adapter, queries, limit, where)));
    return batches.flat();
};

const safeGetMostRelevant = async (
    adapter: CollectionAdapter,
    queries: readonly string[],
    limit: number,
    where?: Record<string, unknown>,
): Promise<ContextEntry[]> => {
    try {
        return await adapter.getMostRelevant([...queries], limit, where);
    } catch (error) {
        console.warn(
            `makeContextStore failed to read related entries from ${adapter.name ?? 'unknown'} collection`,
            error,
        );
        return [];
    }
};

const buildQuerySeeds = (
    texts: readonly string[],
    latestEntries: readonly ContextEntry[],
    queryLimit: number,
): string[] => {
    if (queryLimit <= 0) {
        return [];
    }

    const combined: string[] = [...texts];
    for (const entry of latestEntries) {
        if (isNonEmptyString(entry.text)) {
            combined.push(entry.text);
        }
    }

    return combined.slice(-queryLimit);
};

const prepareEntries = (
    related: readonly ContextEntry[],
    latest: readonly ContextEntry[],
    images: readonly ContextEntry[],
): ContextEntry[] => {
    const relatedWithoutImages = related.filter((entry) => getMetadataType(entry.metadata) !== 'image');
    return [...relatedWithoutImages, ...latest, ...images];
};

const filterValidEntries = (entries: readonly ContextEntry[]): ContextEntry[] =>
    entries.filter((entry): entry is ContextEntry => {
        if (!entry) {
            return false;
        }
        if (!isNonEmptyString(entry.text)) {
            return false;
        }
        if (typeof entry.metadata !== 'object' || entry.metadata === null) {
            return false;
        }
        return true;
    });

const dedupeByText = (entries: readonly ContextEntry[]): ContextEntry[] => {
    const seen = new Set<string>();
    const deduped: ContextEntry[] = [];

    for (const entry of entries) {
        const text = entry.text;
        if (!isNonEmptyString(text)) {
            continue;
        }
        if (seen.has(text)) {
            continue;
        }
        seen.add(text);
        deduped.push(entry);
    }

    return deduped;
};

const sortByTimestamp = (entries: readonly ContextEntry[]): ContextEntry[] =>
    [...entries].sort((a, b) => toEpochMilliseconds(a.timestamp) - toEpochMilliseconds(b.timestamp));

const limitByCollectionCount = (
    entries: readonly ContextEntry[],
    limit: number,
    collectionCount: number,
): ContextEntry[] => {
    if (limit <= 0) {
        return [];
    }

    const multiplicativeFactor = Math.max(collectionCount, 1) * 2;
    const maxResults = limit * multiplicativeFactor;
    return entries.length > maxResults ? entries.slice(-maxResults) : [...entries];
};

type MessageFormattingDeps = {
    assistantName: string;
    formatTime: (epochMs: number) => string;
    resolveRole?: (meta?: Record<string, unknown>) => ContextMessage['role'];
    resolveDisplayName?: (meta?: Record<string, unknown>) => string | undefined;
};

const toContextMessage = (entry: ContextEntry, deps: MessageFormattingDeps): ContextMessage => {
    const metadata = (entry.metadata ?? {}) as EntryMetadata;
    const displayName = resolveDisplayNameForEntry(metadata, deps);
    const isAssistant = displayName === deps.assistantName;
    const baseRole = resolveBaseRole(metadata, isAssistant);
    const role = safeResolveRole(deps.resolveRole, metadata, baseRole);

    if (getMetadataType(metadata) === 'image') {
        const caption = getString(metadata.caption) ?? `${displayName ?? 'Unknown'} shared an image`;
        return {
            role,
            content: caption,
            images: [entry.text],
        } satisfies ContextMessage;
    }

    const timestamp = toEpochMilliseconds(entry.timestamp as DualStoreTimestamp);
    const formattedTime = deps.formatTime(timestamp);
    const verb = metadata.isThought ? 'thought' : 'said';
    const shouldFormatAssistant = !(isAssistant && !metadata.isThought);
    const content = shouldFormatAssistant
        ? `${displayName ?? 'Unknown'} ${verb} (${formattedTime}): ${entry.text}`
        : entry.text;

    return {
        role,
        content,
    } satisfies ContextMessage;
};

const resolveBaseRole = (metadata: EntryMetadata, isAssistant: boolean): ContextMessage['role'] => {
    if (isRole(metadata.role)) {
        return metadata.role;
    }
    if (isAssistant) {
        return metadata.isThought ? 'system' : 'assistant';
    }
    return 'user';
};

const getMetadataType = (metadata: EntryMetadata | undefined): string | undefined => {
    const type = metadata?.type;
    return typeof type === 'string' ? type.toLowerCase() : undefined;
};

const resolveDisplayNameForEntry = (metadata: EntryMetadata, deps: MessageFormattingDeps): string | undefined => {
    const resolved = safeResolveName(deps.resolveDisplayName, metadata);
    if (isNonEmptyString(resolved)) {
        return resolved.trim();
    }
    const fallback = metadata.displayName ?? metadata.name ?? metadata.userName;
    return getString(fallback);
};

const safeResolveRole = (
    resolver: ((meta?: Record<string, unknown>) => ContextMessage['role']) | undefined,
    metadata: EntryMetadata,
    fallback: ContextMessage['role'],
): ContextMessage['role'] => {
    try {
        const resolved = resolver?.(metadata);
        if (isRole(resolved)) {
            return resolved;
        }
    } catch (error) {
        console.warn('makeContextStore resolveRole threw, falling back to derived role', error);
    }
    return fallback;
};

const safeResolveName = (
    resolver: ((meta?: Record<string, unknown>) => string | undefined) | undefined,
    metadata: EntryMetadata,
): string | undefined => {
    if (!resolver) {
        return undefined;
    }
    try {
        return resolver(metadata);
    } catch (error) {
        console.warn('makeContextStore resolveDisplayName threw, falling back to metadata', error);
        return undefined;
    }
};

const isRole = (value: unknown): value is ContextMessage['role'] =>
    value === 'assistant' || value === 'system' || value === 'user';

const getString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim().length > 0 ? value : undefined;

const toEpochMilliseconds = (value: DualStoreTimestamp): number => {
    if (value instanceof Date) {
        return value.getTime();
    }
    if (typeof value === 'string') {
        return new Date(value).getTime();
    }
    return Number(value);
};
