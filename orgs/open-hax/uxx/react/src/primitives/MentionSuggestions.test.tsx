import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MentionSuggestions } from './MentionSuggestions';

describe('MentionSuggestions', () => {
  it('renders mention options and fires selection callback', async () => {
    const onSelect = vi.fn();

    render(
      <MentionSuggestions
        items={[
          { id: 'alice', name: 'Alice Chen', description: 'Frontend Developer' },
          { id: 'bob', name: 'Bob Martinez', description: 'Backend Developer' },
        ]}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('Alice Chen')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Bob Martinez'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith({
      id: 'bob',
      name: 'Bob Martinez',
      description: 'Backend Developer',
    });
  });
});
