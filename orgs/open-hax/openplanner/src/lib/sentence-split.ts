import { split } from "sentence-splitter";
import { createHash } from "node:crypto";

export interface SentenceWithHash {
  sentence: string;
  hash: string;
  tokens: number;
}

function sha256Hex(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function estimateTokens(input: string): number {
  const text = String(input || "");
  if (!text.trim()) return 0;
  const chars = text.length;
  const words = text.match(/\S+/g)?.length ?? 0;
  return Math.max(Math.ceil(chars / 4), Math.ceil(words * 1.35));
}

export function splitSentences(text: string): SentenceWithHash[] {
  if (!text || text.length === 0) {
    return [];
  }

  const tree = split(text);
  const sentences: SentenceWithHash[] = [];

  for (const node of tree) {
    if (typeof node === "object" && node !== null) {
      const type = (node as any).type;
      if (type === "Sentence") {
        const sentenceText = String((node as any).raw ?? "").trim();
        if (sentenceText.length > 0) {
          const normalized = sentenceText.toLowerCase();
          sentences.push({
            sentence: sentenceText,
            hash: sha256Hex(normalized),
            tokens: estimateTokens(sentenceText),
          });
        }
      }
    }
  }

  return sentences;
}

export function deduplicateByHash(
  items: SentenceWithHash[],
): Map<string, SentenceWithHash> {
  const seen = new Map<string, SentenceWithHash>();
  for (const item of items) {
    if (!seen.has(item.hash)) {
      seen.set(item.hash, item);
    }
  }
  return seen;
}

export function computeTextHash(text: string): string {
  return sha256Hex(text.trim().toLowerCase());
}
