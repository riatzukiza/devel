const ARXIV_API_QUERY_URL = String(
  process.env.WEAVER_ARXIV_API_QUERY_URL || "http://export.arxiv.org/api/query",
).trim();
const ARXIV_API_MAX_RESULTS = Number.parseInt(
  process.env.WEAVER_ARXIV_API_MAX_RESULTS || "400",
  10,
);
const FEED_ENTRY_LINK_MAX = Number.parseInt(
  process.env.WEAVER_FEED_ENTRY_LINK_MAX || "2000",
  10,
);
const MAX_SEMANTIC_REFERENCES_PER_PAGE = Number.parseInt(
  process.env.WEAVER_MAX_SEMANTIC_REFERENCES_PER_PAGE || "2000",
  10,
);
const MAX_ARXIV_REFERENCES_PER_PAGE = Number.parseInt(
  process.env.WEAVER_MAX_ARXIV_REFERENCES_PER_PAGE || "1500",
  10,
);
const MAX_WIKIPEDIA_REFERENCES_PER_PAGE = Number.parseInt(
  process.env.WEAVER_MAX_WIKIPEDIA_REFERENCES_PER_PAGE || "1500",
  10,
);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeUrl(raw, base) {
  try {
    const url = base ? new URL(raw, base) : new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    url.hash = "";
    url.username = "";
    url.password = "";
    if (url.protocol === "http:" && url.port === "80") {
      url.port = "";
    }
    if (url.protocol === "https:" && url.port === "443") {
      url.port = "";
    }
    const cleanPath = url.pathname.replace(/\/+/g, "/");
    if (cleanPath.length > 1) {
      url.pathname = cleanPath.replace(/\/+$/g, "");
    } else {
      url.pathname = "/";
    }
    const sortedParams = [...url.searchParams.entries()].sort((left, right) => {
      if (left[0] === right[0]) {
        return left[1].localeCompare(right[1]);
      }
      return left[0].localeCompare(right[0]);
    });
    url.search = "";
    for (const [key, value] of sortedParams) {
      url.searchParams.append(key, value);
    }
    return url.toString();
  } catch {
    return null;
  }
}

function parseAuthHeader(rawHeader) {
  const header = String(rawHeader || "").trim();
  if (!header) {
    return {};
  }
  if (header.includes(":")) {
    const [key, ...rest] = header.split(":");
    const normalizedKey = String(key || "").trim();
    const normalizedValue = String(rest.join(":") || "").trim();
    if (normalizedKey && normalizedValue) {
      return {
        [normalizedKey]: normalizedValue,
      };
    }
  }
  return {
    Authorization: header,
  };
}

function llmAuthHeaders() {
  const weaverRawHeader = String(process.env.WEAVER_LLM_AUTH_HEADER || "").trim();
  if (weaverRawHeader) {
    return parseAuthHeader(weaverRawHeader);
  }
  const textGenerationRawHeader = String(process.env.TEXT_GENERATION_AUTH_HEADER || "").trim();
  if (textGenerationRawHeader) {
    return parseAuthHeader(textGenerationRawHeader);
  }

  const bearerToken =
    String(process.env.WEAVER_LLM_BEARER_TOKEN || "").trim() ||
    String(process.env.TEXT_GENERATION_BEARER_TOKEN || "").trim();
  if (bearerToken) {
    return {
      Authorization: `Bearer ${bearerToken}`,
    };
  }

  const apiKey =
    String(process.env.WEAVER_LLM_API_KEY || "").trim() ||
    String(process.env.TEXT_GENERATION_API_KEY || "").trim();
  if (apiKey) {
    const headerName = String(
      process.env.WEAVER_LLM_API_KEY_HEADER ||
        process.env.TEXT_GENERATION_API_KEY_HEADER ||
        "X-API-Key",
    ).trim();
    return {
      [headerName || "X-API-Key"]: apiKey,
    };
  }

  return {};
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeArxivId(rawId) {
  let value = String(rawId || "").trim();
  if (!value) {
    return "";
  }
  value = value.replace(/\.pdf$/i, "").replace(/\/+$/g, "");
  value = value.replace(/v\d+$/i, "");
  value = safeDecodeURIComponent(value);
  if (!/^[a-z0-9._\-/]+$/i.test(value)) {
    return "";
  }
  return value;
}

function isArxivHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return host === "arxiv.org" || host.endsWith(".arxiv.org");
}

function extractArxivIdFromUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!isArxivHost(parsed.hostname)) {
      return "";
    }
    const path = parsed.pathname || "";
    const match = /^\/(abs|pdf)\/(.+)$/i.exec(path);
    if (!match) {
      return "";
    }
    return normalizeArxivId(match[2]);
  } catch {
    return "";
  }
}

function canonicalArxivAbsUrlFromId(arxivId) {
  const normalized = normalizeArxivId(arxivId);
  if (!normalized) {
    return "";
  }
  return `https://arxiv.org/abs/${normalized}`;
}

function canonicalArxivPdfUrlFromId(arxivId) {
  const normalized = normalizeArxivId(arxivId);
  if (!normalized) {
    return "";
  }
  return `https://arxiv.org/pdf/${normalized}.pdf`;
}

function isArxivPdfUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return isArxivHost(parsed.hostname) && /^\/pdf\//i.test(parsed.pathname || "");
  } catch {
    return false;
  }
}

function isArxivSearchUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return isArxivHost(parsed.hostname) && /^\/search\/?$/i.test(parsed.pathname || "");
  } catch {
    return false;
  }
}

function parseArxivSearchSeed(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!isArxivHost(parsed.hostname) || !/^\/search\/?$/i.test(parsed.pathname || "")) {
      return null;
    }

    const query = String(
      parsed.searchParams.get("query") || parsed.searchParams.get("search_query") || "",
    ).trim();
    if (!query) {
      return null;
    }

    const searchType = String(parsed.searchParams.get("searchtype") || "all").trim().toLowerCase();
    const prefixByType = {
      all: "all",
      title: "ti",
      author: "au",
      abstract: "abs",
      comments: "co",
      journal_ref: "jr",
      cat: "cat",
    };
    const fieldPrefix = prefixByType[searchType] || "all";
    const compactQuery = query.replace(/\s+/g, " ").trim();
    const searchQuery = /^[a-z_]+\s*:/i.test(compactQuery)
      ? compactQuery
      : `${fieldPrefix}:${compactQuery}`;

    const sortByRaw = String(parsed.searchParams.get("order") || "").trim().toLowerCase();
    let sortBy = "relevance";
    if (sortByRaw === "-announced_date_first") {
      sortBy = "submittedDate";
    } else if (sortByRaw === "-last_updated_date") {
      sortBy = "lastUpdatedDate";
    }

    const startRaw = Number.parseInt(String(parsed.searchParams.get("start") || "0"), 10);
    const sizeRaw = Number.parseInt(
      String(parsed.searchParams.get("size") || parsed.searchParams.get("max_results") || "25"),
      10,
    );
    const start = Number.isFinite(startRaw) ? Math.max(0, startRaw) : 0;
    const maxResults = clamp(
      Number.isFinite(sizeRaw) && sizeRaw > 0 ? sizeRaw : 25,
      1,
      Math.max(1, ARXIV_API_MAX_RESULTS),
    );

    return {
      searchQuery,
      start,
      maxResults,
      sortBy,
      sortOrder: "descending",
    };
  } catch {
    return null;
  }
}

function buildArxivApiQueryUrl(seed) {
  const parsed = seed || {};
  const apiUrl = new URL(ARXIV_API_QUERY_URL);
  apiUrl.searchParams.set("search_query", String(parsed.searchQuery || "all:all"));
  apiUrl.searchParams.set("start", String(Math.max(0, Number(parsed.start || 0))));
  apiUrl.searchParams.set(
    "max_results",
    String(clamp(Number(parsed.maxResults || 25), 1, Math.max(1, ARXIV_API_MAX_RESULTS))),
  );
  apiUrl.searchParams.set("sortBy", String(parsed.sortBy || "relevance"));
  apiUrl.searchParams.set("sortOrder", String(parsed.sortOrder || "descending"));
  return apiUrl.toString();
}

function extractArxivAbsUrlsFromApiFeed(feedXml, maxItems = ARXIV_API_MAX_RESULTS) {
  const xml = String(feedXml || "");
  const entries = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  const output = [];
  const seen = new Set();
  for (const entry of entries) {
    const idMatch = /<id[^>]*>\s*([^<]+)\s*<\/id>/i.exec(entry);
    const idUrl = String(idMatch?.[1] || "").trim();
    const arxivId = extractArxivIdFromUrl(idUrl);
    if (!arxivId) {
      continue;
    }
    const canonical = canonicalArxivAbsUrlFromId(arxivId);
    if (!canonical || seen.has(canonical)) {
      continue;
    }
    seen.add(canonical);
    output.push(canonical);
    if (output.length >= maxItems) {
      break;
    }
  }
  return output;
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function extractFeedEntries(feedBody, baseUrl, maxItems = FEED_ENTRY_LINK_MAX) {
  const output = [];
  const seen = new Set();
  const safeMax = clamp(Number(maxItems || FEED_ENTRY_LINK_MAX), 1, Math.max(1, FEED_ENTRY_LINK_MAX));

  const cleanFeedText = (rawValue, limit = 360) => {
    const decoded = decodeHtmlEntities(String(rawValue || "")).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");
    const plain = decoded.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!plain) {
      return "";
    }
    if (plain.length <= limit) {
      return plain;
    }
    return `${plain.slice(0, Math.max(0, limit - 3)).trim()}...`;
  };

  const pushEntry = (rawValue, meta = {}) => {
    const decoded = String(rawValue || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .trim();
    if (!decoded) {
      return;
    }
    const normalized = normalizeUrl(decoded, baseUrl);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    const title = cleanFeedText(meta.title || "", 200);
    const summary = cleanFeedText(meta.summary || meta.description || "", 480);
    const publishedAt = cleanFeedText(meta.publishedAt || meta.date_published || "", 80);
    const sourceKind = cleanFeedText(meta.sourceKind || "", 80).toLowerCase();
    seen.add(normalized);
    output.push({
      url: normalized,
      title,
      summary,
      publishedAt,
      sourceKind,
    });
  };

  const text = String(feedBody || "").trim();
  if (!text) {
    return output;
  }

  const maybeJson = text.startsWith("{") || text.startsWith("[");
  if (maybeJson) {
    try {
      const payload = JSON.parse(text);
      const items = Array.isArray(payload?.items) ? payload.items : [];
      for (const item of items) {
        if (!item || typeof item !== "object") {
          continue;
        }
        pushEntry(item.url || item.external_url || item.id || "", {
          title: item.title || "",
          summary: item.summary || item.content_text || item.content_html || "",
          publishedAt: item.date_published || item.date_modified || "",
          sourceKind: "feed:json",
        });
        if (output.length >= safeMax) {
          return output;
        }
      }
      if (output.length > 0) {
        return output;
      }
    } catch {
      // fall through to XML parsing
    }
  }

  const xml = text;
  const rssItems = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  for (const item of rssItems) {
    const titleMatch = /<title[^>]*>\s*([\s\S]*?)\s*<\/title>/i.exec(item);
    const descriptionMatch = /<description[^>]*>\s*([\s\S]*?)\s*<\/description>/i.exec(item);
    const pubDateMatch = /<pubDate[^>]*>\s*([\s\S]*?)\s*<\/pubDate>/i.exec(item);
    const dcDateMatch = /<dc:date[^>]*>\s*([\s\S]*?)\s*<\/dc:date>/i.exec(item);
    const rssMeta = {
      title: titleMatch?.[1] || "",
      summary: descriptionMatch?.[1] || "",
      publishedAt: pubDateMatch?.[1] || dcDateMatch?.[1] || "",
      sourceKind: "feed:rss",
    };
    const linkMatch = /<link[^>]*>\s*([\s\S]*?)\s*<\/link>/i.exec(item);
    if (linkMatch) {
      pushEntry(linkMatch[1], rssMeta);
    }
    const guidMatch = /<guid\b([^>]*)>\s*([\s\S]*?)\s*<\/guid>/i.exec(item);
    if (guidMatch) {
      const attrs = String(guidMatch[1] || "").toLowerCase();
      if (!attrs.includes('ispermalink="false"')) {
        pushEntry(guidMatch[2], rssMeta);
      }
    }
    const rdfAboutMatch = /<item\b[^>]*\brdf:about\s*=\s*(?:"([^"]+)"|'([^']+)')/i.exec(item);
    if (rdfAboutMatch) {
      pushEntry(rdfAboutMatch[1] || rdfAboutMatch[2] || "", rssMeta);
    }
    if (output.length >= safeMax) {
      return output.slice(0, safeMax);
    }
  }

  const atomEntries = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  for (const entry of atomEntries) {
    const titleMatch = /<title[^>]*>\s*([\s\S]*?)\s*<\/title>/i.exec(entry);
    const summaryMatch = /<summary[^>]*>\s*([\s\S]*?)\s*<\/summary>/i.exec(entry);
    const contentMatch = /<content[^>]*>\s*([\s\S]*?)\s*<\/content>/i.exec(entry);
    const publishedMatch = /<published[^>]*>\s*([\s\S]*?)\s*<\/published>/i.exec(entry);
    const updatedMatch = /<updated[^>]*>\s*([\s\S]*?)\s*<\/updated>/i.exec(entry);
    const atomMeta = {
      title: titleMatch?.[1] || "",
      summary: summaryMatch?.[1] || contentMatch?.[1] || "",
      publishedAt: publishedMatch?.[1] || updatedMatch?.[1] || "",
      sourceKind: "feed:atom",
    };
    const atomLinkPattern = /<link\b[^>]*>/gi;
    while (true) {
      const linkTagMatch = atomLinkPattern.exec(entry);
      if (!linkTagMatch) {
        break;
      }
      const tag = String(linkTagMatch[0] || "");
      const hrefMatch = /\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'`<>]+))/i.exec(tag);
      if (!hrefMatch) {
        continue;
      }
      const relMatch = /\brel\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'`<>]+))/i.exec(tag);
      const relValue = String(relMatch?.[1] || relMatch?.[2] || relMatch?.[3] || "")
        .toLowerCase()
        .trim();
      if (relValue && !relValue.split(/\s+/).includes("alternate")) {
        continue;
      }
      pushEntry(hrefMatch[1] || hrefMatch[2] || hrefMatch[3] || "", atomMeta);
      if (output.length >= safeMax) {
        return output.slice(0, safeMax);
      }
    }
    const idMatch = /<id[^>]*>\s*([\s\S]*?)\s*<\/id>/i.exec(entry);
    if (idMatch) {
      pushEntry(idMatch[1], atomMeta);
      if (output.length >= safeMax) {
        return output.slice(0, safeMax);
      }
    }
  }

  return output.slice(0, safeMax);
}

function extractFeedEntryLinks(feedBody, baseUrl, maxItems = FEED_ENTRY_LINK_MAX) {
  return extractFeedEntries(feedBody, baseUrl, maxItems)
    .map((row) => String(row?.url || "").trim())
    .filter((url) => url.length > 0);
}

function looksLikeFeedDocument(contentType, bodyText) {
  const type = String(contentType || "").toLowerCase();
  if (type.includes("application/rss+xml") || type.includes("application/atom+xml")) {
    return true;
  }
  if (type.includes("application/feed+json")) {
    return true;
  }

  const trimmed = String(bodyText || "").trim();
  if (!trimmed) {
    return false;
  }
  if ((type.includes("json") || trimmed.startsWith("{")) && trimmed.includes("jsonfeed.org/version")) {
    return true;
  }
  if (!(type.includes("xml") || type.includes("text/") || trimmed.startsWith("<"))) {
    return false;
  }

  const head = trimmed.slice(0, 8192).toLowerCase();
  return (
    head.includes("<rss") ||
    head.includes("<feed") ||
    head.includes("<rdf:rdf") ||
    (head.includes("<channel") && head.includes("<item"))
  );
}

function canonicalWikipediaArticleUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const host = String(parsed.hostname || "").toLowerCase();
    if (host !== "wikipedia.org" && !host.endsWith(".wikipedia.org")) {
      return "";
    }
    if (!parsed.pathname.startsWith("/wiki/")) {
      return "";
    }
    const rawSlug = parsed.pathname.slice("/wiki/".length);
    const slug = safeDecodeURIComponent(rawSlug).trim().replace(/\s+/g, "_");
    if (!slug || slug.includes(":")) {
      return "";
    }
    const canonicalHost = host.replace(/\.m\.wikipedia\.org$/, ".wikipedia.org");
    const encodedSlug = encodeURIComponent(slug).replace(/%2F/g, "/");
    const canonical = `https://${canonicalHost}/wiki/${encodedSlug}`;
    return normalizeUrl(canonical, undefined) || "";
  } catch {
    return "";
  }
}

function extractWikipediaSlugFromUrl(rawUrl) {
  const canonical = canonicalWikipediaArticleUrl(rawUrl);
  if (!canonical) {
    return "";
  }
  try {
    const parsed = new URL(canonical);
    return safeDecodeURIComponent(parsed.pathname.slice("/wiki/".length));
  } catch {
    return "";
  }
}

function classifyKnowledgeUrl(rawUrl) {
  const arxivId = extractArxivIdFromUrl(rawUrl);
  if (arxivId) {
    return isArxivPdfUrl(rawUrl) ? "arxiv_pdf" : "arxiv_abs";
  }
  const wikiUrl = canonicalWikipediaArticleUrl(rawUrl);
  if (wikiUrl) {
    return "wikipedia_article";
  }
  return "other";
}

function inferKnowledgeMetadata(rawUrl) {
  const knowledgeKind = classifyKnowledgeUrl(rawUrl);
  if (knowledgeKind === "arxiv_abs" || knowledgeKind === "arxiv_pdf") {
    return {
      source_family: "arxiv",
      knowledge_kind: knowledgeKind,
      arxiv_id: extractArxivIdFromUrl(rawUrl) || null,
      wikipedia_slug: null,
    };
  }
  if (knowledgeKind === "wikipedia_article") {
    return {
      source_family: "wikipedia",
      knowledge_kind: knowledgeKind,
      arxiv_id: null,
      wikipedia_slug: extractWikipediaSlugFromUrl(rawUrl) || null,
    };
  }
  return {
    source_family: "web",
    knowledge_kind: "web_url",
    arxiv_id: null,
    wikipedia_slug: null,
  };
}

function parseContentType(contentTypeHeader) {
  if (!contentTypeHeader) {
    return "application/octet-stream";
  }
  return String(contentTypeHeader).split(";")[0].trim().toLowerCase() || "application/octet-stream";
}

function isTextLikeContentType(contentType) {
  const value = String(contentType || "").toLowerCase();
  return (
    value.startsWith("text/") ||
    value.includes("html") ||
    value.includes("xml") ||
    value.includes("json") ||
    value.includes("javascript") ||
    value.includes("xhtml") ||
    value.includes("svg")
  );
}

function extractReadableTextFromHtml(html) {
  const withoutScripts = String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  const withoutTags = withoutScripts.replace(/<[^>]+>/g, " ");
  const decoded = decodeHtmlEntities(withoutTags);
  return decoded.replace(/\s+/g, " ").trim();
}

function fallbackTextSummary(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) {
    return "No readable text extracted.";
  }
  if (clean.length <= 260) {
    return clean;
  }
  return `${clean.slice(0, 257)}...`;
}

function focusIntentFromText(text) {
  const lowered = String(text || "").toLowerCase();
  if (!lowered.trim()) {
    return "Re-crawl this source with alternate rendering to extract reliable content.";
  }
  if (/\b(cve|vulnerability|exploit|security|advisory|mitre|nvd|cisa|patch)\b/.test(lowered)) {
    return "Track affected systems, severity signals, and remediation guidance from this source.";
  }
  if (/\b(release|changelog|version|update|roadmap)\b/.test(lowered)) {
    return "Track release changes, version deltas, and references to impacted components.";
  }
  if (/\b(doc|documentation|guide|tutorial|quickstart|api)\b/.test(lowered)) {
    return "Track implementation guidance, API references, and linked technical dependencies.";
  }
  return "Track the key entities, claims, and outbound references from this page.";
}

function structuredFallbackAnalysisSummary(text) {
  const compact = fallbackTextSummary(text);
  if (!compact || compact === "No readable text extracted.") {
    return [
      "- No reliable page text was extracted.",
      "- The source may require JavaScript, authentication, or alternate rendering.",
      "FocusIntent: Re-crawl this source with alternate rendering to capture substantive content.",
    ].join("\n");
  }
  const first = compact.length > 220 ? `${compact.slice(0, 217)}...` : compact;
  return [
    `- ${first}`,
    "- Auto-condensed summary; verify important claims against the canonical source.",
    `FocusIntent: ${focusIntentFromText(compact)}`,
  ].join("\n");
}

function normalizeAnalysisSummary(rawText, fallbackText) {
  const fallbackSummary = structuredFallbackAnalysisSummary(fallbackText);
  const cleanRaw = String(rawText || "").replace(/\r/g, "\n").trim();
  if (!cleanRaw) {
    return fallbackSummary;
  }

  const flattened = cleanRaw.replace(/```[\s\S]*?```/g, " ").replace(/\s+/g, " ").trim();
  if (!flattened) {
    return fallbackSummary;
  }

  const lowered = flattened.toLowerCase();
  if (
    lowered.includes("<what should a graph crawler learn from this page>") ||
    lowered.includes("the page text in 2 concise bullet") ||
    lowered === "text" ||
    lowered === "page text"
  ) {
    return fallbackSummary;
  }

  const tokens = lowered.match(/[a-z0-9_/-]+/g) || [];
  if (tokens.length >= 12) {
    const uniqueRatio = new Set(tokens).size / tokens.length;
    if (uniqueRatio < 0.28) {
      return fallbackSummary;
    }
  }

  const rows = cleanRaw
    .split(/\n+/)
    .map((line) => String(line || "").replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);

  const bulletCandidates = [];
  let focusIntent = "";
  for (const row of rows) {
    const noMarkdown = row.replace(/^#+\s*/, "").trim();
    const focusMatch = /^focus\s*intent\s*[:\-]\s*(.+)$/i.exec(noMarkdown);
    if (focusMatch && !focusIntent) {
      focusIntent = String(focusMatch[1] || "").replace(/\s+/g, " ").trim();
      continue;
    }
    const stripped = noMarkdown.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim();
    if (!stripped) {
      continue;
    }
    if (/^focus\s*intent\b/i.test(stripped)) {
      continue;
    }
    bulletCandidates.push(stripped);
  }

  if (bulletCandidates.length < 2) {
    const sentenceCandidates = flattened
      .split(/[.!?]\s+/)
      .map((item) => String(item || "").replace(/\s+/g, " ").trim())
      .filter((item) => item.length >= 12);
    for (const sentence of sentenceCandidates) {
      bulletCandidates.push(sentence);
      if (bulletCandidates.length >= 3) {
        break;
      }
    }
  }

  const dedupedBullets = [];
  const seen = new Set();
  for (const item of bulletCandidates) {
    const normalized = String(item || "").replace(/\s+/g, " ").trim();
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    dedupedBullets.push(normalized);
    if (dedupedBullets.length >= 4) {
      break;
    }
  }

  const fallbackRows = fallbackSummary.split(/\n+/);
  const fallbackBulletA = String(fallbackRows[0] || "").replace(/^[-*]\s*/, "").trim();
  const fallbackBulletB = String(fallbackRows[1] || "").replace(/^[-*]\s*/, "").trim();

  const bulletA = dedupedBullets[0] || fallbackBulletA || "No reliable summary extracted.";
  const bulletB =
    dedupedBullets[1] ||
    fallbackBulletB ||
    "Verify key claims against the original source before acting.";
  const resolvedIntent = String(focusIntent || "").trim() || focusIntentFromText(flattened);

  const clampText = (text, limit) => {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (clean.length <= limit) {
      return clean;
    }
    return `${clean.slice(0, Math.max(0, limit - 3)).trim()}...`;
  };

  return [
    `- ${clampText(bulletA, 260)}`,
    `- ${clampText(bulletB, 260)}`,
    `FocusIntent: ${clampText(resolvedIntent, 240)}`,
  ].join("\n");
}

function extractCanonicalHref(html) {
  const match = /<link[^>]+rel\s*=\s*["'][^"']*canonical[^"']*["'][^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'>]+))/i.exec(
    html,
  );
  if (!match) {
    return "";
  }
  return String(match[1] || match[2] || match[3] || "").trim();
}

function extractTitle(html) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!match) {
    return "";
  }
  return match[1].replace(/\s+/g, " ").trim().slice(0, 160);
}

function extractAnchorLinks(html, baseUrl) {
  const links = [];
  const seen = new Set();
  const pushLink = (url, nofollow) => {
    if (!url || seen.has(url)) {
      return;
    }
    seen.add(url);
    links.push({ url, nofollow });
  };

  const pageNoFollow = /<meta[^>]+name\s*=\s*["']robots["'][^>]+content\s*=\s*["'][^"']*nofollow[^"']*["'][^>]*>/i.test(
    html,
  );
  const anchorPattern = /<a\s+[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`<>]+))[^>]*>/gi;
  while (true) {
    const match = anchorPattern.exec(html);
    if (match === null) {
      break;
    }
    const tag = match[0] || "";
    const href = String(match[1] || match[2] || match[3] || "").trim();
    if (!href) {
      continue;
    }
    const relMatch = /rel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`<>]+))/i.exec(tag);
    const relValue = String(relMatch?.[1] || relMatch?.[2] || relMatch?.[3] || "").toLowerCase();
    const nofollow = pageNoFollow || relValue.split(/\s+/).includes("nofollow");
    const normalized = normalizeUrl(href, baseUrl);
    if (!normalized) {
      continue;
    }
    pushLink(normalized, nofollow);
  }
  return links;
}

function extractLinks(html, baseUrl) {
  const links = [];
  const seen = new Set();
  const pushLink = (url, nofollow) => {
    if (!url || seen.has(url)) {
      return;
    }
    seen.add(url);
    links.push({ url, nofollow });
  };

  for (const link of extractAnchorLinks(html, baseUrl)) {
    pushLink(link.url, link.nofollow);
  }

  const resourcePattern = /<(?:link|script|img|source)\s+[^>]*(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`<>]+))[^>]*>/gi;
  while (true) {
    const match = resourcePattern.exec(html);
    if (match === null) {
      break;
    }
    const href = String(match[1] || match[2] || match[3] || "").trim();
    if (!href) {
      continue;
    }
    const normalized = normalizeUrl(href, baseUrl);
    if (!normalized) {
      continue;
    }
    pushLink(normalized, false);
  }

  return links;
}

function extractArxivMentionIds(text) {
  const ids = [];
  const seen = new Set();
  const mentionPattern = /\barxiv\s*:\s*([a-z\-]+\/\d{7}|\d{4}\.\d{4,5})(?:v\d+)?\b/gi;
  while (true) {
    const match = mentionPattern.exec(text);
    if (match === null) {
      break;
    }
    const normalized = normalizeArxivId(match[1]);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    ids.push(normalized);
  }
  return ids;
}

function dedupeSemanticReferences(rows, maxItems = MAX_SEMANTIC_REFERENCES_PER_PAGE) {
  const output = [];
  const seen = new Set();
  for (const row of rows) {
    const normalized = normalizeUrl(row.url, undefined);
    if (!normalized) {
      continue;
    }
    const edgeKind = String(row.edge_kind || "").trim().toLowerCase();
    if (!edgeKind) {
      continue;
    }
    const key = `${edgeKind}|${normalized}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push({
      url: normalized,
      edge_kind: edgeKind,
      reason: String(row.reason || "semantic_reference"),
      nofollow: Boolean(row.nofollow),
      enqueue: Boolean(row.enqueue),
    });
    if (output.length >= maxItems) {
      break;
    }
  }
  return output;
}

function extractSemanticReferences(sourceUrl, html) {
  const sourceKind = classifyKnowledgeUrl(sourceUrl);
  if (sourceKind === "other") {
    return {
      source_kind: "other",
      references: [],
    };
  }

  const references = [];
  const anchorLinks = extractAnchorLinks(html, sourceUrl);

  if (sourceKind === "arxiv_abs" || sourceKind === "arxiv_pdf") {
    const sourceArxivId = extractArxivIdFromUrl(sourceUrl);
    if (sourceArxivId) {
      references.push({
        url: canonicalArxivPdfUrlFromId(sourceArxivId),
        edge_kind: "paper_pdf",
        reason: "arxiv_pdf_asset",
        nofollow: false,
        enqueue: true,
      });
    }

    let arxivReferenceBudget = MAX_ARXIV_REFERENCES_PER_PAGE;
    for (const link of anchorLinks) {
      const targetArxivId = extractArxivIdFromUrl(link.url);
      if (targetArxivId) {
        if (sourceArxivId && targetArxivId === sourceArxivId) {
          if (isArxivPdfUrl(link.url)) {
            references.push({
              url: canonicalArxivPdfUrlFromId(targetArxivId),
              edge_kind: "paper_pdf",
              reason: "arxiv_pdf_asset",
              nofollow: link.nofollow,
              enqueue: !link.nofollow,
            });
          }
        } else if (arxivReferenceBudget > 0) {
          references.push({
            url: canonicalArxivAbsUrlFromId(targetArxivId),
            edge_kind: "citation",
            reason: "arxiv_link_citation",
            nofollow: link.nofollow,
            enqueue: !link.nofollow,
          });
          arxivReferenceBudget -= 1;
        }
      }

      const wikiTarget = canonicalWikipediaArticleUrl(link.url);
      if (wikiTarget) {
        references.push({
          url: wikiTarget,
          edge_kind: "cross_reference",
          reason: "arxiv_to_wikipedia",
          nofollow: link.nofollow,
          enqueue: !link.nofollow,
        });
      }
    }

    if (arxivReferenceBudget > 0) {
      for (const mentionId of extractArxivMentionIds(html)) {
        if (sourceArxivId && mentionId === sourceArxivId) {
          continue;
        }
        references.push({
          url: canonicalArxivAbsUrlFromId(mentionId),
          edge_kind: "citation",
          reason: "arxiv_text_citation",
          nofollow: false,
          enqueue: false,
        });
        arxivReferenceBudget -= 1;
        if (arxivReferenceBudget <= 0) {
          break;
        }
      }
    }
  }

  if (sourceKind === "wikipedia_article") {
    const sourceWiki = canonicalWikipediaArticleUrl(sourceUrl);
    let wikipediaBudget = MAX_WIKIPEDIA_REFERENCES_PER_PAGE;

    for (const link of anchorLinks) {
      const wikiTarget = canonicalWikipediaArticleUrl(link.url);
      if (wikiTarget && wikiTarget !== sourceWiki && wikipediaBudget > 0) {
        references.push({
          url: wikiTarget,
          edge_kind: "wiki_reference",
          reason: "wikipedia_internal_link",
          nofollow: link.nofollow,
          enqueue: !link.nofollow,
        });
        wikipediaBudget -= 1;
      }

      const targetArxivId = extractArxivIdFromUrl(link.url);
      if (targetArxivId) {
        references.push({
          url: canonicalArxivAbsUrlFromId(targetArxivId),
          edge_kind: "cross_reference",
          reason: "wikipedia_to_arxiv",
          nofollow: link.nofollow,
          enqueue: !link.nofollow,
        });
      }
    }
  }

  return {
    source_kind: sourceKind,
    references: dedupeSemanticReferences(references),
  };
}

module.exports = {
  normalizeUrl,
  parseAuthHeader,
  llmAuthHeaders,
  extractArxivIdFromUrl,
  isArxivSearchUrl,
  parseArxivSearchSeed,
  buildArxivApiQueryUrl,
  extractArxivAbsUrlsFromApiFeed,
  extractFeedEntries,
  extractFeedEntryLinks,
  looksLikeFeedDocument,
  canonicalArxivAbsUrlFromId,
  canonicalArxivPdfUrlFromId,
  canonicalWikipediaArticleUrl,
  classifyKnowledgeUrl,
  inferKnowledgeMetadata,
  parseContentType,
  isTextLikeContentType,
  extractReadableTextFromHtml,
  fallbackTextSummary,
  normalizeAnalysisSummary,
  extractCanonicalHref,
  extractTitle,
  extractLinks,
  extractSemanticReferences,
};
