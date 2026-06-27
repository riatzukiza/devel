import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorToolbar } from './EditorToolbar';

describe('EditorToolbar', () => {
  it('renders actions and fires callbacks', async () => {
    const onBold = vi.fn();

    render(
      <EditorToolbar
        items={[
          { key: 'h1', label: 'H1' },
          { type: 'divider', key: 'div-1', testId: 'toolbar-divider' },
          { key: 'bold', label: 'B', onClick: onBold },
        ]}
      />,
    );

    expect(screen.getByText('H1')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-divider')).toBeInTheDocument();

    await userEvent.click(screen.getByText('B'));
    expect(onBold).toHaveBeenCalledTimes(1);
  });
});