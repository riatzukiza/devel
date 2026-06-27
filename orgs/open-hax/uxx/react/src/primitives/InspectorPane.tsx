/**
 * InspectorPane Component
 *
 * Implements the inspector-pane.edn contract.
 * Story 3.1: Core implementation with selection, detail view, error state, and empty state.
 * Story 3.2: Context panel showing related entities.
 * Story 3.3: Pin & Compare functionality.
 *
 * A panel for inspecting selected entities with context, detail view, and comparison support.
 */

import { type ReactNode } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
import { ContextSection } from './ContextSection.js';
import { PinnedTabsBar } from './PinnedTabsBar.js';
import { getEntityKey, type Entity, type PinnedEntry, type ErrorState } from './InspectorPane.types.js';

export type { Entity, PinnedEntry, ErrorState } from './InspectorPane.types.js';

export interface InspectorPaneProps {
  /** Currently selected entity */
  selection?: Entity | null;
  /** Related context entities */
  context?: Entity[];
  /** Pinned entities for comparison */
  pinned?: PinnedEntry[];
  /** Key of currently active pinned entity */
  activePinnedKey?: string | null;
  /** Error state if loading failed */
  error?: ErrorState | null;
  /** Callback to pin the current selection */
  onPin?: (entity: Entity) => void;
  /** Callback to unpin an entity by key */
  onUnpin?: (key: string) => void;
  /** Callback to set the active pinned entity */
  onSetActive?: (key: string) => void;
  /** Callback to retry after error */
  onRetry?: () => void;
  /** Callback when a context item is selected */
  onContextSelect?: (entity: Entity) => void;
  /** Custom renderer for entity detail view */
  renderDetail?: (entity: Entity) => ReactNode;
  /** Custom renderer for context items */
  renderContextItem?: (entity: Entity) => ReactNode;
}

const MAX_PINNED = 5;

function EmptyState() {
  return (
    <div
      data-testid="inspector-empty"
      style={{
        padding: `${tokens.spacing[4]}px`,
        textAlign: 'center',
        color: tokens.colors.text.muted,
        fontSize: tokens.typography.bodySm.fontSize,
      }}
    >
      Select an item to inspect details and context.
    </div>
  );
}

function ErrorStateView({ error, onRetry }: { error: ErrorState; onRetry?: () => void }) {
  const retryable = error.retryable ?? true;

  return (
    <div
      data-testid="inspector-pane-error"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: `${tokens.spacing[2]}px`,
        padding: `${tokens.spacing[2]}px`,
        border: `1px solid ${tokens.colors.accent.red}`,
        borderRadius: `${tokens.spacing[1]}px`,
        background: tokens.colors.alpha.red._12,
        color: tokens.colors.text.default,
      }}
    >
      <div
        data-testid="inspector-pane-error-message"
        style={{
          fontSize: tokens.typography.bodySm.fontSize,
          flex: 1,
        }}
      >
        {error.message}
      </div>
      {retryable && onRetry && (
        <button
          type="button"
          data-testid="inspector-pane-error-retry"
          onClick={onRetry}
          style={{
            padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: `${tokens.spacing[0.5]}px`,
            fontSize: tokens.typography.bodySm.fontSize,
            background: tokens.colors.background.default,
            color: tokens.colors.text.default,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

function DetailView({ entity, renderDetail }: { entity: Entity; renderDetail?: (entity: Entity) => ReactNode }) {
  if (renderDetail) {
    return <>{renderDetail(entity)}</>;
  }

  return (
    <div
      data-testid="inspector-detail"
      style={{
        padding: `${tokens.spacing[3]}px`,
        border: `1px solid ${tokens.colors.border.default}`,
        borderRadius: `${tokens.spacing[1]}px`,
        background: tokens.colors.background.elevated,
      }}
    >
      <div
        style={{
          fontSize: tokens.typography.bodySm.fontSize,
          color: tokens.colors.text.muted,
          marginBottom: `${tokens.spacing[1]}px`,
        }}
      >
        Detail
      </div>
      <div
        style={{
          fontSize: tokens.typography.body.fontSize,
          fontWeight: tokens.fontWeight.medium,
          color: tokens.colors.text.default,
          marginBottom: `${tokens.spacing[2]}px`,
        }}
      >
        {entity.title || ''}
      </div>
      {entity.type && (
        <div
          style={{
            fontSize: tokens.typography.bodySm.fontSize,
            color: tokens.colors.text.secondary,
            textTransform: 'capitalize',
            marginBottom: `${tokens.spacing[2]}px`,
          }}
        >
          {entity.type}
        </div>
      )}
      {entity.text && entity.text !== '' && (
        <div
          style={{
            color: tokens.colors.text.secondary,
            whiteSpace: 'pre-wrap',
            fontFamily: tokens.fontFamily.mono,
            fontSize: tokens.typography.bodySm.fontSize,
            maxHeight: '300px',
            overflowY: 'auto',
            padding: `${tokens.spacing[2]}px`,
            background: tokens.colors.background.default,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: `${tokens.spacing[0.5]}px`,
          }}
        >
          {entity.text}
        </div>
      )}
      {entity.time && (
        <div
          style={{
            marginTop: `${tokens.spacing[2]}px`,
            fontSize: tokens.typography.bodySm.fontSize,
            color: tokens.colors.text.muted,
          }}
        >
          Observed {entity.time}
        </div>
      )}
    </div>
  );
}

/**
 * Panel for inspecting selected entities.
 */
export function InspectorPane({
  selection = null,
  context = [],
  pinned = [],
  activePinnedKey = null,
  error = null,
  onPin,
  onUnpin,
  onSetActive,
  onRetry,
  onContextSelect,
  renderDetail,
  renderContextItem,
}: InspectorPaneProps) {
  const hasSelection = selection !== null;
  const hasPinned = pinned.length > 0;

  const activePinned = hasPinned && activePinnedKey
    ? pinned.find((p) => p.key === activePinnedKey)
    : null;

  const displayEntity = activePinned ? activePinned.selection : selection;
  const displayContext = activePinned ? (activePinned.context || []) : context;

  const selectionKey = selection ? getEntityKey(selection) : null;
  const alreadyPinned = selectionKey ? pinned.some((p) => p.key === selectionKey) : false;
  const atMaxPinned = pinned.length >= MAX_PINNED;
  const canPin = hasSelection && !alreadyPinned && !atMaxPinned;

  return (
    <div
      data-component="inspector-pane"
      data-has-selection={hasSelection || undefined}
      data-has-pinned={hasPinned || undefined}
      style={{
        height: '100%',
        backgroundColor: tokens.colors.background.surface,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        data-testid="inspector-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          padding: `${tokens.spacing[3]}px`,
          background: tokens.colors.background.surface,
          borderBottom: hasPinned || canPin ? undefined : `1px solid ${tokens.colors.border.default}`,
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
          Inspector
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

      {(hasPinned || canPin) && (
        <PinnedTabsBar
          pinned={pinned}
          activePinnedKey={activePinnedKey}
          onSetActive={onSetActive}
          onUnpin={onUnpin}
          onPin={onPin}
          selection={selection}
          canPin={canPin}
        />
      )}

      <div
        className="inspector-content"
        style={{
          fontSize: tokens.typography.bodySm.fontSize,
          color: tokens.colors.text.secondary,
          padding: `${tokens.spacing[3]}px`,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: `${tokens.spacing[3]}px`,
        }}
      >
        {error && <ErrorStateView error={error} onRetry={onRetry} />}

        {displayEntity ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${tokens.spacing[3]}px` }}>
            <DetailView entity={displayEntity} renderDetail={renderDetail} />
            <ContextSection
              context={displayContext}
              onContextSelect={onContextSelect}
              renderContextItem={renderContextItem}
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

export default InspectorPane;
