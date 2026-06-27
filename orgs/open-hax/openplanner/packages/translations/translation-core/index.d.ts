export type TranslationSegmentStatus = "pending" | "in_review" | "approved" | "rejected";
export type TranslationLabelOverall = "approve" | "needs_edit" | "reject";

export type NormalizedTranslationSegment = {
  source_text: string;
  translated_text: string;
  source_lang: string;
  target_lang: string;
  document_id: string;
  segment_index: number;
  status: TranslationSegmentStatus;
  mt_model?: string | null;
  confidence?: number | null;
  domain?: string | null;
  content_type?: string | null;
  url_context?: string | null;
  garden_id?: string | null;
  org_id?: string | null;
  project?: string | null;
  errors: Array<{ path: string[]; error: string }>;
};

export type TranslationSummary = {
  total_segments: number;
  approved: number;
  pending: number;
  rejected: number;
  in_review: number;
  overall_status: string;
};

export function nextSegmentStatus(input: {
  currentStatus?: unknown;
  overall?: unknown;
  corrected_text?: unknown;
  correctedText?: unknown;
}): TranslationSegmentStatus;

export function documentOverallStatus(input: {
  total?: number;
  approved?: number;
  rejected?: number;
  pending?: number;
}): string;

export function summarizeSegments(segments: Array<{ status?: unknown }>): TranslationSummary;
export function normalizeTranslationSegment(input: Record<string, unknown>): NormalizedTranslationSegment;
export function translationGraphMemoryPlan(input: Record<string, unknown>): Record<string, unknown>;
export function sftRow(input: Record<string, unknown>): { prompt: string; target: string };
export function manifestShape(input: {
  project?: string;
  languages?: Array<Record<string, unknown>>;
  correctionsByLanguage?: Record<string, number>;
  labelers?: Array<Record<string, unknown>>;
}): {
  project: string;
  languages: Record<string, Record<string, number>>;
  labelers: Array<{ email: string; segments_labeled: number }>;
  export_sizes: Record<string, { rows: number; bytes_estimate: number }>;
};

export function translationJobPlan(input: Record<string, unknown>): {
  "ok?": boolean;
  error?: string;
  documentId?: string;
  document_id?: string;
  targetLanguages?: string[];
  target_languages?: string[];
  jobs?: Array<{
    document_id: string;
    garden_id?: string | null;
    project?: string | null;
    source_lang: string;
    target_language: string;
    status: "queued";
  }>;
  message?: string;
};

export function jobStatusUpdatePlan(input: Record<string, unknown>): {
  "ok?": boolean;
  error?: string;
  status?: "processing" | "complete" | "failed";
  "started?"?: boolean;
  "completed?"?: boolean;
};

export function documentListShape(input: { documents: unknown[]; titles: Record<string, unknown> }): {
  documents: Array<Record<string, unknown>>;
  total: number;
};

export function documentTranslationShape(input: { document: Record<string, unknown>; segments: unknown[]; labels: unknown[] }): {
  document: Record<string, unknown>;
  segments: Array<Record<string, unknown>>;
  summary: TranslationSummary;
};

export function documentReviewLabelPlan(input: Record<string, unknown>): Record<string, unknown> & { next_status: TranslationSegmentStatus };
