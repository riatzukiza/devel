import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InspectorHeader } from './InspectorHeader';

describe('InspectorHeader', () => {
  it('renders selection metadata when not viewing an active pinned item', () => {
    render(
      <InspectorHeader
        selection={{ id: 'entity-1', title: 'Debug Session', type: 'error' }}
      />,
    );

    expect(screen.getByTestId('inspector-header')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-selection-title')).toHaveTextContent('Debug Session');
    expect(screen.getByTestId('inspector-selection-type')).toHaveTextContent('error');
  });

  it('hides live selection metadata when a pinned entry is active', () => {
    render(
      <InspectorHeader
        selection={{ id: 'entity-1', title: 'Debug Session', type: 'error' }}
        activePinned
      />,
    );

    expect(screen.queryByTestId('inspector-selection-title')).not.toBeInTheDocument();
    expect(screen.queryByTestId('inspector-selection-type')).not.toBeInTheDocument();
  });
});