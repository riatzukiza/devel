import { useEffect, useMemo, useState } from "react";

type SignalData = { median: number; range: [number, number]; agreement: number; sample_size: number };
type BranchData = { name: string; support: string; agreement: number; triggers: string[] };

type RadarTile = {
  radar: { id: string; slug: string; name: string; category: string; status: string };
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

function averageSignal(snapshot: RadarTile["liveSnapshot"]): number {
  if (!snapshot) return 0;
  const values = Object.values(snapshot.signals);
  if (values.length === 0) return 0;
  return values.reduce((sum, s) => sum + s.median, 0) / values.length;
}

function SweepClock({ tile }: { tile: RadarTile }) {
  const mean = averageSignal(tile.liveSnapshot);
  const disagreement = tile.liveSnapshot?.disagreement_index ?? 0;
  const handAngle = -135 + (mean / 4) * 270;
  const signals = tile.liveSnapshot ? Object.entries(tile.liveSnapshot.signals) : [];
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 2800);
    return () => window.clearInterval(id);
  }, []);

  const jitter = Math.sin(tick * 0.7) * disagreement * 3;
  const haloRadius = 62 + disagreement * 12;
  const haloOpacity = 0.08 + disagreement * 0.35;

  return (
    <svg viewBox="0 0 180 180" className="sweep-clock">
      <circle cx="90" cy="90" r={haloRadius} fill="none"
        stroke={`rgba(255,111,60,${haloOpacity.toFixed(2)})`} strokeWidth="6"
        style={{ filter: "blur(4px)" }} />
      <circle cx="90" cy="90" r="58" className="clock-face" />
      <circle cx="90" cy="90" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      {signals.map(([key, sig], i) => {
        const startA = -135 + (sig.range[0] / 4) * 270;
        const endA = -135 + (sig.range[1] / 4) * 270;
        const r = 53 - i * 4;
        return <path key={key} d={describeArc(90, 90, r, startA, endA)}
          fill="none" stroke={`hsla(${20 + i * 40},80%,60%,0.55)`} strokeWidth="2.5" strokeLinecap="round" />;
      })}
      {signals.map(([key, sig]) => {
        const a = (-135 + (sig.median / 4) * 270) * Math.PI / 180;
        return <circle key={`m-${key}`} cx={90 + Math.cos(a) * 42} cy={90 + Math.sin(a) * 42}
          r="2.5" fill="rgba(255,209,102,0.6)" />;
      })}
      <line x1="90" y1="90"
        x2={90 + Math.cos((handAngle + jitter) * Math.PI / 180) * 48}
        y2={90 + Math.sin((handAngle + jitter) * Math.PI / 180) * 48}
        stroke="var(--ink)" strokeWidth="3" strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.25))", transition: "all 0.6s ease" }} />
      <circle cx="90" cy="90" r="4" fill="var(--accent-2)" />
      <text x="90" y="135" textAnchor="middle" fill="var(--ink)" fontSize="18" fontWeight="600">
        {mean.toFixed(1)}
      </text>
      <text x="90" y="148" textAnchor="middle" fill="var(--muted)" fontSize="9" letterSpacing="0.12em">
        SIGNAL
      </text>
    </svg>
  );
}

function BranchBar({ branches }: { branches: BranchData[] }) {
  const bandValue: Record<string, number> = { very_low: 10, low: 25, moderate: 50, high: 75, very_high: 95 };
  return (
    <div className="branch-bar">
      {branches.map((b) => (
        <div key={b.name} className="branch-item">
          <div className="branch-label">{b.name.replace(/_/g, " ")}</div>
          <div className="branch-track">
            <div className="branch-fill" style={{ width: `${bandValue[b.support] ?? 50}%`, opacity: 0.5 + b.agreement * 0.5 }} />
          </div>
          <div className="branch-support">{b.support.replace(/_/g, " ")}</div>
        </div>
      ))}
    </div>
  );
}

function RadarCard({ tile }: { tile: RadarTile }) {
  const signals = tile.liveSnapshot ? Object.entries(tile.liveSnapshot.signals) : [];
  const branches = tile.liveSnapshot?.branches ?? [];

  return (
    <article className="radar-card">
      <div className="card-header">
        <div>
          <h3>{tile.radar.name}</h3>
          <span className="card-category">{tile.radar.category}</span>
        </div>
        <span className={`status-badge status-${tile.radar.status}`}>{tile.radar.status}</span>
      </div>
      <SweepClock tile={tile} />
      <div className="signal-grid">
        {signals.map(([key, sig]) => (
          <div key={key} className="signal-row">
            <div className="signal-label">{key.replace(/_/g, " ")}</div>
            <div className="signal-track">
              <div className="signal-range" style={{
                left: `${(sig.range[0] / 4) * 100}%`,
                width: `${((sig.range[1] - sig.range[0]) / 4) * 100}%`,
              }} />
              <div className="signal-dot" style={{ left: `${(sig.median / 4) * 100}%` }} />
            </div>
            <div className="signal-value">{sig.median} / 4</div>
            <div className="signal-agreement" style={{ opacity: 0.4 + sig.agreement * 0.6 }}>
              {(sig.agreement * 100).toFixed(0)}% agree
            </div>
          </div>
        ))}
      </div>
      {branches.length > 0 && <BranchBar branches={branches} />}
      <div className="card-footer">
        <span>{tile.submissionCount} packets</span>
        <span>{tile.sourceCount} sources</span>
        <span>{tile.liveSnapshot?.model_count ?? 0} models</span>
        <span>Q {tile.liveSnapshot?.quality_score ?? 0}</span>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="var(--muted)" strokeWidth="1.5">
          <circle cx="24" cy="24" r="20" />
          <line x1="24" y1="24" x2="24" y2="10" />
          <line x1="24" y1="24" x2="34" y2="28" />
        </svg>
      </div>
      <h2>No radars yet</h2>
      <p>Connect an agent to the MCP control plane and create the first radar.<br />
        Agents can use <code>radar_create</code>, then <code>radar_collect_bluesky</code> or <code>radar_collect_reddit</code> to start ingesting signals.</p>
    </div>
  );
}

function LaneHeader({ symbol, name, description }: { symbol: string; name: string; description: string }) {
  return (
    <div className="lane-header">
      <span className="lane-icon">{symbol}</span>
      <div>
        <h2>{name}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function LanePlaceholder({ message }: { message: string }) {
  return (
    <div className="lane-placeholder">
      <p>{message}</p>
    </div>
  );
}

export function App(): JSX.Element {
  const [tiles, setTiles] = useState<RadarTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL ?? "";

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/radars`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as RadarTile[];
        if (active) { setTiles(data); setError(null); }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 12_000);
    return () => { active = false; window.clearInterval(interval); };
  }, [apiUrl]);

  const globalTiles = useMemo(() => tiles.filter((t) => t.radar.category === "geopolitical" || t.radar.category === "infrastructure" || t.radar.category === "global"), [tiles]);
  const localTiles = useMemo(() => tiles.filter((t) => t.radar.category === "local" || t.radar.category === "community" || t.radar.category === "oss"), [tiles]);
  const connectionTiles = useMemo(() => tiles.filter((t) => !globalTiles.includes(t) && !localTiles.includes(t)), [tiles, globalTiles, localTiles]);

  const compositeStress = useMemo(() => {
    if (tiles.length === 0) return 0;
    return tiles.reduce((sum, t) => sum + averageSignal(t.liveSnapshot), 0) / tiles.length;
  }, [tiles]);

  return (
    <div className="dashboard-shell">
      <div className="dashboard-layout">
        {/* η (Global) Lane — Cyan */}
        <section className="lane lane-eta" style={{ "--lane-accent": "var(--cyan)", "--lane-accent-rgb": "34,211,238" } as React.CSSProperties}>
          <LaneHeader symbol={"\u03B7"} name="Global Forces" description="Things that affect you, outside your direct control" />
          <div className="lane-content">
            {/* Hero gauges in the η lane */}
            <div className="hero-gauges">
              <RingGauge value={compositeStress} max={4} label="Composite Stress" color="var(--accent)" />
              <RingGauge value={tiles.reduce((s, t) => s + (t.liveSnapshot?.disagreement_index ?? 0), 0) / (tiles.length || 1)} max={1} label="Disagreement" color="var(--accent-2)" />
              <RingGauge value={tiles.reduce((s, t) => s + (t.liveSnapshot?.quality_score ?? 0), 0) / (tiles.length || 1)} max={100} label="Quality" color="var(--cyan)" />
            </div>

            {loading && <p className="loading">Loading radars...</p>}
            {error && <p className="error-msg">Connection issue: {error}</p>}
            {!loading && tiles.length === 0 && <EmptyState />}

            <div className="lane-grid">
              {globalTiles.map((t) => <RadarCard key={t.radar.id} tile={t} />)}
            </div>
          </div>
        </section>

        {/* μ (Local) Lane — Emerald */}
        <section className="lane lane-mu" style={{ "--lane-accent": "var(--emerald)", "--lane-accent-rgb": "52,211,153" } as React.CSSProperties}>
          <LaneHeader symbol={"\u03BC"} name="Local Reach" description="Signals inside your expertise where intervention might matter" />
          <div className="lane-content">
            {localTiles.length > 0 ? (
              <div className="lane-grid">
                {localTiles.map((t) => <RadarCard key={t.radar.id} tile={t} />)}
              </div>
            ) : (
              <LanePlaceholder message="Local signals will appear here when community or open-source radars are configured." />
            )}
          </div>
        </section>

        {/* Π (Connections) Lane — Fuchsia */}
        <section className="lane lane-pi" style={{ "--lane-accent": "var(--fuchsia)", "--lane-accent-rgb": "217,70,239" } as React.CSSProperties}>
          <LaneHeader symbol={"\u03A0"} name="Connections" description="Bridges between global forces and local actions" />
          <div className="lane-content">
            {connectionTiles.length > 0 ? (
              <div className="lane-grid">
                {connectionTiles.map((t) => <RadarCard key={t.radar.id} tile={t} />)}
              </div>
            ) : (
              <LanePlaceholder message="Connection opportunities will appear here as the system links global signals to local actions." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function RingGauge({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = Math.min(1, Math.max(0, value / max));
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - pct * circumference;
  return (
    <div className="ring-gauge">
      <svg viewBox="0 0 76 76" className="ring-svg">
        <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "38px 38px", transition: "stroke-dashoffset 1s ease" }} />
        <text x="38" y="42" textAnchor="middle" fill="var(--ink)" fontSize="16" fontWeight="600">
          {pct < 1 ? value.toFixed(1) : Math.round(value)}
        </text>
      </svg>
      <span className="ring-label">{label}</span>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(x: number, y: number, r: number, startDeg: number, endDeg: number): string {
  const s = polarToCartesian(x, y, r, endDeg);
  const e = polarToCartesian(x, y, r, startDeg);
  const large = endDeg - startDeg <= 180 ? "0" : "1";
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}
