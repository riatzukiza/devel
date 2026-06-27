import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const HTML_TAG_RE = /<\/?[a-z][^>]{0,200}>/gi;
const HTML_DOCUMENT_RE = /<!doctype html|<html\b|<body\b|<main\b|<article\b/i;
const HTML_ARTIFACT_LINE_RE = /^\s*<\/?(?:div|span|section|article|main|header|footer|nav|aside|figure|figcaption|form|button|picture|source|template)[^>]*>\s*$/gim;
const DANGEROUS_BLOCK_RE = /<(script|style|noscript|iframe|object|embed|svg)[^>]*>[\s\S]*?<\/\1>/gi;
const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;
const DEFAULT_TOKEN_OVERFLOW_THRESHOLD = 5_000;
const DEFAULT_TARGET_CHUNK_TOKENS = 4_000;
const DEFAULT_TARGET_CHUNK_CHARS = 16_000;
const DEFAULT_OVERLAP_CHARS = 400;
const DEFAULT_BATCH_TOKEN_BUDGET = 40_000;
const DEFAULT_BATCH_ITEM_LIMIT = 256;
const HARD_MIN_CHUNK_CHARS = 3_000;

const turndown = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});
turndown.use(gfm);
turndown.remove(["script", "style", "meta", "link", "noscript", "iframe", "object", "embed", "svg"]);

export type PreparedIndexChunk = {
  id: string;
  text: string;
  chunkIndex: number;
  chunkCount: number;
  charStart?: number | null;
  charEnd?: number | null;
};

export type PreparedIndexDocument = {
  parentId: string;
  rawText: string;
  normalizedText: string;
  normalizedFormat: "markdown" | "text";
  chunked: boolean;
  chunkCount: number;
  chunks: PreparedIndexChunk[];
  rawEstimatedTokens: number;
  normalizedEstimatedTokens: number;
};

function normalizeWhitespace(input: string): string {
  return input
    .replace(/\u0000/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, "  ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function looksLikeHtml(input: string): boolean {
  const sample = String(input || "").slice(0, 20_000);
  if (!sample) return false;
  if (HTML_DOCUMENT_RE.test(sample)) return true;
  const tags = sample.match(HTML_TAG_RE)?.length ?? 0;
  if (tags < 10) return false;
  const lines = sample.split(/\n/).length;
  return tags / Math.max(1, lines) >= 0.08;
}

function stripMarkdownHtmlArtifacts(input: string): string {
  return normalizeWhitespace(
    String(input || "")
      .replace(HTML_COMMENT_RE, "\n")
      .replace(DANGEROUS_BLOCK_RE, "\n")
      .replace(HTML_ARTIFACT_LINE_RE, "\n")
      .replace(/&nbsp;/g, " "),
  );
}

function htmlToMarkdown(input: string): string {
  const cleaned = String(input || "")
    .replace(HTML_COMMENT_RE, "\n")
    .replace(DANGEROUS_BLOCK_RE, "\n");
  try {
    return stripMarkdownHtmlArtifacts(turndown.turndown(cleaned));
  } catch {
    return stripMarkdownHtmlArtifacts(cleaned);
  }
}

function extractHtmlCandidate(text: string, extra?: Record<string, unknown>): string | null {
  const sources = [
    extra?.html,
    extra?.raw_html,
    extra?.rawHtml,
    extra?.clean_html,
    extra?.cleanHtml,
    extra?.content_html,
    extra?.contentHtml,
    text,
  ];

  for (const candidate of sources) {
    if (typeof candidate === "string" && looksLikeHtml(candidate)) {
      return candidate;
    }
  }

  return null;
}

function estimateTokens(input: string): number {
  const text = String(input || "");
  if (!text.trim()) return 0;
  const chars = text.length;
  const words = text.match(/\S+/g)?.length ?? 0;
  return Math.max(Math.ceil(chars / 4), Math.ceil(words * 1.35));
}

function hardSplitBlock(block: string, maxChars: number): string[] {
  const normalized = normalizeWhitespace(block);
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [normalized];

  const lines = normalized.split(/\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length > 1) {
    return lines.flatMap((line) => hardSplitBlock(line, maxChars));
  }

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  if (sentences.length > 1) {
    const out: string[] = [];
    let current = "";
    for (const sentence of sentences) {
      const next = current ? `${current} ${sentence}` : sentence;
      if (current && next.length > maxChars) {
        out.push(current);
        current = sentence;
      } else {
        current = next;
      }
    }
    if (current) out.push(current);
    return out.flatMap((part) => hardSplitBlock(part, maxChars));
  }

  const out: string[] = [];
  const step = Math.max(HARD_MIN_CHUNK_CHARS, maxChars);
  for (let start = 0; start < normalized.length; start += step) {
    out.push(normalized.slice(start, start + step).trim());
  }
  return out.filter(Boolean);
}

function chunkText(input: string, targetTokens: number, targetChars: number, overlapChars: number): string[] {
  const text = normalizeWhitespace(input);
  if (!text) return [];
  if (estimateTokens(text) <= targetTokens && text.length <= targetChars) {
    return [text];
  }

  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block) => hardSplitBlock(block, targetChars));

  const out: string[] = [];
  let current = "";

  for (const block of blocks) {
    const next = current ? `${current}\n\n${block}` : block;
    if (current && (estimateTokens(next) > targetTokens || next.length > targetChars)) {
      out.push(current.trim());
      const maxOverlapChars = Math.max(0, Math.min(overlapChars, targetChars - block.length - 2));
      const overlap = maxOverlapChars > 0 ? current.slice(-maxOverlapChars).trim() : "";
      current = overlap ? `${overlap}\n\n${block}` : block;
      continue;
    }
    current = next;
  }

  if (current.trim()) out.push(current.trim());
  return out.filter(Boolean);
}

function locateChunkOffsets(text: string, chunks: string[]): Array<{ charStart: number | null; charEnd: number | null }> {
  let searchFrom = 0;
  return chunks.map((chunk) => {
    let start = text.indexOf(chunk, searchFrom);
    if (start < 0) start = text.indexOf(chunk);
    if (start < 0) return { charStart: null, charEnd: null };
    const charEnd = start + chunk.length;
    searchFrom = Math.max(start + 1, charEnd - DEFAULT_OVERLAP_CHARS);
    return { charStart: start, charEnd };
  });
}

export function prepareIndexDocument(params: {
  parentId: string;
  text: string;
  extra?: Record<string, unknown>;
  forceChunking?: boolean;
  targetChunkTokens?: number;
  targetChunkChars?: number;
  overlapChars?: number;
  overflowThresholdTokens?: number;
}): PreparedIndexDocument {
  const rawText = normalizeWhitespace(String(params.text || ""));
  const htmlCandidate = extractHtmlCandidate(rawText, params.extra);
  const normalizedText = htmlCandidate ? htmlToMarkdown(htmlCandidate) : stripMarkdownHtmlArtifacts(rawText);
  const normalizedFormat = htmlCandidate ? "markdown" : "text";
  const rawEstimatedTokens = estimateTokens(rawText);
  const normalizedEstimatedTokens = estimateTokens(normalizedText);

  const overflowThresholdTokens = params.overflowThresholdTokens ?? DEFAULT_TOKEN_OVERFLOW_THRESHOLD;
  const targetChunkTokens = params.targetChunkTokens ?? DEFAULT_TARGET_CHUNK_TOKENS;
  const targetChunkChars = params.targetChunkChars ?? DEFAULT_TARGET_CHUNK_CHARS;
  const overlapChars = params.overlapChars ?? DEFAULT_OVERLAP_CHARS;
  const shouldChunk = params.forceChunking === true
    || normalizedEstimatedTokens > targetChunkTokens
    || normalizedText.length > targetChunkChars
    || normalizedEstimatedTokens > overflowThresholdTokens;
  const parts = shouldChunk
    ? chunkText(normalizedText, targetChunkTokens, targetChunkChars, overlapChars)
    : [normalizedText];

  const offsets = locateChunkOffsets(normalizedText, parts);
  const chunks = parts.map((text, index) => ({
    id: parts.length === 1 ? params.parentId : `${params.parentId}#chunk:${String(index).padStart(4, "0")}`,
    text,
    chunkIndex: index,
    chunkCount: parts.length,
    charStart: offsets[index]?.charStart ?? null,
    charEnd: offsets[index]?.charEnd ?? null,
  }));

  return {
    parentId: params.parentId,
    rawText,
    normalizedText,
    normalizedFormat,
    chunked: chunks.length > 1,
    chunkCount: chunks.length,
    chunks,
    rawEstimatedTokens,
    normalizedEstimatedTokens,
  };
}

export function isContextOverflowError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  // We treat "input too large" (embed provider / OpenAI-style errors) the same as
  // context overflow, because the fix is the same: split the batch into smaller
  // pieces.
  return /context window|context size has been exceeded|ollama_context_overflow|exceeds model context window|exceed_context_size|embed_input_too_large|embedding input is too large|input is too large|maximum:\s*200000/i.test(message);
}

export function batchPreparedChunks(
  chunks: ReadonlyArray<PreparedIndexChunk>,
  opts?: { maxBatchTokens?: number; maxBatchItems?: number },
): PreparedIndexChunk[][] {
  const maxBatchTokens = opts?.maxBatchTokens ?? DEFAULT_BATCH_TOKEN_BUDGET;
  const maxBatchItems = opts?.maxBatchItems ?? DEFAULT_BATCH_ITEM_LIMIT;

  const batches: PreparedIndexChunk[][] = [];
  let current: PreparedIndexChunk[] = [];
  let currentTokens = 0;

  for (const chunk of chunks) {
    const nextTokens = estimateTokens(chunk.text);
    const wouldOverflow = current.length > 0 && (currentTokens + nextTokens > maxBatchTokens || current.length >= maxBatchItems);
    if (wouldOverflow) {
      batches.push(current);
      current = [];
      currentTokens = 0;
    }

    current.push(chunk);
    currentTokens += nextTokens;
  }

  if (current.length > 0) {
    batches.push(current);
  }

  return batches;
}
