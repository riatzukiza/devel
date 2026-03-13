// ---------------------------------------------------------------------------
// MuThreadCard — thread card for the μ (local/actionable) lane
// Shows: title, signal count, proximity indicator, leverage indicator,
// time-to-act countdown, expandable signal details.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { SourceBadge } from "./SourceBadge";
import type { ThreadData } from "../../api/types";

export interface MuThreadCardProps {
  readonly thread: ThreadData;
  readonly className?: string;
}

// ---------------------------------------------------------------------------
// Scoring helpers — derive proximity, leverage, and time-to-act from thread
// ---------------------------------------------------------------------------

export type LeverageLevel = "high" | "medium" | "low";
export type ProximityLevel = "close" | "moderate" | "distant";
export type TimeToAct = "act now" | "act within days" | "act within weeks" | "window closing";

/** Derive a leverage score (0–1) from thread properties.
 *  Higher = more actionable. */
export function computeLeverage(thread: ThreadData): number {
  let score = 0;
  // local_opportunity kind is most actionable
  if (thread.kind === "local_opportunity") score += 0.35;
  else if (thread.kind === "event") score += 0.15;
  else score += 0.1;

  // Active/emerging status means actionable now
  if (thread.status === "active") score += 0.25;
  else if (thread.status === "emerging") score += 0.2;
  else if (thread.status === "cooling") score += 0.1;

  // Higher confidence = more actionable
  score += thread.confidence * 0.25;

  // Tags that indicate actionability
  const actionTags = ["community", "oss", "local", "actionable", "developer", "open-source"];
  const tagBoost = thread.domain_tags.filter((t) => actionTags.includes(t)).length;
  score += Math.min(0.15, tagBoost * 0.05);

  return Math.min(1, Math.max(0, score));
}

/** Derive a proximity score (0–1) from thread properties.
 *  Higher = closer/more relevant to the user. */
export function computeProximity(thread: ThreadData): number {
  let score = 0;
  // local_opportunity kind is closest
  if (thread.kind === "local_opportunity") score += 0.35;
  else if (thread.kind === "event") score += 0.15;
  else score += 0.2;

  // Proximity tags
  const proximityTags = ["local", "community", "oss", "developer", "open-source", "ai"];
  const tagCount = thread.domain_tags.filter((t) => proximityTags.includes(t)).length;
  score += Math.min(0.25, tagCount * 0.08);

  // More reddit = more community-proximate
  const redditShare = thread.source_distribution["reddit"] ?? 0;
  score += redditShare * 0.15;

  // Confidence contributes to proximity (higher confidence = more relevant)
  score += thread.confidence * 0.2;

  // More members = more signal coverage
  const memberBoost = Math.min(0.1, thread.members.length * 0.01);
  score += memberBoost;

  return Math.min(1, Math.max(0, score));
}

export function leverageLevel(score: number): LeverageLevel {
  if (score >= 0.6) return "high";
  if (score >= 0.35) return "medium";
  return "low";
}

export function proximityLevel(score: number): ProximityLevel {
  if (score >= 0.6) return "close";
  if (score >= 0.35) return "moderate";
  return "distant";
}

export function timeToAct(thread: ThreadData): TimeToAct {
  switch (thread.status) {
    case "active": return "act now";
    case "emerging": return "act within days";
    case "cooling": return "act within weeks";
    case "archived": return "window closing";
  }
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function timeToActClass(tta: TimeToAct): string {
  switch (tta) {
    case "act now": return "tta-now";
    case "act within days": return "tta-days";
    case "act within weeks": return "tta-weeks";
    case "window closing": return "tta-closing";
  }
}

// ---------------------------------------------------------------------------
// Indicator pill component
// ---------------------------------------------------------------------------

function IndicatorPill({ label, value, className }: {
  label: string;
  value: string;
  className: string;
}): JSX.Element {
  return (
    <span className={`mu-indicator ${className}`} data-testid={`mu-indicator-${label.toLowerCase()}`}>
      <span className="mu-indicator-label">{label}</span>
      <span className="mu-indicator-value">{value}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Leverage bar visualization
// ---------------------------------------------------------------------------

function LeverageBar({ score }: { score: number }): JSX.Element {
  const pct = Math.max(0, Math.min(100, score * 100));
  return (
    <div className="mu-leverage-bar" data-testid="mu-leverage-bar">
      <span className="mu-leverage-bar-label">leverage</span>
      <div className="mu-leverage-bar-track">
        <div
          className="mu-leverage-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="mu-leverage-bar-value">{pct.toFixed(0)}%</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MuThreadCard({ thread, className }: MuThreadCardProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);

  const leverageScore = computeLeverage(thread);
  const proximityScore = computeProximity(thread);
  const levLevel = leverageLevel(leverageScore);
  const proxLevel = proximityLevel(proximityScore);
  const tta = timeToAct(thread);
  const signalCount = thread.members.length;

  const sources = Object.entries(thread.source_distribution)
    .sort(([, a], [, b]) => b - a);

  return (
    <article
      className={`mu-thread-card ${expanded ? "mu-thread-card--expanded" : ""} ${className ?? ""}`.trim()}
      data-testid="mu-thread-card"
      onClick={() => setExpanded((prev) => !prev)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setExpanded((prev) => !prev);
        }
      }}
      aria-expanded={expanded}
    >
      {/* Header: title + signal count */}
      <div className="mu-thread-header">
        <div className="mu-thread-title-block">
          <h4 className="mu-thread-title">{thread.title}</h4>
          {thread.summary && (
            <p className="mu-thread-summary">{thread.summary}</p>
          )}
        </div>
        <span className="mu-thread-signal-count" data-testid="mu-signal-count">
          {signalCount} signal{signalCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Indicator pills: proximity, leverage, time-to-act */}
      <div className="mu-indicators" data-testid="mu-indicators">
        <IndicatorPill
          label="Proximity"
          value={proxLevel}
          className={`mu-proximity-${proxLevel}`}
        />
        <IndicatorPill
          label="Leverage"
          value={`${levLevel} leverage`}
          className={`mu-leverage-${levLevel}`}
        />
        <IndicatorPill
          label="Time"
          value={tta}
          className={timeToActClass(tta)}
        />
      </div>

      {/* Leverage bar */}
      <LeverageBar score={leverageScore} />

      {/* Source badges */}
      <div className="mu-thread-sources" data-testid="mu-thread-sources">
        {sources.map(([sourceType, proportion]) => (
          <SourceBadge
            key={sourceType}
            source={sourceType}
            count={Math.round(proportion * signalCount) || undefined}
          />
        ))}
      </div>

      {/* Footer: last updated */}
      <div className="mu-thread-footer">
        <span className="mu-thread-updated" data-testid="mu-thread-updated">
          {formatRelativeTime(thread.timeline.last_updated)}
        </span>
        <span className="mu-expand-hint" data-testid="mu-expand-hint">
          {expanded ? "▲ collapse" : "▼ details"}
        </span>
      </div>

      {/* Expanded signal details */}
      {expanded && (
        <div className="mu-expanded-details" data-testid="mu-expanded-details">
          <div className="mu-detail-section">
            <h5 className="mu-detail-title">Signal Details</h5>
            <div className="mu-detail-stats">
              <div className="mu-detail-stat">
                <span className="mu-detail-stat-label">Kind</span>
                <span className="mu-detail-stat-value">{thread.kind.replace(/_/g, " ")}</span>
              </div>
              <div className="mu-detail-stat">
                <span className="mu-detail-stat-label">Status</span>
                <span className="mu-detail-stat-value">{thread.status}</span>
              </div>
              <div className="mu-detail-stat">
                <span className="mu-detail-stat-label">Confidence</span>
                <span className="mu-detail-stat-value">{(thread.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="mu-detail-stat">
                <span className="mu-detail-stat-label">First seen</span>
                <span className="mu-detail-stat-value">{formatRelativeTime(thread.timeline.first_seen)}</span>
              </div>
              {thread.timeline.peak_activity && (
                <div className="mu-detail-stat">
                  <span className="mu-detail-stat-label">Peak activity</span>
                  <span className="mu-detail-stat-value">{formatRelativeTime(thread.timeline.peak_activity)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Domain tags */}
          {thread.domain_tags.length > 0 && (
            <div className="mu-detail-section">
              <h5 className="mu-detail-title">Tags</h5>
              <div className="mu-detail-tags">
                {thread.domain_tags.map((tag) => (
                  <span key={tag} className="mu-detail-tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Member signals */}
          <div className="mu-detail-section">
            <h5 className="mu-detail-title">Member Signals ({thread.members.length})</h5>
            <div className="mu-detail-members">
              {thread.members.slice(0, 10).map((m) => (
                <div key={m.signal_event_id} className="mu-detail-member">
                  <span className="mu-detail-member-id">{m.signal_event_id.slice(0, 12)}…</span>
                  <span className="mu-detail-member-relevance">relevance: {m.relevance.toFixed(2)}</span>
                  <span className="mu-detail-member-added">{formatRelativeTime(m.added_at)}</span>
                </div>
              ))}
              {thread.members.length > 10 && (
                <p className="mu-detail-more">…and {thread.members.length - 10} more signals</p>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
