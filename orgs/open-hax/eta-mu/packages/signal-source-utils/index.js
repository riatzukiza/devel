import signalSourceUtils from "./index.cjs";

export const normalizeUrl = signalSourceUtils.normalizeUrl;
export const parseAuthHeader = signalSourceUtils.parseAuthHeader;
export const llmAuthHeaders = signalSourceUtils.llmAuthHeaders;
export const extractArxivIdFromUrl = signalSourceUtils.extractArxivIdFromUrl;
export const isArxivSearchUrl = signalSourceUtils.isArxivSearchUrl;
export const parseArxivSearchSeed = signalSourceUtils.parseArxivSearchSeed;
export const buildArxivApiQueryUrl = signalSourceUtils.buildArxivApiQueryUrl;
export const extractArxivAbsUrlsFromApiFeed = signalSourceUtils.extractArxivAbsUrlsFromApiFeed;
export const extractFeedEntries = signalSourceUtils.extractFeedEntries;
export const extractFeedEntryLinks = signalSourceUtils.extractFeedEntryLinks;
export const looksLikeFeedDocument = signalSourceUtils.looksLikeFeedDocument;
export const canonicalArxivAbsUrlFromId = signalSourceUtils.canonicalArxivAbsUrlFromId;
export const canonicalArxivPdfUrlFromId = signalSourceUtils.canonicalArxivPdfUrlFromId;
export const canonicalWikipediaArticleUrl = signalSourceUtils.canonicalWikipediaArticleUrl;
export const classifyKnowledgeUrl = signalSourceUtils.classifyKnowledgeUrl;
export const inferKnowledgeMetadata = signalSourceUtils.inferKnowledgeMetadata;
export const parseContentType = signalSourceUtils.parseContentType;
export const isTextLikeContentType = signalSourceUtils.isTextLikeContentType;
export const extractReadableTextFromHtml = signalSourceUtils.extractReadableTextFromHtml;
export const fallbackTextSummary = signalSourceUtils.fallbackTextSummary;
export const normalizeAnalysisSummary = signalSourceUtils.normalizeAnalysisSummary;
export const extractCanonicalHref = signalSourceUtils.extractCanonicalHref;
export const extractTitle = signalSourceUtils.extractTitle;
export const extractLinks = signalSourceUtils.extractLinks;
export const extractSemanticReferences = signalSourceUtils.extractSemanticReferences;

export default signalSourceUtils;
