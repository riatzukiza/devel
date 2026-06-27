import type { DiscoveredLink, FetchBackend, FetchResult } from "./fetch-backend.js";
import { ShuvCrawlClient, type ShuvCrawlDiscoveredLink, type ShuvCrawlMapResult } from "./shuvcrawl-client.js";
import { extractHttpLinksFromHtml } from "@workspace/graph-weaver-aco";

export interface ShuvCrawlFetchBackendOptions {
  includePatterns?: string[];
  excludePatterns?: string[];
}

const DEFAULT_EXCLUDE_PATTERNS = [
  "github.githubassets.com",
  "avatars.githubusercontent.com",
  "user-images.githubusercontent.com",
  "private-user-images.githubusercontent.com",
  "github-cloud.s3.amazonaws.com",
  "objects.githubusercontent.com",
  "opengraph.githubassets.com",
  "ghcc.githubassets.com",
  "analytics.githubassets.com",
  "js.monitor.azure.com",
  "stats.wp.com",
  "v0.wordpress.com",
  "fonts.gstatic.com",
  "fonts.googleapis.com",
  "news.ycombinator.com/vote?id=",
  "news.ycombinator.com/hide?id=",
  "news.ycombinator.com/login?goto=",
  "github.com/login?return_to=",
  "/login?",
  "/logout",
  "/session",
  "/notifications",
  "/settings/",
  "/wp-json/",
  "/xmlrpc.php",
  "/oembed/",
];

export class ShuvCrawlFetchBackend implements FetchBackend {
  private readonly client: ShuvCrawlClient;
  private readonly includePatterns: string[];
  private readonly excludePatterns: string[];

  constructor(client: ShuvCrawlClient, options: ShuvCrawlFetchBackendOptions = {}) {
    this.client = client;
    this.includePatterns = [...(options.includePatterns ?? [])]
      .map((value) => value.trim())
      .filter(Boolean);
    this.excludePatterns = [...DEFAULT_EXCLUDE_PATTERNS, ...(options.excludePatterns ?? [])]
      .map((value) => value.trim())
      .filter(Boolean);
  }

  async fetch(url: string): Promise<FetchResult> {
    try {
      const result = await this.client.scrape(url, {
        onlyMainContent: false,
        rawHtml: true,
        wait: "networkidle",
      });

      const baseUrl = result.url || result.originalUrl || url;
      const extractedOutgoing = extractHttpLinksFromHtml(result.rawHtml || result.html || "", baseUrl);
      const feedOutgoing = extractFeedLinks(result.rawHtml || result.html || "", baseUrl);
      const sitemapOutgoing = shouldProbeSitemap(baseUrl)
        ? await this.fetchSitemapLinks(baseUrl)
        : [];
      const outgoingLinks = dedupeDiscoveredLinks([
        ...((result.linkDetails?.length ? result.linkDetails : extractedOutgoing.map((link) => ({ url: link, source: "page" as const })))
          .map((link) => this.mapDiscoveredLink(link))),
        ...feedOutgoing,
        ...sitemapOutgoing,
      ]).filter((link) => this.shouldTrackUrl(link.url, baseUrl));
      const outgoing = outgoingLinks.map((link) => link.url);

      return {
        url: baseUrl,
        status: 200,
        contentType: "text/html",
        html: result.rawHtml || result.html,
        content: result.content,
        title: result.metadata.title,
        metadata: {
          author: result.metadata.author,
          publishedAt: result.metadata.publishedAt,
          bypassMethod: result.metadata.bypassMethod,
          elapsed: result.metadata.elapsed,
        },
        outgoing,
        outgoingLinks,
      };
    } catch (err) {
      return {
        url,
        status: 0,
        contentType: "",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async discoverLinks(url: string): Promise<string[]> {
    try {
      const result = await this.client.map(url, {
        source: "both",
        sameOriginOnly: false,
      });
      return this.mapResultLinks(result).map((link) => link.url).filter((link) => this.shouldTrackUrl(link, url));
    } catch {
      return [];
    }
  }

  private async fetchSitemapLinks(url: string): Promise<DiscoveredLink[]> {
    try {
      const result = await this.client.map(url, {
        source: "sitemap",
        sameOriginOnly: false,
      });
      return this.mapResultLinks(result);
    } catch {
      return [];
    }
  }

  private mapResultLinks(result: ShuvCrawlMapResult): DiscoveredLink[] {
    if (Array.isArray(result.discovered) && result.discovered.length > 0) {
      return result.discovered.map((entry) => this.mapDiscoveredLink(entry)).filter((entry) => Boolean(entry.url));
    }
    return (result.links ?? []).map((url) => ({ url, source: "sitemap" as const }));
  }

  private mapDiscoveredLink(link: ShuvCrawlDiscoveredLink | DiscoveredLink): DiscoveredLink {
    return {
      url: link.url,
      source: link.source,
      text: link.text ?? null,
      rel: link.rel ?? null,
      context: link.context ?? null,
      domPath: link.domPath ?? null,
      blockSignature: link.blockSignature ?? null,
      blockRole: link.blockRole ?? null,
    };
  }

  private shouldTrackUrl(url: string, sourceUrl?: string): boolean {
    if (this.excludePatterns.some((pattern) => url.includes(pattern))) {
      return false;
    }
    if (sourceUrl && isSuppressedCrossHostFanout(sourceUrl, url)) {
      return false;
    }
    if (this.includePatterns.length === 0) {
      return true;
    }
    return this.includePatterns.some((pattern) => url.includes(pattern));
  }
}

function isSuppressedCrossHostFanout(sourceUrl: string, targetUrl: string): boolean {
  try {
    const source = new URL(sourceUrl);
    const target = new URL(targetUrl);

    const sourceHost = source.hostname.toLowerCase();
    const targetHost = target.hostname.toLowerCase();

    if (sourceHost.endsWith('.wikipedia.org')) {
      if (targetHost.endsWith('.wikipedia.org') && targetHost !== sourceHost) {
        return true;
      }
      if (['commons.wikimedia.org', 'donate.wikimedia.org', 'www.wikidata.org', 'wikidata.org'].includes(targetHost)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

function dedupeDiscoveredLinks(links: DiscoveredLink[]): DiscoveredLink[] {
  const merged = new Map<string, DiscoveredLink>();
  for (const link of links ?? []) {
    if (!isIndexableLink(link.url)) continue;
    const existing = merged.get(link.url);
    merged.set(link.url, {
      url: link.url,
      source: link.source ?? existing?.source,
      text: link.text ?? existing?.text ?? null,
      rel: link.rel ?? existing?.rel ?? null,
      context: link.context ?? existing?.context ?? null,
      domPath: link.domPath ?? existing?.domPath ?? null,
      blockSignature: link.blockSignature ?? existing?.blockSignature ?? null,
      blockRole: link.blockRole ?? existing?.blockRole ?? null,
    });
  }
  return [...merged.values()];
}

function isIndexableLink(link: string): boolean {
  if (!link) return false;
  try {
    const url = new URL(link);
    if (!/^https?:$/.test(url.protocol)) return false;
    const path = url.pathname.toLowerCase();
    if (/\.(css|js|mjs|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|map|mp4|webm|mp3|wav|zip|gz|bz2|xz|7z|tar)$/i.test(path)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function shouldProbeSitemap(link: string): boolean {
  try {
    const url = new URL(link);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path === "/") return true;
    if (["/changelog", "/newest", "/news", "/front"].includes(path.toLowerCase())) return true;
    if (/\/list\/[^/]+\/recent$/i.test(path)) return true;
    return false;
  } catch {
    return false;
  }
}

function extractFeedLinks(raw: string, baseUrl: string): DiscoveredLink[] {
  const source = String(raw ?? "");
  if (!source) return [];
  const links = new Map<string, DiscoveredLink>();

  for (const match of source.matchAll(/<entry\b[\s\S]*?<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const normalized = safeAbsoluteUrl(match[1], baseUrl);
    if (normalized) links.set(normalized, { url: normalized, source: "feed", blockRole: "related_content" });
  }

  for (const match of source.matchAll(/<item\b[\s\S]*?<link>([^<]+)<\/link>/gi)) {
    const normalized = safeAbsoluteUrl(match[1], baseUrl);
    if (normalized) links.set(normalized, { url: normalized, source: "feed", blockRole: "related_content" });
  }

  return [...links.values()];
}

function safeAbsoluteUrl(value: string, baseUrl: string): string | null {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}
