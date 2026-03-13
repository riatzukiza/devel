import { useMemo } from "react";
import { ThreatClock } from "./components/ThreatClock";
import type { ThreatClockSignal } from "./components/ThreatClock";
import { RiskGauge } from "./components/RiskGauge";
import { BranchMap } from "./components/BranchMap";
import type { BranchMapBranch } from "./components/BranchMap";
import { ErrorBanner } from "./components/ErrorBanner";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { EtaLaneContent } from "./components/EtaLane";
import { MuLaneContent } from "./components/MuLane";
import { PersonalizationPanel } from "./components/PersonalizationPanel";
import { CriticalThinkingSection } from "./components/CriticalThinkingSection";
import { ActionFeed } from "./components/ActionFeed";
import { FirehosePanel } from "./components/FirehosePanel";
import { HeroPanel } from "./components/HeroPanel";
import { useRadarPolling } from "../api/useRadarPolling";
import { usePersonalization, applyWeights, computeCompositeScore } from "./hooks/usePersonalization";
import { isGlobalCategory, isLocalCategory } from "./lane-routing";
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
    <div className="dashboard-empty-state" data-testid="dashboard-empty-state">
      <div className="dashboard-empty-icon">
        <svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="var(--cyan)" strokeWidth="1.5">
          <circle cx="32" cy="32" r="28" opacity="0.3" />
          <circle cx="32" cy="32" r="18" opacity="0.5" />
          <circle cx="32" cy="32" r="8" />
          <line x1="32" y1="32" x2="32" y2="12" strokeWidth="2" />
          <line x1="32" y1="32" x2="46" y2="38" strokeWidth="2" />
          <circle cx="32" cy="32" r="2" fill="var(--cyan)" />
        </svg>
      </div>
      <h2>Welcome to Mission Control</h2>
      <p>
        Your intelligence dashboard is ready. Connect an MCP agent to the control
        plane and start monitoring signals from Bluesky, Reddit, and more.
      </p>
      <div className="dashboard-empty-steps">
        <div className="dashboard-empty-step">
          <span className="dashboard-empty-step-number">1</span>
          <span className="dashboard-empty-step-text">
            Create a radar: <code>radar_create</code> with a name, slug, and category
            (<code>geopolitical</code>, <code>local</code>, etc.)
          </span>
        </div>
        <div className="dashboard-empty-step">
          <span className="dashboard-empty-step-number">2</span>
          <span className="dashboard-empty-step-text">
            Collect signals: <code>radar_collect_bluesky</code> or <code>radar_collect_reddit</code> to
            ingest from public feeds
          </span>
        </div>
        <div className="dashboard-empty-step">
          <span className="dashboard-empty-step-number">3</span>
          <span className="dashboard-empty-step-text">
            Reduce and view: <code>radar_reduce_live</code> to process signals — the dashboard
            auto-updates every 12 seconds
          </span>
        </div>
      </div>
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
  const { weights, toggles, setWeight, setToggle, resetToDefaults } = usePersonalization();

  const globalTiles = useMemo(() => tiles.filter((t) => isGlobalCategory(t.radar.category)), [tiles]);
  const localTiles = useMemo(() => tiles.filter((t) => isLocalCategory(t.radar.category)), [tiles]);
  const connectionTiles = useMemo(() => tiles.filter((t) => !globalTiles.includes(t) && !localTiles.includes(t)), [tiles, globalTiles, localTiles]);

  // Compute weighted composite score from all tiles with deterministic snapshots
  const globalDisagreement = useMemo(() => {
    const snaps = globalTiles
      .map((t) => t.liveSnapshot?.disagreement_index)
      .filter((d): d is number => d !== undefined);
    if (snaps.length === 0) return 0;
    return snaps.reduce((a, b) => a + b, 0) / snaps.length;
  }, [globalTiles]);

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

      {/* Personalization Panel */}
      <PersonalizationPanel
        weights={weights}
        toggles={toggles}
        onWeightChange={setWeight}
        onToggleChange={setToggle}
        onReset={resetToDefaults}
      />

      {/* Hero Panel — aggregate ring gauges above the grid */}
      {!loading && tiles.length > 0 && (
        <HeroPanel tiles={tiles} />
      )}
      {/* Placeholder hero panel when loading or no data */}
      {!loading && tiles.length === 0 && !error ? null : loading ? (
        <HeroPanel tiles={[]} />
      ) : null}

      {/* Main layout — show empty state or 3-lane grid */}
      {!loading && tiles.length === 0 && !error ? (
        <div className="dashboard-layout">
          <EmptyState />
        </div>
      ) : (
        <div className="dashboard-layout">
          {/* η (Global) Lane — Cyan */}
          <section className="lane lane-eta" style={{ "--lane-accent": "var(--cyan)", "--lane-accent-rgb": "34,211,238" } as React.CSSProperties}>
            <LaneHeader symbol={"\u03B7"} name="Global Forces" description="Things that affect you, outside your direct control" />
            <div className="lane-content">
              {loading && <LoadingSkeleton count={2} />}

              {/* η lane with real signal data: ThreatClock, RiskGauges with ranges, BranchMap, thread cards */}
              {!loading && globalTiles.length > 0 && (
                <EtaLaneContent tiles={globalTiles} weights={weights} />
              )}

              {/* Show placeholder when no global radars but other radars exist */}
              {!loading && globalTiles.length === 0 && tiles.length > 0 && !error && (
                <LanePlaceholder message="No global radars configured yet. Create a radar with category 'geopolitical', 'infrastructure', or 'global'." />
              )}

              {/* Critical Thinking Section */}
              {!loading && (
                <CriticalThinkingSection
                  enabled={toggles.criticalThinking}
                  disagreementIndex={globalDisagreement}
                />
              )}
            </div>
          </section>

          {/* μ (Local) Lane — Emerald */}
          <section className="lane lane-mu" style={{ "--lane-accent": "var(--emerald)", "--lane-accent-rgb": "52,211,153" } as React.CSSProperties}>
            <LaneHeader symbol={"\u03BC"} name="Local Reach" description="Signals inside your expertise where intervention might matter" />
            <div className="lane-content">
              {loading && <LoadingSkeleton count={1} />}
              {!loading && <MuLaneContent tiles={localTiles} />}

              {/* Action Feed — time-bounded suggestions */}
              {!loading && (
                <ActionFeed
                  tiles={tiles}
                  agencyBiasEnabled={toggles.agencyBias}
                />
              )}
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
                <LanePlaceholder message={toggles.federation
                  ? "Connection opportunities will appear here as the system links global signals to local actions."
                  : "Federation is disabled. Enable it in personalization to see connection opportunities from peers."
                } />
              ) : null}
            </div>
          </section>
        </div>
      )}

      {/* Firehose Panel — collapsible bottom panel with signal feed */}
      {!loading && (
        <FirehosePanel tiles={tiles} />
      )}
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
