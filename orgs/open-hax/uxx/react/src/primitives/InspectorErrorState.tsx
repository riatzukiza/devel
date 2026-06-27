import { tokens } from '@open-hax/uxx/tokens';
import type { ErrorState } from './InspectorPane.types.js';

export interface InspectorErrorStateProps {
  error: ErrorState;
  onRetry?: () => void;
  retryLabel?: string;
}

export function InspectorErrorState({
  error,
  onRetry,
  retryLabel = 'Retry',
}: InspectorErrorStateProps) {
  const retryable = error.retryable ?? true;

  return (
    <div
      data-component="inspector-error-state"
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
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export default InspectorErrorState;