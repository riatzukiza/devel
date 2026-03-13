import { useMemo } from "react";
import { ThreatClock } from "./components/ThreatClock";
import type { ThreatClockSignal } from "./components/ThreatClock";
import { RiskGauge } from "./components/RiskGauge";
import { BranchMap } from "./components/BranchMap";
import type { BranchMapBranch } from "./components/BranchMap";
import { ErrorBanner } from "./components/ErrorBanner";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { useRadarPolling } from "../api/useRadarPolling";
import type { RadarTile, SignalData, BranchData } from "../api/types";

function averageSignal(snapshot: RadarTile["liveSnapshot"]): number {
  if (!snapshot) return 0;
  const values = Object.values(snapshot.signals);
  if (values.length === 0) return 0;
  return values.reduce((sum, s) => sum + s.median, 0) / values.length;
}

/** Convert API signal data to ThreatClockSignal props */
function toClockSignals(signals: Record<string, SignalData>): ThreatClockSignal[] {
  return Object.entries(signals).map(([key, sig]) => ({
    median: sig.median,
    range: sig.range,
    agreement: sig.agreement,
    label: key,
  }));
}

/** Map API branch data to BranchMapBranch props */
const bandProbability: Record<string, number> = {
  very_low: 0.1,
  low: 0.25,
  moderate: 0.5,
  high: 0.75,
  very_high: 0.95,
};

function toBranchMapBranches(branches: BranchData[]): BranchMapBranch[] {
  return branches.map((b) => ({
    label: b.name,
    probability: bandProbability[b.support] ?? 0.5,
    evidence: b.triggers,
  }));
}

function RadarCard({ tile }: { tile: RadarTile }) {
  const signals = tile.liveSnapshot ? Object.entries(tile.liveSnapshot.signals) : [];
  const branches = tile.liveSnapshot?.branches ?? [];
  const mean = averageSignal(tile.liveSnapshot);
  const clockSignals = tile.liveSnapshot ? toClockSignals(tile.liveSnapshot.signals) : [];
  const branchMapData = toBranchMapBranches(branches);

  return (
    <article className="radar-card">
      <div className="card-header">
        <div>
          <h3>{tile.radar.name}</h3>
          <span className="card-category">{tile.radar.category}</span>
        </div>
        <span className={`status-badge status-${tile.radar.status}`}>{tile.radar.status}</span>
      </div>

      {/* ThreatClock — animated composite clock */}
      <ThreatClock
        value={mean}
        max={4}
        signals={clockSignals}
        disagreementIndex={tile.liveSnapshot?.disagreement_index ?? 0}
        size={180}
        className="sweep-clock"
      />

      {/* RiskGauge per signal dimension */}
      <div className="signal-gauges">
        {signals.map(([key, sig]) => (
          <RiskGauge
            key={key}
            value={sig.median}
            min={0}
            max={4}
            label={key.replace(/_/g, " ")}
            color={`hsla(${Math.abs(key.charCodeAt(0) * 7) % 360}, 70%, 60%, 0.9)`}
            size={120}
          />
        ))}
      </div>

      {/* BranchMap — narrative branches with probabilities */}
      {branchMapData.length >= 2 && (
        <BranchMap
          branches={branchMapData}
          rootLabel={tile.radar.name}
          width={280}
          height={Math.max(120, branchMapData.length * 50)}
        />
      )}

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
  const apiUrl = import.meta.env.VITE_API_URL ?? "";
  const { tiles, loading, error, isStale, lastUpdated, refetch } = useRadarPolling(apiUrl);

  const globalTiles = useMemo(() => tiles.filter((t) => t.radar.category === "geopolitical" || t.radar.category === "infrastructure" || t.radar.category === "global"), [tiles]);
  const localTiles = useMemo(() => tiles.filter((t) => t.radar.category === "local" || t.radar.category === "community" || t.radar.category === "oss"), [tiles]);
  const connectionTiles = useMemo(() => tiles.filter((t) => !globalTiles.includes(t) && !localTiles.includes(t)), [tiles, globalTiles, localTiles]);

  const compositeStress = useMemo(() => {
    if (tiles.length === 0) return 0;
    return tiles.reduce((sum, t) => sum + averageSignal(t.liveSnapshot), 0) / tiles.length;
  }, [tiles]);

  return (
    <div className="dashboard-shell">
      {/* Error banner — shown when API is unreachable */}
      {error && (
        <ErrorBanner
          message={error}
          isStale={isStale}
          lastUpdated={lastUpdated}
          onRetry={refetch}
        />
      )}

      <div className="dashboard-layout">
        {/* η (Global) Lane — Cyan */}
        <section className="lane lane-eta" style={{ "--lane-accent": "var(--cyan)", "--lane-accent-rgb": "34,211,238" } as React.CSSProperties}>
          <LaneHeader symbol={"\u03B7"} name="Global Forces" description="Things that affect you, outside your direct control" />
          <div className="lane-content">
            {/* Hero gauges in the η lane */}
            {!loading && tiles.length > 0 && (
              <div className="hero-gauges">
                <RingGauge value={compositeStress} max={4} label="Composite Stress" color="var(--accent)" />
                <RingGauge value={tiles.reduce((s, t) => s + (t.liveSnapshot?.disagreement_index ?? 0), 0) / (tiles.length || 1)} max={1} label="Disagreement" color="var(--accent-2)" />
                <RingGauge value={tiles.reduce((s, t) => s + (t.liveSnapshot?.quality_score ?? 0), 0) / (tiles.length || 1)} max={100} label="Quality" color="var(--cyan)" />
              </div>
            )}

            {loading && <LoadingSkeleton count={2} />}
            {!loading && tiles.length === 0 && !error && <EmptyState />}

            <div className="lane-grid">
              {globalTiles.map((t) => <RadarCard key={t.radar.id} tile={t} />)}
            </div>
          </div>
        </section>

        {/* μ (Local) Lane — Emerald */}
        <section className="lane lane-mu" style={{ "--lane-accent": "var(--emerald)", "--lane-accent-rgb": "52,211,153" } as React.CSSProperties}>
          <LaneHeader symbol={"\u03BC"} name="Local Reach" description="Signals inside your expertise where intervention might matter" />
          <div className="lane-content">
            {loading && <LoadingSkeleton count={1} />}
            {!loading && localTiles.length > 0 ? (
              <div className="lane-grid">
                {localTiles.map((t) => <RadarCard key={t.radar.id} tile={t} />)}
              </div>
            ) : !loading ? (
              <LanePlaceholder message="Local signals will appear here when community or open-source radars are configured." />
            ) : null}
          </div>
        </section>

        {/* Π (Connections) Lane — Fuchsia */}
        <section className="lane lane-pi" style={{ "--lane-accent": "var(--fuchsia)", "--lane-accent-rgb": "217,70,239" } as React.CSSProperties}>
          <LaneHeader symbol={"\u03A0"} name="Connections" description="Bridges between global forces and local actions" />
          <div className="lane-content">
            {loading && <LoadingSkeleton count={1} />}
            {!loading && connectionTiles.length > 0 ? (
              <div className="lane-grid">
                {connectionTiles.map((t) => <RadarCard key={t.radar.id} tile={t} />)}
              </div>
            ) : !loading ? (
              <LanePlaceholder message="Connection opportunities will appear here as the system links global signals to local actions." />
            ) : null}
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
