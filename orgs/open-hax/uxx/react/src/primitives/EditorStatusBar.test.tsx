import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditorStatusBar } from './EditorStatusBar';

describe('EditorStatusBar', () => {
  it('renders status segments', () => {
    render(
      <EditorStatusBar
        items={[
          { key: 'cursor', label: 'Ln 3, Col 14' },
          { key: 'lines', label: '21 lines' },
          { key: 'mode', label: 'Markdown', align: 'end' },
        ]}
      />,
    );

    expect(screen.getByText('Ln 3, Col 14')).toBeInTheDocument();
    expect(screen.getByText('21 lines')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
  });
});