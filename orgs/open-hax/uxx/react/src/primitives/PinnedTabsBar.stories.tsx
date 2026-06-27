import type { Meta, StoryObj } from '@storybook/react';
import { PinnedTabsBar } from './PinnedTabsBar';
import type { Entity, PinnedEntry } from './InspectorPane';

const meta: Meta<typeof PinnedTabsBar> = {
  title: 'Primitives/PinnedTabsBar',
  component: PinnedTabsBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PinnedTabsBar>;

const selection: Entity = { id: 'sel-1', title: 'Current Entity', type: 'session' };
const pinned: PinnedEntry[] = [
  { key: 'a', selection: { id: 'a', title: 'Session A' } },
  { key: 'b', selection: { id: 'b', title: 'Session B' } },
];

export const Basic: Story = {
  args: {
    pinned,
    activePinnedKey: 'a',
    selection,
    canPin: true,
  },
};
