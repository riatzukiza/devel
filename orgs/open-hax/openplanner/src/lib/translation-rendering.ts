export type TranslationSegmentLike = {
  _id?: string | { toString(): string };
  translated_text?: string | null;
  segment_index?: number | null;
};

export type TranslationLabelLike = {
  segment_id?: string | null;
  corrected_text?: string | null;
  created_at?: string | number | Date | null;
};

function segmentIdOf(segment: TranslationSegmentLike): string {
  const raw = segment._id;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw.toString === "function") return raw.toString();
  return "";
}

function labelTimestamp(value: TranslationLabelLike["created_at"]): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function latestCorrectedText(
  segment: TranslationSegmentLike,
  labels: TranslationLabelLike[] | undefined,
): string | null {
  const segmentId = segmentIdOf(segment);
  if (!segmentId || !labels?.length) return null;

  const match = labels
    .filter((label) => label.segment_id === segmentId && typeof label.corrected_text === "string" && label.corrected_text.trim().length > 0)
    .sort((left, right) => labelTimestamp(right.created_at) - labelTimestamp(left.created_at))[0];

  return match?.corrected_text?.trim() ?? null;
}

export function renderedTranslationText(
  segment: TranslationSegmentLike,
  labels: TranslationLabelLike[] | undefined,
): string {
  return latestCorrectedText(segment, labels) ?? String(segment.translated_text ?? "");
}

export function renderTranslatedDocument(
  segments: TranslationSegmentLike[],
  labelsBySegmentId: Map<string, TranslationLabelLike[]>,
): string {
  return [...segments]
    .sort((left, right) => Number(left.segment_index ?? 0) - Number(right.segment_index ?? 0))
    .map((segment) => renderedTranslationText(segment, labelsBySegmentId.get(segmentIdOf(segment))))
    .filter((text) => text.trim().length > 0)
    .join("\n\n");
}
