import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextSection } from './ContextSection';

describe('ContextSection', () => {
  it('renders context items and fires selection callback', async () => {
    const onContextSelect = vi.fn();
    render(
      <ContextSection
        context={[
          { id: 'ctx-1', title: 'Related Session' },
          { id: 'ctx-2', title: 'Parent Task' },
        ]}
        onContextSelect={onContextSelect}
      />,
    );

    expect(screen.getByText('Related Session')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Parent Task'));
    expect(onContextSelect).toHaveBeenCalledWith({ id: 'ctx-2', title: 'Parent Task' });
  });
});
