const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  loadWatchlistSeedsFromFile,
  mergeRequestedAndWatchlistSeeds,
  normalizeHttpUrl,
  parseWatchlistSeeds,
} = require("../index.cjs");

test("normalizeHttpUrl strips auth, fragments, and duplicate slashes", () => {
  assert.equal(
    normalizeHttpUrl("https://user:" + "pass@example.com//feed///?b=2&a=1#frag"),
    "https://example.com/feed?a=1&b=2",
  );
});

test("parseWatchlistSeeds preserves feed metadata and dedupes by normalized URL", () => {
  const rows = parseWatchlistSeeds({
    enabled: true,
    domains: [
      {
        id: "hacker_news",
        seed_urls: [
          {
            url: "https://hnrss.org/frontpage",
            kind: "feed:rss",
            title: "HN Frontpage",
            source_type: "rss",
          },
          "https://hnrss.org/frontpage#dup",
        ],
      },
    ],
  });

  assert.deepEqual(rows, [
    {
      url: "https://hnrss.org/frontpage",
      kind: "feed:rss",
      title: "HN Frontpage",
      source_type: "rss",
      domain_id: "hacker_news",
      tags: [],
    },
  ]);
});

test("loadWatchlistSeedsFromFile loads a world_watchlist payload from disk", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "signal-watchlists-"));
  const filePath = path.join(tmpDir, "world_watchlist.json");
  fs.writeFileSync(filePath, JSON.stringify({
    enabled: true,
    domains: [{ id: "hormuz", seed_urls: ["https://www.ukmto.org/advisory/003-26"] }],
  }), "utf8");

  try {
    const rows = loadWatchlistSeedsFromFile(filePath);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].domain_id, "hormuz");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("mergeRequestedAndWatchlistSeeds keeps request seeds first and dedupes overlaps", () => {
  const rows = mergeRequestedAndWatchlistSeeds({
    requestedUrls: ["https://example.com/advisory", "https://example.com/advisory#dup"],
    watchlistRows: [
      {
        url: "https://example.com/advisory",
        kind: "feed:rss",
        title: "Overlap",
        source_type: "rss",
        domain_id: "global",
        tags: [],
      },
      {
        url: "https://hnrss.org/frontpage",
        kind: "feed:rss",
        title: "HN",
        source_type: "rss",
        domain_id: "global",
        tags: [],
      },
    ],
  });

  assert.deepEqual(rows, [
    {
      url: "https://example.com/advisory",
      source: "request",
      kind: "",
      domain_id: "",
      source_type: "",
      tags: [],
    },
    {
      url: "https://hnrss.org/frontpage",
      source: "watchlist",
      kind: "feed:rss",
      domain_id: "global",
      source_type: "rss",
      tags: [],
    },
  ]);
});
