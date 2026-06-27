import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Primitives/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the spinner',
    },
    color: {
      control: 'color',
      description: 'Color of the spinner',
    },
    thickness: {
      control: { type: 'range', min: 1, max: 5, step: 0.5 },
      description: 'Stroke thickness',
    },
    label: {
      control: 'text',
      description: 'Accessible label for screen readers',
    },
  },
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/spinner.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </div>
  ),
};

export const CustomColor: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Spinner color="#a6e22e" />
      <Spinner color="#f92672" />
      <Spinner color="#66d9ef" />
      <Spinner color="#fd971f" />
    </div>
  ),
};

export const ThicknessVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Spinner thickness={1} size="lg" />
      <Spinner thickness={2.5} size="lg" />
      <Spinner thickness={4} size="lg" />
      <Spinner thickness={5} size="lg" />
    </div>
  ),
};

export const WithLabel: Story = {
  args: {
    size: 'lg',
    label: 'Loading user data...',
  },
};

export const InlineLoading: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Spinner size="sm" />
      <span>Loading content...</span>
    </div>
  ),
};
