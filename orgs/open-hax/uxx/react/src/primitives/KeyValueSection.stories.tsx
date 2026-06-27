/**
 * KeyValueSection Stories
 *
 * Stories for the KeyValueSection component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { tokens } from '@open-hax/uxx/tokens';
import { KeyValueSection, type KeyValueEntry } from './KeyValueSection.js';

const meta: Meta<typeof KeyValueSection> = {
  title: 'Primitives/KeyValueSection',
  component: KeyValueSection,
  tags: ['autodocs'],
  argTypes: {
    layout: {
      control: 'select',
      options: ['vertical', 'grid', 'inline'],
    },
    gap: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    titleSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    columns: {
      control: { type: 'number', min: 1, max: 4 },
    },
    dividers: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof KeyValueSection>;

// Sample entries
const basicEntries: KeyValueEntry[] = [
  { label: 'Status', value: 'Running' },
  { label: 'Uptime', value: '2d 4h' },
  { label: 'CPU', value: '45%' },
  { label: 'Memory', value: '1.2 GB' },
];

const actorEntries: KeyValueEntry[] = [
  { label: 'ID', value: 'actor-12345' },
  { label: 'Type', value: 'Agent' },
  { label: 'Status', value: 'Active' },
  { label: 'Total Ticks', value: 1247 },
  { label: 'Last Activity', value: '2 minutes ago' },
];

const entriesWithIcons: KeyValueEntry[] = [
  { label: 'Temperature', value: '0.7', icon: '🌡️' },
  { label: 'Max Tokens', value: '1000', icon: '📊' },
  { label: 'Model', value: 'gpt-4', icon: '🤖' },
];

const entriesWithBadges: KeyValueEntry[] = [
  { label: 'Version', value: '2.1.0', badge: 'stable' },
  { label: 'Environment', value: 'Production', badge: 'live' },
  { label: 'Region', value: 'US-West' },
];

const entriesWithHideIfEmpty: KeyValueEntry[] = [
  { label: 'Name', value: 'John Doe' },
  { label: 'Email', value: 'john@example.com' },
  { label: 'Phone', value: '', hideIfEmpty: true },
  { label: 'Fax', value: null, hideIfEmpty: true },
  { label: 'Company', value: 'Acme Corp' },
];

const complexValueEntries: KeyValueEntry[] = [
  {
    label: 'Tags',
    value: (
      <div style={{ display: 'flex', gap: '4px' }}>
        {['react', 'typescript', 'ui'].map(tag => (
          <span
            key={tag}
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              backgroundColor: tokens.colors.accent.cyan,
              color: tokens.colors.background.default,
              borderRadius: '3px',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    ),
  },
  {
    label: 'Config',
    value: (
      <code style={{
        fontSize: '11px',
        padding: '4px 8px',
        backgroundColor: tokens.colors.background.surface,
        borderRadius: '3px',
        display: 'block',
      }}>
        {'{ "enabled": true, "timeout": 30 }'}
      </code>
    ),
  },
];

export const Default: Story = {
  args: {
    entries: basicEntries,
  },
};

export const WithTitle: Story = {
  args: {
    title: 'System Status',
    entries: basicEntries,
  },
};

export const VerticalLayout: Story = {
  args: {
    title: 'Vertical Layout',
    layout: 'vertical',
    entries: actorEntries,
  },
};

export const GridLayout: Story = {
  args: {
    title: 'Grid Layout (2 columns)',
    layout: 'grid',
    columns: 2,
    entries: actorEntries,
  },
};

export const GridLayoutThreeColumns: Story = {
  args: {
    title: 'Grid Layout (3 columns)',
    layout: 'grid',
    columns: 3,
    entries: basicEntries,
  },
};

export const InlineLayout: Story = {
  args: {
    title: 'Inline Layout',
    layout: 'inline',
    labelWidth: 100,
    entries: actorEntries,
  },
};

export const WithDividers: Story = {
  args: {
    title: 'With Dividers',
    layout: 'vertical',
    dividers: true,
    entries: actorEntries,
  },
};

export const WithIcons: Story = {
  args: {
    title: 'With Icons',
    entries: entriesWithIcons,
  },
};

export const WithBadges: Story = {
  args: {
    title: 'With Badges',
    entries: entriesWithBadges,
  },
};

export const HideIfEmpty: Story = {
  args: {
    title: 'Hide If Empty (Phone and Fax hidden)',
    entries: entriesWithHideIfEmpty,
    dividers: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Phone and Fax entries have `hideIfEmpty: true` and empty/null values, so they are not rendered.',
      },
    },
  },
};

export const ComplexValues: Story = {
  args: {
    title: 'Complex Value Rendering',
    entries: complexValueEntries,
  },
};

export const SmallGap: Story = {
  args: {
    title: 'Small Gap',
    gap: 'sm',
    entries: basicEntries,
  },
};

export const LargeGap: Story = {
  args: {
    title: 'Large Gap',
    gap: 'lg',
    entries: basicEntries,
  },
};

export const SmallTitle: Story = {
  args: {
    title: 'Small Title',
    titleSize: 'sm',
    entries: basicEntries,
  },
};

export const LargeTitle: Story = {
  args: {
    title: 'Large Title',
    titleSize: 'lg',
    entries: basicEntries,
  },
};

export const EmptyState: Story = {
  args: {
    title: 'Empty Section',
    entries: [],
    emptyMessage: 'No data available',
  },
};

export const AllHidden: Story = {
  args: {
    title: 'All Entries Hidden',
    entries: [
      { label: 'Field 1', value: '', hideIfEmpty: true },
      { label: 'Field 2', value: null, hideIfEmpty: true },
    ],
    emptyMessage: 'All fields are empty',
  },
};

export const Complete: Story = {
  args: {
    title: 'Actor Information',
    layout: 'grid',
    columns: 2,
    gap: 'md',
    dividers: false,
    entries: [
      { label: 'ID', value: 'actor-001', icon: '🔑' },
      { label: 'Type', value: 'Agent', icon: '🤖', badge: 'active' },
      { label: 'Status', value: 'Running', icon: '✅' },
      { label: 'Uptime', value: '5d 12h', icon: '⏱️' },
      { label: 'CPU', value: '23%', icon: '💻' },
      { label: 'Memory', value: '847 MB', icon: '🧠' },
    ],
  },
};
