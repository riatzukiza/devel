import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InspectorErrorState } from './InspectorErrorState';

describe('InspectorErrorState', () => {
  it('renders the error and supports retry when retryable', async () => {
    const onRetry = vi.fn();

    render(
      <InspectorErrorState
        error={{ message: 'Failed to load details.', retryable: true }}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByTestId('inspector-pane-error-message')).toHaveTextContent(
      'Failed to load details.',
    );

    await userEvent.click(screen.getByTestId('inspector-pane-error-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});