import type { Meta, StoryObj } from '@storybook/react';
import { InspectorErrorState } from './InspectorErrorState';

const meta: Meta<typeof InspectorErrorState> = {
  title: 'Primitives/InspectorErrorState',
  component: InspectorErrorState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InspectorErrorState>;

export const Retryable: Story = {
  args: {
    error: { message: 'Failed to load entity details.', retryable: true },
  },
};

export const DefaultRetryability: Story = {
  args: {
    error: { message: 'Transient network problem.' },
  },
};

export const NonRetryable: Story = {
  args: {
    error: { message: 'Permission denied.', retryable: false },
  },
};
