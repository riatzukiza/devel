export interface WallClockTile {
  radarId: string;
  slug: string;
  title: string;
  status: string;
  latestSnapshotAt: string | null;
  latestSnapshot: null | {
    summary?: {
      overallRisk?: number;
      disagreement?: number;
      confidence?: number;
    };
    signals?: Array<{
      key: string;
      median: number;
      lowerBound: number;
      upperBound: number;
      disagreement: number;
    }>;
    branches?: Array<{
      key: string;
      support: 'low' | 'medium' | 'high';
      agreement: 'low' | 'moderate' | 'high';
    }>;
  };
}

export async function fetchWall(baseUrl: string): Promise<WallClockTile[]> {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/radars`, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`wall_fetch_failed:${response.status}`);
  }

  return (await response.json()) as WallClockTile[];
}

export async function fetchRadarDetail(
  baseUrl: string,
  slug: string,
): Promise<{
  radar: { id: string; slug: string; title: string; status: string };
  sources: Array<{ sourceKey: string; title: string; sourceType: string; enabled: boolean }>;
  liveSnapshot: WallClockTile['latestSnapshot'];
  dailySnapshots: Array<{ snapshotDate: string; snapshot: WallClockTile['latestSnapshot'] }>;
}> {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/radars/${encodeURIComponent(slug)}`, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`radar_detail_fetch_failed:${response.status}`);
  }

  return (await response.json()) as {
    radar: { id: string; slug: string; title: string; status: string };
    sources: Array<{ sourceKey: string; title: string; sourceType: string; enabled: boolean }>;
    liveSnapshot: WallClockTile['latestSnapshot'];
    dailySnapshots: Array<{ snapshotDate: string; snapshot: WallClockTile['latestSnapshot'] }>;
  };
}
