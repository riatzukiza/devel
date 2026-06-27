export type BlobRef = {
  blob: string; // sha256 hex
  mime: string;
  name?: string;
  size?: number;
};

export type SourceRef = Partial<{
  project: string;
  session: string;
  message: string;
  turn: string;
}>;

export type EventEnvelopeV1 = {
  schema: "openplanner.event.v1";
  schema_version?: number;
  id: string;
  ts: string; // ISO
  source: string;
  kind: string;
  source_ref?: SourceRef;
  text?: string;
  attachments?: BlobRef[];
  meta?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  migration_state?: Record<string, unknown>;
};

export type EventIngestRequest = { events: EventEnvelopeV1[] };

export type SearchTier = "hot" | "compact" | "both";

export type DocumentKind = "docs" | "code" | "config" | "data";
export type DocumentVisibility = "internal" | "review" | "public" | "archived";

export type DocumentRecord = {
  id: string;
  title: string;
  content: string;
  project: string;
  kind: DocumentKind;
  visibility: DocumentVisibility;
  source?: string;
  sourcePath?: string;
  domain?: string;
  language?: string;
  createdBy?: string;
  publishedBy?: string;
  publishedAt?: string | null;
  aiDrafted?: boolean;
  aiModel?: string | null;
  aiPromptHash?: string | null;
  metadata?: Record<string, unknown>;
  ts?: string;
};

export type DocumentUpsertRequest = {
  document: DocumentRecord;
};

export type DocumentPatchRequest = {
  title?: string;
  content?: string;
  visibility?: DocumentVisibility;
  sourcePath?: string | null;
  domain?: string | null;
  language?: string | null;
  publishedBy?: string | null;
  publishedAt?: string | null;
  metadata?: Record<string, unknown>;
};

export type FtsSearchRequest = {
  q: string;
  limit?: number;
  source?: string;
  kind?: string;
  project?: string;
  session?: string;
  visibility?: DocumentVisibility;
  tier?: SearchTier;
  quality?: "good" | "not_bad" | "any" | "good_then_not_bad";
  output_quality?: "good" | "not_bad" | "any" | "good_then_not_bad";
};

export type VectorSearchRequest = {
  q: string;
  k?: number;
  source?: string;
  kind?: string;
  project?: string;
  visibility?: DocumentVisibility;
  where?: Record<string, unknown>;
  tier?: SearchTier;
  quality?: "good" | "not_bad" | "any" | "good_then_not_bad";
  output_quality?: "good" | "not_bad" | "any" | "good_then_not_bad";
};

// Translation types

export type TranslationSegmentSource = "mt" | "human" | "import";
export type TranslationStatus = "pending" | "in_review" | "approved" | "rejected";

export type TranslationSegmentEvent = {
  schema: "openplanner.event.v1";
  id: string;
  ts: string;
  source: TranslationSegmentSource;
  kind: "translation.segment";
  source_ref: {
    project: string;
    document_id: string;
    segment_index: number;
  };
  text: string;
  meta: {
    source_lang: string;
    target_lang: string;
    source_text: string;
    mt_model?: string;
    confidence?: number;
    status: TranslationStatus;
  };
  extra: {
    tenant_id: string;
    org_id: string;
    domain?: string;
    content_type?: string;
    url_context?: string;
  };
};

export type TranslationLabelEvent = {
  schema: "openplanner.event.v1";
  id: string;
  ts: string;
  source: "shibboleth";
  kind: "translation.label";
  source_ref: {
    project: string;
    segment_id: string;
    document_id: string;
  };
  meta: {
    labeler_id: string;
    labeler_email: string;
    label_version: number;
  };
  extra: {
    tenant_id: string;
    org_id: string;
    adequacy: "excellent" | "good" | "adequate" | "poor" | "unusable";
    fluency: "excellent" | "good" | "adequate" | "poor" | "unusable";
    terminology: "correct" | "minor_errors" | "major_errors";
    risk: "safe" | "sensitive" | "policy_violation";
    overall: "approve" | "needs_edit" | "reject";
    corrected_text?: string;
    editor_notes?: string;
  };
};

export type TranslationSegmentResponse = {
  id: string;
  source_text: string;
  translated_text: string;
  source_lang: string;
  target_lang: string;
  status: TranslationStatus;
  confidence?: number;
  mt_model?: string;
  document_id: string;
  segment_index: number;
  domain?: string;
  tenant_id: string;
  org_id: string;
  labels: TranslationLabelResponse[];
  ts: string;
};

export type TranslationLabelResponse = {
  id: string;
  segment_id: string;
  labeler_id: string;
  labeler_email: string;
  adequacy: string;
  fluency: string;
  terminology: string;
  risk: string;
  overall: string;
  corrected_text?: string;
  editor_notes?: string;
  ts: string;
};

export type TranslationSegmentListRequest = {
  project: string;
  status?: TranslationStatus;
  source_lang?: string;
  target_lang?: string;
  domain?: string;
  limit?: number;
  offset?: number;
};

export type TranslationLabelSubmitRequest = {
  adequacy: "excellent" | "good" | "adequate" | "poor" | "unusable";
  fluency: "excellent" | "good" | "adequate" | "poor" | "unusable";
  terminology: "correct" | "minor_errors" | "major_errors";
  risk: "safe" | "sensitive" | "policy_violation";
  overall: "approve" | "needs_edit" | "reject";
  corrected_text?: string;
  editor_notes?: string;
};

export type TranslationBatchImportRequest = {
  segments: {
    source_text: string;
    translated_text: string;
    source_lang: string;
    target_lang: string;
    document_id: string;
    segment_index: number;
    mt_model?: string;
    confidence?: number;
    domain?: string;
    project?: string;
    tenant_id?: string;
    org_id?: string;
  }[];
};
