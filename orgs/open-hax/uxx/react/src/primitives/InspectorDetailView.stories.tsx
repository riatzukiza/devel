import type { Meta, StoryObj } from '@storybook/react';
import { InspectorDetailView } from './InspectorDetailView';
import type { Entity } from './InspectorPane.types';

const entity: Entity = {
  id: 'session-123',
  title: 'OpenCode Session: API Integration',
  type: 'info',
  text: 'This session covers the integration of the new API endpoints with the existing authentication flow.',
  time: '2 hours ago',
};

const meta: Meta<typeof InspectorDetailView> = {
  title: 'Primitives/InspectorDetailView',
  component: InspectorDetailView,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InspectorDetailView>;

export const Default: Story = {
  args: {
    entity,
  },
};

export const CustomRenderer: Story = {
  args: {
    entity,
    renderDetail: (current) => (
      <div style={{ padding: 12, border: '1px solid #66d9ef', borderRadius: 4 }}>
        <div style={{ fontSize: 11, marginBottom: 8 }}>CUSTOM RENDERER</div>
        <div>{current.title}</div>
      </div>
    ),
  },
};
