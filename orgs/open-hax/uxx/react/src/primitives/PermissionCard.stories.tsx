import type { Meta, StoryObj } from '@storybook/react';
import { PermissionCard } from './PermissionCard';
import type { PermissionRequest, PermissionResponse } from './PermissionPrompts';

const meta: Meta<typeof PermissionCard> = {
  title: 'Primitives/PermissionCard',
  component: PermissionCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PermissionCard>;

const samplePermission: PermissionRequest = {
  id: 'perm-1',
  title: 'Read File',
  sessionId: 'sess-123',
  metadata: { path: '/src/core/handler.ts' },
};

export const Basic: Story = {
  args: {
    permission: samplePermission,
    onResponse: (() => {}) as (id: string, response: PermissionResponse) => void,
    showMetadata: true,
  },
};

export const DefaultReject: Story = {
  args: {
    permission: { ...samplePermission, defaultResponse: 'reject' },
    onResponse: (() => {}) as (id: string, response: PermissionResponse) => void,
    showMetadata: true,
  },
};
