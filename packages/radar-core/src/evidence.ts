import type { SourceCitation } from "./schema.js";

export type SourceQuality = "primary" | "secondary" | "tertiary" | "unreliable";

export type IndexedSource = {
  id: string;
  citation: SourceCitation;
  quality: SourceQuality;
  recencyScore: number;
  confidenceScore: number;
  duplicateOf?: string;
};

function hashSource(source: SourceCitation): string {
  const normalizedUrl = source.url?.toLowerCase().trim() ?? "";
  const normalizedName = source.name.toLowerCase().trim();
  return `${source.type}:${normalizedName}:${normalizedUrl}`;
}

function assessSourceQuality(source: SourceCitation): SourceQuality {
  if (source.type === "official" || source.type === "ais") return "primary";
  if (source.type === "analyst" || source.type === "news") return "secondary";
  if (source.type === "social") return "tertiary";
  return "tertiary";
}

function computeRecencyScore(source: SourceCitation): number {
  if (!source.retrieved_at) return 0.5;
  const hoursSince = (Date.now() - new Date(source.retrieved_at).getTime()) / (1000 * 60 * 60);
  if (hoursSince < 1) return 1;
  if (hoursSince < 6) return 0.9;
  if (hoursSince < 24) return 0.8;
  if (hoursSince < 72) return 0.7;
  if (hoursSince < 168) return 0.5;
  return 0.3;
}

export class EvidenceIndex {
  private readonly sources = new Map<string, IndexedSource>();

  index(source: SourceCitation): IndexedSource {
    const id = hashSource(source);
    const existing = this.sources.get(id);
    if (existing) return existing;
    const indexed: IndexedSource = {
      id,
      citation: source,
      quality: assessSourceQuality(source),
      recencyScore: computeRecencyScore(source),
      confidenceScore: source.confidence,
    };
    this.sources.set(id, indexed);
    return indexed;
  }

  indexBatch(sources: SourceCitation[]): IndexedSource[] {
    return sources.map((source) => this.index(source));
  }

  dedupeByUrl(): number {
    const urlMap = new Map<string, string>();
    let deduped = 0;
    for (const [id, source] of this.sources.entries()) {
      const url = source.citation.url?.toLowerCase().trim();
      if (!url) continue;
      const existing = urlMap.get(url);
      if (existing) {
        source.duplicateOf = existing;
        deduped += 1;
      } else {
        urlMap.set(url, id);
      }
    }
    return deduped;
  }

  getSummary(): {
    total: number;
    unique: number;
    byQuality: Record<SourceQuality, number>;
    avgConfidence: number;
    avgRecency: number;
  } {
    const all = [...this.sources.values()];
    const unique = all.filter((source) => !source.duplicateOf).length;
    const byQuality: Record<SourceQuality, number> = {
      primary: 0,
      secondary: 0,
      tertiary: 0,
      unreliable: 0,
    };
    for (const source of all) {
      byQuality[source.quality] += 1;
    }
    return {
      total: all.length,
      unique,
      byQuality,
      avgConfidence: Math.round((all.reduce((sum, source) => sum + source.confidenceScore, 0) / (all.length || 1)) * 100) / 100,
      avgRecency: Math.round((all.reduce((sum, source) => sum + source.recencyScore, 0) / (all.length || 1)) * 100) / 100,
    };
  }
}
