import type { Meta, StoryObj } from '@storybook/react';
import { EditorToolbar } from './EditorToolbar';

const meta: Meta<typeof EditorToolbar> = {
  title: 'Text Editors/EditorToolbar',
  component: EditorToolbar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EditorToolbar>;

export const Default: Story = {
  args: {
    items: [
      { key: 'h1', label: 'H1', title: 'Heading 1' },
      { key: 'h2', label: 'H2', title: 'Heading 2' },
      { type: 'divider', key: 'div-1' },
      { key: 'bold', label: 'B', title: 'Bold', buttonStyle: { fontWeight: 'bold' } },
      { key: 'italic', label: 'I', title: 'Italic', buttonStyle: { fontStyle: 'italic' } },
      { type: 'divider', key: 'div-2' },
      { key: 'link', label: 'Link', title: 'Insert link' },
      { key: 'code', label: '</>', title: 'Inline code' },
    ],
  },
};

export const DisabledAction: Story = {
  args: {
    items: [
      { key: 'undo', label: 'Undo', title: 'Undo', disabled: true },
      { key: 'redo', label: 'Redo', title: 'Redo', disabled: true },
      { type: 'divider', key: 'div-1' },
      { key: 'save', label: 'Save', title: 'Save document' },
    ],
  },
};