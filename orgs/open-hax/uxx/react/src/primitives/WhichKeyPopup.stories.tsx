import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { WhichKeyPopup, type BindingEntry } from './WhichKeyPopup';

const meta: Meta<typeof WhichKeyPopup> = {
  title: 'Primitives/WhichKeyPopup',
  component: WhichKeyPopup,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    active: {
      control: 'boolean',
      description: 'Whether the popup is currently visible',
    },
    prefix: {
      control: 'object',
      description: 'The key sequence prefix that triggered the popup',
    },
    position: {
      control: 'radio',
      options: ['bottom', 'top', 'auto'],
      description: 'Where to position the popup',
    },
    maxColumns: {
      control: { type: 'number', min: 1, max: 5 },
      description: 'Maximum number of columns to display',
    },
    sortKey: {
      control: 'radio',
      options: ['key', 'description', 'none'],
      description: 'How to sort the bindings',
    },
    showCategory: {
      control: 'boolean',
      description: 'Whether to show category headers',
    },
    timeoutMs: {
      control: { type: 'number', min: 0, max: 10000 },
      description: 'Auto-dismiss timeout (0 = disabled)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof WhichKeyPopup>;

// Sample bindings
const fileBindings: BindingEntry[] = [
  { key: 'f', description: 'Find file', category: 'File' },
  { key: 's', description: 'Save file', category: 'File' },
  { key: 'S', description: 'Save all files', category: 'File' },
  { key: 'd', description: 'Delete file', category: 'File', destructive: true },
];

const bufferBindings: BindingEntry[] = [
  { key: 'b', description: 'Switch buffer', category: 'Buffer' },
  { key: 'k', description: 'Kill buffer', category: 'Buffer', destructive: true },
  { key: 'n', description: 'Next buffer', category: 'Buffer' },
  { key: 'p', description: 'Previous buffer', category: 'Buffer' },
];

const windowBindings: BindingEntry[] = [
  { key: 'w', description: 'Split window', category: 'Window' },
  { key: 'v', description: 'Vertical split', category: 'Window' },
  { key: 'h', description: 'Horizontal split', category: 'Window' },
  { key: 'x', description: 'Close window', category: 'Window' },
];

const allBindings = [...fileBindings, ...bufferBindings, ...windowBindings];

// Default story with toggle
const WhichKeyPopupWithToggle = () => {
  const [active, setActive] = useState(true);

  return (
    <div
      style={{
        height: '100vh',
        backgroundColor: 'var(--bg-primary, #272822)',
        padding: '20px',
      }}
    >
      <button
        onClick={() => setActive(!active)}
        style={{
          padding: '8px 16px',
          background: '#66d9ef',
          color: '#272822',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        {active ? 'Hide Popup' : 'Show Popup'}
      </button>

      <WhichKeyPopup
        active={active}
        prefix={['SPC', 'f']}
        bindings={allBindings}
        position="bottom"
        maxColumns={3}
        showCategory
        onSelect={(binding) => {
          if (binding) {
            // eslint-disable-next-line no-alert
            alert(`Selected: ${binding.key} - ${binding.description}`);
          }
          setActive(false);
        }}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <WhichKeyPopupWithToggle />,
};

// Top position
export const TopPosition: Story = {
  args: {
    active: true,
    prefix: ['SPC', 'b'],
    bindings: bufferBindings,
    position: 'top',
    maxColumns: 2,
    showCategory: true,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          height: '100vh',
          backgroundColor: 'var(--bg-primary, #272822)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// No categories
export const NoCategories: Story = {
  args: {
    active: true,
    prefix: ['SPC'],
    bindings: allBindings,
    position: 'bottom',
    maxColumns: 3,
    showCategory: false,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          height: '100vh',
          backgroundColor: 'var(--bg-primary, #272822)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// Single column
export const SingleColumn: Story = {
  args: {
    active: true,
    prefix: ['SPC', 'f'],
    bindings: fileBindings,
    position: 'bottom',
    maxColumns: 1,
    showCategory: true,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          height: '100vh',
          backgroundColor: 'var(--bg-primary, #272822)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// Destructive actions highlighted
export const DestructiveActions: Story = {
  args: {
    active: true,
    prefix: ['SPC', 'd'],
    bindings: [
      { key: 'd', description: 'Delete file', category: 'Dangerous', destructive: true },
      { key: 'D', description: 'Delete all', category: 'Dangerous', destructive: true },
      { key: 'r', description: 'Remove buffer', category: 'Dangerous', destructive: true },
      { key: 'k', description: 'Kill process', category: 'Dangerous', destructive: true },
    ],
    position: 'bottom',
    maxColumns: 2,
    showCategory: true,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          height: '100vh',
          backgroundColor: 'var(--bg-primary, #272822)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// Sorted by description
export const SortedByDescription: Story = {
  args: {
    active: true,
    prefix: ['SPC'],
    bindings: allBindings,
    position: 'bottom',
    maxColumns: 3,
    sortKey: 'description',
    showCategory: true,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          height: '100vh',
          backgroundColor: 'var(--bg-primary, #272822)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// Inactive (hidden)
export const Inactive: Story = {
  args: {
    active: false,
    prefix: ['SPC', 'f'],
    bindings: fileBindings,
    position: 'bottom',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          height: '100vh',
          backgroundColor: 'var(--bg-primary, #272822)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary, #75715e)',
        }}
      >
        <p>Popup is hidden (active=false)</p>
        <Story />
      </div>
    ),
  ],
};
