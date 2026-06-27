const DROP_SCHEMES = new Set(["mailto:", "javascript:", "data:", "tel:"]);

function decodeHtmlAttribute(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&#38;/g, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&#60;/g, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#62;/g, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'");
}

export function normalizeUrl(raw: string, base?: string): string | null {
  const trimmed = decodeHtmlAttribute(String(raw || "")).trim();
  if (!trimmed) return null;
  for (const scheme of DROP_SCHEMES) {
    if (trimmed.toLowerCase().startsWith(scheme)) return null;
  }

  try {
    const url = base ? new URL(trimmed, base) : new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    // keep query: sometimes matters for docs/search pages.
    return url.toString();
  } catch {
    return null;
  }
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

export function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

/**
 * Very small HTML link extractor (href/src). Not perfect, but stable + fast.
 * For ACO crawling, we prefer *some* consistent signal over expensive parsing.
 */
export function extractHttpLinksFromHtml(html: string, baseUrl: string): string[] {
  const links = new Set<string>();
  const re = /\b(?:href|src)\s*=\s*("[^"]+"|'[^']+'|[^\s>]+)/gi;
  let match = re.exec(html);
  while (match) {
    const token = match[1] || "";
    const raw = token.replace(/^['"]|['"]$/g, "");
    const normalized = normalizeUrl(raw, baseUrl);
    if (normalized) links.add(normalized);
    match = re.exec(html);
  }
  return [...links.values()];
}
