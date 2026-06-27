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
