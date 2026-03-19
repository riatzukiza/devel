import { useEffect, useMemo, useState } from "react";

type RadarSummary = {
  id: string;
  slug: string;
  name: string;
  category: string;
  status: string;
};

type SignalSummary = {
  median: number;
  range: [number, number];
  agreement: number;
};

type LiveSnapshot = {
  disagreement_index: number;
  quality_score: number;
  signals: Record<string, SignalSummary>;
};

type RadarTile = {
  radar: RadarSummary;
  sourceCount: number;
  submissionCount: number;
  liveSnapshot?: LiveSnapshot;
  latestDailySnapshot?: {
    as_of_utc: string;
  };
};

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function toNumber(value: unknown, fallback = 0): number {
  const candidate = typeof value === "number" ? value : Number(value);
  return Number.isFinite(candidate) ? candidate : fallback;
}

function normalizeSignal(value: unknown): SignalSummary | null {
  const signal = asObject(value);
  if (!signal) return null;
  const rawRange = Array.isArray(signal.range) ? signal.range : [];
  const start = toNumber(rawRange[0], 0);
  const end = toNumber(rawRange[1], start);
  return {
    median: toNumber(signal.median, 0),
    range: [start, end],
    agreement: Math.max(0, Math.min(1, toNumber(signal.agreement, 0))),
  };
}

function normalizeLiveSnapshot(value: unknown): LiveSnapshot | undefined {
  const snapshot = asObject(value);
  if (!snapshot) return undefined;

  const signalEntries = Object.entries(parseJsonValue<Record<string, unknown>>(snapshot.signals, {}))
    .flatMap(([key, candidate]) => {
      const normalized = normalizeSignal(candidate);
      return normalized ? [[key, normalized] as const] : [];
    });

  return {
    disagreement_index: Math.max(0, Math.min(1, toNumber(snapshot.disagreement_index, 0))),
    quality_score: Math.max(0, Math.round(toNumber(snapshot.quality_score, 0))),
    signals: Object.fromEntries(signalEntries),
  };
}

function normalizeTile(value: unknown): RadarTile | null {
  const tile = asObject(value);
  const radar = asObject(tile?.radar);
  if (!tile || !radar) return null;

  const id = typeof radar.id === "string" ? radar.id : "";
  const slug = typeof radar.slug === "string" ? radar.slug : "";
  const name = typeof radar.name === "string" ? radar.name : "";
  const category = typeof radar.category === "string" ? radar.category : "uncategorized";
  const status = typeof radar.status === "string" ? radar.status : "unknown";
  if (!id || !slug || !name) return null;

  const latestDailySnapshot = asObject(tile.latestDailySnapshot);
  const asOf = typeof latestDailySnapshot?.as_of_utc === "string"
    ? latestDailySnapshot.as_of_utc
    : undefined;

  return {
    radar: { id, slug, name, category, status },
    sourceCount: Math.max(0, Math.trunc(toNumber(tile.sourceCount, 0))),
    submissionCount: Math.max(0, Math.trunc(toNumber(tile.submissionCount, 0))),
    liveSnapshot: normalizeLiveSnapshot(tile.liveSnapshot),
    latestDailySnapshot: asOf ? { as_of_utc: asOf } : undefined,
  };
}

function formatTimestamp(value: string | undefined): string {
  if (!value) return "No daily seal yet";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "No daily seal yet"
    : `Daily seal ${parsed.toLocaleDateString()}`;
}

function averageSignal(snapshot: RadarTile["liveSnapshot"]): number {
  if (!snapshot) return 0;
  const values = Object.values(snapshot.signals);
  if (values.length === 0) return 0;
  return values.reduce((sum, signal) => sum + signal.median, 0) / values.length;
}

function isLabTile(tile: RadarTile): boolean {
  return tile.radar.category === "test" || /test|integration/i.test(tile.radar.name);
}

function rankTile(tile: RadarTile): number {
  const signalCount = Object.keys(tile.liveSnapshot?.signals ?? {}).length;
  return (tile.liveSnapshot ? 1000 : 0) + signalCount * 100 + tile.submissionCount * 10 + tile.sourceCount;
}

function ClockTile({ tile }: { tile: RadarTile }): JSX.Element {
  const mean = averageSignal(tile.liveSnapshot);
  const angle = -90 + (mean / 4) * 360;
  const disagreement = tile.liveSnapshot?.disagreement_index ?? 0;
  const haloOpacity = 0.15 + disagreement * 0.5;
  const signals = tile.liveSnapshot ? Object.values(tile.liveSnapshot.signals) : [];
  const handLength = 58;
  const radians = (angle * Math.PI) / 180;
  const x2 = 76 + Math.cos(radians) * handLength;
  const y2 = 76 + Math.sin(radians) * handLength;

  return (
    <article className="tile">
      <div className="tile-header">
        <div>
          <h2>{tile.radar.name}</h2>
          <p>{tile.radar.category}</p>
        </div>
        <span className="status">{tile.radar.status}</span>
      </div>
      <svg viewBox="0 0 152 152" className="clock" role="img" aria-label={`${tile.radar.name} clock`}>
        <defs>
          <radialGradient id={`halo-${tile.radar.id}`}>
            <stop offset="0%" stopColor="rgba(255,111,60,0.0)" />
            <stop offset="70%" stopColor={`rgba(255,111,60,${haloOpacity.toFixed(2)})`} />
            <stop offset="100%" stopColor="rgba(255,111,60,0.0)" />
          </radialGradient>
        </defs>
        <circle cx="76" cy="76" r="70" fill={`url(#halo-${tile.radar.id})`} />
        <circle cx="76" cy="76" r="58" className="clock-face" />
        <circle cx="76" cy="76" r="48" className="clock-ring" />
        {signals.map((signal, index) => {
          const start = -90 + (signal.range[0] / 4) * 360;
          const end = -90 + (signal.range[1] / 4) * 360;
          return (
            <path
              key={`${tile.radar.id}-${index}`}
              d={describeArc(76, 76, 52 - index * 3, start, end)}
              className="uncertainty-arc"
            />
          );
        })}
        <line x1="76" y1="76" x2={x2} y2={y2} className="clock-hand" />
        <circle cx="76" cy="76" r="5" className="clock-center" />
      </svg>
      <p className="tile-note">
        {signals.length > 0
          ? `${signals.length} live signals · ${formatTimestamp(tile.latestDailySnapshot?.as_of_utc)}`
          : `Awaiting live reduction · ${formatTimestamp(tile.latestDailySnapshot?.as_of_utc)}`}
      </p>
      <div className="tile-meta">
        <span>{tile.submissionCount} packets</span>
        <span>{tile.sourceCount} sources</span>
        <span>Q {tile.liveSnapshot?.quality_score ?? 0}</span>
      </div>
    </article>
  );
}

export function App(): JSX.Element {
  const [tiles, setTiles] = useState<RadarTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [showLabRadars, setShowLabRadars] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL ?? "";

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      if (active) {
        setLoading(true);
      }

      try {
        const response = await fetch(`${apiUrl}/api/radars`);
        if (!response.ok) {
          throw new Error(`radar request failed (${response.status})`);
        }
        const payload = (await response.json()) as unknown;
        const nextTiles = Array.isArray(payload)
          ? payload.flatMap((entry) => {
            const normalized = normalizeTile(entry);
            return normalized ? [normalized] : [];
          })
          : [];

        if (active) {
          setTiles(nextTiles);
          setError(null);
          setLastUpdatedAt(new Date().toISOString());
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load radars");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 15_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [apiUrl]);

  const orderedTiles = useMemo(
    () => [...tiles].sort((left, right) => rankTile(right) - rankTile(left)),
    [tiles],
  );

  const labRadarCount = useMemo(
    () => orderedTiles.filter((tile) => isLabTile(tile)).length,
    [orderedTiles],
  );

  const visibleTiles = useMemo(
    () => (showLabRadars ? orderedTiles : orderedTiles.filter((tile) => !isLabTile(tile))),
    [orderedTiles, showLabRadars],
  );

  const headline = useMemo(() => {
    if (loading && tiles.length === 0) {
      return "Loading radars…";
    }
    return `${visibleTiles.length} active radars`;
  }, [loading, tiles.length, visibleTiles.length]);

  const liveRadarCount = useMemo(
    () => visibleTiles.filter((tile) => tile.liveSnapshot).length,
    [visibleTiles],
  );

  const statusLine = useMemo(() => {
    if (error && tiles.length === 0) {
      return `Load failed: ${error}`;
    }
    if (error) {
      return `Refresh failed: ${error}`;
    }
    if (loading && tiles.length === 0) {
      return "Loading the wall from the local control plane.";
    }
    if (lastUpdatedAt) {
      return `Last refreshed ${new Date(lastUpdatedAt).toLocaleTimeString()}`;
    }
    return "Waiting for first refresh.";
  }, [error, lastUpdatedAt, loading, tiles.length]);

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Threat Radar Network</p>
        <h1>{headline}</h1>
        <p className="lede">A live wall of agent-maintained clocks. Each tile is a deterministic synthesis over evolving evidence, not a single model opinion.</p>
        <p className="status-line">{statusLine}</p>
        <div className="summary-row">
          <span className="summary-pill">{visibleTiles.length} shown</span>
          <span className="summary-pill">{liveRadarCount} live clocks</span>
          {labRadarCount > 0 ? (
            <span className="summary-pill">{showLabRadars ? `${labRadarCount} lab radars visible` : `${labRadarCount} lab radars hidden`}</span>
          ) : null}
          {labRadarCount > 0 ? (
            <button
              type="button"
              className="toggle-button"
              onClick={() => {
                setShowLabRadars((current) => !current);
              }}
            >
              {showLabRadars ? "Hide lab radars" : "Show lab radars"}
            </button>
          ) : null}
        </div>
      </header>
      {error && tiles.length === 0 ? (
        <section className="state-card" aria-live="polite">
          <h2>Wall unavailable</h2>
          <p>The control plane responded in a way the UI could not render safely.</p>
          <p>{error}</p>
        </section>
      ) : null}
      {!loading && !error && tiles.length === 0 ? (
        <section className="state-card" aria-live="polite">
          <h2>No radars yet</h2>
          <p>Create or ingest a radar in the MCP service and it will appear here.</p>
        </section>
      ) : null}
      {!loading && !error && tiles.length > 0 && visibleTiles.length === 0 ? (
        <section className="state-card" aria-live="polite">
          <h2>Only lab radars are available</h2>
          <p>Use the toggle above to reveal integration and test radars.</p>
        </section>
      ) : null}
      <section className="wall">
        {visibleTiles.map((tile) => <ClockTile key={tile.radar.id} tile={tile} />)}
        {loading && visibleTiles.length > 0 ? <article className="tile tile-placeholder">Refreshing live wall…</article> : null}
      </section>
    </main>
  );
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
}
