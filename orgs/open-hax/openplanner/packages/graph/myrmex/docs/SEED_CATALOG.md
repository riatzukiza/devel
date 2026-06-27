# Knoxx / Proxx Websearch Seed Catalog

Curated seed sets for the extracted Fork Tales graph slice.

## Important split

Current runtime behavior is **not symmetric** across seed types.

### 1. Expandable seeds

Use these with the current `myrmex -> shuvcrawl` path when you want frontier growth.
They are HTML/listing surfaces that naturally link outward.

### 2. Feed / beacon seeds

Use these as poll targets, freshness beacons, or future feed-ingestion sources.
Today they are still useful, but they do **not** reliably expand into frontier links in the extracted runtime.

Fork Tales had explicit feed-entry extraction for RSS/Atom/JSON Feed; this extracted slice has not fully regained that behavior yet.

## Recommended starter set for current crawl expansion

### Hacker News / dev discovery

- `https://news.ycombinator.com/`
- `https://news.ycombinator.com/newest`

### GitHub HTML surfaces

- `https://github.com/open-hax/proxx/issues`
- `https://github.com/open-hax/proxx/pulls`
- `https://github.com/open-hax/knoxx/issues`
- `https://github.com/open-hax/knoxx/pulls`
- `https://github.com/open-hax/openplanner/issues`
- `https://github.com/open-hax/openplanner/pulls`
- `https://github.com/openai/codex/issues`
- `https://github.com/openai/codex/pulls`
- `https://github.com/shuv1337/shuvcrawl/issues`
- `https://github.com/shuv1337/shuvcrawl/pulls`
- `https://github.com/octave-commons/graph-weaver/issues`
- `https://github.com/octave-commons/myrmex/issues`

### GitHub editorial / ecosystem surfaces

- `https://github.blog/`
- `https://github.blog/changelog/`

### Research / knowledge graph surfaces

- `https://arxiv.org/list/cs.AI/recent`
- `https://arxiv.org/list/cs.LG/recent`
- `https://arxiv.org/list/cs.CR/recent`
- `https://krebsonsecurity.com/`
- `https://openssf.org/blog/`

### Optional exploratory seeds (high-fanout / noisy)

- `https://en.wikipedia.org/wiki/Artificial_intelligence`
  - useful for aggressive concept expansion
  - noisy in the current runtime because it fans out into interlanguage and Wikimedia surfaces

### Workspace-derived public corpus

- `https://riatzukiza.github.io/`

### Event / world-watch listing surfaces from Fork Tales

- `https://www.ukmto.org/advisory/003-26`
- `https://www.maritime.dot.gov/msci`
- `https://api.weather.gov/alerts/active`
- `https://eonet.gsfc.nasa.gov/api/v3/events?status=open`
- `https://stream.wikimedia.org/v2/stream/recentchange,revision-create,page-create,page-delete,page-undelete`

## Feed / beacon set for future Proxx websearch ingestion

### Hacker News

- `https://hnrss.org/frontpage`
- `https://hnrss.org/newest?q=security`
- `https://news.ycombinator.com/rss`

### GitHub Atom feeds

- `https://github.com/open-hax/proxx/releases.atom`
- `https://github.com/open-hax/knoxx/releases.atom`
- `https://github.com/open-hax/openplanner/releases.atom`
- `https://github.com/openai/codex/releases.atom`
- `https://github.com/openai/codex/commits/main.atom`
- `https://github.com/octave-commons/graph-weaver/releases.atom`
- `https://github.com/octave-commons/graph-weaver-aco/releases.atom`
- `https://github.com/octave-commons/myrmex/releases.atom`
- `https://github.com/shuv1337/shuvcrawl/releases.atom`

### Research feeds

- `https://rss.arxiv.org/rss/cs.AI`
- `https://rss.arxiv.org/rss/cs.LG`
- `https://rss.arxiv.org/rss/cs.CR`
- `https://rss.arxiv.org/rss/stat.ML`

### Security feeds

- `https://krebsonsecurity.com/feed/`
- `https://www.schneier.com/blog/atom.xml`
- `https://openssf.org/blog/`
- `https://www.first.org/blog/`

## Ready-to-paste `MYRMEX_SEED_URLS`

```text
https://news.ycombinator.com/,
https://news.ycombinator.com/newest,
https://github.blog/changelog/,
https://github.com/open-hax/proxx/issues,
https://github.com/open-hax/knoxx/issues,
https://github.com/open-hax/openplanner/issues,
https://github.com/openai/codex/issues,
https://github.com/shuv1337/shuvcrawl/issues,
https://arxiv.org/list/cs.AI/recent,
https://arxiv.org/list/cs.LG/recent,
https://arxiv.org/list/cs.CR/recent,
https://krebsonsecurity.com/,
https://openssf.org/blog/,
https://riatzukiza.github.io/
```

## Provenance

- `fork_tales/part64/world_state/config/world_watchlist.json`
- `fork_tales/docs/WEB_GRAPH_WEAVER.md`
- workspace-wide URL harvest from `~/devel`
- public web confirmation for GitHub Atom patterns, HN/HNRSS, arXiv RSS, and security feeds
