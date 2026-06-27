import type { ReactNode } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
import type { Entity } from './InspectorPane.types.js';

export interface InspectorDetailViewProps {
  entity: Entity;
  renderDetail?: (entity: Entity) => ReactNode;
  title?: string;
}

export function InspectorDetailView({
  entity,
  renderDetail,
  title = 'Detail',
}: InspectorDetailViewProps) {
  if (renderDetail) {
    return <>{renderDetail(entity)}</>;
  }

  return (
    <div
      data-component="inspector-detail-view"
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
        {title}
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
      {entity.text && (
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

export default InspectorDetailView;
