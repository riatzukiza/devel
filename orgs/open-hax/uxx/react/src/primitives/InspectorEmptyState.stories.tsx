import type { Meta, StoryObj } from '@storybook/react';
import { InspectorEmptyState } from './InspectorEmptyState';

const meta: Meta<typeof InspectorEmptyState> = {
  title: 'Primitives/InspectorEmptyState',
  component: InspectorEmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InspectorEmptyState>;

export const Default: Story = {};

export const CustomMessage: Story = {
  args: {
    message: 'Choose a session or entity from the left rail to inspect it here.',
  },
};