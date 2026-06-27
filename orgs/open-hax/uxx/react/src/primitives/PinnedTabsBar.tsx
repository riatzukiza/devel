import { tokens } from '@open-hax/uxx/tokens';
import type { Entity, PinnedEntry } from './InspectorPane.types.js';

export interface PinnedTabsBarProps {
  pinned: PinnedEntry[];
  activePinnedKey?: string | null;
  onSetActive?: (key: string) => void;
  onUnpin?: (key: string) => void;
  onPin?: (entity: Entity) => void;
  selection?: Entity | null;
  canPin?: boolean;
  pinLabel?: string;
}

function PinnedTab({
  entry,
  isActive,
  onSetActive,
  onUnpin,
}: {
  entry: PinnedEntry;
  isActive: boolean;
  onSetActive?: (key: string) => void;
  onUnpin?: (key: string) => void;
}) {
  return (
    <div
      data-testid="pinned-tab"
      data-key={entry.key}
      tabIndex={0}
      onClick={() => onSetActive?.(entry.key)}
      onKeyDown={(e) => {
        if (e.key === 'Delete' && isActive && onUnpin) {
          onUnpin(entry.key);
        }
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${tokens.spacing[1]}px`,
        padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
        borderRadius: `${tokens.spacing[0.5]}px`,
        fontSize: tokens.typography.bodySm.fontSize,
        cursor: 'pointer',
        background: isActive ? tokens.colors.selection.default : tokens.colors.background.default,
        color: isActive ? tokens.colors.text.default : tokens.colors.text.secondary,
        border: `1px solid ${isActive ? tokens.colors.accent.green : tokens.colors.border.default}`,
      }}
    >
      <span
        style={{
          maxWidth: '100px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {entry.selection.title || 'Untitled'}
      </span>
      <button
        type="button"
        data-testid="pinned-tab-unpin"
        onClick={(e) => {
          e.stopPropagation();
          onUnpin?.(entry.key);
        }}
        style={{
          padding: '2px 4px',
          marginLeft: `${tokens.spacing[1]}px`,
          border: 'none',
          borderRadius: '2px',
          fontSize: '10px',
          background: 'transparent',
          color: tokens.colors.text.muted,
          cursor: 'pointer',
        }}
      >
        ×
      </button>
    </div>
  );
}

export function PinnedTabsBar({
  pinned,
  activePinnedKey,
  onSetActive,
  onUnpin,
  onPin,
  selection,
  canPin = false,
  pinLabel = 'Pin',
}: PinnedTabsBarProps) {
  return (
    <div
      data-component="pinned-tabs-bar"
      data-testid="pinned-tabs-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${tokens.spacing[1]}px`,
        padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
        borderBottom: `1px solid ${tokens.colors.border.default}`,
        flexWrap: 'wrap',
      }}
    >
      {pinned.length > 0 && (
        <div
          className="pinned-tabs"
          style={{
            display: 'flex',
            gap: `${tokens.spacing[1]}px`,
            flexWrap: 'wrap',
          }}
        >
          {pinned.map((entry) => (
            <PinnedTab
              key={entry.key}
              entry={entry}
              isActive={entry.key === activePinnedKey}
              onSetActive={onSetActive}
              onUnpin={onUnpin}
            />
          ))}
        </div>
      )}
      {canPin && onPin && selection && (
        <button
          type="button"
          data-testid="pin-button"
          onClick={() => onPin(selection)}
          style={{
            padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: `${tokens.spacing[0.5]}px`,
            fontSize: tokens.typography.bodySm.fontSize,
            background: 'transparent',
            color: tokens.colors.text.muted,
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          {pinLabel}
        </button>
      )}
    </div>
  );
}

export default PinnedTabsBar;
