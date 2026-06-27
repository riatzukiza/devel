function expandEscapedNewlines(value: string): string {
  return value.replaceAll("\\n", "\n");
}

export function formatEmbeddingQueryText(rawQuery: string): string {
  const query = String(rawQuery ?? "").trim();
  if (!query) return "";

  const template = expandEscapedNewlines(String(process.env.EMBED_QUERY_TEMPLATE ?? "")).trim();
  if (template) {
    return template.replaceAll("{query}", query);
  }

  const prefix = expandEscapedNewlines(String(process.env.EMBED_QUERY_PREFIX ?? ""));
  if (prefix) {
    return `${prefix}${query}`;
  }

  return query;
}

export function formatEmbeddingPassageText(rawText: string): string {
  const text = String(rawText ?? "").trim();
  if (!text) return "";

  const template = expandEscapedNewlines(String(process.env.EMBED_PASSAGE_TEMPLATE ?? "")).trim();
  if (template) {
    return template.replaceAll("{text}", text);
  }

  const prefix = expandEscapedNewlines(String(process.env.EMBED_PASSAGE_PREFIX ?? ""));
  if (prefix) {
    return `${prefix}${text}`;
  }

  return text;
}
