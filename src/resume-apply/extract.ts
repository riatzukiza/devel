import { normalizeText, tokenize } from "../resume-workbench/text";
import type { RequirementsExtract } from "./types";

export const extractBullets = (text: string): readonly string[] => {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim());

  const bullets: string[] = [];
  for (const line of lines) {
    if (line.startsWith("-") || line.startsWith("•") || line.startsWith("*") || line.startsWith("+") || line.startsWith("\u2022")) {
      const cleaned = line.replace(/^[-•*+\u2022]+\s*/, "").trim();
      if (cleaned.length > 0) {
        bullets.push(cleaned);
      }
    }
  }
  return bullets;
};

export const keywordCounts = (text: string): Readonly<Record<string, number>> => {
  const counts: Record<string, number> = {};
  for (const token of tokenize(text)) {
    counts[token] = (counts[token] ?? 0) + 1;
  }
  return counts;
};

export const diffTopMissingTokens = (input: {
  readonly resumeText: string;
  readonly jobText: string;
  readonly limit: number;
}): readonly { readonly token: string; readonly jobCount: number }[] => {
  const resumeTokens = new Set(tokenize(input.resumeText));
  const jobCounts = keywordCounts(input.jobText);
  const missing = Object.entries(jobCounts)
    .filter(([token]) => !resumeTokens.has(token))
    .sort((a, b) => b[1] - a[1])
    .slice(0, input.limit)
    .map(([token, jobCount]) => ({ token, jobCount }));

  return missing;
};

export const buildRequirements = (input: {
  readonly company: string;
  readonly role: string;
  readonly jobUrl?: string;
  readonly capturedAt: string;
  readonly jobText: string;
}): RequirementsExtract => ({
  company: input.company,
  role: input.role,
  jobUrl: input.jobUrl,
  capturedAt: input.capturedAt,
  bullets: extractBullets(input.jobText),
});

export const toPlainJobText = (raw: string): string => normalizeText(raw)
  .replace(/\s+/g, " ")
  .trim();
