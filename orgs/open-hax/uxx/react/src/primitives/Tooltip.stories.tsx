import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';
import { Button } from './Button';

const meta: Meta<typeof Tooltip> = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right', 'top-start', 'top-end', 'bottom-start', 'bottom-end'],
      description: 'Preferred placement of the tooltip',
    },
    trigger: {
      control: 'select',
      options: ['hover', 'focus', 'hover-focus', 'click'],
      description: 'Event that triggers the tooltip',
    },
    delay: {
      control: { type: 'number', min: 0, max: 1000, step: 50 },
      description: 'Delay in ms before showing',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the tooltip is disabled',
    },
  },
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/tooltip.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip content="This is a tooltip">
      <Button>Hover me</Button>
    </Tooltip>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '32px', padding: '48px' }}>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <Tooltip content="Top tooltip" placement="top">
          <Button>Top</Button>
        </Tooltip>
        <Tooltip content="Bottom tooltip" placement="bottom">
          <Button>Bottom</Button>
        </Tooltip>
        <Tooltip content="Left tooltip" placement="left">
          <Button>Left</Button>
        </Tooltip>
        <Tooltip content="Right tooltip" placement="right">
          <Button>Right</Button>
        </Tooltip>
      </div>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <Tooltip content="Top Start" placement="top-start">
          <Button>Top Start</Button>
        </Tooltip>
        <Tooltip content="Top End" placement="top-end">
          <Button>Top End</Button>
        </Tooltip>
        <Tooltip content="Bottom Start" placement="bottom-start">
          <Button>Bottom Start</Button>
        </Tooltip>
        <Tooltip content="Bottom End" placement="bottom-end">
          <Button>Bottom End</Button>
        </Tooltip>
      </div>
    </div>
  ),
};

export const Triggers: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Tooltip content="Appears on hover" trigger="hover">
        <Button>Hover Trigger</Button>
      </Tooltip>
      <Tooltip content="Appears on focus" trigger="focus">
        <Button>Focus Trigger</Button>
      </Tooltip>
      <Tooltip content="Appears on hover or focus" trigger="hover-focus">
        <Button>Hover + Focus</Button>
      </Tooltip>
      <Tooltip content="Toggles on click" trigger="click">
        <Button>Click Trigger</Button>
      </Tooltip>
    </div>
  ),
};

export const Delays: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Tooltip content="No delay" delay={0}>
        <Button>No Delay</Button>
      </Tooltip>
      <Tooltip content="200ms delay (default)" delay={200}>
        <Button>Default Delay</Button>
      </Tooltip>
      <Tooltip content="500ms delay" delay={500}>
        <Button>Slow Delay</Button>
      </Tooltip>
      <Tooltip content="Hides after 500ms" hideDelay={500}>
        <Button>Hide Delay</Button>
      </Tooltip>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Tooltip content="This won't show" disabled>
      <Button disabled>Disabled Tooltip</Button>
    </Tooltip>
  ),
};

export const WithoutArrow: Story = {
  render: () => (
    <Tooltip content="No arrow here" arrow={false}>
      <Button>No Arrow</Button>
    </Tooltip>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Tooltip
      content={
        <div>
          <strong>Interactive Content</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
            You can hover over this tooltip!
          </p>
        </div>
      }
      interactive
      hideDelay={200}
    >
      <Button>Interactive Tooltip</Button>
    </Tooltip>
  ),
};

export const RichContent: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Tooltip
        content={
          <div>
            <strong style={{ color: '#a6e22e' }}>Success!</strong>
            <br />
            Operation completed successfully.
          </div>
        }
      >
        <Button variant="primary">With Formatting</Button>
      </Tooltip>
      
      <Tooltip
        content={
          <div style={{ maxWidth: '200px' }}>
            This is a longer tooltip that wraps to multiple lines to demonstrate
            the max-width behavior.
          </div>
        }
      >
        <Button>Long Content</Button>
      </Tooltip>
      
      <Tooltip content="🔑 Keyboard shortcut: Ctrl+S">
        <Button>With Icon</Button>
      </Tooltip>
    </div>
  ),
};

export const IconTrigger: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Tooltip content="Settings">
        <span style={{ cursor: 'pointer', fontSize: '20px' }}>⚙️</span>
      </Tooltip>
      <Tooltip content="Help">
        <span style={{ cursor: 'pointer', fontSize: '20px' }}>❓</span>
      </Tooltip>
      <Tooltip content="Notifications (3 new)">
        <span style={{ cursor: 'pointer', fontSize: '20px' }}>🔔</span>
      </Tooltip>
    </div>
  ),
};
