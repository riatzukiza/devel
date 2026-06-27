import type { Meta, StoryObj } from '@storybook/react';
import { EditorStatusBar } from './EditorStatusBar';

const meta: Meta<typeof EditorStatusBar> = {
  title: 'Text Editors/EditorStatusBar',
  component: EditorStatusBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EditorStatusBar>;

export const Default: Story = {
  args: {
    items: [
      { key: 'cursor', label: 'Ln 12, Col 8' },
      { key: 'lines', label: '42 lines' },
      { key: 'words', label: '318 words' },
      { key: 'mode', label: 'Markdown', align: 'end' },
    ],
  },
};