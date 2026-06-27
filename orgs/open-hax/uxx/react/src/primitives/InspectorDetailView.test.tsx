import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InspectorDetailView } from './InspectorDetailView';

describe('InspectorDetailView', () => {
  it('renders entity detail content', () => {
    render(
      <InspectorDetailView
        entity={{
          id: 'entity-1',
          title: 'Debug Session',
          type: 'error',
          text: 'Stack trace and notes',
          time: '45 min ago',
        }}
      />,
    );

    expect(screen.getByTestId('inspector-detail')).toBeInTheDocument();
    expect(screen.getByText('Debug Session')).toBeInTheDocument();
    expect(screen.getByText('error')).toBeInTheDocument();
    expect(screen.getByText('Stack trace and notes')).toBeInTheDocument();
    expect(screen.getByText('Observed 45 min ago')).toBeInTheDocument();
  });
});