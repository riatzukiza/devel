// ---------------------------------------------------------------------------
// PiLaneConnections — shows semantic similarity scores between η and μ thread
// titles in the Π (connections) lane.
//
// Uses the browser-side embedding worker (ONNX or trigram fallback) to
// compute pairwise similarity between global and local thread titles, then
// renders connection bridge cards ordered by similarity score.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import type { ThreadData, RadarTile } from "../../api/types";
import type { SimilarityScore, EmbeddingState } from "../../embed/useEmbedding";

export interface PiLaneConnectionsProps {
  globalTiles: RadarTile[];
  localTiles: RadarTile[];
  embeddingState: EmbeddingState;
  computeSimilarity: (
    globalTitles: string[],
    localTitles: string[],
  ) => Promise<SimilarityScore[]>;
}

/**
 * Extract unique thread titles from radar tiles.
 */
function extractThreadTitles(tiles: RadarTile[]): string[] {
  const titles: string[] = [];
  for (const tile of tiles) {
    if (tile.threads) {
      for (const thread of tile.threads) {
        titles.push(thread.title);
      }
    }
    // If no threads, use radar name as fallback
    if (!tile.threads || tile.threads.length === 0) {
      titles.push(tile.radar.name);
    }
  }
  return titles;
}

/**
 * Format a similarity score as a percentage string.
 */
function formatSimilarity(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Map similarity score to a CSS color for visual indication.
 */
function similarityColor(score: number): string {
  if (score >= 0.5) return "var(--fuchsia)";
  if (score >= 0.3) return "var(--accent-2)";
  if (score >= 0.15) return "var(--muted)";
  return "rgba(255,255,255,0.2)";
}

/**
 * Classify connection strength for display.
 */
function strengthLabel(score: number): string {
  if (score >= 0.5) return "Strong";
  if (score >= 0.3) return "Moderate";
  if (score >= 0.15) return "Weak";
  return "Tenuous";
}

export function PiLaneConnections({
  globalTiles,
  localTiles,
  embeddingState,
  computeSimilarity,
}: PiLaneConnectionsProps): JSX.Element {
  const [scores, setScores] = useState<SimilarityScore[]>([]);
  const [computing, setComputing] = useState(false);

  const globalTitles = useMemo(
    () => extractThreadTitles(globalTiles),
    [globalTiles],
  );
  const localTitles = useMemo(
    () => extractThreadTitles(localTiles),
    [localTiles],
  );

  // Compute similarity when titles change and embedding is ready
  useEffect(() => {
    if (!embeddingState.ready) return;
    if (globalTitles.length === 0 || localTitles.length === 0) {
      setScores([]);
      return;
    }

    let cancelled = false;
    setComputing(true);

    computeSimilarity(globalTitles, localTitles)
      .then((result) => {
        if (!cancelled) {
          // Filter to meaningful connections (> 10% similarity)
          const filtered = result.filter((s) => s.similarity > 0.1);
          setScores(filtered);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.warn("[PiLaneConnections] Similarity computation failed:", err);
          setScores([]);
        }
      })
      .finally(() => {
        if (!cancelled) setComputing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [embeddingState.ready, globalTitles, localTitles, computeSimilarity]);

  // Show status when no data or not ready
  if (!embeddingState.ready) {
    return (
      <div className="pi-conn-status" data-testid="pi-conn-loading">
        <div className="pi-conn-status-icon">⏳</div>
        <p>Initializing embedding engine…</p>
        <span className="pi-conn-status-sub">
          Backend: {embeddingState.activeBackend}
        </span>
      </div>
    );
  }

  if (globalTitles.length === 0 || localTitles.length === 0) {
    return (
      <div className="pi-conn-status" data-testid="pi-conn-empty">
        <div className="pi-conn-status-icon">🔗</div>
        <p>
          Connections will appear when both η (global) and μ (local) lanes have
          signals to compare.
        </p>
      </div>
    );
  }

  return (
    <div className="pi-conn-container" data-testid="pi-conn-container">
      {/* Backend status badge */}
      <div className="pi-conn-meta">
        <span
          className="pi-conn-backend-badge"
          data-testid="pi-conn-backend"
          title={embeddingState.error ?? `Backend: ${embeddingState.activeBackend}`}
        >
          {embeddingState.onnxReady ? "⚡" : "🔤"}{" "}
          {embeddingState.activeBackend}
        </span>
        {computing && <span className="pi-conn-computing">computing…</span>}
        <span className="pi-conn-count">
          {scores.length} connection{scores.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Connection cards */}
      {scores.length === 0 && !computing && (
        <div className="pi-conn-status" data-testid="pi-conn-no-matches">
          <p>
            No significant semantic connections detected between η and μ
            threads.
          </p>
        </div>
      )}

      <div className="pi-conn-list">
        {scores.slice(0, 20).map((score, idx) => (
          <div
            key={`${score.globalTitle}-${score.localTitle}-${idx}`}
            className="pi-conn-card"
            data-testid="pi-conn-card"
          >
            {/* Similarity score bar */}
            <div className="pi-conn-score-bar">
              <div
                className="pi-conn-score-fill"
                style={{
                  width: `${Math.min(100, score.similarity * 100)}%`,
                  backgroundColor: similarityColor(score.similarity),
                }}
              />
              <span
                className="pi-conn-score-label"
                data-testid="pi-conn-similarity"
              >
                {formatSimilarity(score.similarity)}
              </span>
            </div>

            {/* Strength badge */}
            <span
              className="pi-conn-strength"
              style={{ color: similarityColor(score.similarity) }}
            >
              {strengthLabel(score.similarity)}
            </span>

            {/* Thread titles */}
            <div className="pi-conn-threads">
              <div className="pi-conn-thread pi-conn-thread-global">
                <span className="pi-conn-lane-tag pi-conn-tag-eta">η</span>
                <span className="pi-conn-thread-title">{score.globalTitle}</span>
              </div>
              <div className="pi-conn-bridge-arrow">↕</div>
              <div className="pi-conn-thread pi-conn-thread-local">
                <span className="pi-conn-lane-tag pi-conn-tag-mu">μ</span>
                <span className="pi-conn-thread-title">{score.localTitle}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
