import type { Meta, StoryObj } from '@storybook/react';
import { InspectorHeader } from './InspectorHeader';

const meta: Meta<typeof InspectorHeader> = {
  title: 'Primitives/InspectorHeader',
  component: InspectorHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InspectorHeader>;

export const Default: Story = {
  args: {
    selection: {
      id: 'session-123',
      title: 'OpenCode Session: API Integration',
      type: 'info',
    },
  },
};

export const WithPinnedBar: Story = {
  args: {
    selection: {
      id: 'session-123',
      title: 'OpenCode Session: API Integration',
      type: 'info',
    },
    hasPinnedBar: true,
  },
};

export const ActivePinnedSelection: Story = {
  args: {
    selection: {
      id: 'session-123',
      title: 'OpenCode Session: API Integration',
      type: 'info',
    },
    activePinned: true,
    hasPinnedBar: true,
  },
};