import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptCard } from './PromptCard';

describe('PromptCard', () => {
  it('submits entered input', async () => {
    const onResponse = vi.fn();
    render(
      <PromptCard
        prompt={{ id: 'prompt-1', title: 'Input Required', body: { prompt: 'Enter value' } }}
        onResponse={onResponse}
      />,
    );

    const input = screen.getByTestId('prompt-input');
    const submit = screen.getByTestId('prompt-submit');

    expect(submit).toBeDisabled();
    await userEvent.type(input, 'staging');
    expect(submit).not.toBeDisabled();
    await userEvent.click(submit);

    expect(onResponse).toHaveBeenCalledWith('prompt-1', 'staging');
  });
});
