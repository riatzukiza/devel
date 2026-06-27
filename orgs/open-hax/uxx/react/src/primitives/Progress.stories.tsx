/**
 * Progress Stories
 *
 * Stories for the enhanced Progress component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { tokens } from '@open-hax/uxx/tokens';
import { Progress } from './Progress.js';

const meta: Meta<typeof Progress> = {
  title: 'Primitives/Progress',
  component: Progress,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'info', 'pressure'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
    valuePosition: {
      control: 'select',
      options: ['inside', 'right', 'tooltip'],
    },
    value: {
      control: { type: 'number', min: 0, max: 100 },
    },
    animationDuration: {
      control: { type: 'number', min: 0, max: 2000 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 60,
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Progress value={75} variant="default" label="Default" />
      <Progress value={80} variant="success" label="Success" />
      <Progress value={50} variant="warning" label="Warning" />
      <Progress value={30} variant="error" label="Error" />
      <Progress value={65} variant="info" label="Info" />
      <Progress value={70} variant="pressure" label="Pressure" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Progress value={60} size="xs" label="Extra Small" />
      <Progress value={60} size="sm" label="Small" />
      <Progress value={60} size="md" label="Medium" />
      <Progress value={60} size="lg" label="Large" />
    </div>
  ),
};

export const WithGradient: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Progress
        value={75}
        gradient="linear-gradient(90deg, #66d9ef, #a6e22e)"
        label="Custom Gradient (string)"
      />
      <Progress
        value={80}
        gradient={{ from: '#66d9ef', to: '#ae81ff', angle: 90 }}
        label="Custom Gradient (object)"
      />
      <Progress
        value={65}
        gradient={{ from: '#f92672', to: '#fd971f' }}
        label="Warm Gradient"
      />
    </div>
  ),
};

export const Animated: Story = {
  render: () => {
    const [value, setValue] = React.useState(0);

    React.useEffect(() => {
      const interval = setInterval(() => {
        setValue(v => (v >= 100 ? 0 : v + 10));
      }, 1000);
      return () => clearInterval(interval);
    }, []);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Progress value={value} animated label="Animated (auto-incrementing)" />
        <Progress value={value} animated animationDuration={500} label="Faster Animation" />
        <Progress value={value} animated={false} label="Not Animated" />
      </div>
    );
  },
};

import React from 'react';

export const Striped: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Progress value={60} striped label="Striped" />
      <Progress value={75} striped stripedAnimated label="Striped + Animated" />
    </div>
  ),
};

export const Indeterminate: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Progress indeterminate label="Loading..." />
      <Progress indeterminate size="lg" label="Large Loading" />
    </div>
  ),
};

export const WithValue: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Progress value={60} showValue valuePosition="right" label="Value Right" />
      <Progress value={75} showValue valuePosition="tooltip" label="Value Tooltip" />
      <Progress value={85} size="lg" showValue valuePosition="inside" label="Value Inside (lg only)" />
    </div>
  ),
};

export const CustomFormatter: Story = {
  args: {
    value: 3,
    max: 5,
    showValue: true,
    formatValue: (value, max) => `${value} of ${max} items`,
    label: 'Custom Formatter',
  },
};

export const MultiSegment: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Progress
        label="Resource Distribution"
        segments={[
          { value: 30, color: tokens.colors.accent.cyan, label: 'continuity' },
          { value: 25, color: tokens.colors.accent.magenta, label: 'click pressure' },
          { value: 20, color: tokens.colors.accent.orange, label: 'file pressure' },
        ]}
      />
      <Progress
        label="With Gradients"
        segments={[
          { value: 40, gradient: 'linear-gradient(90deg, #66d9ef, #a6e22e)', label: 'Segment 1' },
          { value: 30, gradient: 'linear-gradient(90deg, #a6e22e, #ae81ff)', label: 'Segment 2' },
        ]}
      />
    </div>
  ),
};

export const PressureDisplay: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
      {[
        { label: 'Continuity', value: 72 },
        { label: 'Click Pressure', value: 45 },
        { label: 'File Pressure', value: 88 },
        { label: 'Particles', value: 33 },
      ].map(item => (
        <div
          key={item.label}
          style={{
            padding: '8px 12px',
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: '4px',
          }}
        >
          <div style={{ fontSize: '10px', color: tokens.colors.text.muted, textTransform: 'uppercase' }}>
            {item.label}
          </div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.value}%</div>
          <Progress value={item.value} size="sm" variant="pressure" />
        </div>
      ))}
    </div>
  ),
};
