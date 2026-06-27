import type { ReactNode } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
import type { Entity } from './InspectorPane.types.js';

export interface ContextSectionProps {
  context: Entity[];
  onContextSelect?: (entity: Entity) => void;
  renderContextItem?: (entity: Entity) => ReactNode;
  title?: string;
  emptyMessage?: string;
}

function ContextItem({
  entity,
  onSelect,
  renderItem,
}: {
  entity: Entity;
  onSelect?: (entity: Entity) => void;
  renderItem?: (entity: Entity) => ReactNode;
}) {
  if (renderItem) {
    return (
      <div style={{ cursor: onSelect ? 'pointer' : undefined }} onClick={() => onSelect?.(entity)}>
        {renderItem(entity)}
      </div>
    );
  }

  return (
    <div
      data-testid="inspector-context-item"
      onClick={() => onSelect?.(entity)}
      style={{
        marginTop: `${tokens.spacing[2]}px`,
        padding: `${tokens.spacing[2]}px`,
        borderRadius: `${tokens.spacing[0.5]}px`,
        background: tokens.colors.background.default,
        color: tokens.colors.text.secondary,
        fontSize: tokens.typography.bodySm.fontSize,
        cursor: onSelect ? 'pointer' : undefined,
      }}
    >
      {entity.title || 'Untitled'}
    </div>
  );
}

export function ContextSection({
  context,
  onContextSelect,
  renderContextItem,
  title = 'Context',
  emptyMessage = 'No related context',
}: ContextSectionProps) {
  return (
    <div
      data-component="context-section"
      data-testid="inspector-context"
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
        {title}
      </div>
      {context.length > 0 ? (
        <div className="context-list">
          {context.map((entity) => (
            <ContextItem
              key={entity.key || entity.id}
              entity={entity}
              onSelect={onContextSelect}
              renderItem={renderContextItem}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            marginTop: `${tokens.spacing[2]}px`,
            fontSize: tokens.typography.bodySm.fontSize,
            color: tokens.colors.text.muted,
          }}
        >
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export default ContextSection;
