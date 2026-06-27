import type { SourceCitation } from "./packet.js";

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
  if (source.type === "official") return "primary";
  if (source.type === "ais") return "primary";
  if (source.type === "analyst") return "secondary";
  if (source.type === "news") return "secondary";
  if (source.type === "social") return "tertiary";
  return "tertiary";
}

function computeRecencyScore(source: SourceCitation): number {
  if (!source.retrieved_at) return 0.5;
  const retrieved = new Date(source.retrieved_at);
  const now = new Date();
  const hoursSince = (now.getTime() - retrieved.getTime()) / (1000 * 60 * 60);
  if (hoursSince < 1) return 1.0;
  if (hoursSince < 6) return 0.9;
  if (hoursSince < 24) return 0.8;
  if (hoursSince < 72) return 0.7;
  if (hoursSince < 168) return 0.5;
  return 0.3;
}

export class EvidenceIndex {
  private sources = new Map<string, IndexedSource>();

  index(source: SourceCitation): IndexedSource {
    const hash = hashSource(source);
    const existing = this.sources.get(hash);
    if (existing) {
      return existing;
    }

    const indexed: IndexedSource = {
      id: hash,
      citation: source,
      quality: assessSourceQuality(source),
      recencyScore: computeRecencyScore(source),
      confidenceScore: source.confidence,
    };

    this.sources.set(hash, indexed);
    return indexed;
  }

  indexBatch(sources: SourceCitation[]): IndexedSource[] {
    return sources.map((s) => this.index(s));
  }

  getById(id: string): IndexedSource | undefined {
    return this.sources.get(id);
  }

  getAll(): IndexedSource[] {
    return Array.from(this.sources.values());
  }

  getByQuality(quality: SourceQuality): IndexedSource[] {
    return this.getAll().filter((s) => s.quality === quality);
  }

  getHighQuality(threshold = 0.7): IndexedSource[] {
    return this.getAll().filter(
      (s) => s.recencyScore * s.confidenceScore >= threshold,
    );
  }

  dedupeByUrl(): number {
    const urlMap = new Map<string, string>();
    let deduped = 0;

    for (const [hash, source] of this.sources) {
      const url = source.citation.url;
      if (!url) continue;

      const normalized = url.toLowerCase().trim();
      const existing = urlMap.get(normalized);

      if (existing) {
        source.duplicateOf = existing;
        deduped++;
      } else {
        urlMap.set(normalized, hash);
      }
    }

    return deduped;
  }

  computeQualityScore(): number {
    const all = this.getAll();
    if (all.length === 0) return 0;

    const primary = all.filter((s) => s.quality === "primary").length;
    const secondary = all.filter((s) => s.quality === "secondary").length;
    const unique = all.filter((s) => !s.duplicateOf).length;

    const diversityBonus = Math.min(1, unique / all.length);
    const primaryBonus = primary * 0.1;
    const secondaryBonus = secondary * 0.05;

    return Math.min(1, (primary + secondary) / all.length + diversityBonus * 0.2 + primaryBonus + secondaryBonus);
  }

  getSummary(): {
    total: number;
    unique: number;
    byQuality: Record<SourceQuality, number>;
    avgConfidence: number;
    avgRecency: number;
  } {
    const all = this.getAll();
    const unique = all.filter((s) => !s.duplicateOf);

    const byQuality: Record<SourceQuality, number> = {
      primary: 0,
      secondary: 0,
      tertiary: 0,
      unreliable: 0,
    };

    for (const source of all) {
      byQuality[source.quality]++;
    }

    const avgConfidence = all.reduce((sum, s) => sum + s.confidenceScore, 0) / (all.length || 1);
    const avgRecency = all.reduce((sum, s) => sum + s.recencyScore, 0) / (all.length || 1);

    return {
      total: all.length,
      unique: unique.length,
      byQuality,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      avgRecency: Math.round(avgRecency * 100) / 100,
    };
  }
}