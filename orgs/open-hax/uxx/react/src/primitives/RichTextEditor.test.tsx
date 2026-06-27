import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RichTextEditor } from './RichTextEditor';

describe('RichTextEditor mentions', () => {
  it('filters suggestions without inserting typed characters and closes on backspace past empty filter', () => {
    const { container } = render(
      <RichTextEditor
        defaultValue=""
        mentions={{
          items: [
            { id: 'alice', name: 'Alice Chen', description: 'Frontend Developer' },
            { id: 'bob', name: 'Bob Martinez', description: 'Backend Developer' },
          ],
          trigger: '@',
        }}
      />,
    );

    const editor = container.querySelector('[contenteditable="true"]') as HTMLDivElement | null;
    expect(editor).not.toBeNull();
    if (!editor) throw new Error('contenteditable editor not found');

    const initialHtml = editor.innerHTML;

    fireEvent.keyDown(editor, { key: '@' });
    expect(screen.getAllByTestId('mention-suggestion-item')).toHaveLength(2);
    expect(editor.innerHTML).toBe(initialHtml);

    fireEvent.keyDown(editor, { key: 'b' });
    expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    expect(screen.queryByText('Alice Chen')).not.toBeInTheDocument();
    expect(editor.innerHTML).toBe(initialHtml);

    fireEvent.keyDown(editor, { key: 'Backspace' });
    expect(screen.getAllByTestId('mention-suggestion-item')).toHaveLength(2);

    fireEvent.keyDown(editor, { key: 'Backspace' });
    expect(screen.queryByTestId('mention-suggestions')).not.toBeInTheDocument();
  });
});
