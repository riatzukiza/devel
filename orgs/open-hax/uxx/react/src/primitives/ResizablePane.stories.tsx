import type { Meta, StoryObj } from '@storybook/react';
import { ResizablePane } from './ResizablePane';

const meta: Meta<typeof ResizablePane> = {
  title: 'Primitives/ResizablePane',
  component: ResizablePane,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    width: {
      control: { type: 'number', min: 100, max: 800 },
      description: 'Current width of the pane in pixels',
    },
    minWidth: {
      control: { type: 'number', min: 50, max: 400 },
      description: 'Minimum width constraint',
    },
    maxWidth: {
      control: { type: 'number', min: 200, max: 1200 },
      description: 'Maximum width constraint',
    },
    direction: {
      control: 'radio',
      options: ['left', 'right'],
      description: 'Which edge has the resize handle',
    },
    collapsible: {
      control: 'boolean',
      description: 'Whether the pane can be collapsed',
    },
    collapsed: {
      control: 'boolean',
      description: 'Whether the pane is currently collapsed',
    },
    handleWidth: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Width of the resize handle in pixels',
    },
    showHandle: {
      control: 'boolean',
      description: 'Whether to show the resize handle',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResizablePane>;

// Demo content for the pane
const DemoContent = () => (
  <div
    style={{
      padding: '16px',
      height: '100%',
      backgroundColor: 'var(--bg-secondary, #1e1f1c)',
      color: 'var(--text-primary, #f8f8f2)',
      fontFamily: 'monospace',
      fontSize: '14px',
    }}
  >
    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Resizable Pane</h3>
    <p style={{ margin: '0 0 8px 0', opacity: 0.7 }}>
      Drag the edge to resize.
    </p>
    <ul style={{ margin: 0, paddingLeft: '20px', opacity: 0.6 }}>
      <li>Min width: 180px</li>
      <li>Max width: 500px</li>
      <li>Persistence: enabled</li>
    </ul>
  </div>
);

// Default story
export const Default: Story = {
  args: {
    width: 280,
    minWidth: 180,
    maxWidth: 500,
    direction: 'left',
    persistenceKey: 'resizable-pane-default',
    handleWidth: 3,
    showHandle: true,
    children: <DemoContent />,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          backgroundColor: 'var(--bg-primary, #272822)',
        }}
      >
        <Story />
        <div
          style={{
            flex: 1,
            padding: '16px',
            color: 'var(--text-secondary, #75715e)',
          }}
        >
          Main content area
        </div>
      </div>
    ),
  ],
};

// Right direction
export const RightHandle: Story = {
  args: {
    width: 240,
    minWidth: 150,
    maxWidth: 400,
    direction: 'right',
    persistenceKey: 'resizable-pane-right',
    children: <DemoContent />,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          backgroundColor: 'var(--bg-primary, #272822)',
        }}
      >
        <div
          style={{
            flex: 1,
            padding: '16px',
            color: 'var(--text-secondary, #75715e)',
          }}
        >
          Main content area
        </div>
        <Story />
      </div>
    ),
  ],
};

// Collapsed state
export const Collapsed: Story = {
  args: {
    width: 280,
    minWidth: 180,
    maxWidth: 500,
    direction: 'left',
    collapsed: true,
    collapsible: true,
    children: <DemoContent />,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          backgroundColor: 'var(--bg-primary, #272822)',
        }}
      >
        <Story />
        <div
          style={{
            flex: 1,
            padding: '16px',
            color: 'var(--text-secondary, #75715e)',
          }}
        >
          Main content area (pane collapsed)
        </div>
      </div>
    ),
  ],
};

// Wide handle
export const WideHandle: Story = {
  args: {
    width: 280,
    minWidth: 180,
    maxWidth: 500,
    direction: 'left',
    handleWidth: 6,
    children: <DemoContent />,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          backgroundColor: 'var(--bg-primary, #272822)',
        }}
      >
        <Story />
        <div
          style={{
            flex: 1,
            padding: '16px',
            color: 'var(--text-secondary, #75715e)',
          }}
        >
          Main content area (6px handle)
        </div>
      </div>
    ),
  ],
};

// No handle visibility (programmatic resize only)
export const NoHandle: Story = {
  args: {
    width: 280,
    minWidth: 180,
    maxWidth: 500,
    direction: 'left',
    showHandle: false,
    children: <DemoContent />,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          backgroundColor: 'var(--bg-primary, #272822)',
        }}
      >
        <Story />
        <div
          style={{
            flex: 1,
            padding: '16px',
            color: 'var(--text-secondary, #75715e)',
          }}
        >
          Main content area (no visible handle)
        </div>
      </div>
    ),
  ],
};
