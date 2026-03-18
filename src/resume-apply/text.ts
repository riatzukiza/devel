export const stripHtmlToText = (input: string): string => {
  // Remove scripts/styles first.
  const withoutScripts = input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");

  // Very small HTML -> text approximation (offline + dependency-free).
  const withoutTags = withoutScripts
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ");

  // Minimal entity decoding for common entities.
  const decoded = withoutTags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return decoded
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/ +/g, " ")
    .trim();
};

export const slugify = (input: string): string => input
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-+|-+$)/g, "")
  .slice(0, 80);
