import { tokens } from '@open-hax/uxx/tokens';

export interface InspectorEmptyStateProps {
  message?: string;
}

export function InspectorEmptyState({
  message = 'Select an item to inspect details and context.',
}: InspectorEmptyStateProps) {
  return (
    <div
      data-component="inspector-empty-state"
      data-testid="inspector-empty"
      style={{
        padding: `${tokens.spacing[4]}px`,
        textAlign: 'center',
        color: tokens.colors.text.muted,
        fontSize: tokens.typography.bodySm.fontSize,
      }}
    >
      {message}
    </div>
  );
}

export default InspectorEmptyState;