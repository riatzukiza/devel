import { cosineSimilarity, normalizeText, termFrequency, uniqueTokens } from "./text";
import type { FitBreakdown, ResumeDocument } from "./types";

const SECTION_HINTS = [
  "summary",
  "skills",
  "contact",
  "education",
  "work experience",
  "open source experience",
  "projects"
] as const;

const extractPhrases = (input: string): readonly string[] => {
  const normalized = normalizeText(input);
  const sentenceLike = input
    .split(/[\n.!?;]+/)
    .map((part) => normalizeText(part))
    .filter((part) => {
      const words = part.split(" ").filter(Boolean);
      return words.length >= 3 && words.length <= 10;
    });

  const ngrams: string[] = [];
  const tokens = normalized.split(" ").filter(Boolean);
  for (let index = 0; index < tokens.length - 2 && ngrams.length < 40; index += 1) {
    const gram = tokens.slice(index, index + 3).join(" ");
    if (gram.length >= 12) {
      ngrams.push(gram);
    }
  }

  return Array.from(new Set([...sentenceLike, ...ngrams])).slice(0, 40);
};

const coverage = (needles: readonly string[], haystack: string): { readonly hits: readonly string[]; readonly misses: readonly string[]; readonly score: number } => {
  const hits = needles.filter((needle) => haystack.includes(needle));
  const misses = needles.filter((needle) => !haystack.includes(needle));
  const score = needles.length === 0 ? 0 : hits.length / needles.length;
  return { hits, misses, score };
};

const scoreSections = (resumeText: string): number => {
  const normalized = normalizeText(resumeText);
  const present = SECTION_HINTS.filter((section) => normalized.includes(section));
  return present.length / SECTION_HINTS.length;
};

export const scorePair = (resume: ResumeDocument, jobDescription: ResumeDocument): FitBreakdown => {
  const resumeText = resume.normalizedText;
  const jdText = jobDescription.normalizedText;

  const jdTokens = uniqueTokens(jobDescription.text)
    .filter((token) => token.length >= 3)
    .slice(0, 80);
  const jdPhrases = extractPhrases(jobDescription.text)
    .filter((phrase) => phrase.length >= 8)
    .slice(0, 30);

  const keywordCoverage = coverage(jdTokens, resumeText);
  const phraseCoverage = coverage(jdPhrases, resumeText);
  const lexicalSimilarity = cosineSimilarity(termFrequency(resume.text), termFrequency(jobDescription.text));
  const sectionSignal = scoreSections(resume.text);

  const hybridScore = (
    keywordCoverage.score * 0.4 +
    phraseCoverage.score * 0.25 +
    lexicalSimilarity * 0.25 +
    sectionSignal * 0.1
  );

  return {
    keywordCoverage: keywordCoverage.score,
    keywordHits: keywordCoverage.hits,
    keywordMisses: keywordCoverage.misses,
    phraseCoverage: phraseCoverage.score,
    phraseHits: phraseCoverage.hits,
    phraseMisses: phraseCoverage.misses,
    lexicalSimilarity,
    sectionSignal,
    hybridScore
  };
};

export const recommendImprovements = (breakdown: FitBreakdown): readonly string[] => {
  const recs: string[] = [];
  if (breakdown.keywordMisses.length > 0) {
    recs.push(`Review missing JD tokens: ${breakdown.keywordMisses.slice(0, 10).join(", ")}`);
  }
  if (breakdown.phraseMisses.length > 0) {
    recs.push(`Review missing JD phrases: ${breakdown.phraseMisses.slice(0, 5).join(" | ")}`);
  }
  if (breakdown.sectionSignal < 0.6) {
    recs.push("Strengthen ATS-standard section labeling (Summary, Skills, Contact, Education, Work Experience).");
  }
  if (breakdown.lexicalSimilarity < 0.2) {
    recs.push("Low lexical similarity: consider tighter JD-specific phrasing where truthful.");
  }
  if (recs.length === 0) {
    recs.push("No major lexical gaps detected; focus on experience clarity and quantification.");
  }
  return recs;
};
