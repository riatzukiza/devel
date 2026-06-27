import type { ReactNode } from "react";
import { Button, tokens } from "@open-hax/uxx";

export type StudioTrack = {
  path: string;
  name?: string;
  title?: string;
  artist?: string;
  ext?: string;
  duration?: number;
  labels?: string[];
  description?: string;
};

export type MusicPlayerPermissions = {
  canGoPrevious?: boolean;
  canPlayPause?: boolean;
  canGoNext?: boolean;
  canEditLabels?: boolean;
  canAdjustVolume?: boolean;
  canGenerateAssets?: boolean;
  canRemoveFromQueue?: boolean;
};

type MusicPlayerViewProps = {
  title?: string;
  description?: string;
  track: StudioTrack | null;
  trackCount?: number;
  playerState?: "idle" | "loading" | "playing" | "paused";
  playingFrom?: "library" | "playlist";
  permissions?: MusicPlayerPermissions;
  volume?: number;
  fileIcon?: (ext: string) => string;
  onPrevious?: () => void;
  onTogglePlayPause?: () => void;
  onNext?: () => void;
  onEditLabels?: () => void;
  onVolumeChange?: (volume: number) => void;
  onGenerateSpectrogram?: () => void;
  onGenerateWaveform?: () => void;
  onRemoveFromQueue?: () => void;
  waveform?: ReactNode;
  progress?: ReactNode;
  heardDescription?: ReactNode;
  currentLabels?: ReactNode;
  agentActions?: ReactNode;
  graphLabelControls?: ReactNode;
  emptyState?: ReactNode;
};

function trackTitle(track: StudioTrack): string {
  return track.title ?? track.name ?? track.path.split("/").pop() ?? track.path;
}

function defaultFileIcon(ext: string): string {
  switch (ext) {
    case ".mp3": return "🎵";
    case ".wav": return "🔊";
    case ".ogg": return "🎶";
    case ".flac": return "🎼";
    case ".m4a": return "🎤";
    default: return "🎧";
  }
}

export function MusicPlayerView({
  title,
  description,
  track,
  trackCount,
  playerState = "idle",
  playingFrom = "library",
  permissions = {},
  volume = 1,
  fileIcon = defaultFileIcon,
  onPrevious,
  onTogglePlayPause,
  onNext,
  onEditLabels,
  onVolumeChange,
  onGenerateSpectrogram,
  onGenerateWaveform,
  onRemoveFromQueue,
  waveform,
  progress,
  heardDescription,
  currentLabels,
  agentActions,
  graphLabelControls,
  emptyState,
}: MusicPlayerViewProps) {
  const resolvedPermissions: Required<MusicPlayerPermissions> = {
    canGoPrevious: permissions.canGoPrevious ?? false,
    canPlayPause: permissions.canPlayPause ?? false,
    canGoNext: permissions.canGoNext ?? false,
    canEditLabels: permissions.canEditLabels ?? false,
    canAdjustVolume: permissions.canAdjustVolume ?? false,
    canGenerateAssets: permissions.canGenerateAssets ?? false,
    canRemoveFromQueue: permissions.canRemoveFromQueue ?? false,
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--token-colors-background-base)" }}>
      {track ? (
        <div style={{ width: "100%", maxWidth: 600, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          {(title || description || typeof trackCount === "number") ? (
            <div style={{ width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                {title ? <div style={{ fontSize: tokens.fontSize.lg, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div> : null}
                {description ? <div style={{ fontSize: tokens.fontSize.sm, color: "var(--token-colors-text-muted)", marginTop: 4 }}>{description}</div> : null}
              </div>
              {typeof trackCount === "number" ? <div style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 999, border: "1px solid var(--token-colors-border-default)", color: "var(--token-colors-text-muted)", fontSize: 12 }}>{trackCount} track{trackCount === 1 ? "" : "s"}</div> : null}
            </div>
          ) : null}
          <div style={{ display: "flex", alignItems: "center", gap: 24, width: "100%" }}>
            <div style={{
              width: 120,
              height: 120,
              borderRadius: 12,
              background: "linear-gradient(135deg, var(--token-colors-accent-blue), var(--token-colors-accent-purple))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              flexShrink: 0,
            }}>
              {fileIcon(track.ext ?? "")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: tokens.fontSize.lg, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trackTitle(track)}</div>
              <div style={{ fontSize: tokens.fontSize.xs, color: "var(--token-colors-text-muted)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {track.path}
              </div>
              <div style={{ fontSize: tokens.fontSize.xs, color: "var(--token-colors-accent-blue)", marginTop: 4 }}>
                {playingFrom === "playlist" ? "🎵 Playing from queue" : "📁 Playing from library"}
              </div>
            </div>
          </div>

          {waveform}
          {progress}

          {(resolvedPermissions.canGoPrevious || resolvedPermissions.canPlayPause || resolvedPermissions.canGoNext || resolvedPermissions.canEditLabels) ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {resolvedPermissions.canGoPrevious ? <Button variant="ghost" onClick={onPrevious}>⏮</Button> : null}
              {resolvedPermissions.canPlayPause ? (
                <button
                  onClick={onTogglePlayPause}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--token-colors-accent-blue)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 20,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  {playerState === "playing" ? "❚❚" : "▶"}
                </button>
              ) : null}
              {resolvedPermissions.canGoNext ? <Button variant="ghost" onClick={onNext}>⏭</Button> : null}
              {resolvedPermissions.canEditLabels ? <Button variant="ghost" onClick={onEditLabels} title="Labels">🏷</Button> : null}
            </div>
          ) : null}

          {heardDescription}
          {currentLabels}

          {resolvedPermissions.canAdjustVolume ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, width: 200 }}>
              <span style={{ fontSize: 14 }}>{volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={e => onVolumeChange?.(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: "var(--token-colors-accent-blue)" }}
              />
            </div>
          ) : null}

          {(resolvedPermissions.canGenerateAssets || resolvedPermissions.canRemoveFromQueue) ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {resolvedPermissions.canGenerateAssets ? <Button variant="ghost" size="sm" onClick={onGenerateSpectrogram}>📊 Spectrogram</Button> : null}
              {resolvedPermissions.canGenerateAssets ? <Button variant="ghost" size="sm" onClick={onGenerateWaveform}>📈 Waveform</Button> : null}
              {resolvedPermissions.canRemoveFromQueue ? <Button variant="ghost" size="sm" onClick={onRemoveFromQueue}>➖ Remove from queue</Button> : null}
            </div>
          ) : null}

          {agentActions}
          {graphLabelControls}
        </div>
      ) : (
        emptyState ?? (
          <div style={{ textAlign: "center", color: "var(--token-colors-text-muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎧</div>
            <div style={{ fontSize: tokens.fontSize.lg }}>Select a file to play</div>
            <div style={{ fontSize: tokens.fontSize.sm, marginTop: 8 }}>
              Browse the audio library on the left, or ask the studio agent
            </div>
          </div>
        )
      )}
    </div>
  );
}
