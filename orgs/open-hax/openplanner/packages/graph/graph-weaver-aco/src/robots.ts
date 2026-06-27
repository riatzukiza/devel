import { normalizeUrl, originOf } from "./url.js";

type RobotsRules = {
  fetchedAt: number;
  allowAll: boolean;
  disallow: string[];
};

function parseRobotsTxt(txt: string, userAgent: string): RobotsRules {
  const ua = userAgent.toLowerCase();
  const lines = txt
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*$/, "").trim())
    .filter(Boolean);

  let active = false;
  let activeIsWildcard = false;
  const disallow: string[] = [];

  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (key === "user-agent") {
      const v = value.toLowerCase();
      active = v === "*" || v === ua;
      activeIsWildcard = v === "*";
      continue;
    }

    if (!active) continue;
    if (key === "disallow") {
      if (value) disallow.push(value);
    }
  }

  // If only wildcard rules were present, that's fine; if nothing, allow all.
  return {
    fetchedAt: Date.now(),
    allowAll: disallow.length === 0 && !activeIsWildcard,
    disallow,
  };
}

export class RobotsCache {
  private readonly userAgent: string;
  private readonly rulesByOrigin = new Map<string, RobotsRules>();
  private readonly ttlMs: number;

  constructor(params: { userAgent: string; ttlMs?: number }) {
    this.userAgent = params.userAgent;
    this.ttlMs = params.ttlMs ?? 1000 * 60 * 60;
  }

  async allowed(url: string): Promise<boolean> {
    const origin = originOf(url);
    if (!origin) return false;

    const cached = this.rulesByOrigin.get(origin);
    if (cached && Date.now() - cached.fetchedAt < this.ttlMs) {
      return this.allowedByRules(url, cached);
    }

    const robotsUrl = normalizeUrl("/robots.txt", origin);
    if (!robotsUrl) return true;

    try {
      const res = await fetch(robotsUrl, {
        headers: {
          "user-agent": this.userAgent,
          accept: "text/plain,*/*",
        },
      });
      const txt = await res.text();
      const rules = parseRobotsTxt(txt, this.userAgent);
      this.rulesByOrigin.set(origin, rules);
      return this.allowedByRules(url, rules);
    } catch {
      // If robots fetch fails, prefer permissive (common crawler behavior).
      return true;
    }
  }

  private allowedByRules(url: string, rules: RobotsRules): boolean {
    if (rules.allowAll) return true;
    try {
      const u = new URL(url);
      const path = u.pathname || "/";
      for (const prefix of rules.disallow) {
        if (prefix === "/" && prefix.length === 1) return false;
        if (prefix && path.startsWith(prefix)) return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}
