import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PinnedTabsBar } from './PinnedTabsBar';

describe('PinnedTabsBar', () => {
  it('renders tabs and supports activate/unpin/pin callbacks', async () => {
    const onSetActive = vi.fn();
    const onUnpin = vi.fn();
    const onPin = vi.fn();
    const selection = { id: 'sel-1', title: 'Current Entity' };

    render(
      <PinnedTabsBar
        pinned={[
          { key: 'a', selection: { id: 'a', title: 'Session A' } },
          { key: 'b', selection: { id: 'b', title: 'Session B' } },
        ]}
        activePinnedKey="a"
        onSetActive={onSetActive}
        onUnpin={onUnpin}
        onPin={onPin}
        selection={selection}
        canPin
      />,
    );

    await userEvent.click(screen.getByText('Session B'));
    expect(onSetActive).toHaveBeenCalledWith('b');

    await userEvent.click(screen.getAllByTestId('pinned-tab-unpin')[0]);
    expect(onUnpin).toHaveBeenCalledWith('a');

    await userEvent.click(screen.getByTestId('pin-button'));
    expect(onPin).toHaveBeenCalledWith(selection);
  });
});
