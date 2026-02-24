function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function unwrapData(value: unknown): unknown {
  const rec = asRecord(value);
  if (rec && Object.prototype.hasOwnProperty.call(rec, "data")) {
    return rec.data;
  }
  return value;
}

export type AgentCatalogEntry = {
  name: string;
  mode: string;
  builtIn: boolean;
  description: string;
};

export function parseAgentCatalog(value: unknown): AgentCatalogEntry[] {
  const unwrapped = unwrapData(value);
  const candidates = Array.isArray(unwrapped)
    ? unwrapped
    : (asRecord(unwrapped)?.agents && Array.isArray(asRecord(unwrapped)?.agents)
      ? (asRecord(unwrapped)?.agents as unknown[])
      : []);

  return candidates
    .map((item) => asRecord(item))
    .filter((rec): rec is Record<string, unknown> => rec !== null)
    .map((rec) => {
      const name = typeof rec.name === "string" ? rec.name.trim() : "";
      const mode = typeof rec.mode === "string" ? rec.mode.trim() : "unknown";
      const builtIn = rec.builtIn === true;
      const description = typeof rec.description === "string" ? rec.description.replace(/\s+/g, " ").trim() : "";
      return { name, mode, builtIn, description };
    })
    .filter((entry) => entry.name.length > 0);
}

export function primaryAgentNames(value: unknown): string[] {
  return parseAgentCatalog(value)
    .filter((entry) => entry.mode !== "subagent")
    .map((entry) => entry.name.toLowerCase());
}

export function formatPrimaryAgentList(value: unknown, maxResults: number, includeDescriptions: boolean): string {
  const candidates = parseAgentCatalog(value).filter((entry) => entry.mode !== "subagent");
  const lines = candidates.slice(0, maxResults).map((entry) => {
    const builtIn = entry.builtIn ? "built-in" : "custom";
    const base = `${entry.name} [${entry.mode}] ${builtIn}`;
    if (includeDescriptions && entry.description.length > 0) {
      return `${base} - ${entry.description.slice(0, 140)}`;
    }
    return base;
  });

  if (lines.length === 0) {
    return "(no agents)";
  }

  if (candidates.length > lines.length) {
    lines.push(`#truncated ${maxResults}; use higher maxResults for more agents`);
  }

  return lines.join("\n");
}
