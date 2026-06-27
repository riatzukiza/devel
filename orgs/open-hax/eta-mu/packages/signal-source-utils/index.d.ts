export interface FeedEntry {
  readonly url: string;
  readonly title: string;
  readonly summary: string;
  readonly publishedAt: string;
  readonly sourceKind: string;
}

export interface SemanticReference {
  readonly url: string;
  readonly edge_kind: string;
  readonly reason: string;
  readonly nofollow: boolean;
  readonly enqueue: boolean;
}

export interface SemanticReferencePayload {
  readonly source_kind: string;
  readonly references: readonly SemanticReference[];
}

export interface ArxivSearchSeed {
  readonly searchQuery: string;
  readonly start: number;
  readonly maxResults: number;
  readonly sortBy: string;
  readonly sortOrder: string;
}

export declare function normalizeUrl(raw: string, base?: string): string | null;
export declare function parseAuthHeader(rawHeader: string): Record<string, string>;
export declare function llmAuthHeaders(): Record<string, string>;
export declare function extractArxivIdFromUrl(rawUrl: string): string;
export declare function isArxivSearchUrl(rawUrl: string): boolean;
export declare function parseArxivSearchSeed(rawUrl: string): ArxivSearchSeed | null;
export declare function buildArxivApiQueryUrl(seed: Partial<ArxivSearchSeed>): string;
export declare function extractArxivAbsUrlsFromApiFeed(feedXml: string, maxItems?: number): string[];
export declare function extractFeedEntries(feedBody: string, baseUrl: string, maxItems?: number): FeedEntry[];
export declare function extractFeedEntryLinks(feedBody: string, baseUrl: string, maxItems?: number): string[];
export declare function looksLikeFeedDocument(contentType: string, bodyText: string): boolean;
export declare function canonicalArxivAbsUrlFromId(arxivId: string): string;
export declare function canonicalArxivPdfUrlFromId(arxivId: string): string;
export declare function canonicalWikipediaArticleUrl(rawUrl: string): string;
export declare function classifyKnowledgeUrl(rawUrl: string): string;
export declare function inferKnowledgeMetadata(rawUrl: string): {
  readonly source_family: string;
  readonly knowledge_kind: string;
  readonly arxiv_id: string | null;
  readonly wikipedia_slug: string | null;
};
export declare function parseContentType(contentTypeHeader: string | null | undefined): string;
export declare function isTextLikeContentType(contentType: string): boolean;
export declare function extractReadableTextFromHtml(html: string): string;
export declare function fallbackTextSummary(text: string): string;
export declare function normalizeAnalysisSummary(rawText: string, fallbackText: string): string;
export declare function extractCanonicalHref(html: string): string;
export declare function extractTitle(html: string): string;
export declare function extractLinks(html: string, baseUrl: string): Array<{ readonly url: string; readonly nofollow: boolean }>;
export declare function extractSemanticReferences(sourceUrl: string, html: string): SemanticReferencePayload;

declare const signalSourceUtils: {
  readonly normalizeUrl: typeof normalizeUrl;
  readonly parseAuthHeader: typeof parseAuthHeader;
  readonly llmAuthHeaders: typeof llmAuthHeaders;
  readonly extractArxivIdFromUrl: typeof extractArxivIdFromUrl;
  readonly isArxivSearchUrl: typeof isArxivSearchUrl;
  readonly parseArxivSearchSeed: typeof parseArxivSearchSeed;
  readonly buildArxivApiQueryUrl: typeof buildArxivApiQueryUrl;
  readonly extractArxivAbsUrlsFromApiFeed: typeof extractArxivAbsUrlsFromApiFeed;
  readonly extractFeedEntries: typeof extractFeedEntries;
  readonly extractFeedEntryLinks: typeof extractFeedEntryLinks;
  readonly looksLikeFeedDocument: typeof looksLikeFeedDocument;
  readonly canonicalArxivAbsUrlFromId: typeof canonicalArxivAbsUrlFromId;
  readonly canonicalArxivPdfUrlFromId: typeof canonicalArxivPdfUrlFromId;
  readonly canonicalWikipediaArticleUrl: typeof canonicalWikipediaArticleUrl;
  readonly classifyKnowledgeUrl: typeof classifyKnowledgeUrl;
  readonly inferKnowledgeMetadata: typeof inferKnowledgeMetadata;
  readonly parseContentType: typeof parseContentType;
  readonly isTextLikeContentType: typeof isTextLikeContentType;
  readonly extractReadableTextFromHtml: typeof extractReadableTextFromHtml;
  readonly fallbackTextSummary: typeof fallbackTextSummary;
  readonly normalizeAnalysisSummary: typeof normalizeAnalysisSummary;
  readonly extractCanonicalHref: typeof extractCanonicalHref;
  readonly extractTitle: typeof extractTitle;
  readonly extractLinks: typeof extractLinks;
  readonly extractSemanticReferences: typeof extractSemanticReferences;
};

export default signalSourceUtils;
