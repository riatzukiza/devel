export interface ResumeDocument {
  readonly path: string;
  readonly kind: "resume" | "job-description";
  readonly text: string;
  readonly normalizedText: string;
  readonly wordCount: number;
}

export interface FitBreakdown {
  readonly keywordCoverage: number;
  readonly keywordHits: readonly string[];
  readonly keywordMisses: readonly string[];
  readonly phraseCoverage: number;
  readonly phraseHits: readonly string[];
  readonly phraseMisses: readonly string[];
  readonly lexicalSimilarity: number;
  readonly sectionSignal: number;
  readonly hybridScore: number;
}

export interface PairReport {
  readonly resumePath: string;
  readonly jobDescriptionPath: string;
  readonly breakdown: FitBreakdown;
  readonly recommendations: readonly string[];
}

export interface WorkbenchReport {
  readonly generatedAt: string;
  readonly resumes: readonly string[];
  readonly jobDescriptions: readonly string[];
  readonly pairs: readonly PairReport[];
  readonly notes: readonly string[];
}
