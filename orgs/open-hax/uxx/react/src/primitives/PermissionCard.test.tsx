import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PermissionCard } from './PermissionCard';

describe('PermissionCard', () => {
  it('renders permission details and fires response callbacks', async () => {
    const onResponse = vi.fn();
    render(
      <PermissionCard
        permission={{ id: 'perm-1', title: 'Read File', metadata: { path: '/tmp/a.ts' } }}
        onResponse={onResponse}
      />,
    );

    expect(screen.getByText('Read File')).toBeInTheDocument();
    expect(screen.getByText('Path: /tmp/a.ts')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('permission-btn-always'));
    expect(onResponse).toHaveBeenCalledWith('perm-1', 'always');
  });
});
