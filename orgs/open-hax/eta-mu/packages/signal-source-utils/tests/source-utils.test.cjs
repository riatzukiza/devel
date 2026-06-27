const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildArxivApiQueryUrl,
  canonicalArxivAbsUrlFromId,
  canonicalArxivPdfUrlFromId,
  canonicalWikipediaArticleUrl,
  classifyKnowledgeUrl,
  extractArxivAbsUrlsFromApiFeed,
  extractArxivIdFromUrl,
  extractFeedEntries,
  extractFeedEntryLinks,
  extractSemanticReferences,
  isArxivSearchUrl,
  llmAuthHeaders,
  looksLikeFeedDocument,
  normalizeAnalysisSummary,
  normalizeUrl,
  parseArxivSearchSeed,
  parseAuthHeader,
} = require("../index.cjs");

test("normalizeUrl canonicalizes auth, path, and query ordering", () => {
  assert.equal(
    normalizeUrl("https://user:" + "pass@example.com//alpha///?b=2&a=1#frag"),
    "https://example.com/alpha?a=1&b=2",
  );
});

test("auth header helpers normalize direct headers, bearer, and api key env", () => {
  assert.deepEqual(parseAuthHeader("Authorization: Bearer abc"), {
    Authorization: "Bearer abc",
  });

  const keys = [
    "WEAVER_LLM_AUTH_HEADER",
    "WEAVER_LLM_BEARER_TOKEN",
    "WEAVER_LLM_API_KEY",
    "WEAVER_LLM_API_KEY_HEADER",
    "TEXT_GENERATION_AUTH_HEADER",
    "TEXT_GENERATION_BEARER_TOKEN",
    "TEXT_GENERATION_API_KEY",
    "TEXT_GENERATION_API_KEY_HEADER",
  ];
  const restore = {};
  for (const key of keys) {
    restore[key] = process.env[key];
    delete process.env[key];
  }

  try {
    const fakeApiKey = ["token", "text"].join("-");
    process.env.TEXT_GENERATION_API_KEY = fakeApiKey;
    assert.deepEqual(llmAuthHeaders(), { "X-API-Key": fakeApiKey });

    const fakeBearer = ["bearer", "local"].join("-");
    process.env.WEAVER_LLM_BEARER_TOKEN = fakeBearer;
    assert.deepEqual(llmAuthHeaders(), { Authorization: `Bearer ${fakeBearer}` });
  } finally {
    for (const key of keys) {
      if (restore[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = restore[key];
      }
    }
  }
});

test("arXiv helpers preserve canonical ids and search query conversion", () => {
  assert.equal(extractArxivIdFromUrl("https://arxiv.org/abs/2401.12345v2"), "2401.12345");
  assert.equal(canonicalArxivAbsUrlFromId("2401.12345v2"), "https://arxiv.org/abs/2401.12345");
  assert.equal(canonicalArxivPdfUrlFromId("2401.12345v2"), "https://arxiv.org/pdf/2401.12345.pdf");

  const searchUrl = "https://arxiv.org/search/?query=graph+learning&searchtype=all&size=5&order=-announced_date_first";
  assert.equal(isArxivSearchUrl(searchUrl), true);
  const seed = parseArxivSearchSeed(searchUrl);
  assert.equal(seed?.searchQuery, "all:graph learning");
  assert.ok(buildArxivApiQueryUrl(seed).includes("search_query=all%3Agraph+learning"));
});

test("feed helpers parse RSS, Atom, and JSON feed entries", () => {
  const rss = `
    <rss version="2.0">
      <channel>
        <item><link>https://news.ycombinator.com/item?id=1</link></item>
        <item><link>https://example.org/advisory</link></item>
      </channel>
    </rss>
  `;
  assert.deepEqual(extractFeedEntryLinks(rss, "https://hnrss.org/frontpage", 10), [
    "https://news.ycombinator.com/item?id=1",
    "https://example.org/advisory",
  ]);

  const entries = extractFeedEntries(JSON.stringify({
    version: "https://jsonfeed.org/version/1.1",
    items: [{ id: "1", url: "https://example.com/a", title: "Port outage" }],
  }), "https://example.com/feed", 10);
  assert.equal(entries[0]?.url, "https://example.com/a");
  assert.equal(entries[0]?.sourceKind, "feed:json");
  assert.equal(looksLikeFeedDocument("application/feed+json", JSON.stringify({ version: "https://jsonfeed.org/version/1.1" })), true);
});

test("knowledge and semantic helpers preserve arXiv and Wikipedia cross references", () => {
  assert.equal(classifyKnowledgeUrl("https://arxiv.org/abs/2401.12345"), "arxiv_abs");
  assert.equal(
    canonicalWikipediaArticleUrl("https://en.m.wikipedia.org/wiki/Graph_theory#history"),
    "https://en.wikipedia.org/wiki/Graph_theory",
  );

  const payload = extractSemanticReferences(
    "https://arxiv.org/abs/2401.12345v2",
    `
      <html>
        <body>
          <a href="/pdf/2401.12345v2.pdf">PDF</a>
          <a href="https://arxiv.org/abs/2402.54321">Reference</a>
          <a href="https://en.wikipedia.org/wiki/Graph_neural_network">Wikipedia</a>
          <p>Related work includes arXiv:2403.11111v3 and arXiv:2401.12345.</p>
        </body>
      </html>
    `,
  );

  assert.equal(payload.source_kind, "arxiv_abs");
  assert.ok(payload.references.some((row) => row.edge_kind === "paper_pdf"));
  assert.ok(payload.references.some((row) => row.edge_kind === "citation" && row.url === "https://arxiv.org/abs/2402.54321"));
  assert.ok(payload.references.some((row) => row.edge_kind === "cross_reference"));
});

test("summary normalization removes prompt echo and falls back safely", () => {
  const normalized = normalizeAnalysisSummary(
    "**Summary:** the page text in 2 concise bullets. FocusIntent: <what should a graph crawler learn from this page>.",
    "CISA advisory references a known exploited vulnerability and mitigation steps.",
  );

  assert.match(normalized, /^- .+\n- .+\nFocusIntent: .+/s);
  assert.equal(normalized.includes("<what should a graph crawler learn from this page>"), false);
});

test("arXiv feed extraction returns canonical abs urls", () => {
  const feed = `
    <feed>
      <entry><id>http://arxiv.org/abs/2401.12345v2</id></entry>
      <entry><id>http://arxiv.org/abs/cs/9901001v1</id></entry>
    </feed>
  `;
  assert.deepEqual(extractArxivAbsUrlsFromApiFeed(feed, 10), [
    "https://arxiv.org/abs/2401.12345",
    "https://arxiv.org/abs/cs/9901001",
  ]);
});
