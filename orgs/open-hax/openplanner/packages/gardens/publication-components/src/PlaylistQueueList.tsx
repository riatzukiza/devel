import { tokens } from "@open-hax/uxx";
import type { StudioTrack } from "./MusicPlayerView.js";

type PlaylistQueueListProps = {
  items: StudioTrack[];
  selectedIndex?: number;
  readOnly?: boolean;
  showLabels?: boolean;
  showDuration?: boolean;
  maxVisible?: number;
  onSelect?: (item: StudioTrack, index: number) => void;
  onRemove?: (item: StudioTrack, index: number) => void;
};

function formatDuration(seconds: number | undefined): string | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return null;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function trackTitle(item: StudioTrack): string {
  return item.title ?? item.name ?? item.path.split("/").pop() ?? item.path;
}

export function PlaylistQueueList({ items, selectedIndex = -1, readOnly = false, showLabels = true, showDuration = true, maxVisible = Number.POSITIVE_INFINITY, onSelect, onRemove }: PlaylistQueueListProps) {
  const visibleItems = Number.isFinite(maxVisible) ? items.slice(0, maxVisible) : items;
  const hiddenCount = Math.max(0, items.length - visibleItems.length);

  if (items.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "var(--token-colors-text-muted)", fontSize: tokens.fontSize.sm }}>
        No tracks in this playlist.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minHeight: 0, maxHeight: readOnly ? 420 : undefined, overflowY: readOnly ? "auto" : undefined }}>
      {hiddenCount > 0 ? (
        <div style={{ padding: "6px 8px", color: "var(--token-colors-text-muted)", fontSize: tokens.fontSize.xs }}>
          Showing first {visibleItems.length} of {items.length} tracks here. The full playlist snapshot is stored in the CMS publication.
        </div>
      ) : null}
      {visibleItems.map((item, index) => {
        const active = index === selectedIndex;
        const duration = formatDuration(item.duration);
        return (
          <div
            key={`${item.path}:${index}`}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              padding: "6px 8px",
              borderRadius: 6,
              fontSize: tokens.fontSize.sm,
              background: active ? "var(--token-colors-alpha-blue-10)" : "transparent",
              border: active ? "1px solid var(--token-colors-accent-blue)" : "1px solid transparent",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--token-colors-text-muted)", width: 28, textAlign: "right", fontSize: tokens.fontSize.xs }}>{index + 1}</span>
              <button
                type="button"
                onClick={() => onSelect?.(item, index)}
                style={{ flex: 1, minWidth: 0, padding: 0, border: "none", background: "transparent", color: "inherit", textAlign: "left", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}
              >
                {trackTitle(item)}
              </button>
              {showDuration && duration ? <span style={{ color: "var(--token-colors-text-muted)", fontSize: tokens.fontSize.xs, minWidth: 32, textAlign: "right" }}>{duration}</span> : null}
              {!readOnly && onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(item, index)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 14, color: "var(--token-colors-accent-red)" }}
                  title="Remove"
                >
                  ×
                </button>
              ) : null}
            </div>
            {showLabels && item.labels && item.labels.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, paddingLeft: 36 }}>
                {item.labels.map((label) => (
                  <span key={label} style={{ padding: "1px 6px", borderRadius: 8, fontSize: 10, background: "var(--token-colors-alpha-blue-10)", color: "var(--token-colors-text-muted)" }}>{label}</span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
