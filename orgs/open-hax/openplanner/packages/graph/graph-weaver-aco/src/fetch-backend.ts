import { extractHttpLinksFromHtml } from "./url.js";

export interface DiscoveredLink {
  url: string;
  source?: "page" | "sitemap" | "feed";
  text?: string | null;
  rel?: string | null;
  context?: string | null;
  domPath?: string | null;
  blockSignature?: string | null;
  blockRole?: string | null;
}

export interface FetchResult {
  url: string;
  status: number;
  contentType: string;
  html?: string;
  content?: string;
  title?: string;
  metadata?: Record<string, unknown>;
  outgoing?: string[];
  outgoingLinks?: DiscoveredLink[];
  error?: string;
}

export interface FetchBackend {
  fetch(url: string, options?: {
    signal?: AbortSignal;
    timeout?: number;
    userAgent?: string;
  }): Promise<FetchResult>;

  discoverLinks?(url: string, options?: {
    signal?: AbortSignal;
    timeout?: number;
  }): Promise<string[]>;
}

export class SimpleFetchBackend implements FetchBackend {
  private readonly userAgent: string;

  constructor(options?: { userAgent?: string }) {
    this.userAgent = options?.userAgent ?? "graph-weaver/0.1";
  }

  async fetch(url: string, options?: { signal?: AbortSignal; timeout?: number; userAgent?: string }): Promise<FetchResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeout ?? 15_000);
    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: options?.signal ?? controller.signal,
        headers: {
          "user-agent": options?.userAgent ?? this.userAgent,
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      const contentType = String(res.headers.get("content-type") || "");
      const status = res.status;
      const body = await res.text();
      const outgoingLinks = contentType.includes("text/html")
        ? extractHttpLinksFromHtml(body, url).map((link) => ({ url: link, source: "page" as const }))
        : [];
      const outgoing = outgoingLinks.map((link) => link.url);
      return {
        url,
        status,
        contentType,
        html: contentType.includes("text/html") ? body : undefined,
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
    } finally {
      clearTimeout(timeout);
    }
  }

  async discoverLinks(_url: string, _options?: { signal?: AbortSignal; timeout?: number }): Promise<string[]> {
    return [];
  }
}
