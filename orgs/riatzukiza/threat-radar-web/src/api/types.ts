/**
 * Shared types for the threat-radar-web API layer.
 * Mirrors the shape returned by GET /api/radars from threat-radar-mcp.
 */

export type SignalData = {
  median: number;
  range: [number, number];
  agreement: number;
  sample_size: number;
};

export type BranchData = {
  name: string;
  support: string;
  agreement: number;
  triggers: string[];
};

export type RadarTile = {
  radar: {
    id: string;
    slug: string;
    name: string;
    category: string;
    status: string;
  };
  sourceCount: number;
  submissionCount: number;
  liveSnapshot?: {
    as_of_utc: string;
    disagreement_index: number;
    quality_score: number;
    signals: Record<string, SignalData>;
    branches: BranchData[];
    model_count: number;
  };
  latestDailySnapshot?: { as_of_utc: string };
};
