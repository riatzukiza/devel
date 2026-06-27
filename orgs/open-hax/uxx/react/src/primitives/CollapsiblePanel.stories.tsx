/**
 * CollapsiblePanel Stories
 * 
 * Stories for the CollapsiblePanel component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { tokens } from '@open-hax/uxx/tokens';
import { CollapsiblePanel } from './CollapsiblePanel.js';

const meta: Meta<typeof CollapsiblePanel> = {
  title: 'Primitives/CollapsiblePanel',
  component: CollapsiblePanel,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'elevated'],
    },
    defaultCollapsed: {
      control: 'boolean',
    },
    animate: {
      control: 'boolean',
    },
    maxHeight: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CollapsiblePanel>;

// Sample content
const sampleContent = (
  <div>
    <p style={{ margin: '0 0 8px 0' }}>
      This is the collapsible content. It can contain any React nodes.
    </p>
    <p style={{ margin: '0 0 8px 0' }}>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.
    </p>
    <p style={{ margin: 0 }}>
      Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
    </p>
  </div>
);

const sampleList = (
  <ul style={{ margin: 0, padding: '0 0 0 20px' }}>
    <li>Event one: User logged in</li>
    <li>Event two: File uploaded</li>
    <li>Event three: Settings changed</li>
    <li>Event four: Task completed</li>
    <li>Event five: Notification sent</li>
  </ul>
);

export const Default: Story = {
  args: {
    title: 'Panel Title',
    children: sampleContent,
  },
};

export const WithCount: Story = {
  args: {
    title: 'Events',
    count: 5,
    children: sampleList,
  },
};

export const WithStats: Story = {
  args: {
    title: 'Statistics',
    stats: [
      { label: 'Total', value: 42 },
      { label: 'Active', value: 17 },
      { label: 'Pending', value: 8 },
    ],
    children: sampleContent,
  },
};

export const OutlinedVariant: Story = {
  args: {
    title: 'Outlined Panel',
    variant: 'outlined',
    children: sampleContent,
  },
};

export const ElevatedVariant: Story = {
  args: {
    title: 'Elevated Panel',
    variant: 'elevated',
    children: sampleContent,
  },
};

export const StartCollapsed: Story = {
  args: {
    title: 'Collapsed by Default',
    defaultCollapsed: true,
    children: sampleContent,
  },
};

export const ControlledCollapse: Story = {
  args: {
    title: 'Controlled Panel',
    collapsed: false,
    onCollapseChange: (collapsed: boolean) => console.log('Collapsed:', collapsed),
    children: sampleContent,
  },
};

export const WithExtraHeaderContent: Story = {
  args: {
    title: 'Panel with Extra Header',
    count: 3,
    extraHeaderContent: (
      <span style={{ 
        fontSize: '12px', 
        color: tokens.colors.accent.cyan,
        marginLeft: '8px' 
      }}>
        Updated 5m ago
      </span>
    ),
    children: sampleContent,
  },
};

export const WithStatsAndCount: Story = {
  args: {
    title: 'Comprehensive Header',
    count: 25,
    stats: [
      { label: 'Success', value: 18, color: tokens.colors.accent.cyan },
      { label: 'Failed', value: 4, color: tokens.colors.accent.red },
      { label: 'Pending', value: 3, color: tokens.colors.accent.orange },
    ],
    variant: 'outlined',
    children: sampleList,
  },
};

export const LimitedHeight: Story = {
  args: {
    title: 'Limited Height Panel',
    maxHeight: 100,
    children: (
      <div>
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i} style={{ margin: '0 0 8px 0' }}>
            Line {i + 1}: This content scrolls when it exceeds the max height.
          </p>
        ))}
      </div>
    ),
  },
};

export const CustomHeader: Story = {
  args: {
    title: 'Custom Header',
    headerContent: (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        width: '100%',
        gap: '8px'
      }}>
        <span style={{ fontSize: '20px' }}>📊</span>
        <strong style={{ flex: 1 }}>Custom Header Layout</strong>
        <span style={{ 
          fontSize: '12px',
          padding: '2px 8px',
          backgroundColor: tokens.colors.accent.cyan,
          color: tokens.colors.background.default,
          borderRadius: '4px'
        }}>
          NEW
        </span>
      </div>
    ),
    children: sampleContent,
  },
};

export const MultiplePanels: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <CollapsiblePanel
        title="Events"
        count={5}
        variant="outlined"
        defaultCollapsed={false}
      >
        {sampleList}
      </CollapsiblePanel>
      <CollapsiblePanel
        title="Tasks"
        count={12}
        stats={[
          { label: 'Done', value: 8, color: tokens.colors.accent.cyan },
          { label: 'Todo', value: 4 },
        ]}
        variant="outlined"
        defaultCollapsed={true}
      >
        {sampleContent}
      </CollapsiblePanel>
      <CollapsiblePanel
        title="Notes"
        variant="outlined"
        defaultCollapsed={true}
      >
        {sampleContent}
      </CollapsiblePanel>
    </div>
  ),
};
