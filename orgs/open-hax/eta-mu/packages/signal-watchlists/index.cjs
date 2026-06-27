const fs = require("node:fs");

function isObjectRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeHttpUrl(rawUrl, base) {
  try {
    const url = base ? new URL(String(rawUrl || ""), base) : new URL(String(rawUrl || ""));
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
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
    url.pathname = cleanPath.length > 1 ? cleanPath.replace(/\/+$/g, "") : "/";

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
    return "";
  }
}

function normalizeWatchlistSeedRow(seedRow, domainId) {
  let rawUrl = "";
  let kind = "";
  let title = "";
  let sourceType = "";
  let tags = [];

  if (typeof seedRow === "string") {
    rawUrl = seedRow;
  } else if (isObjectRecord(seedRow)) {
    rawUrl = normalizeString(seedRow.url);
    kind = normalizeString(seedRow.kind).toLowerCase();
    title = normalizeString(seedRow.title);
    sourceType = normalizeString(seedRow.source_type).toLowerCase();
    tags = Array.isArray(seedRow.tags)
      ? [...new Set(seedRow.tags.map((item) => normalizeString(item)).filter(Boolean))]
      : [];
  }

  const url = normalizeHttpUrl(rawUrl);
  if (!url) {
    return null;
  }

  return {
    url,
    kind,
    title,
    source_type: sourceType,
    domain_id: normalizeString(domainId).toLowerCase(),
    tags,
  };
}

function parseWatchlistSeeds(payload) {
  if (!isObjectRecord(payload) || payload.enabled === false) {
    return [];
  }

  const domains = Array.isArray(payload.domains) ? payload.domains : [];
  const rows = [];
  const seen = new Set();

  for (const domainRow of domains) {
    if (!isObjectRecord(domainRow) || domainRow.enabled === false) {
      continue;
    }
    const domainId = normalizeString(domainRow.id);
    const seedRows = Array.isArray(domainRow.seed_urls) ? domainRow.seed_urls : [];
    for (const seedRow of seedRows) {
      const normalizedRow = normalizeWatchlistSeedRow(seedRow, domainId);
      if (!normalizedRow || seen.has(normalizedRow.url)) {
        continue;
      }
      seen.add(normalizedRow.url);
      rows.push(normalizedRow);
    }
  }

  rows.sort((left, right) => (
    left.domain_id.localeCompare(right.domain_id)
    || left.kind.localeCompare(right.kind)
    || left.url.localeCompare(right.url)
  ));
  return rows;
}

function loadWatchlistSeedsFromFile(filePath) {
  const target = normalizeString(filePath);
  if (!target) {
    return [];
  }
  try {
    if (!fs.existsSync(target)) {
      return [];
    }
    const payload = JSON.parse(fs.readFileSync(target, "utf8"));
    return parseWatchlistSeeds(payload);
  } catch {
    return [];
  }
}

function filterWatchlistSeedsByDomainId(rows, domainId) {
  const domainToken = normalizeString(domainId).toLowerCase();
  if (!domainToken) {
    return Array.isArray(rows) ? rows.filter((row) => isObjectRecord(row)) : [];
  }
  return (Array.isArray(rows) ? rows : []).filter((row) => (
    isObjectRecord(row)
    && normalizeString(row.domain_id).toLowerCase() === domainToken
  ));
}

function mergeRequestedAndWatchlistSeeds({
  requestedUrls = [],
  watchlistRows = [],
  normalizeUrlFn = normalizeHttpUrl,
} = {}) {
  const rows = [];
  const seen = new Set();

  for (const rawUrl of Array.isArray(requestedUrls) ? requestedUrls : []) {
    const url = normalizeString(normalizeUrlFn(rawUrl, undefined));
    if (!url || seen.has(url)) {
      continue;
    }
    seen.add(url);
    rows.push({
      url,
      source: "request",
      kind: "",
      domain_id: "",
      source_type: "",
      tags: [],
    });
  }

  for (const row of Array.isArray(watchlistRows) ? watchlistRows : []) {
    if (!isObjectRecord(row)) {
      continue;
    }
    const url = normalizeString(normalizeUrlFn(row.url, undefined));
    if (!url || seen.has(url)) {
      continue;
    }
    seen.add(url);
    rows.push({
      url,
      source: "watchlist",
      kind: normalizeString(row.kind).toLowerCase(),
      domain_id: normalizeString(row.domain_id).toLowerCase(),
      source_type: normalizeString(row.source_type).toLowerCase(),
      tags: Array.isArray(row.tags)
        ? [...new Set(row.tags.map((item) => normalizeString(item)).filter(Boolean))]
        : [],
    });
  }

  return rows;
}

module.exports = {
  normalizeHttpUrl,
  normalizeWatchlistSeedRow,
  parseWatchlistSeeds,
  loadWatchlistSeedsFromFile,
  filterWatchlistSeedsByDomainId,
  mergeRequestedAndWatchlistSeeds,
};
