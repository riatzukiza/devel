import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';

const meta: Meta<typeof Card> = {
  title: 'Primitives/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'elevated'],
      description: 'Visual style variant of the card',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Internal padding size',
    },
    radius: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'full'],
      description: 'Border radius size',
    },
    interactive: {
      control: 'boolean',
      description: 'Whether the card has interactive states',
    },
  },
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/card.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    title: 'Card Title',
    children: 'This is the card body content. It can contain any React nodes.',
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    title: 'Outlined Card',
    children: 'A card with border but no shadow.',
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    title: 'Elevated Card',
    children: 'A card with shadow for visual elevation.',
  },
};

export const WithFooter: Story = {
  args: {
    title: 'Card with Footer',
    children: 'Content goes here.',
    footer: (
      <>
        <Button variant="ghost" size="sm">Cancel</Button>
        <Button variant="primary" size="sm">Save</Button>
      </>
    ),
  },
};

export const WithHeader: Story = {
  args: {
    header: <Badge variant="success">Active</Badge>,
    title: 'Status Card',
    extra: <Button variant="ghost" size="sm">Edit</Button>,
    children: 'Card with custom header and extra actions.',
  },
};

export const Interactive: Story = {
  args: {
    variant: 'outlined',
    interactive: true,
    title: 'Clickable Card',
    children: 'Click me! I have interactive hover and focus states.',
    onClick: () => alert('Card clicked!'),
  },
};

export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <div style={{ padding: '16px', background: 'rgba(166, 226, 46, 0.1)' }}>
        Content with custom padding inside a no-padding card.
      </div>
    ),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
      <Card variant="default" title="Default Card">
        Standard card with subtle shadow.
      </Card>
      <Card variant="outlined" title="Outlined Card">
        Card with border only, no shadow.
      </Card>
      <Card variant="elevated" title="Elevated Card">
        Card with prominent shadow.
      </Card>
    </div>
  ),
};

export const CompleteExample: Story = {
  render: () => (
    <div style={{ maxWidth: '400px' }}>
      <Card
        variant="elevated"
        header={<Badge variant="success">Published</Badge>}
        title="Project Alpha"
        extra={<Button variant="ghost" size="sm">⋯</Button>}
        footer={
          <>
            <Button variant="ghost" size="sm">Archive</Button>
            <Button variant="primary" size="sm">Edit</Button>
          </>
        }
      >
        <p style={{ margin: 0, marginBottom: '8px' }}>
          A demonstration of the Card component with all slots populated.
        </p>
        <p style={{ margin: 0, color: 'var(--color-fg-muted)', fontSize: '14px' }}>
          Last updated: 2 hours ago
        </p>
      </Card>
    </div>
  ),
};
