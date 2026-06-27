import type { Meta, StoryObj } from '@storybook/react';
import { ContextSection } from './ContextSection';
import type { Entity } from './InspectorPane';

const meta: Meta<typeof ContextSection> = {
  title: 'Primitives/ContextSection',
  component: ContextSection,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ContextSection>;

const items: Entity[] = [
  { id: 'ctx-1', title: 'Related Session', type: 'session' },
  { id: 'ctx-2', title: 'Parent Task', type: 'task' },
  { id: 'ctx-3', title: 'config/endpoints.edn', type: 'file' },
];

export const Basic: Story = {
  args: {
    context: items,
  },
};

export const Empty: Story = {
  args: {
    context: [],
  },
};
