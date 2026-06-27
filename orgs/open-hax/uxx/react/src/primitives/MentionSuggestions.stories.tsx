import type { Meta, StoryObj } from '@storybook/react';
import { MentionSuggestions } from './MentionSuggestions';

const items = [
  { id: 'alice', name: 'Alice Chen', description: 'Frontend Developer' },
  { id: 'bob', name: 'Bob Martinez', description: 'Backend Developer' },
  { id: 'carol', name: 'Carol Davis', description: 'Designer' },
];

const meta: Meta<typeof MentionSuggestions> = {
  title: 'Text Editors/MentionSuggestions',
  component: MentionSuggestions,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', minHeight: 220, background: '#1e1f1c', paddingTop: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MentionSuggestions>;

export const Default: Story = {
  args: {
    items,
  },
};

export const CustomRenderer: Story = {
  args: {
    items,
    renderItem: (item) => (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <strong>{item.name}</strong>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{item.id}</span>
      </div>
    ),
  },
};