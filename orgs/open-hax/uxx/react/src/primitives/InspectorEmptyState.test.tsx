import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InspectorEmptyState } from './InspectorEmptyState';

describe('InspectorEmptyState', () => {
  it('renders the default empty message', () => {
    render(<InspectorEmptyState />);

    expect(screen.getByTestId('inspector-empty')).toHaveTextContent(
      'Select an item to inspect details and context.',
    );
  });
});