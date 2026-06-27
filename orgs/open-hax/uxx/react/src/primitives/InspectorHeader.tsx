import { tokens } from '@open-hax/uxx/tokens';
import type { Entity } from './InspectorPane.types.js';

export interface InspectorHeaderProps {
  selection?: Entity | null;
  activePinned?: boolean;
  hasPinnedBar?: boolean;
  title?: string;
}

export function InspectorHeader({
  selection = null,
  activePinned = false,
  hasPinnedBar = false,
  title = 'Inspector',
}: InspectorHeaderProps) {
  const hasSelection = selection !== null;

  return (
    <div
      data-component="inspector-header"
      data-testid="inspector-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        padding: `${tokens.spacing[3]}px`,
        background: tokens.colors.background.surface,
        borderBottom: hasPinnedBar ? undefined : `1px solid ${tokens.colors.border.default}`,
      }}
    >
      <h3
        className="inspector-title"
        style={{
          margin: 0,
          fontSize: tokens.typography.bodySm.fontSize,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: tokens.colors.text.muted,
        }}
      >
        {title}
      </h3>
      {hasSelection && !activePinned && (
        <div
          data-testid="inspector-selection-title"
          style={{
            marginTop: `${tokens.spacing[2]}px`,
            fontSize: tokens.typography.body.fontSize,
            fontWeight: tokens.fontWeight.medium,
            color: tokens.colors.text.default,
          }}
        >
          {selection.title}
        </div>
      )}
      {hasSelection && selection.type && !activePinned && (
        <div
          data-testid="inspector-selection-type"
          style={{
            marginTop: `${tokens.spacing[1]}px`,
            fontSize: tokens.typography.bodySm.fontSize,
            color: tokens.colors.text.secondary,
            textTransform: 'capitalize',
          }}
        >
          {selection.type}
        </div>
      )}
    </div>
  );
}

export default InspectorHeader;