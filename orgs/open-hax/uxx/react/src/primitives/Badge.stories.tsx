/**
 * Badge Stories
 *
 * Stories for the enhanced Badge component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge.js';

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'success',
        'warning',
        'error',
        'info',
        'open',
        'closed',
        'merged',
        'alive',
        'dead',
        'running',
        'stopped',
      ],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
    dot: {
      control: 'boolean',
    },
    pulse: {
      control: 'boolean',
    },
    rounded: {
      control: 'boolean',
    },
    outline: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge variant="default">Default</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};

export const SemanticVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge variant="open">Open</Badge>
      <Badge variant="closed">Closed</Badge>
      <Badge variant="merged">Merged</Badge>
      <Badge variant="alive">Alive</Badge>
      <Badge variant="dead">Dead</Badge>
      <Badge variant="running">Running</Badge>
      <Badge variant="stopped">Stopped</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Badge size="xs">Extra Small</Badge>
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

export const WithDot: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge variant="success" dot>
        Active
      </Badge>
      <Badge variant="warning" dot>
        Pending
      </Badge>
      <Badge variant="error" dot>
        Failed
      </Badge>
      <Badge variant="info" dot>
        Info
      </Badge>
    </div>
  ),
};

export const PulsingDot: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge variant="success" dot pulse>
        Live
      </Badge>
      <Badge variant="running" dot pulse>
        Processing
      </Badge>
      <Badge variant="alive" dot pulse size="sm">
        ONLINE
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pulsing dots indicate live or active states. The animation pulses every 2 seconds.',
      },
    },
  },
};

export const Rounded: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge variant="success" rounded>
        Active
      </Badge>
      <Badge variant="error" rounded>
        Error
      </Badge>
      <Badge variant="info" rounded dot>
        Info
      </Badge>
    </div>
  ),
};

export const Outline: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge variant="default" outline>
        Default
      </Badge>
      <Badge variant="success" outline>
        Success
      </Badge>
      <Badge variant="warning" outline>
        Warning
      </Badge>
      <Badge variant="error" outline>
        Error
      </Badge>
      <Badge variant="info" outline dot>
        Info
      </Badge>
    </div>
  ),
};

export const CustomDotColor: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge variant="default" dot dotColor="#ff6b6b">
        Custom Red
      </Badge>
      <Badge variant="default" dot dotColor="#4ecdc4">
        Custom Teal
      </Badge>
      <Badge variant="default" dot dotColor="#ffe66d">
        Custom Yellow
      </Badge>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge variant="success" iconStart={<span>✓</span>}>
        Verified
      </Badge>
      <Badge variant="error" iconStart={<span>✗</span>}>
        Failed
      </Badge>
      <Badge variant="info" iconEnd={<span>→</span>}>
        Details
      </Badge>
      <Badge variant="warning" iconStart={<span>⚡</span>} iconEnd={<span>!</span>}>
        Warning
      </Badge>
    </div>
  ),
};

export const IssueStatus: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge variant="open" dot>
        Open
      </Badge>
      <Badge variant="closed">Closed</Badge>
      <Badge variant="merged" dot>
        Merged
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Semantic variants for PR/Issue states.',
      },
    },
  },
};

export const AgentStatus: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge variant="alive" size="sm">
        ALIVE
      </Badge>
      <Badge variant="dead" size="sm">
        DEAD
      </Badge>
      <Badge variant="running" dot pulse size="sm">
        RUNNING
      </Badge>
      <Badge variant="stopped" size="sm">
        STOPPED
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Semantic variants for agent/process states, inspired by gates-of-aker.',
      },
    },
  },
};

export const Combination: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge variant="success" dot pulse rounded>
        Live
      </Badge>
      <Badge variant="error" outline rounded>
        Error
      </Badge>
      <Badge variant="warning" dot outline size="sm">
        Warning
      </Badge>
    </div>
  ),
};

export const AllVariantsGrid: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
      }}
    >
      {[
        'default',
        'success',
        'warning',
        'error',
        'info',
        'open',
        'closed',
        'merged',
        'alive',
        'dead',
        'running',
        'stopped',
      ].map((variant) => (
        <div key={variant} style={{ padding: '8px', border: '1px solid #333', borderRadius: '4px' }}>
          <Badge variant={variant as any}>{variant}</Badge>
        </div>
      ))}
    </div>
  ),
};
